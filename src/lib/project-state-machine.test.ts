import { describe, it, expect } from 'vitest';
import {
  validateStateTransition,
  getTransitionData,
  VALID_STATES,
} from '@/lib/project-state-machine';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeUser(overrides: Record<string, string> = {}) {
  return { id: 'user-1', role: 'csm', ...overrides };
}

function makeProject(overrides: Record<string, unknown> = {}) {
  return { csmId: 'user-1', estado: 'en_progreso', ...overrides };
}

// ─── validateStateTransition ────────────────────────────────────────────────

describe('validateStateTransition', () => {
  // ── Invalid states ──

  it('should reject invalid target state', () => {
    const result = validateStateTransition('invalido', makeUser(), makeProject());
    expect(result.allowed).toBe(false);
    expect(result.message).toBe('Estado inválido');
  });

  it('should reject empty state', () => {
    const result = validateStateTransition('', makeUser(), makeProject());
    expect(result.allowed).toBe(false);
    expect(result.message).toBe('Estado inválido');
  });

  // ── → terminado ──

  it('should allow CSM owner to mark as terminado', () => {
    const result = validateStateTransition('terminado', makeUser(), makeProject());
    expect(result.allowed).toBe(true);
  });

  it('should reject non-CSM marking as terminado', () => {
    const result = validateStateTransition('terminado', makeUser({ role: 'po' }), makeProject());
    expect(result.allowed).toBe(false);
    expect(result.message).toContain('Solo CSM');
  });

  it('should reject CSM who does not own the project', () => {
    const result = validateStateTransition('terminado', makeUser({ id: 'user-2' }), makeProject());
    expect(result.allowed).toBe(false);
    expect(result.message).toContain('No es tu proyecto');
  });

  // ── → cerrado ──

  it('should allow PO to close from terminado', () => {
    const result = validateStateTransition('cerrado', makeUser({ role: 'po' }), makeProject({ estado: 'terminado' }));
    expect(result.allowed).toBe(true);
  });

  it('should reject PO closing from non-terminado', () => {
    const result = validateStateTransition('cerrado', makeUser({ role: 'po' }), makeProject({ estado: 'en_progreso' }));
    expect(result.allowed).toBe(false);
    expect(result.message).toContain('terminado primero');
  });

  it('should reject non-PO closing', () => {
    const result = validateStateTransition('cerrado', makeUser({ role: 'csm' }), makeProject({ estado: 'terminado' }));
    expect(result.allowed).toBe(false);
    expect(result.message).toContain('Solo PO');
  });

  // ── → cancelado ──

  it('should allow PO to cancel from terminado', () => {
    const result = validateStateTransition('cancelado', makeUser({ role: 'po' }), makeProject({ estado: 'terminado' }));
    expect(result.allowed).toBe(true);
  });

  it('should reject PO cancelling from non-terminado', () => {
    const result = validateStateTransition('cancelado', makeUser({ role: 'po' }), makeProject({ estado: 'en_progreso' }));
    expect(result.allowed).toBe(false);
    expect(result.message).toContain('desde terminado');
  });

  it('should reject non-PO cancelling', () => {
    const result = validateStateTransition('cancelado', makeUser({ role: 'csm' }), makeProject({ estado: 'terminado' }));
    expect(result.allowed).toBe(false);
    expect(result.message).toContain('Solo PO');
  });

  // ── → en_progreso (PO rejection) ──

  it('should allow PO to reject from terminado back to en_progreso', () => {
    const result = validateStateTransition('en_progreso', makeUser({ role: 'po' }), makeProject({ estado: 'terminado' }));
    expect(result.allowed).toBe(true);
    expect(result.transition).toBe('rechazado');
  });

  it('should reject PO setting en_progreso from non-terminado', () => {
    const result = validateStateTransition('en_progreso', makeUser({ role: 'po' }), makeProject({ estado: 'en_progreso' }));
    expect(result.allowed).toBe(false);
  });

  // ── → en_progreso (Admin reopen) ──

  it('should allow admin to reopen from cancelado', () => {
    const result = validateStateTransition('en_progreso', makeUser({ role: 'admin' }), makeProject({ estado: 'cancelado' }));
    expect(result.allowed).toBe(true);
    expect(result.transition).toBe('reabierto');
  });

  it('should allow admin to reopen from cerrado', () => {
    const result = validateStateTransition('en_progreso', makeUser({ role: 'admin' }), makeProject({ estado: 'cerrado' }));
    expect(result.allowed).toBe(true);
    expect(result.transition).toBe('reabierto');
  });

  it('should reject admin reopening from terminado', () => {
    const result = validateStateTransition('en_progreso', makeUser({ role: 'admin' }), makeProject({ estado: 'terminado' }));
    expect(result.allowed).toBe(false);
    expect(result.message).toContain('Sin permisos');
  });

  // ── CSM/Dev cannot set en_progreso ──

  it('should reject CSM setting en_progreso', () => {
    const result = validateStateTransition('en_progreso', makeUser({ role: 'csm' }), makeProject({ estado: 'terminado' }));
    expect(result.allowed).toBe(false);
  });

  it('should reject dev setting en_progreso', () => {
    const result = validateStateTransition('en_progreso', makeUser({ role: 'dev' }), makeProject({ estado: 'terminado' }));
    expect(result.allowed).toBe(false);
  });
});

// ─── getTransitionData ──────────────────────────────────────────────────────

describe('getTransitionData', () => {
  it('should return terminado data with cleared rechazoMotivo', () => {
    const data = getTransitionData('terminado', 'user-1');
    expect(data.data.estado).toBe('terminado');
    expect(data.data.terminadoById).toBe('user-1');
    expect(data.data.terminadoAt).toBeInstanceOf(Date);
    expect(data.data.rechazoMotivo).toBeNull();
    expect(data.historyEntry).toBe('terminado');
  });

  it('should return cerrado data', () => {
    const data = getTransitionData('cerrado', 'user-1');
    expect(data.data.estado).toBe('cerrado');
    expect(data.data.cerradoById).toBe('user-1');
    expect(data.data.cerradoAt).toBeInstanceOf(Date);
    expect(data.historyEntry).toBe('cerrado');
  });

  it('should return cancelado data with motivo', () => {
    const data = getTransitionData('cancelado', 'user-1', 'No cumple requisitos');
    expect(data.data.estado).toBe('cancelado');
    expect(data.data.canceladoById).toBe('user-1');
    expect(data.data.canceladoAt).toBeInstanceOf(Date);
    expect(data.data.rechazoMotivo).toBe('No cumple requisitos');
    expect(data.historyEntry).toBe('cancelado');
  });

  it('should return cancelado data with null motivo', () => {
    const data = getTransitionData('cancelado', 'user-1');
    expect(data.data.rechazoMotivo).toBeNull();
  });

  it('should return rechazo data (PO rejection)', () => {
    const data = getTransitionData('en_progreso', 'user-1', 'Falta evidencia', 'rechazado');
    expect(data.data.estado).toBe('en_progreso');
    expect(data.data.terminadoById).toBeNull();
    expect(data.data.terminadoAt).toBeNull();
    expect(data.data.rechazoMotivo).toBe('Falta evidencia');
    expect(data.historyEntry).toBe('rechazado');
  });

  it('should return reabierto data (Admin reopen)', () => {
    const data = getTransitionData('en_progreso', 'user-1', null, 'reabierto');
    expect(data.data.estado).toBe('en_progreso');
    expect(data.data.terminadoById).toBeNull();
    expect(data.data.terminadoAt).toBeNull();
    expect(data.data.cerradoById).toBeNull();
    expect(data.data.cerradoAt).toBeNull();
    expect(data.data.canceladoById).toBeNull();
    expect(data.data.canceladoAt).toBeNull();
    expect(data.data.rechazoMotivo).toBeNull();
    expect(data.historyEntry).toBe('reabierto');
  });
});

// ─── VALID_STATES ────────────────────────────────────────────────────────────

describe('VALID_STATES', () => {
  it('should include all valid states', () => {
    expect(VALID_STATES).toContain('en_progreso');
    expect(VALID_STATES).toContain('terminado');
    expect(VALID_STATES).toContain('cerrado');
    expect(VALID_STATES).toContain('cancelado');
    expect(VALID_STATES).toHaveLength(4);
  });
});
