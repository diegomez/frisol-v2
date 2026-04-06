/**
 * Pure functions for user validation and sanitization.
 * Extracted from the users API routes for testability.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface UserCreateBody {
  email?: string;
  password?: string;
  name?: string;
  role?: string;
  active?: boolean;
  tribeId?: string | null;
  [key: string]: unknown;
}

export interface UserUpdateBody {
  email?: string;
  name?: string;
  role?: string;
  active?: boolean;
  tribeId?: string | null;
  password?: string;
  [key: string]: unknown;
}

export interface ValidationResult {
  valid: boolean;
  message?: string;
}

const CREATE_FIELDS = ['email', 'password', 'name', 'role', 'active', 'tribeId'] as const;
const UPDATE_FIELDS = ['email', 'name', 'role', 'active', 'tribeId', 'password'] as const;

// ─── Validation ──────────────────────────────────────────────────────────────

/**
 * Validate required fields for user creation.
 */
export function validateUserCreate(body: Record<string, unknown>): ValidationResult {
  const { email, password, name, role } = body;
  if (!email || !password || !name || !role) {
    return { valid: false, message: 'Campos obligatorios faltantes' };
  }
  if (typeof email === 'string' && email.trim() === '') {
    return { valid: false, message: 'Campos obligatorios faltantes' };
  }
  return { valid: true };
}

// ─── Sanitization ────────────────────────────────────────────────────────────

/**
 * Sanitize user creation fields. Only allows whitelisted fields.
 * Defaults active to true, tribeId to null when empty.
 */
export function sanitizeUserCreateFields(body: UserCreateBody): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const field of CREATE_FIELDS) {
    if (field in body) {
      let value = body[field];
      if (field === 'tribeId' && (!value || value === '')) {
        value = null;
      }
      result[field] = value;
    }
  }

  // Default active to true
  if (result.active === undefined) {
    result.active = true;
  }

  return result;
}

/**
 * Sanitize user update fields. Only allows whitelisted fields.
 * Sets tribeId to null when empty string.
 */
export function sanitizeUserUpdateFields(body: UserUpdateBody): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const field of UPDATE_FIELDS) {
    if (field in body) {
      let value = body[field];
      if (field === 'tribeId' && value === '') {
        value = null;
      }
      result[field] = value;
    }
  }

  return result;
}
