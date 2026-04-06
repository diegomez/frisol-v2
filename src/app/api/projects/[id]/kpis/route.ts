import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { checkProjectAccess } from '@/lib/api-helpers';
import { sanitizeKpiFields } from '@/lib/resource-sanitization';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
  const kpis = await prisma.kpi.findMany({ where: { projectId: params.id }, orderBy: { createdAt: 'asc' } });
  return NextResponse.json(kpis);
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
  const { error } = await checkProjectAccess(params.id, user.id);
  if (error) return error;
  const body = await request.json();
  const kpi = await prisma.kpi.create({ data: { projectId: params.id, ...sanitizeKpiFields(body) } as any });
  return NextResponse.json(kpi, { status: 201 });
}

export async function PATCH(request: Request, { params }: { params: { id: string; kpiId: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
  const { error } = await checkProjectAccess(params.id, user.id);
  if (error) return error;
  const body = await request.json();
  const kpi = await prisma.kpi.update({ where: { id: params.kpiId }, data: sanitizeKpiFields(body) });
  return NextResponse.json(kpi);
}

export async function DELETE(request: Request, { params }: { params: { id: string; kpiId: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
  const { error } = await checkProjectAccess(params.id, user.id);
  if (error) return error;
  await prisma.kpi.delete({ where: { id: params.kpiId } });
  return NextResponse.json({ message: 'Eliminado' });
}
