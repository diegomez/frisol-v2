/**
 * Pure functions for root cause analysis (5 Whys).
 * Extracted from the causas API route for testability.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CausaBody {
  why1?: string | null;
  why2?: string | null;
  why3?: string | null;
  why4?: string | null;
  why5?: string | null;
  originMetodo?: boolean;
  originMaquina?: boolean;
  originGobernanza?: boolean;
  [key: string]: unknown;
}

export interface SanitizedCausa {
  why1?: string | null;
  why2?: string | null;
  why3?: string | null;
  why4?: string | null;
  why5?: string | null;
  originMetodo?: boolean;
  originMaquina?: boolean;
  originGobernanza?: boolean;
  rootCause: string;
}

const ALLOWED_CAUSA_FIELDS = [
  'why1', 'why2', 'why3', 'why4', 'why5',
  'originMetodo', 'originMaquina', 'originGobernanza',
] as const;

// ─── Root cause computation ──────────────────────────────────────────────────

/**
 * Compute the root cause from the 5 Whys.
 * Returns the deepest non-empty why, falling back to why3 as minimum.
 */
export function computeRootCause(body: CausaBody): string {
  return (body.why5?.trim()) || (body.why4?.trim()) || (body.why3?.trim()) || '';
}

/**
 * Sanitize causa fields and compute rootCause automatically.
 * Only allows whitelisted fields.
 */
export function sanitizeCausaFields(body: CausaBody): SanitizedCausa {
  const result: Record<string, unknown> = {};

  for (const field of ALLOWED_CAUSA_FIELDS) {
    if (field in body) {
      result[field] = body[field];
    }
  }

  result.rootCause = computeRootCause(body);

  return result as unknown as SanitizedCausa;
}
