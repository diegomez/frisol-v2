/**
 * Pure functions for project permissions and data transformations.
 * Extracted from API route handlers for testability.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface UserContext {
  id: string;
  role: string;
}

export interface ProjectContext {
  csmId: string;
  estado: string;
}

// ─── Format helpers ──────────────────────────────────────────────────────────

/**
 * Format project number as PRJ-XXXXX (zero-padded to 5 digits).
 */
export function formatProjectNumber(num: number): string {
  return `PRJ-${String(num).padStart(5, '0')}`;
}

// ─── State checks ────────────────────────────────────────────────────────────

/**
 * Check if a project is in editable state.
 */
export function isProjectEditable(estado: string): boolean {
  return estado === 'en_progreso';
}

// ─── Permission checks ───────────────────────────────────────────────────────

/**
 * Check if user can edit a project.
 * Rules: CSM can edit their own projects, PO can edit any en_progreso project.
 */
export function canEditProject(user: UserContext, project: ProjectContext): boolean {
  if (!isProjectEditable(project.estado)) return false;
  if (user.role === 'po') return true;
  if (user.role === 'csm' && project.csmId === user.id) return true;
  return false;
}

/**
 * Check if user can delete a project.
 * Rules: CSM can delete their own en_progreso projects, PO can delete any en_progreso project.
 */
export function canDeleteProject(user: UserContext, project: ProjectContext): boolean {
  if (!isProjectEditable(project.estado)) return false;
  if (user.role === 'po') return true;
  if (user.role === 'csm' && project.csmId === user.id) return true;
  return false;
}

/**
 * Check if user can change project state.
 * Rules: CSM can change state of their own projects, PO can change any project.
 */
export function canChangeProjectState(user: UserContext, project: ProjectContext): boolean {
  if (user.role === 'po') return true;
  if (user.role === 'csm' && project.csmId === user.id) return true;
  return false;
}

// ─── Data sanitization ───────────────────────────────────────────────────────

const ALLOWED_PROJECT_FIELDS = [
  'nombreCliente',
  'nombreProyecto',
  'crmId',
  'fechaInicio',
  'interlocutores',
  'tribeId',
  'evidencia',
  'vozDolor',
  'impactoNegocio',
  'dependencias',
  'importancia',
  'pedido',
] as const;

/**
 * Sanitize and transform project update fields.
 * Only allows whitelisted fields and converts fechaInicio to Date.
 */
export function sanitizeProjectFields(body: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const field of ALLOWED_PROJECT_FIELDS) {
    if (field in body) {
      let value = body[field];
      if (field === 'fechaInicio' && value) {
        value = new Date(value as string);
      }
      result[field] = value;
    }
  }

  return result;
}
