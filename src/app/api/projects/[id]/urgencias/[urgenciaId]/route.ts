import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function PATCH(request: Request, { params }: { params: { id: string; urgenciaId: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
  const project = await prisma.project.findUnique({ where: { id: params.id } });
  if (!project || project.estado !== 'en_progreso') return NextResponse.json({ message: 'No editable' }, { status: 403 });
  const body = await request.json();
  const updateData: any = {};
  if (body.tipo) updateData.tipo = body.tipo;
  if (body.justificacion !== undefined) updateData.justificacion = body.justificacion;
  if (body.fechaDeseada !== undefined) updateData.fechaDeseada = body.fechaDeseada ? new Date(body.fechaDeseada) : null;
  const urgencia = await prisma.urgencia.update({ where: { id: params.urgenciaId }, data: updateData });
  return NextResponse.json(urgencia);
}

export async function DELETE(request: Request, { params }: { params: { id: string; urgenciaId: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
  await prisma.urgencia.delete({ where: { id: params.urgenciaId } });
  return NextResponse.json({ message: 'Eliminado' });
}
