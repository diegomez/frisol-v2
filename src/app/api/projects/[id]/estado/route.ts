import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { validateStateTransition, getTransitionData } from '@/lib/project-state-machine';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });

  const { estado, motivo } = await request.json();
  const project = await prisma.project.findUnique({ where: { id: params.id } });
  if (!project) return NextResponse.json({ message: 'Proyecto no encontrado' }, { status: 404 });

  const validation = validateStateTransition(estado, user, project);
  if (!validation.allowed) {
    return NextResponse.json({ message: validation.message }, { status: estado ? 403 : 400 });
  }

  const transitionData = getTransitionData(estado, user.id, motivo, validation.transition);
  const updated = await prisma.project.update({
    where: { id: params.id },
    data: transitionData.data,
  });

  await prisma.stateHistory.create({
    data: {
      projectId: params.id,
      estado: transitionData.historyEntry,
      userId: user.id,
      motivo: motivo || null,
    },
  });

  return NextResponse.json(updated);
}
