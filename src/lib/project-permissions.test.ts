import { describe, it, expect } from 'vitest';
import {
  canEditProject,
  canDeleteProject,
  canChangeProjectState,
  isProjectEditable,
  formatProjectNumber,
  sanitizeProjectFields,
} from '@/lib/project-permissions';

// ─── formatProjectNumber ─────────────────────────────────────────────────────

describe('formatProjectNumber', () => {
  it('should format number with PRJ- prefix and zero-padding', () => {
    expect(formatProjectNumber(1)).toBe('PRJ-00001');
  });

  it('should handle double-digit numbers', () => {
    expect(formatProjectNumber(42)).toBe('PRJ-00042');
  });

  it('should handle large numbers', () => {
    expect(formatProjectNumber(12345)).toBe('PRJ-12345');
  });

  it('should handle zero', () => {
    expect(formatProjectNumber(0)).toBe('PRJ-00000');
  });
});

// ─── isProjectEditable ───────────────────────────────────────────────────────

describe('isProjectEditable', () => {
  it('should return true for en_progreso projects', () => {
    expect(isProjectEditable('en_progreso')).toBe(true);
  });

  it('should return false for terminado projects', () => {
    expect(isProjectEditable('terminado')).toBe(false);
  });

  it('should return false for cerrado projects', () => {
    expect(isProjectEditable('cerrado')).toBe(false);
  });

  it('should return false for cancelado projects', () => {
    expect(isProjectEditable('cancelado')).toBe(false);
  });
});

// ─── canEditProject ──────────────────────────────────────────────────────────

describe('canEditProject', () => {
  it('should allow CSM who owns the project to edit', () => {
    const user = { id: 'user-1', role: 'csm' };
    const project = { csmId: 'user-1', estado: 'en_progreso' };
    expect(canEditProject(user, project)).toBe(true);
  });

  it('should allow CSM who does NOT own the project to NOT edit', () => {
    const user = { id: 'user-1', role: 'csm' };
    const project = { csmId: 'user-2', estado: 'en_progreso' };
    expect(canEditProject(user, project)).toBe(false);
  });

  it('should allow PO to edit any en_progreso project', () => {
    const user = { id: 'user-1', role: 'po' };
    const project = { csmId: 'user-2', estado: 'en_progreso' };
    expect(canEditProject(user, project)).toBe(true);
  });

  it('should not allow admin to edit', () => {
    const user = { id: 'user-1', role: 'admin' };
    const project = { csmId: 'user-1', estado: 'en_progreso' };
    expect(canEditProject(user, project)).toBe(false);
  });

  it('should not allow dev to edit', () => {
    const user = { id: 'user-1', role: 'dev' };
    const project = { csmId: 'user-1', estado: 'en_progreso' };
    expect(canEditProject(user, project)).toBe(false);
  });

  it('should not allow editing terminado projects', () => {
    const user = { id: 'user-1', role: 'csm' };
    const project = { csmId: 'user-1', estado: 'terminado' };
    expect(canEditProject(user, project)).toBe(false);
  });

  it('should not allow editing cerrado projects', () => {
    const user = { id: 'user-1', role: 'po' };
    const project = { csmId: 'user-2', estado: 'cerrado' };
    expect(canEditProject(user, project)).toBe(false);
  });
});

// ─── canDeleteProject ────────────────────────────────────────────────────────

describe('canDeleteProject', () => {
  it('should allow CSM who owns the project to delete', () => {
    const user = { id: 'user-1', role: 'csm' };
    const project = { csmId: 'user-1', estado: 'en_progreso' };
    expect(canDeleteProject(user, project)).toBe(true);
  });

  it('should allow PO to delete any en_progreso project', () => {
    const user = { id: 'user-1', role: 'po' };
    const project = { csmId: 'user-2', estado: 'en_progreso' };
    expect(canDeleteProject(user, project)).toBe(true);
  });

  it('should not allow CSM to delete projects they do not own', () => {
    const user = { id: 'user-1', role: 'csm' };
    const project = { csmId: 'user-2', estado: 'en_progreso' };
    expect(canDeleteProject(user, project)).toBe(false);
  });

  it('should not allow admin to delete', () => {
    const user = { id: 'user-1', role: 'admin' };
    const project = { csmId: 'user-1', estado: 'en_progreso' };
    expect(canDeleteProject(user, project)).toBe(false);
  });

  it('should not allow dev to delete', () => {
    const user = { id: 'user-1', role: 'dev' };
    const project = { csmId: 'user-1', estado: 'en_progreso' };
    expect(canDeleteProject(user, project)).toBe(false);
  });

  it('should not allow deleting terminado projects', () => {
    const user = { id: 'user-1', role: 'csm' };
    const project = { csmId: 'user-1', estado: 'terminado' };
    expect(canDeleteProject(user, project)).toBe(false);
  });

  it('should not allow deleting cancelado projects', () => {
    const user = { id: 'user-1', role: 'po' };
    const project = { csmId: 'user-2', estado: 'cancelado' };
    expect(canDeleteProject(user, project)).toBe(false);
  });
});

// ─── canChangeProjectState ───────────────────────────────────────────────────

describe('canChangeProjectState', () => {
  it('should allow CSM to change state of their project', () => {
    const user = { id: 'user-1', role: 'csm' };
    const project = { csmId: 'user-1', estado: 'en_progreso' };
    expect(canChangeProjectState(user, project)).toBe(true);
  });

  it('should allow PO to change state of any project', () => {
    const user = { id: 'user-1', role: 'po' };
    const project = { csmId: 'user-2', estado: 'en_progreso' };
    expect(canChangeProjectState(user, project)).toBe(true);
  });

  it('should not allow CSM to change state of projects they do not own', () => {
    const user = { id: 'user-1', role: 'csm' };
    const project = { csmId: 'user-2', estado: 'en_progreso' };
    expect(canChangeProjectState(user, project)).toBe(false);
  });

  it('should not allow admin to change state', () => {
    const user = { id: 'user-1', role: 'admin' };
    const project = { csmId: 'user-1', estado: 'en_progreso' };
    expect(canChangeProjectState(user, project)).toBe(false);
  });

  it('should not allow dev to change state', () => {
    const user = { id: 'user-1', role: 'dev' };
    const project = { csmId: 'user-1', estado: 'en_progreso' };
    expect(canChangeProjectState(user, project)).toBe(false);
  });
});

// ─── sanitizeProjectFields ───────────────────────────────────────────────────

describe('sanitizeProjectFields', () => {
  it('should only include allowed fields', () => {
    const body = {
      nombreCliente: 'TechCorp',
      nombreProyecto: 'Migration',
      crmId: 'CRM-001',
      invalidField: 'should be ignored',
      __proto__: 'prototype pollution',
    };
    const result = sanitizeProjectFields(body);
    expect(result).toEqual({
      nombreCliente: 'TechCorp',
      nombreProyecto: 'Migration',
      crmId: 'CRM-001',
    });
  });

  it('should convert fechaInicio string to Date', () => {
    const body = { fechaInicio: '2024-01-15T00:00:00.000Z' };
    const result = sanitizeProjectFields(body);
    expect(result.fechaInicio).toBeInstanceOf(Date);
    expect((result.fechaInicio as Date).toISOString()).toBe('2024-01-15T00:00:00.000Z');
  });

  it('should not convert null fechaInicio to Date', () => {
    const body = { fechaInicio: null };
    const result = sanitizeProjectFields(body);
    expect(result.fechaInicio).toBeNull();
  });

  it('should not convert undefined fechaInicio', () => {
    const body = {};
    const result = sanitizeProjectFields(body);
    expect(result).not.toHaveProperty('fechaInicio');
  });

  it('should return empty object for empty body', () => {
    const result = sanitizeProjectFields({});
    expect(result).toEqual({});
  });

  it('should handle all valid fields', () => {
    const body = {
      nombreCliente: 'Client',
      nombreProyecto: 'Project',
      crmId: 'CRM-1',
      fechaInicio: '2024-06-01',
      interlocutores: 'John, Jane',
      tribeId: 'tribe-1',
      evidencia: 'Evidence text',
      vozDolor: 'Voice of pain',
      impactoNegocio: 'Impact description',
      dependencias: 'Dependencies',
      importancia: 5,
      pedido: 'Order details',
    };
    const result = sanitizeProjectFields(body);
    expect(Object.keys(result)).toHaveLength(12);
    expect(result.nombreCliente).toBe('Client');
    expect(result.importancia).toBe(5);
  });
});
