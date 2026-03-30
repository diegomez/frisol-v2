import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const UPLOAD_DIR = process.env.UPLOAD_DIR || '/app/uploads';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
  const attachments = await prisma.attachment.findMany({ where: { projectId: params.id }, orderBy: { uploadedAt: 'desc' } });
  return NextResponse.json(attachments);
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });

  const project = await prisma.project.findUnique({ where: { id: params.id } });
  if (!project) return NextResponse.json({ message: 'No encontrado' }, { status: 404 });
  if (project.estado !== 'en_progreso') return NextResponse.json({ message: 'No editable' }, { status: 403 });

  const formData = await request.formData();
  const file = formData.get('file') as File;
  const title = formData.get('title') as string;

  if (!file || !title?.trim()) return NextResponse.json({ message: 'Archivo y título son obligatorios' }, { status: 400 });

  if (!existsSync(UPLOAD_DIR)) await mkdir(UPLOAD_DIR, { recursive: true });

  const ext = file.name.split('.').pop() || '';
  const storedName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(join(UPLOAD_DIR, storedName), buffer);

  const attachment = await prisma.attachment.create({
    data: { projectId: params.id, title: title.trim(), originalName: file.name, storedName, fileSize: file.size },
  });

  return NextResponse.json(attachment, { status: 201 });
}
