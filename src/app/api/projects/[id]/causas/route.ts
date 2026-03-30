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

function computeRootCause(body: any): string {
  return (body.why5?.trim()) || (body.why4?.trim()) || body.why3 || '';
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
  const causas = await prisma.causa.findMany({ where: { projectId: params.id }, orderBy: { createdAt: 'asc' } });
  return NextResponse.json(causas);
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
  const { error } = await checkProject(params.id, user.id);
  if (error) return error;
  const body = await request.json();
  const causa = await prisma.causa.create({ data: { projectId: params.id, ...body, rootCause: computeRootCause(body) } });
  return NextResponse.json(causa, { status: 201 });
}

export async function PATCH(request: Request, { params }: { params: { id: string; causaId: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
  const { error } = await checkProject(params.id, user.id);
  if (error) return error;
  const body = await request.json();
  const existing = await prisma.causa.findUnique({ where: { id: params.causaId } });
  const merged = { ...existing, ...body };
  const causa = await prisma.causa.update({ where: { id: params.causaId }, data: { ...body, rootCause: computeRootCause(merged) } });
  return NextResponse.json(causa);
}

export async function DELETE(request: Request, { params }: { params: { id: string; causaId: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
  const { error } = await checkProject(params.id, user.id);
  if (error) return error;
  await prisma.causa.delete({ where: { id: params.causaId } });
  return NextResponse.json({ message: 'Eliminado' });
}
