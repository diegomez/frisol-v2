import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export async function GET() {
  try {
    await requireRole('admin');
  } catch { return NextResponse.json({ message: 'Sin permisos' }, { status: 403 }); }

  const users = await prisma.user.findMany({
    include: { tribe: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(users.map(u => ({
    id: u.id, email: u.email, name: u.name, role: u.role, active: u.active,
    tribeId: u.tribeId, tribeName: u.tribe?.name || null, createdAt: u.createdAt,
  })));
}

export async function POST(request: Request) {
  try {
    await requireRole('admin');
  } catch { return NextResponse.json({ message: 'Sin permisos' }, { status: 403 }); }

  const { email, password, name, role, active, tribeId } = await request.json();
  if (!email || !password || !name || !role) return NextResponse.json({ message: 'Campos obligatorios faltantes' }, { status: 400 });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ message: 'Ya existe un usuario con ese email' }, { status: 400 });

  const bcrypt = await import('bcrypt');
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { email, passwordHash, name, role, active: active ?? true, tribeId: tribeId || null },
  });

  return NextResponse.json({ id: user.id, email: user.email, name: user.name, role: user.role, active: user.active, tribeId: user.tribeId }, { status: 201 });
}
