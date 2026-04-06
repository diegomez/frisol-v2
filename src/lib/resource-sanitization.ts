/**
 * Pure functions for sanitizing KPI and Urgencia data.
 * Extracted from API routes for testability.
 */

// ─── KPI ─────────────────────────────────────────────────────────────────────

const KPI_FIELDS = ['nombre', 'valorActual', 'valorObjetivo'] as const;

export function sanitizeKpiFields(body: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const field of KPI_FIELDS) {
    if (field in body) {
      result[field] = body[field];
    }
  }
  return result;
}

// ─── Urgencia ────────────────────────────────────────────────────────────────

const URGENCIA_FIELDS = ['tipo', 'justificacion', 'fechaDeseada'] as const;

export function sanitizeUrgenciaFields(body: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = { fechaDeseada: null };
  for (const field of URGENCIA_FIELDS) {
    if (field in body) {
      let value = body[field];
      if (field === 'fechaDeseada') {
        result[field] = value && value !== '' ? new Date(value as string) : null;
      } else {
        result[field] = value;
      }
    }
  }
  return result;
}
