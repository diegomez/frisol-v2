import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      csm: { select: { id: true, name: true, email: true } },
      tribe: true,
      terminadoBy: { select: { name: true } },
      cerradoBy: { select: { name: true } },
      canceladoBy: { select: { name: true } },
      symptoms: { orderBy: { createdAt: 'asc' } },
      causas: { orderBy: { createdAt: 'asc' } },
      kpis: { orderBy: { createdAt: 'asc' } },
      attachments: { orderBy: { uploadedAt: 'desc' } },
    },
  });

  if (!project) return NextResponse.json({ message: 'Proyecto no encontrado' }, { status: 404 });
  return NextResponse.json(project);
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });

  const project = await prisma.project.findUnique({ where: { id: params.id } });
  if (!project) return NextResponse.json({ message: 'Proyecto no encontrado' }, { status: 404 });
  if (project.estado !== 'en_progreso') return NextResponse.json({ message: 'No editable' }, { status: 403 });
  if (project.csmId !== user.id && user.role !== 'po') return NextResponse.json({ message: 'Sin acceso' }, { status: 403 });

  const body = await request.json();
  const updateData: any = {};
  const fields = ['nombreCliente', 'nombreProyecto', 'crmId', 'fechaInicio', 'interlocutores', 'tribeId', 'evidencia', 'vozDolor', 'impactoNegocio', 'importancia', 'pedido'];
  for (const f of fields) {
    if (f in body) {
      updateData[f] = f === 'fechaInicio' && body[f] ? new Date(body[f]) : body[f];
    }
  }

  const updated = await prisma.project.update({ where: { id: params.id }, data: updateData });
  return NextResponse.json(updated);
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
  if (user.role !== 'csm' && user.role !== 'po') return NextResponse.json({ message: 'Sin permisos' }, { status: 403 });

  const project = await prisma.project.findUnique({ where: { id: params.id } });
  if (!project) return NextResponse.json({ message: 'Proyecto no encontrado' }, { status: 404 });
  if (project.estado !== 'en_progreso') return NextResponse.json({ message: 'Solo se pueden eliminar proyectos en progreso' }, { status: 403 });
  if (user.role === 'csm' && project.csmId !== user.id) return NextResponse.json({ message: 'No es tu proyecto' }, { status: 403 });

  await prisma.project.update({ where: { id: params.id }, data: { deletedAt: new Date() } });
  return NextResponse.json({ message: 'Proyecto eliminado' });
}
