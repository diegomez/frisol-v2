import { describe, it, expect } from 'vitest';
import { calculateProgress } from '@/lib/project-progress';

// ─── Helper to build minimal project ─────────────────────────────────────────

function makeProject(overrides: Record<string, unknown> = {}) {
  return {
    nombreCliente: null,
    nombreProyecto: null,
    crmId: null,
    fechaInicio: null,
    importancia: null,
    evidencia: null,
    vozDolor: null,
    impactoNegocio: null,
    dependencias: null,
    symptoms: [],
    causas: [],
    kpis: [],
    ...overrides,
  };
}

// ─── Cliente progress ────────────────────────────────────────────────────────

describe('calculateProgress - cliente', () => {
  it('should be red when no client info is filled', () => {
    const result = calculateProgress(makeProject());
    expect(result.cliente).toBe('red');
  });

  it('should be green when all client fields are filled', () => {
    const result = calculateProgress(makeProject({
      nombreCliente: 'TechCorp',
      nombreProyecto: 'Migration',
      crmId: 'CRM-001',
      fechaInicio: new Date('2024-01-01'),
      importancia: 5,
    }));
    expect(result.cliente).toBe('green');
  });

  it('should be red when only some client fields are filled', () => {
    const result = calculateProgress(makeProject({
      nombreCliente: 'TechCorp',
      nombreProyecto: null,
    }));
    expect(result.cliente).toBe('red');
  });
});

// ─── Diagnostico progress ────────────────────────────────────────────────────

describe('calculateProgress - diagnostico', () => {
  it('should be red when no symptoms exist', () => {
    const result = calculateProgress(makeProject());
    expect(result.diagnostico).toBe('red');
  });

  it('should be yellow when symptoms exist but some are incomplete', () => {
    const result = calculateProgress(makeProject({
      symptoms: [
        { what: 'Something', who: 'Team', whenField: 'Monday', whereField: 'Office', how: 'Process', declaration: '' },
      ],
    }));
    expect(result.diagnostico).toBe('yellow');
  });

  it('should be green when all symptoms are complete', () => {
    const result = calculateProgress(makeProject({
      symptoms: [
        { what: 'Something', who: 'Team', whenField: 'Monday', whereField: 'Office', how: 'Process', declaration: 'Decl' },
        { what: 'Other', who: 'User', whenField: 'Tuesday', whereField: 'Home', how: 'System', declaration: 'Decl2' },
      ],
    }));
    expect(result.diagnostico).toBe('green');
  });
});

// ─── Evidencia progress ──────────────────────────────────────────────────────

describe('calculateProgress - evidencia', () => {
  it('should be red when evidencia is empty', () => {
    const result = calculateProgress(makeProject());
    expect(result.evidencia).toBe('red');
  });

  it('should be green when evidencia has content', () => {
    const result = calculateProgress(makeProject({ evidencia: 'Evidence text here' }));
    expect(result.evidencia).toBe('green');
  });

  it('should be red when evidencia is only whitespace', () => {
    const result = calculateProgress(makeProject({ evidencia: '   ' }));
    expect(result.evidencia).toBe('red');
  });
});

// ─── Voz de dolor progress ───────────────────────────────────────────────────

describe('calculateProgress - vozDolor', () => {
  it('should be red when vozDolor is empty', () => {
    const result = calculateProgress(makeProject());
    expect(result.vozDolor).toBe('red');
  });

  it('should be green when vozDolor has content', () => {
    const result = calculateProgress(makeProject({ vozDolor: 'Voice of pain text' }));
    expect(result.vozDolor).toBe('green');
  });
});

// ─── Causas progress ─────────────────────────────────────────────────────────

describe('calculateProgress - causas', () => {
  it('should be red when no causas exist', () => {
    const result = calculateProgress(makeProject());
    expect(result.causas).toBe('red');
  });

  it('should be yellow when causas exist but incomplete', () => {
    const result = calculateProgress(makeProject({
      causas: [
        { why1: 'Why1', why2: 'Why2', why3: '', originMetodo: false, originMaquina: false, originGobernanza: false },
      ],
    }));
    expect(result.causas).toBe('yellow');
  });

  it('should be green when all causas are complete with origin', () => {
    const result = calculateProgress(makeProject({
      causas: [
        { why1: 'Why1', why2: 'Why2', why3: 'Why3', originMetodo: true, originMaquina: false, originGobernanza: false },
      ],
    }));
    expect(result.causas).toBe('green');
  });

  it('should be green with originMaquina', () => {
    const result = calculateProgress(makeProject({
      causas: [
        { why1: 'Why1', why2: 'Why2', why3: 'Why3', originMetodo: false, originMaquina: true, originGobernanza: false },
      ],
    }));
    expect(result.causas).toBe('green');
  });

  it('should be green with originGobernanza', () => {
    const result = calculateProgress(makeProject({
      causas: [
        { why1: 'Why1', why2: 'Why2', why3: 'Why3', originMetodo: false, originMaquina: false, originGobernanza: true },
      ],
    }));
    expect(result.causas).toBe('green');
  });
});

// ─── Impacto progress ────────────────────────────────────────────────────────

describe('calculateProgress - impacto', () => {
  it('should be red when impactoNegocio is empty', () => {
    const result = calculateProgress(makeProject());
    expect(result.impacto).toBe('red');
  });

  it('should be yellow when impactoNegocio exists but no KPIs', () => {
    const result = calculateProgress(makeProject({
      impactoNegocio: 'Impact description',
      kpis: [],
    }));
    expect(result.impacto).toBe('yellow');
  });

  it('should be yellow when KPIs are incomplete', () => {
    const result = calculateProgress(makeProject({
      impactoNegocio: 'Impact description',
      kpis: [{ nombre: 'KPI1', valorActual: '', valorObjetivo: '100' }],
    }));
    expect(result.impacto).toBe('yellow');
  });

  it('should be green when impactoNegocio and all KPIs are complete', () => {
    const result = calculateProgress(makeProject({
      impactoNegocio: 'Impact description',
      kpis: [
        { nombre: 'KPI1', valorActual: '50', valorObjetivo: '100' },
        { nombre: 'KPI2', valorActual: '75', valorObjetivo: '200' },
      ],
    }));
    expect(result.impacto).toBe('green');
  });
});

// ─── Dependencias progress ───────────────────────────────────────────────────

describe('calculateProgress - dependencias', () => {
  it('should be red when dependencias is empty', () => {
    const result = calculateProgress(makeProject());
    expect(result.dependencias).toBe('red');
  });

  it('should be green when dependencias has content', () => {
    const result = calculateProgress(makeProject({ dependencias: 'Dependencies text' }));
    expect(result.dependencias).toBe('green');
  });
});

// ─── Full project (all green) ────────────────────────────────────────────────

describe('calculateProgress - full project', () => {
  it('should be all green for a complete project', () => {
    const result = calculateProgress(makeProject({
      nombreCliente: 'TechCorp',
      nombreProyecto: 'Migration',
      crmId: 'CRM-001',
      fechaInicio: new Date('2024-01-01'),
      importancia: 5,
      evidencia: 'Evidence',
      vozDolor: 'Voice of pain',
      impactoNegocio: 'Impact',
      dependencias: 'Deps',
      symptoms: [
        { what: 'W', who: 'Who', whenField: 'When', whereField: 'Where', how: 'How', declaration: 'Decl' },
      ],
      causas: [
        { why1: 'W1', why2: 'W2', why3: 'W3', originMetodo: true, originMaquina: false, originGobernanza: false },
      ],
      kpis: [
        { nombre: 'KPI1', valorActual: '50', valorObjetivo: '100' },
      ],
    }));

    expect(result.cliente).toBe('green');
    expect(result.diagnostico).toBe('green');
    expect(result.evidencia).toBe('green');
    expect(result.vozDolor).toBe('green');
    expect(result.causas).toBe('green');
    expect(result.impacto).toBe('green');
    expect(result.dependencias).toBe('green');
  });
});
