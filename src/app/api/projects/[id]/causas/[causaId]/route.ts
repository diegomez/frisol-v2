import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function PATCH(request: Request, { params }: { params: { id: string; causaId: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
  const project = await prisma.project.findUnique({ where: { id: params.id } });
  if (!project || project.estado !== 'en_progreso') return NextResponse.json({ message: 'No editable' }, { status: 403 });
  const body = await request.json();
  const existing = await prisma.causa.findUnique({ where: { id: params.causaId } });
  const merged = { ...existing, ...body };
  const rootCause = (merged.why5?.trim()) || (merged.why4?.trim()) || merged.why3 || '';
  const causa = await prisma.causa.update({ where: { id: params.causaId }, data: { ...body, rootCause } });
  return NextResponse.json(causa);
}

export async function DELETE(request: Request, { params }: { params: { id: string; causaId: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
  await prisma.causa.delete({ where: { id: params.causaId } });
  return NextResponse.json({ message: 'Eliminado' });
}
