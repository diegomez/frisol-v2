'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

interface Props {
  user: { id: string; email: string; name: string; role: string };
  project: any;
  params: { id: string };
  children: React.ReactNode;
}

const pages = [
  { id: '1', name: 'Cliente', path: 'cliente' },
  { id: '2', name: 'Diagnóstico', path: 'diagnostico' },
  { id: '3', name: 'Evidencia', path: 'evidencia' },
  { id: '4', name: 'Voz del Dolor', path: 'voz-dolor' },
  { id: '5', name: 'Causas', path: 'causas' },
  { id: '6', name: 'Impacto', path: 'impacto' },
  { id: '7', name: 'Dependencias', path: 'dependencias' },
  { id: '8', name: 'Cierre', path: 'cierre' },
];

export default function ProjectLayout({ user, project, params, children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [progress, setProgress] = useState<Record<string, string>>({});

  const loadProgress = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${params.id}/progress`);
      if (res.ok) setProgress(await res.json());
    } catch {}
  }, [params.id]);

  useEffect(() => { loadProgress(); }, [loadProgress]);

  // Expose reloadProgress to children via context-like approach
  useEffect(() => {
    (window as any).__frisolReloadProgress = loadProgress;
  }, [loadProgress]);

  const progressMap: Record<string, string> = {
    cliente: progress.cliente || 'red',
    diagnostico: progress.diagnostico || 'red',
    evidencia: progress.evidencia || 'red',
    'voz-dolor': progress.vozDolor || 'red',
    causas: progress.causas || 'red',
    impacto: progress.impacto || 'red',
    dependencias: progress.dependencias || 'red',
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/15 shadow-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          {/* Left: Logo + Dashboard + Project info */}
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-container rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-extrabold font-headline">F</span>
              </div>
            </Link>
            <Link href="/dashboard" className="text-sm font-body font-semibold text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1 shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Dashboard
            </Link>
            <div className="h-5 w-px bg-outline-variant/30 shrink-0" />
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-semibold text-on-surface truncate">{project.nombreProyecto || 'Nuevo proyecto'}</span>
              <span className="text-xs text-on-surface-variant font-mono shrink-0">PRJ-{String(project.projectNumber || 0).padStart(5, '0')}</span>
              {project.urgencias?.length > 0 && (() => {
                const maxTipo = project.urgencias.some((u: any) => u.tipo === 'alta') ? 'alta' : project.urgencias.some((u: any) => u.tipo === 'media') ? 'media' : 'baja';
                return (
                  <span className={`badge text-[9px] shrink-0 ${maxTipo === 'alta' ? 'bg-red-100 text-red-700' : maxTipo === 'media' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    ⚡{maxTipo.toUpperCase()}
                  </span>
                );
              })()}
            </div>
          </div>

          {/* Right: User + Logout */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-on-surface">{user.name}</p>
            </div>
            <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : user.role === 'csm' ? 'bg-teal-100 text-teal-800' : user.role === 'po' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
              {user.role}
            </span>
            <button onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/login'); }} className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-all" title="Cerrar sesión">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Project Title */}
        <div className="mb-6">
          <h2 className="text-xl font-extrabold font-headline text-on-surface tracking-tight">
            {project.nombreProyecto || 'Nuevo proyecto'}
          </h2>
          <p className="text-sm text-on-surface-variant">
            {project.nombreCliente || 'Sin cliente'}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="card mb-6 p-4">
          <div className="flex items-center gap-2">
            {pages.map((page) => {
              const status = progressMap[page.path] || 'red';
              const isActive = pathname?.includes(`/${page.path}`);

              return (
                <Link
                  key={page.id}
                  href={`/projects/${params.id}/${page.path}`}
                  className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                    isActive ? 'bg-primary/5 ring-2 ring-primary/30' : 'hover:bg-surface-container-low'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full ${
                    status === 'green' ? 'bg-emerald-500' : status === 'yellow' ? 'bg-amber-500' : 'bg-red-400'
                  }`} />
                  <span className={`text-[10px] font-bold uppercase tracking-tight ${isActive ? 'text-primary' : 'text-on-surface-variant'}`}>
                    {page.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Page Content */}
        <div className="card">
          {children}
        </div>
      </main>
    </div>
  );
}
