import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync, createReadStream } from 'fs';

const UPLOAD_DIR = process.env.UPLOAD_DIR || '/app/uploads';

export async function DELETE(request: Request, { params }: { params: { id: string; attachmentId: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });

  const project = await prisma.project.findUnique({ where: { id: params.id } });
  if (!project || project.estado !== 'en_progreso') return NextResponse.json({ message: 'No editable' }, { status: 403 });

  const attachment = await prisma.attachment.findUnique({ where: { id: params.attachmentId } });
  if (!attachment) return NextResponse.json({ message: 'No encontrado' }, { status: 404 });

  const filePath = join(UPLOAD_DIR, attachment.storedName);
  if (existsSync(filePath)) await unlink(filePath).catch(() => {});

  await prisma.attachment.delete({ where: { id: params.attachmentId } });
  return NextResponse.json({ message: 'Eliminado' });
}

export async function GET(request: Request, { params }: { params: { id: string; attachmentId: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });

  const attachment = await prisma.attachment.findUnique({ where: { id: params.attachmentId } });
  if (!attachment) return NextResponse.json({ message: 'No encontrado' }, { status: 404 });

  const filePath = join(UPLOAD_DIR, attachment.storedName);
  if (!existsSync(filePath)) return NextResponse.json({ message: 'Archivo no encontrado' }, { status: 404 });

  const file = createReadStream(filePath);
  return new NextResponse(file as any, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(attachment.originalName)}"`,
    },
  });
}
