import { describe, it, expect } from 'vitest';
import { sanitizeKpiFields, sanitizeUrgenciaFields } from '@/lib/resource-sanitization';

// ─── sanitizeKpiFields ───────────────────────────────────────────────────────

describe('sanitizeKpiFields', () => {
  it('should include only allowed fields', () => {
    const body = { nombre: 'KPI1', valorActual: '50', valorObjetivo: '100', invalid: 'nope' };
    const result = sanitizeKpiFields(body);
    expect(result).toEqual({ nombre: 'KPI1', valorActual: '50', valorObjetivo: '100' });
  });

  it('should return empty object for empty body', () => {
    const result = sanitizeKpiFields({});
    expect(result).toEqual({});
  });

  it('should handle partial fields', () => {
    const body = { nombre: 'KPI1' };
    const result = sanitizeKpiFields(body);
    expect(result).toEqual({ nombre: 'KPI1' });
  });
});

// ─── sanitizeUrgenciaFields ──────────────────────────────────────────────────

describe('sanitizeUrgenciaFields', () => {
  it('should include only allowed fields', () => {
    const body = { tipo: 'alta', justificacion: 'Urgent', fechaDeseada: '2024-06-01', invalid: 'nope' };
    const result = sanitizeUrgenciaFields(body);
    expect(result).toEqual({
      tipo: 'alta',
      justificacion: 'Urgent',
      fechaDeseada: new Date('2024-06-01'),
    });
  });

  it('should set fechaDeseada to null when not provided', () => {
    const body = { tipo: 'media', justificacion: 'Medium' };
    const result = sanitizeUrgenciaFields(body);
    expect(result.fechaDeseada).toBeNull();
  });

  it('should set fechaDeseada to null when empty', () => {
    const body = { tipo: 'baja', justificacion: 'Low', fechaDeseada: '' };
    const result = sanitizeUrgenciaFields(body);
    expect(result.fechaDeseada).toBeNull();
  });

  it('should convert valid fechaDeseada string to Date', () => {
    const body = { tipo: 'alta', justificacion: 'Urgent', fechaDeseada: '2024-12-25T00:00:00.000Z' };
    const result = sanitizeUrgenciaFields(body);
    expect(result.fechaDeseada).toBeInstanceOf(Date);
    expect((result.fechaDeseada as Date).toISOString()).toBe('2024-12-25T00:00:00.000Z');
  });

  it('should return empty object for empty body', () => {
    const result = sanitizeUrgenciaFields({});
    expect(result).toEqual({ fechaDeseada: null });
  });
});
