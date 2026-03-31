import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import ProjectLayout from './ProjectLayout';

export default async function ProjectPage({ params, children }: { params: { id: string }; children: React.ReactNode }) {
  const auth = await getCurrentUser();
  if (!auth) redirect('/login');

  // Get fresh user data from DB (JWT might have stale name)
  const dbUser = await prisma.user.findUnique({ where: { id: auth.id }, select: { id: true, email: true, name: true, role: true } });
  if (!dbUser) redirect('/login');

  // Fetch project server-side
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/projects/${params.id}`, {
    headers: { cookie: (await import('next/headers')).cookies().toString() },
  }).catch(() => null);

  const project = res?.ok ? await res.json() : null;
  if (!project) redirect('/dashboard');

  return <ProjectLayout user={dbUser} project={project} params={params}>{children}</ProjectLayout>;
}
