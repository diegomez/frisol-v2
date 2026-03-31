import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });

  const history = await prisma.stateHistory.findMany({
    where: { projectId: params.id },
    include: { user: { select: { name: true, role: true } } },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json(history);
}
