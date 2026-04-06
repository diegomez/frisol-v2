import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { sanitizeUserUpdateFields } from '@/lib/user-validation';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    await requireRole('admin');
  } catch { return NextResponse.json({ message: 'Sin permisos' }, { status: 403 }); }

  const body = await request.json();
  const sanitized = sanitizeUserUpdateFields(body);

  // Check email uniqueness
  if (sanitized.email) {
    const existing = await prisma.user.findUnique({ where: { email: sanitized.email as string } });
    if (existing && existing.id !== params.id) return NextResponse.json({ message: 'Ya existe un usuario con ese email' }, { status: 400 });
  }

  // Hash password if provided
  if (sanitized.password) {
    const bcrypt = await import('bcryptjs');
    sanitized.passwordHash = await bcrypt.hash(sanitized.password as string, 10);
    delete sanitized.password;
  }

  if (Object.keys(sanitized).length === 0) {
    const user = await prisma.user.findUnique({ where: { id: params.id } });
    return NextResponse.json(user);
  }

  const user = await prisma.user.update({ where: { id: params.id }, data: sanitized });
  return NextResponse.json({ id: user.id, email: user.email, name: user.name, role: user.role, active: user.active, tribeId: user.tribeId });
}
