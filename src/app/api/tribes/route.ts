import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
  const tribes = await prisma.tribe.findMany({ orderBy: { name: 'asc' } });
  return NextResponse.json(tribes);
}
