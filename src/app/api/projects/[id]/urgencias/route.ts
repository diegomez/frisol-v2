import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { checkProjectAccess } from '@/lib/api-helpers';
import { sanitizeUrgenciaFields } from '@/lib/resource-sanitization';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
  const urgencias = await prisma.urgencia.findMany({ where: { projectId: params.id }, orderBy: { createdAt: 'asc' } });
  return NextResponse.json(urgencias);
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
  const { error } = await checkProjectAccess(params.id, user.id);
  if (error) return error;
  const body = await request.json();
  const urgencia = await prisma.urgencia.create({ data: { projectId: params.id, ...sanitizeUrgenciaFields(body) } as any });
  return NextResponse.json(urgencia, { status: 201 });
}
