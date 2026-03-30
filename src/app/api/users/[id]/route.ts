import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    await requireRole('admin');
  } catch { return NextResponse.json({ message: 'Sin permisos' }, { status: 403 }); }

  const body = await request.json();
  const updateData: any = {};

  if (body.email) {
    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing && existing.id !== params.id) return NextResponse.json({ message: 'Ya existe un usuario con ese email' }, { status: 400 });
    updateData.email = body.email;
  }
  if (body.name) updateData.name = body.name;
  if (body.role) updateData.role = body.role;
  if (body.active !== undefined) updateData.active = body.active;
  if (body.tribeId !== undefined) updateData.tribeId = body.tribeId || null;
  if (body.password) {
    const bcrypt = await import('bcrypt');
    updateData.passwordHash = await bcrypt.hash(body.password, 10);
  }

  if (Object.keys(updateData).length === 0) {
    const user = await prisma.user.findUnique({ where: { id: params.id } });
    return NextResponse.json(user);
  }

  const user = await prisma.user.update({ where: { id: params.id }, data: updateData });
  return NextResponse.json({ id: user.id, email: user.email, name: user.name, role: user.role, active: user.active, tribeId: user.tribeId });
}
