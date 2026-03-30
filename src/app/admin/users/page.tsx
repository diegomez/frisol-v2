import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import AdminUsersClient from './AdminUsersClient';

export default async function AdminUsersPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') redirect('/dashboard');
  return <AdminUsersClient user={user} />;
}
