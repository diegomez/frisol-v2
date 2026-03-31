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
  const urgencias = await prisma.urgencia.findMany({ where: { projectId: params.id }, orderBy: { createdAt: 'asc' } });
  return NextResponse.json(urgencias);
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
  const { error } = await checkProject(params.id, user.id);
  if (error) return error;
  const body = await request.json();
  const urgencia = await prisma.urgencia.create({
    data: {
      projectId: params.id,
      tipo: body.tipo,
      justificacion: body.justificacion,
      fechaDeseada: body.fechaDeseada ? new Date(body.fechaDeseada) : null,
    },
  });
  return NextResponse.json(urgencia, { status: 201 });
}
