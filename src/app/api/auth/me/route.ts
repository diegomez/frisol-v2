import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, email: true, name: true, role: true, active: true, tribeId: true },
  });

  if (!dbUser || !dbUser.active) {
    return NextResponse.json({ message: 'Usuario desactivado' }, { status: 401 });
  }

  return NextResponse.json(dbUser);
}
