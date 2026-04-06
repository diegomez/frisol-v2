/**
 * Pure functions for project state machine transitions.
 * Extracted from the estado API route for testability.
 *
 * State flow:
 *   en_progreso → terminado (CSM owner)
 *   terminado → cerrado (PO)
 *   terminado → cancelado (PO, with motivo)
 *   terminado → en_progreso (PO rejection, with motivo)
 *   cancelado → en_progreso (Admin reopen)
 *   cerrado → en_progreso (Admin reopen)
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type ProjectState = 'en_progreso' | 'terminado' | 'cerrado' | 'cancelado';
export type TransitionType = 'terminado' | 'cerrado' | 'cancelado' | 'rechazado' | 'reabierto';

export interface UserContext {
  id: string;
  role: string;
}

export interface ProjectContext {
  csmId: string;
  estado: string;
}

export interface ValidationResult {
  allowed: boolean;
  message?: string;
  transition?: TransitionType;
}

export interface TransitionData {
  data: Record<string, unknown>;
  historyEntry: TransitionType;
}

export const VALID_STATES: ProjectState[] = ['en_progreso', 'terminado', 'cerrado', 'cancelado'];

// ─── Validation ──────────────────────────────────────────────────────────────

/**
 * Validate if a state transition is allowed for the given user and project.
 * Returns a result with allowed flag, optional error message, and transition type.
 */
export function validateStateTransition(
  targetState: string,
  user: UserContext,
  project: ProjectContext,
): ValidationResult {
  // Validate target state
  if (!VALID_STATES.includes(targetState as ProjectState)) {
    return { allowed: false, message: 'Estado inválido' };
  }

  // → terminado
  if (targetState === 'terminado') {
    if (user.role !== 'csm') {
      return { allowed: false, message: 'Solo CSM puede marcar como terminado' };
    }
    if (project.csmId !== user.id) {
      return { allowed: false, message: 'No es tu proyecto' };
    }
    return { allowed: true, transition: 'terminado' };
  }

  // → cerrado
  if (targetState === 'cerrado') {
    if (user.role !== 'po') {
      return { allowed: false, message: 'Solo PO puede cerrar' };
    }
    if (project.estado !== 'terminado') {
      return { allowed: false, message: 'Debe estar terminado primero' };
    }
    return { allowed: true, transition: 'cerrado' };
  }

  // → cancelado
  if (targetState === 'cancelado') {
    if (user.role !== 'po') {
      return { allowed: false, message: 'Solo PO puede cancelar' };
    }
    if (project.estado !== 'terminado') {
      return { allowed: false, message: 'Solo se puede cancelar desde terminado' };
    }
    return { allowed: true, transition: 'cancelado' };
  }

  // → en_progreso (rejection or reopen)
  if (targetState === 'en_progreso') {
    // PO rejects from terminado
    if (user.role === 'po' && project.estado === 'terminado') {
      return { allowed: true, transition: 'rechazado' };
    }
    // Admin reopens from cancelado or cerrado
    if (user.role === 'admin' && (project.estado === 'cancelado' || project.estado === 'cerrado')) {
      return { allowed: true, transition: 'reabierto' };
    }
    return { allowed: false, message: 'Sin permisos para esta acción' };
  }

  return { allowed: false, message: 'Estado inválido' };
}

// ─── Transition data ─────────────────────────────────────────────────────────

/**
 * Build the Prisma update data and history entry for a state transition.
 */
export function getTransitionData(
  targetState: string,
  userId: string,
  motivo?: string | null,
  transitionType?: TransitionType,
): TransitionData {
  const now = new Date();

  switch (transitionType || targetState) {
    case 'terminado':
      return {
        data: {
          estado: 'terminado',
          terminadoById: userId,
          terminadoAt: now,
          rechazoMotivo: null,
        },
        historyEntry: 'terminado',
      };

    case 'cerrado':
      return {
        data: {
          estado: 'cerrado',
          cerradoById: userId,
          cerradoAt: now,
        },
        historyEntry: 'cerrado',
      };

    case 'cancelado':
      return {
        data: {
          estado: 'cancelado',
          canceladoById: userId,
          canceladoAt: now,
          rechazoMotivo: motivo || null,
        },
        historyEntry: 'cancelado',
      };

    case 'rechazado':
      return {
        data: {
          estado: 'en_progreso',
          terminadoById: null,
          terminadoAt: null,
          rechazoMotivo: motivo || null,
        },
        historyEntry: 'rechazado',
      };

    case 'reabierto':
      return {
        data: {
          estado: 'en_progreso',
          terminadoById: null,
          terminadoAt: null,
          cerradoById: null,
          cerradoAt: null,
          canceladoById: null,
          canceladoAt: null,
          rechazoMotivo: null,
        },
        historyEntry: 'reabierto',
      };

    default:
      return { data: { estado: targetState }, historyEntry: targetState as TransitionType };
  }
}
