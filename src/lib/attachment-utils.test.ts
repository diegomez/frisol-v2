import { describe, it, expect } from 'vitest';
import {
  generateStoredName,
  validateAttachmentUpload,
  sanitizeAttachmentTitle,
} from '@/lib/attachment-utils';

// ─── generateStoredName ──────────────────────────────────────────────────────

describe('generateStoredName', () => {
  it('should generate a unique name with timestamp and random string', () => {
    const name = generateStoredName('report.pdf');
    expect(name).toMatch(/^\d{13}-[a-z0-9]{6}\.pdf$/);
  });

  it('should handle files without extension', () => {
    const name = generateStoredName('noextension');
    // When no dot exists, split('.').pop() returns the full name as "extension"
    expect(name).toMatch(/^\d{13}-[a-z0-9]{6}\.noextension$/);
  });

  it('should handle files with multiple dots', () => {
    const name = generateStoredName('my.report.final.pdf');
    expect(name).toMatch(/\.pdf$/);
  });

  it('should generate different names for same input', () => {
    const name1 = generateStoredName('test.txt');
    const name2 = generateStoredName('test.txt');
    expect(name1).not.toBe(name2); // Different timestamps or random
  });
});

// ─── validateAttachmentUpload ────────────────────────────────────────────────

describe('validateAttachmentUpload', () => {
  it('should pass with valid file and title', () => {
    const result = validateAttachmentUpload({ file: true, title: 'My Document' });
    expect(result.valid).toBe(true);
  });

  it('should fail when file is missing', () => {
    const result = validateAttachmentUpload({ file: false, title: 'My Document' });
    expect(result.valid).toBe(false);
    expect(result.message).toContain('obligatorios');
  });

  it('should fail when title is missing', () => {
    const result = validateAttachmentUpload({ file: true, title: '' });
    expect(result.valid).toBe(false);
  });

  it('should fail when title is only whitespace', () => {
    const result = validateAttachmentUpload({ file: true, title: '   ' });
    expect(result.valid).toBe(false);
  });

  it('should fail when both are missing', () => {
    const result = validateAttachmentUpload({ file: false, title: '' });
    expect(result.valid).toBe(false);
  });
});

// ─── sanitizeAttachmentTitle ─────────────────────────────────────────────────

describe('sanitizeAttachmentTitle', () => {
  it('should trim whitespace', () => {
    expect(sanitizeAttachmentTitle('  My Title  ')).toBe('My Title');
  });

  it('should return empty string for null/undefined', () => {
    expect(sanitizeAttachmentTitle(null)).toBe('');
    expect(sanitizeAttachmentTitle(undefined)).toBe('');
  });

  it('should return empty string for whitespace-only', () => {
    expect(sanitizeAttachmentTitle('   ')).toBe('');
  });
});
