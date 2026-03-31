import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });

  const { estado, motivo } = await request.json();
  const project = await prisma.project.findUnique({ where: { id: params.id } });
  if (!project) return NextResponse.json({ message: 'Proyecto no encontrado' }, { status: 404 });

  if (estado === 'terminado') {
    if (user.role !== 'csm') return NextResponse.json({ message: 'Solo CSM puede marcar como terminado' }, { status: 403 });
    if (project.csmId !== user.id) return NextResponse.json({ message: 'No es tu proyecto' }, { status: 403 });
    const updated = await prisma.project.update({
      where: { id: params.id },
      data: { estado: 'terminado', terminadoById: user.id, terminadoAt: new Date(), rechazoMotivo: null },
    });
    return NextResponse.json(updated);
  }

  if (estado === 'cerrado') {
    if (user.role !== 'po') return NextResponse.json({ message: 'Solo PO puede cerrar' }, { status: 403 });
    if (project.estado !== 'terminado') return NextResponse.json({ message: 'Debe estar terminado primero' }, { status: 403 });
    const updated = await prisma.project.update({
      where: { id: params.id },
      data: { estado: 'cerrado', cerradoById: user.id, cerradoAt: new Date() },
    });
    return NextResponse.json(updated);
  }

  if (estado === 'cancelado') {
    if (user.role !== 'po') return NextResponse.json({ message: 'Solo PO puede cancelar' }, { status: 403 });
    if (project.estado !== 'terminado') return NextResponse.json({ message: 'Solo se puede cancelar desde terminado' }, { status: 403 });
    const updated = await prisma.project.update({
      where: { id: params.id },
      data: { estado: 'cancelado', canceladoById: user.id, canceladoAt: new Date(), rechazoMotivo: motivo || null },
    });
    return NextResponse.json(updated);
  }

  if (estado === 'en_progreso') {
    // PO rejects from terminado (with rationale)
    if (user.role === 'po' && project.estado === 'terminado') {
      const updated = await prisma.project.update({
        where: { id: params.id },
        data: { estado: 'en_progreso', terminadoById: null, terminadoAt: null, rechazoMotivo: motivo || null },
      });
      return NextResponse.json(updated);
    }
    // Admin reopens from cancelado or cerrado
    if (user.role === 'admin' && (project.estado === 'cancelado' || project.estado === 'cerrado')) {
      const updated = await prisma.project.update({
        where: { id: params.id },
        data: {
          estado: 'en_progreso',
          terminadoById: null, terminadoAt: null,
          cerradoById: null, cerradoAt: null,
          canceladoById: null, canceladoAt: null,
          rechazoMotivo: null,
        },
      });
      return NextResponse.json(updated);
    }
    return NextResponse.json({ message: 'Sin permisos para esta acción' }, { status: 403 });
  }

  return NextResponse.json({ message: 'Estado inválido' }, { status: 400 });
}
