'use client';

import { useRouter } from 'next/navigation';

interface Props {
  user: { id: string; email: string; name: string; role: string };
}

export default function DashboardClient({ user }: Props) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const roleLabels: Record<string, string> = { admin: 'Admin', csm: 'CSM', po: 'PO', dev: 'Dev' };
  const roleColors: Record<string, string> = { admin: 'bg-purple-100 text-purple-800', csm: 'bg-teal-100 text-teal-800', po: 'bg-emerald-100 text-emerald-800', dev: 'bg-amber-100 text-amber-800' };

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/15 shadow-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-container rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-extrabold font-headline">F</span>
            </div>
            <span className="text-lg font-extrabold font-headline text-on-surface tracking-tight">Frisol v2</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-body font-semibold text-on-surface">{user.name}</p>
            </div>
            <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${roleColors[user.role]}`}>
              {roleLabels[user.role]}
            </span>
            <button onClick={handleLogout} className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-all" title="Cerrar sesión">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-extrabold font-headline text-on-surface tracking-tight">Dashboard</h2>
          <p className="text-sm text-on-surface-variant mt-1">Frisol v2 — Next.js + MySQL</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'En Progreso', count: 0, color: 'bg-amber-50', dot: 'bg-amber-500' },
            { label: 'Terminados', count: 0, color: 'bg-emerald-50', dot: 'bg-emerald-500' },
            { label: 'Cerrados', count: 0, color: 'bg-gray-100', dot: 'bg-gray-400' },
          ].map((c) => (
            <div key={c.label} className="card flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl ${c.color} flex items-center justify-center`}>
                <div className={`w-3 h-3 rounded-full ${c.dot}`} />
              </div>
              <div>
                <div className="text-2xl font-extrabold font-headline text-on-surface">{c.count}</div>
                <div className="text-xs text-on-surface-variant font-medium">{c.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="card text-center py-12">
          <p className="text-on-surface-variant text-sm">Próximamente: lista de proyectos, páginas 4D, PDF, adjuntos...</p>
          <p className="text-on-surface-variant/50 text-xs mt-2">Fase 2 en construcción 🚧</p>
        </div>
      </main>
    </div>
  );
}
