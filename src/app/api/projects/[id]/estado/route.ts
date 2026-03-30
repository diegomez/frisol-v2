import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });

  const { estado } = await request.json();
  const project = await prisma.project.findUnique({ where: { id: params.id } });
  if (!project) return NextResponse.json({ message: 'Proyecto no encontrado' }, { status: 404 });

  if (estado === 'terminado') {
    if (user.role !== 'csm') return NextResponse.json({ message: 'Solo CSM puede marcar como terminado' }, { status: 403 });
    if (project.csmId !== user.id) return NextResponse.json({ message: 'No es tu proyecto' }, { status: 403 });
  }

  if (estado === 'cerrado') {
    if (user.role !== 'po') return NextResponse.json({ message: 'Solo PO puede cerrar' }, { status: 403 });
    if (project.estado !== 'terminado') return NextResponse.json({ message: 'Debe estar terminado primero' }, { status: 403 });
  }

  if (estado === 'en_progreso') {
    if (user.role === 'po' && project.estado === 'terminado') {
      // PO rejects
    } else if (user.role === 'admin' && project.estado === 'cerrado') {
      // Admin reopens
    } else {
      return NextResponse.json({ message: 'Sin permisos para esta acción' }, { status: 403 });
    }
  }

  const updateData: any = { estado };
  if (estado === 'terminado') { updateData.terminadoById = user.id; updateData.terminadoAt = new Date(); }
  if (estado === 'cerrado') { updateData.cerradoById = user.id; updateData.cerradoAt = new Date(); }
  if (estado === 'en_progreso') { updateData.terminadoById = null; updateData.terminadoAt = null; updateData.cerradoById = null; updateData.cerradoAt = null; }

  const updated = await prisma.project.update({ where: { id: params.id }, data: updateData });
  return NextResponse.json(updated);
}
