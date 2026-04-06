import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { canEditProject } from '@/lib/project-permissions';
import { sanitizeCausaFields } from '@/lib/root-cause';

async function checkProject(id: string, userId: string) {
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) return { error: NextResponse.json({ message: 'No encontrado' }, { status: 404 }) };
  if (!canEditProject({ id: userId, role: '' }, project)) {
    // Need actual role — fetch user
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !canEditProject({ id: userId, role: user.role }, project)) {
      return { error: NextResponse.json({ message: 'Sin acceso' }, { status: 403 }) };
    }
  }
  return { project };
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
  const causa = await prisma.causa.create({ data: { projectId: params.id, ...sanitizeCausaFields(body) } as any });
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
  const causa = await prisma.causa.update({ where: { id: params.causaId }, data: sanitizeCausaFields(merged) as any });
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
