'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Project {
  id: string;
  projectNumber: number;
  nombreCliente: string | null;
  nombreProyecto: string | null;
  fechaInicio: string | null;
  estado: string;
  csm: { name: string; id: string };
  tribe: { name: string } | null;
  urgencias: { tipo: string }[];
  updatedAt: string;
}

function getMaxUrgencia(urgencias: { tipo: string }[]): string | null {
  if (!urgencias?.length) return null;
  if (urgencias.some(u => u.tipo === 'alta')) return 'alta';
  if (urgencias.some(u => u.tipo === 'media')) return 'media';
  return 'baja';
}

interface ProgressRecord {
  cliente: string;
  diagnostico: string;
  evidencia: string;
  vozDolor: string;
  causas: string;
  impacto: string;
}

interface Props {
  user: { id: string; email: string; name: string; role: string };
}

const stateColors: Record<string, { bg: string; text: string; label: string }> = {
  en_progreso: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'En Progreso' },
  terminado: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Terminado' },
  cancelado: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelado' },
  cerrado: { bg: 'bg-gray-200', text: 'text-gray-700', label: 'Cerrado' },
};

export default function DashboardClient({ user }: Props) {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, ProgressRecord>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'mine' | 'all'>(user.role === 'csm' ? 'mine' : 'all');
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('all');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects?filter=${filter}`);
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
        // Load progress for each project
        const progressEntries = await Promise.all(
          data.map(async (p: Project) => {
            try {
              const pr = await fetch(`/api/projects/${p.id}/progress`);
              return [p.id, pr.ok ? await pr.json() : null] as const;
            } catch { return [p.id, null] as const; }
          })
        );
        setProgressMap(Object.fromEntries(progressEntries.filter(([, v]) => v)));
      }
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const handleCreate = async () => {
    const res = await fetch('/api/projects', { method: 'POST' });
    if (res.ok) {
      const project = await res.json();
      router.push(`/projects/${project.id}/cliente`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este proyecto?')) return;
    await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    loadData();
  };

  const handleExportPdf = (id: string, name: string) => {
    window.open(`/api/projects/${id}/pdf`, '_blank');
  };

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      const q = search.toLowerCase();
      const matchesSearch = !q ||
        (p.nombreCliente || '').toLowerCase().includes(q) ||
        (p.nombreProyecto || '').toLowerCase().includes(q) ||
        `PRJ-${String(p.projectNumber || 0).padStart(5, '0')}`.toLowerCase().includes(q) ||
        (p.tribe?.name || '').toLowerCase().includes(q);
      const matchesState = stateFilter === 'all' || p.estado === stateFilter;
      return matchesSearch && matchesState;
    });
  }, [projects, search, stateFilter]);

  const counters = useMemo(() => ({
    en_progreso: projects.filter(p => p.estado === 'en_progreso').length,
    terminado: projects.filter(p => p.estado === 'terminado').length,
    cerrado: projects.filter(p => p.estado === 'cerrado').length,
    cancelado: projects.filter(p => p.estado === 'cancelado').length,
  }), [projects]);

  const roleLabels: Record<string, string> = { admin: 'Admin', csm: 'CSM', po: 'PO', dev: 'Dev' };
  const roleColors: Record<string, string> = { admin: 'bg-purple-100 text-purple-800', csm: 'bg-teal-100 text-teal-800', po: 'bg-emerald-100 text-emerald-800', dev: 'bg-amber-100 text-amber-800' };

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/15 shadow-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-container rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-extrabold font-headline">F</span>
            </div>
            <span className="text-lg font-extrabold font-headline text-on-surface tracking-tight hidden sm:block">Frisol v2</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block"><p className="text-sm font-body font-semibold text-on-surface">{user.name}</p></div>
            <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${roleColors[user.role]}`}>{roleLabels[user.role]}</span>
            {user.role === 'admin' && (
              <button onClick={() => router.push('/admin/users')} className="text-sm text-on-surface-variant hover:text-primary transition-colors">Usuarios</button>
            )}
            <button onClick={handleLogout} className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-all" title="Cerrar sesión">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-extrabold font-headline text-on-surface tracking-tight">Dashboard</h2>
            <p className="text-sm text-on-surface-variant mt-1">Gestión de proyectos Framework 4D</p>
          </div>
          {user.role === 'csm' && (
            <button onClick={handleCreate} className="btn-primary">+ Nuevo proyecto</button>
          )}
        </div>

        {/* Filter Toggle (CSM only) */}
        {user.role === 'csm' && (
          <div className="flex gap-2 mb-6">
            <button onClick={() => setFilter('mine')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filter === 'mine' ? 'bg-primary text-white shadow-card' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'}`}>Mis proyectos</button>
            <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filter === 'all' ? 'bg-primary text-white shadow-card' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'}`}>Todos</button>
          </div>
        )}

        {/* Counter Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'En Progreso', count: counters.en_progreso, color: 'bg-amber-50', dot: 'bg-amber-500' },
            { label: 'Terminados', count: counters.terminado, color: 'bg-emerald-50', dot: 'bg-emerald-500' },
            { label: 'Cerrados', count: counters.cerrado, color: 'bg-gray-100', dot: 'bg-gray-400' },
            { label: 'Cancelados', count: counters.cancelado, color: 'bg-red-50', dot: 'bg-red-500' },
          ].map((c) => (
            <div key={c.label} className="card flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl ${c.color} flex items-center justify-center`}><div className={`w-3 h-3 rounded-full ${c.dot}`} /></div>
              <div>
                <div className="text-2xl font-extrabold font-headline text-on-surface">{c.count}</div>
                <div className="text-xs text-on-surface-variant font-medium">{c.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <input type="text" placeholder="Buscar por cliente, proyecto, ID o tribu..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 input-field" />
          <select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)} className="input-field sm:w-48">
            <option value="all">Todos los estados</option>
            <option value="en_progreso">En Progreso</option>
            <option value="terminado">Terminados</option>
            <option value="cerrado">Cerrados</option>
            <option value="cancelado">Cancelados</option>
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="card text-center py-12 text-on-surface-variant">Cargando proyectos...</div>
        ) : filtered.length === 0 ? (
          <div className="card text-center py-12 text-on-surface-variant">No hay proyectos</div>
        ) : (
          <div className="card overflow-x-auto p-0">
            <table className="w-full text-left">
              <thead className="bg-surface-container-low">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-bold text-primary uppercase tracking-widest">ID</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-primary uppercase tracking-widest">Progreso</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-primary uppercase tracking-widest">Proyecto</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-primary uppercase tracking-widest">Cliente</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-primary uppercase tracking-widest">Tribu</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-primary uppercase tracking-widest">Estado</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-primary uppercase tracking-widest">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const state = stateColors[p.estado];
                  const progress = progressMap[p.id];
                  const canEdit = p.estado === 'en_progreso' && (user.role === 'po' || (user.role === 'csm' && p.csm.id === user.id));

                  return (
                    <tr key={p.id} className="hover:bg-surface-container-low/40 transition-colors border-t border-outline-variant/5">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-on-surface-variant">
                        <div className="flex items-center gap-2">
                          PRJ-{String(p.projectNumber || 0).padStart(5, '0')}
                          {getMaxUrgencia(p.urgencias) && (
                            <span className={`badge text-[9px] ${getMaxUrgencia(p.urgencias) === 'alta' ? 'bg-red-100 text-red-700' : getMaxUrgencia(p.urgencias) === 'media' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                              ⚡{getMaxUrgencia(p.urgencias)?.toUpperCase()}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {progress ? (
                          <div className="flex gap-1">
                            {Object.values(progress).map((s, i) => (
                              <span key={i} className={`w-3 h-3 rounded-full ${s === 'green' ? 'bg-emerald-500' : s === 'yellow' ? 'bg-amber-500' : 'bg-red-400'}`} />
                            ))}
                          </div>
                        ) : '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-on-surface">{p.nombreProyecto || 'Sin nombre'}</div>
                        <div className="text-xs text-on-surface-variant">{p.csm.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-on-surface-variant">{p.nombreCliente || '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-on-surface-variant">{p.tribe?.name || '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`badge ${state.bg} ${state.text}`}>{state.label}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                        <button onClick={() => router.push(`/projects/${p.id}/cierre`)} className="text-primary hover:text-primary-container font-semibold transition-colors">Ver</button>
                        {canEdit && <button onClick={() => router.push(`/projects/${p.id}/cliente`)} className="text-emerald-600 hover:text-emerald-700 font-semibold transition-colors">Editar</button>}
                        {(p.estado === 'en_progreso' && (user.role === 'csm' || user.role === 'po')) && <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:text-red-600 font-semibold transition-colors">Eliminar</button>}
                        <button onClick={() => handleExportPdf(p.id, p.nombreProyecto || 'proyecto')} className="text-purple-600 hover:text-purple-700 font-semibold transition-colors">PDF</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
