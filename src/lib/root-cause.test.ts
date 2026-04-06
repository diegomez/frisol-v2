import { describe, it, expect } from 'vitest';
import { computeRootCause, sanitizeCausaFields } from '@/lib/root-cause';

// ─── computeRootCause ────────────────────────────────────────────────────────

describe('computeRootCause', () => {
  it('should return why5 when available', () => {
    expect(computeRootCause({ why5: 'Root cause at level 5' })).toBe('Root cause at level 5');
  });

  it('should return why4 when why5 is empty', () => {
    expect(computeRootCause({ why4: 'Root cause at level 4', why5: '' })).toBe('Root cause at level 4');
  });

  it('should return why3 when why4 and why5 are empty', () => {
    expect(computeRootCause({ why3: 'Root cause at level 3', why4: '', why5: '' })).toBe('Root cause at level 3');
  });

  it('should trim whitespace from why5', () => {
    expect(computeRootCause({ why5: '  trimmed  ' })).toBe('trimmed');
  });

  it('should return empty string when all are empty', () => {
    expect(computeRootCause({})).toBe('');
  });

  it('should skip null/undefined values', () => {
    expect(computeRootCause({ why5: null, why4: null, why3: 'Fallback' })).toBe('Fallback');
  });

  it('should prefer why5 even if why4 and why3 exist', () => {
    expect(computeRootCause({ why5: 'Deepest', why4: 'Middle', why3: 'Shallow' })).toBe('Deepest');
  });
});

// ─── sanitizeCausaFields ─────────────────────────────────────────────────────

describe('sanitizeCausaFields', () => {
  it('should include only allowed fields', () => {
    const body = { why1: 'W1', why2: 'W2', why3: 'W3', invalidField: 'nope' };
    const result = sanitizeCausaFields(body);
    expect(result).toEqual({ why1: 'W1', why2: 'W2', why3: 'W3', rootCause: 'W3' });
  });

  it('should include optional why4 and why5', () => {
    const body = { why1: 'W1', why2: 'W2', why3: 'W3', why4: 'W4', why5: 'W5' };
    const result = sanitizeCausaFields(body);
    expect(result).toEqual({ why1: 'W1', why2: 'W2', why3: 'W3', why4: 'W4', why5: 'W5', rootCause: 'W5' });
  });

  it('should include origin flags', () => {
    const body = { why1: 'W1', why2: 'W2', why3: 'W3', originMetodo: true, originMaquina: false, originGobernanza: true };
    const result = sanitizeCausaFields(body);
    expect(result).toEqual({ why1: 'W1', why2: 'W2', why3: 'W3', originMetodo: true, originMaquina: false, originGobernanza: true, rootCause: 'W3' });
  });

  it('should compute rootCause from why fields', () => {
    const body = { why1: 'W1', why2: 'W2', why3: 'W3', why4: 'W4', why5: 'W5' };
    const result = sanitizeCausaFields(body);
    expect(result.rootCause).toBe('W5');
  });

  it('should compute rootCause from why3 when why4/why5 missing', () => {
    const body = { why1: 'W1', why2: 'W2', why3: 'W3' };
    const result = sanitizeCausaFields(body);
    expect(result.rootCause).toBe('W3');
  });

  it('should return empty object for empty body', () => {
    const result = sanitizeCausaFields({});
    expect(result).toEqual({ rootCause: '' });
  });
});
