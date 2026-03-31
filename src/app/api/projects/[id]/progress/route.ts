import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

function trim(v: string | null | undefined): string { return (v || '').trim(); }

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      symptoms: true,
      causas: true,
      kpis: true,
    },
  });
  if (!project) return NextResponse.json({ message: 'Proyecto no encontrado' }, { status: 404 });

  const green = (cond: boolean) => cond ? 'green' : 'red';
  const yellow = (hasAny: boolean, allComplete: boolean) => !hasAny ? 'red' : allComplete ? 'green' : 'yellow';

  const progress = {
    cliente: green(!!(trim(project.nombreCliente) && trim(project.nombreProyecto) && project.fechaInicio && trim(project.crmId) && project.importancia)),
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
    impacto: !trim(project.impactoNegocio) ? 'red'
      : project.kpis.length === 0 || project.kpis.some(k => !trim(k.nombre) || !trim(k.valorActual) || !trim(k.valorObjetivo))
        ? 'yellow' : 'green',
  };

  return NextResponse.json(progress);
}
