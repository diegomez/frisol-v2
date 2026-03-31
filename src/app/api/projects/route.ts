import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const filter = searchParams.get('filter') || 'all';

  const where: any = {};
  if (filter === 'mine' && user.role === 'csm') {
    where.csmId = user.id;
  }

  const projects = await prisma.project.findMany({
    where: { ...where, deletedAt: null },
    include: { csm: { select: { name: true, id: true } }, tribe: { select: { name: true } } },
    orderBy: { updatedAt: 'desc' },
  });

  return NextResponse.json(projects);
}

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
  if (user.role !== 'csm') return NextResponse.json({ message: 'Solo CSM puede crear proyectos' }, { status: 403 });

  // Get user's tribe as default
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });

  const project = await prisma.project.create({
    data: { csmId: user.id, tribeId: dbUser?.tribeId },
    include: { csm: { select: { name: true } }, tribe: { select: { name: true } } },
  });

  return NextResponse.json(project, { status: 201 });
}
