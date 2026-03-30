'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
  { id: '7', name: 'Cierre', path: 'cierre' },
];

export default function ProjectLayout({ user, project, params, children }: Props) {
  const router = useRouter();
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
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/15 shadow-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-container rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-extrabold font-headline">F</span>
              </div>
            </Link>
            <Link href="/dashboard" className="text-sm font-body font-semibold text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Dashboard
            </Link>
          </div>
          <div className="text-sm text-on-surface-variant font-mono">{project.internalId}</div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Project Title */}
        <div className="mb-6">
          <h2 className="text-xl font-extrabold font-headline text-on-surface tracking-tight">
            {project.nombreProyecto || 'Nuevo proyecto'}
          </h2>
          <p className="text-sm text-on-surface-variant">
            {project.nombreCliente || 'Sin cliente'} — {pages.find(p => typeof window !== 'undefined' && window.location.pathname.includes(p.path))?.name || ''}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="card mb-6 p-4">
          <div className="flex items-center gap-2">
            {pages.map((page) => {
              const status = progressMap[page.path] || 'red';
              const isActive = typeof window !== 'undefined' && window.location.pathname.includes(`/${page.path}`);

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
