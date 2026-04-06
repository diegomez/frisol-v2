/**
 * Shared API route helpers for project-based resources.
 * Extracts the common checkProject pattern used across symptoms, causas, kpis, urgencias.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Result of a project access check.
 * Either contains the project or an error response.
 */
export interface CheckResult {
  error?: NextResponse;
  project?: { id: string; estado: string; csmId: string };
}

/**
 * Check if a user can edit a project's sub-resources.
 * Rules: project must be en_progreso, user must be CSM owner or PO.
 */
export async function checkProjectAccess(projectId: string, userId: string): Promise<CheckResult> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, estado: true, csmId: true },
  });

  if (!project) {
    return { error: NextResponse.json({ message: 'No encontrado' }, { status: 404 }) };
  }

  if (project.estado !== 'en_progreso') {
    return { error: NextResponse.json({ message: 'No editable' }, { status: 403 }) };
  }

  if (project.csmId !== userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (user?.role !== 'po') {
      return { error: NextResponse.json({ message: 'Sin acceso' }, { status: 403 }) };
    }
  }

  return { project };
}
