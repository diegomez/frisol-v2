import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

async function checkProject(id: string, userId: string) {
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) return { error: NextResponse.json({ message: 'No encontrado' }, { status: 404 }) };
  if (project.estado !== 'en_progreso') return { error: NextResponse.json({ message: 'No editable' }, { status: 403 }) };
  if (project.csmId !== userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.role !== 'po') return { error: NextResponse.json({ message: 'Sin acceso' }, { status: 403 }) };
  }
  return { project };
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
  const kpis = await prisma.kpi.findMany({ where: { projectId: params.id }, orderBy: { createdAt: 'asc' } });
  return NextResponse.json(kpis);
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
  const { error } = await checkProject(params.id, user.id);
  if (error) return error;
  const body = await request.json();
  const kpi = await prisma.kpi.create({ data: { projectId: params.id, nombre: body.nombre, valorActual: body.valorActual, valorObjetivo: body.valorObjetivo } });
  return NextResponse.json(kpi, { status: 201 });
}

export async function PATCH(request: Request, { params }: { params: { id: string; kpiId: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
  const { error } = await checkProject(params.id, user.id);
  if (error) return error;
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
  const { error } = await checkProject(params.id, user.id);
  if (error) return error;
  await prisma.kpi.delete({ where: { id: params.kpiId } });
  return NextResponse.json({ message: 'Eliminado' });
}
