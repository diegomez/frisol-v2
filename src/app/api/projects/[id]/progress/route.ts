import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { calculateProgress } from '@/lib/project-progress';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      symptoms: true,
      causas: true,
      kpis: true,
      urgencias: true,
    },
  });
  if (!project) return NextResponse.json({ message: 'Proyecto no encontrado' }, { status: 404 });

  const progress = calculateProgress(project);
  return NextResponse.json(progress);
}
