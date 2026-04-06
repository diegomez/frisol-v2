import { describe, it, expect } from 'vitest';
import {
  sanitizeUserUpdateFields,
  sanitizeUserCreateFields,
  validateUserCreate,
} from '@/lib/user-validation';

// ─── validateUserCreate ──────────────────────────────────────────────────────

describe('validateUserCreate', () => {
  it('should pass when all required fields are present', () => {
    const result = validateUserCreate({ email: 'test@frisol.com', password: 'pass123', name: 'Test', role: 'csm' });
    expect(result.valid).toBe(true);
  });

  it('should fail when email is missing', () => {
    const result = validateUserCreate({ password: 'pass123', name: 'Test', role: 'csm' });
    expect(result.valid).toBe(false);
    expect(result.message).toContain('obligatorios');
  });

  it('should fail when password is missing', () => {
    const result = validateUserCreate({ email: 'test@frisol.com', name: 'Test', role: 'csm' });
    expect(result.valid).toBe(false);
  });

  it('should fail when name is missing', () => {
    const result = validateUserCreate({ email: 'test@frisol.com', password: 'pass123', role: 'csm' });
    expect(result.valid).toBe(false);
  });

  it('should fail when role is missing', () => {
    const result = validateUserCreate({ email: 'test@frisol.com', password: 'pass123', name: 'Test' });
    expect(result.valid).toBe(false);
  });

  it('should fail with empty string fields', () => {
    const result = validateUserCreate({ email: '', password: 'pass123', name: 'Test', role: 'csm' });
    expect(result.valid).toBe(false);
  });
});

// ─── sanitizeUserCreateFields ────────────────────────────────────────────────

describe('sanitizeUserCreateFields', () => {
  it('should include only allowed fields', () => {
    const body = {
      email: 'test@frisol.com',
      password: 'pass123',
      name: 'Test User',
      role: 'csm',
      active: true,
      tribeId: 'tribe-1',
      invalidField: 'nope',
      __proto__: 'pollution',
    };
    const result = sanitizeUserCreateFields(body);
    expect(result).toEqual({
      email: 'test@frisol.com',
      password: 'pass123',
      name: 'Test User',
      role: 'csm',
      active: true,
      tribeId: 'tribe-1',
    });
  });

  it('should default active to true when not provided', () => {
    const result = sanitizeUserCreateFields({ email: 'test@frisol.com', password: 'pass123', name: 'Test', role: 'csm' });
    expect(result.active).toBe(true);
  });

  it('should set tribeId to null when empty or undefined', () => {
    const result = sanitizeUserCreateFields({
      email: 'test@frisol.com',
      password: 'pass123',
      name: 'Test',
      role: 'csm',
      tribeId: '',
    });
    expect(result.tribeId).toBeNull();
  });

  it('should keep tribeId when provided', () => {
    const result = sanitizeUserCreateFields({
      email: 'test@frisol.com',
      password: 'pass123',
      name: 'Test',
      role: 'csm',
      tribeId: 'tribe-1',
    });
    expect(result.tribeId).toBe('tribe-1');
  });
});

// ─── sanitizeUserUpdateFields ────────────────────────────────────────────────

describe('sanitizeUserUpdateFields', () => {
  it('should include only allowed fields', () => {
    const body = {
      email: 'new@frisol.com',
      name: 'New Name',
      role: 'admin',
      active: false,
      tribeId: 'tribe-2',
      password: 'newpass',
      invalidField: 'nope',
    };
    const result = sanitizeUserUpdateFields(body);
    expect(result).toEqual({
      email: 'new@frisol.com',
      name: 'New Name',
      role: 'admin',
      active: false,
      tribeId: 'tribe-2',
      password: 'newpass',
    });
  });

  it('should return empty object when no valid fields', () => {
    const result = sanitizeUserUpdateFields({ invalidField: 'nope' });
    expect(result).toEqual({});
  });

  it('should set tribeId to null when empty string', () => {
    const result = sanitizeUserUpdateFields({ tribeId: '' });
    expect(result.tribeId).toBeNull();
  });

  it('should keep tribeId when provided', () => {
    const result = sanitizeUserUpdateFields({ tribeId: 'tribe-1' });
    expect(result.tribeId).toBe('tribe-1');
  });

  it('should not include tribeId when undefined', () => {
    const result = sanitizeUserUpdateFields({ name: 'Test' });
    expect(result).not.toHaveProperty('tribeId');
  });

  it('should include password for hashing later', () => {
    const result = sanitizeUserUpdateFields({ password: 'newpass123' });
    expect(result.password).toBe('newpass123');
  });
});
