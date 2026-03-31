import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const auth = await getCurrentUser();
  if (!auth) redirect('/login');

  // Get fresh user data from DB (JWT might have stale name)
  const user = await prisma.user.findUnique({ where: { id: auth.id }, select: { id: true, email: true, name: true, role: true } });
  if (!user) redirect('/login');

  return <DashboardClient user={user} />;
}
