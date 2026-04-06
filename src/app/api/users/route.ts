import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { validateUserCreate, sanitizeUserCreateFields } from '@/lib/user-validation';

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

  const body = await request.json();
  const validation = validateUserCreate(body);
  if (!validation.valid) return NextResponse.json({ message: validation.message }, { status: 400 });

  const existing = await prisma.user.findUnique({ where: { email: body.email } });
  if (existing) return NextResponse.json({ message: 'Ya existe un usuario con ese email' }, { status: 400 });

  const sanitized = sanitizeUserCreateFields(body);
  const bcrypt = await import('bcryptjs');
  const passwordHash = await bcrypt.hash(sanitized.password as string, 10);

  const user = await prisma.user.create({
    data: {
      email: sanitized.email as string,
      passwordHash,
      name: sanitized.name as string,
      role: sanitized.role as string,
      active: sanitized.active as boolean,
      tribeId: sanitized.tribeId as string | null,
    },
  });

  return NextResponse.json({ id: user.id, email: user.email, name: user.name, role: user.role, active: user.active, tribeId: user.tribeId }, { status: 201 });
}
