import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function PATCH(request: Request, { params }: { params: { id: string; kpiId: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
  const project = await prisma.project.findUnique({ where: { id: params.id } });
  if (!project || project.estado !== 'en_progreso') return NextResponse.json({ message: 'No editable' }, { status: 403 });
  const body = await request.json();
  const updateData: any = {};
  if (body.nombre) updateData.nombre = body.nombre;
  if (body.valorActual) updateData.valorActual = body.valorActual;
  if (body.valorObjetivo) updateData.valorObjetivo = body.valorObjetivo;
  const kpi = await prisma.kpi.update({ where: { id: params.kpiId }, data: updateData });
  return NextResponse.json(kpi);
}

export async function DELETE(request: Request, { params }: { params: { id: string; kpiId: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
  await prisma.kpi.delete({ where: { id: params.kpiId } });
  return NextResponse.json({ message: 'Eliminado' });
}
