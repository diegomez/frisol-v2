/**
 * Pure functions for attachment handling.
 * Extracted from the attachments API route for testability.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  message?: string;
}

// ─── File name generation ────────────────────────────────────────────────────

/**
 * Generate a unique stored filename with timestamp and random suffix.
 * Preserves the original file extension.
 */
export function generateStoredName(originalName: string): string {
  const ext = originalName.split('.').pop() || '';
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return ext ? `${timestamp}-${random}.${ext}` : `${timestamp}-${random}`;
}

// ─── Validation ──────────────────────────────────────────────────────────────

/**
 * Validate attachment upload data.
 */
export function validateAttachmentUpload(data: { file: boolean; title: string }): ValidationResult {
  if (!data.file || !data.title?.trim()) {
    return { valid: false, message: 'Archivo y título son obligatorios' };
  }
  return { valid: true };
}

/**
 * Sanitize attachment title by trimming whitespace.
 */
export function sanitizeAttachmentTitle(title: string | null | undefined): string {
  return (title || '').trim();
}
