/**
 * Pure functions for calculating project progress indicators.
 * Extracted from the progress API route for testability.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type ProgressState = 'green' | 'yellow' | 'red';

export interface ProgressResult {
  cliente: ProgressState;
  diagnostico: ProgressState;
  evidencia: ProgressState;
  vozDolor: ProgressState;
  causas: ProgressState;
  impacto: ProgressState;
  dependencias: ProgressState;
}

export interface SymptomData {
  what: string | null;
  who: string | null;
  whenField: string | null;
  whereField: string | null;
  how: string | null;
  declaration: string | null;
}

export interface CausaData {
  why1: string | null;
  why2: string | null;
  why3: string | null;
  originMetodo: boolean;
  originMaquina: boolean;
  originGobernanza: boolean;
}

export interface KpiData {
  nombre: string | null;
  valorActual: string | null;
  valorObjetivo: string | null;
}

export interface ProjectForProgress {
  nombreCliente: string | null;
  nombreProyecto: string | null;
  crmId: string | null;
  fechaInicio: Date | null;
  importancia: number | null;
  evidencia: string | null;
  vozDolor: string | null;
  impactoNegocio: string | null;
  dependencias: string | null;
  symptoms: SymptomData[];
  causas: CausaData[];
  kpis: KpiData[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function trim(v: string | null | undefined): string {
  return (v || '').trim();
}

function green(cond: boolean): ProgressState {
  return cond ? 'green' : 'red';
}

function yellow(hasAny: boolean, allComplete: boolean): ProgressState {
  return !hasAny ? 'red' : allComplete ? 'green' : 'yellow';
}

// ─── Progress calculation ────────────────────────────────────────────────────

/**
 * Calculate progress indicators for each section of a project wizard.
 * Returns a record of section → 'green' | 'yellow' | 'red'.
 */
export function calculateProgress(project: ProjectForProgress): ProgressResult {
  return {
    cliente: green(
      !!(trim(project.nombreCliente) && trim(project.nombreProyecto) && project.fechaInicio && trim(project.crmId) && project.importancia)
    ),
    diagnostico: yellow(
      project.symptoms.length > 0,
      project.symptoms.length > 0 && project.symptoms.every(s =>
        trim(s.what) && trim(s.who) && trim(s.whenField) && trim(s.whereField) && trim(s.how) && trim(s.declaration)
      )
    ),
    evidencia: green(!!trim(project.evidencia)),
    vozDolor: green(!!trim(project.vozDolor)),
    causas: yellow(
      project.causas.length > 0,
      project.causas.length > 0 && project.causas.every(c =>
        trim(c.why1) && trim(c.why2) && trim(c.why3) && (c.originMetodo || c.originMaquina || c.originGobernanza)
      )
    ),
    impacto: !trim(project.impactoNegocio)
      ? 'red'
      : project.kpis.length === 0 || project.kpis.some(k => !trim(k.nombre) || !trim(k.valorActual) || !trim(k.valorObjetivo))
        ? 'yellow'
        : 'green',
    dependencias: green(!!trim(project.dependencias)),
  };
}
