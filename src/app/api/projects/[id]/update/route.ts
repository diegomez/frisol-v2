import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });

  const project = await prisma.project.findUnique({ where: { id: params.id } });
  if (!project) return NextResponse.json({ message: 'Proyecto no encontrado' }, { status: 404 });
  if (project.estado !== 'en_progreso') return NextResponse.json({ message: 'No editable' }, { status: 403 });
  if (project.csmId !== user.id && user.role !== 'po') return NextResponse.json({ message: 'Sin acceso' }, { status: 403 });

  const body = await request.json();
  const updateData: any = {};

  // Only update fields that are provided
  if ('nombreCliente' in body) updateData.nombreCliente = body.nombreCliente;
  if ('nombreProyecto' in body) updateData.nombreProyecto = body.nombreProyecto;
  if ('crmId' in body) updateData.crmId = body.crmId;
  if ('fechaInicio' in body) updateData.fechaInicio = body.fechaInicio ? new Date(body.fechaInicio) : null;
  if ('interlocutores' in body) updateData.interlocutores = body.interlocutores;
  if ('tribeId' in body) updateData.tribeId = body.tribeId;
  if ('evidencia' in body) updateData.evidencia = body.evidencia;
  if ('vozDolor' in body) updateData.vozDolor = body.vozDolor;
  if ('impactoNegocio' in body) updateData.impactoNegocio = body.impactoNegocio;

  const updated = await prisma.project.update({ where: { id: params.id }, data: updateData });
  return NextResponse.json(updated);
}
