import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import ProjectLayout from './ProjectLayout';

export default async function ProjectPage({ params, children }: { params: { id: string }; children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  // Fetch project server-side
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/projects/${params.id}`, {
    headers: { cookie: (await import('next/headers')).cookies().toString() },
  }).catch(() => null);

  const project = res?.ok ? await res.json() : null;
  if (!project) redirect('/dashboard');

  return <ProjectLayout user={user} project={project} params={params}>{children}</ProjectLayout>;
}
