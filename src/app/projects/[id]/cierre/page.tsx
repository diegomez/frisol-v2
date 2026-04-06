'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function CierrePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [project, setProject] = useState<any>(null);
  const [progress, setProgress] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [showConfirm, setShowConfirm] = useState<string | null>(null);
  const [motivo, setMotivo] = useState('');
  const [user, setUser] = useState<any>(null);

  const loadData = () => {
    fetch(`/api/projects/${id}`).then(r => r.json()).then(setProject);
    fetch(`/api/projects/${id}/progress`).then(r => r.json()).then(setProgress);
    fetch(`/api/projects/${id}/history`).then(r => r.json()).then(setHistory);
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(setUser);
  };

  useEffect(() => { loadData(); }, [id]);

  if (!project) return <div className="text-sm text-on-surface-variant">Cargando...</div>;

  const allGreen = progress && Object.values(progress).every((s: any) => s === 'green');
  const canTerminar = user?.role === 'csm' && project.csmId === user.id && project.estado === 'en_progreso' && allGreen;
  const canCerrar = user?.role === 'po' && project.estado === 'terminado';
  const canRechazar = user?.role === 'po' && project.estado === 'terminado';
  const canExportPdf = true;

  const handleEstado = async (estado: string) => {
    await fetch(`/api/projects/${id}/estado`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ estado, motivo: motivo || undefined }) });
    setShowConfirm(null);
    setMotivo('');
    loadData();
  };

  const handleExportPdf = () => { window.open(`/api/projects/${id}/pdf`, '_blank'); };

  const handleDelete = async () => {
    if (!confirm('¿Eliminar este proyecto?')) return;
    await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    router.push('/dashboard');
  };

  const statusLabels: Record<string, string> = { en_progreso: 'En Progreso', terminado: 'Terminado', cancelado: 'Cancelado', cerrado: 'Cerrado' };
  const statusColors: Record<string, string> = { en_progreso: 'bg-amber-100 text-amber-800', terminado: 'bg-emerald-100 text-emerald-800', cancelado: 'bg-red-100 text-red-800', cerrado: 'bg-gray-200 text-gray-700' };

  const pageNames: Record<string, string> = { cliente: 'Cliente', diagnostico: 'Diagnóstico', evidencia: 'Evidencia', vozDolor: 'Voz del Dolor', causas: 'Causas', impacto: 'Impacto', dependencias: 'Dependencias' };

  return (
    <div>
      <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 mb-6">
        <h3 className="text-sm font-bold text-sky-700 mb-1">Resumen del Proyecto</h3>
        <p className="text-xs text-on-surface-variant">Revisá toda la información cargada antes de marcar como terminado.</p>
      </div>

      {/* Status + Actions */}
      <div className="card mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <span className={`badge ${statusColors[project.estado]}`}>{statusLabels[project.estado]}</span>
            {project.terminadoBy && <p className="text-xs text-on-surface-variant mt-1">Terminado por: <strong>{project.terminadoBy.name}</strong> — {new Date(project.terminadoAt).toLocaleString('es-AR')}</p>}
            {project.canceladoBy && <p className="text-xs text-on-surface-variant mt-1">Cancelado por: <strong>{project.canceladoBy.name}</strong> — {new Date(project.canceladoAt).toLocaleString('es-AR')}</p>}
            {project.cerradoBy && <p className="text-xs text-on-surface-variant mt-1">Cerrado por: <strong>{project.cerradoBy.name}</strong> — {new Date(project.cerradoAt).toLocaleString('es-AR')}</p>}
            {project.rechazoMotivo && <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg"><p className="text-xs font-bold text-amber-700">Motivo del rechazo/cancelación:</p><p className="text-xs text-amber-800 whitespace-pre-wrap">{project.rechazoMotivo}</p></div>}
          </div>
          <div className="flex gap-2 flex-wrap">
            {canTerminar && <button onClick={() => setShowConfirm('terminado')} className="btn-primary bg-emerald-600 hover:bg-emerald-700">✅ Terminar</button>}
            {canCerrar && <button onClick={() => setShowConfirm('cerrado')} className="btn-secondary">🔒 Cerrar</button>}
            {canRechazar && <button onClick={() => setShowConfirm('rechazar')} className="btn-secondary text-amber-600">← Rechazar</button>}
            {user?.role === 'po' && project.estado === 'terminado' && <button onClick={() => setShowConfirm('cancelado')} className="btn-secondary text-red-600">❌ Cancelar</button>}
            {project.estado === 'cancelado' && user?.role === 'admin' && <button onClick={() => setShowConfirm('reabrir')} className="btn-secondary text-amber-600">🔄 Reabrir</button>}
            {project.estado === 'cerrado' && user?.role === 'admin' && <button onClick={() => setShowConfirm('reabrir')} className="btn-secondary text-amber-600">🔄 Reabrir</button>}
            {canExportPdf && <button onClick={handleExportPdf} className="btn-secondary text-purple-600">📄 PDF</button>}
            {project.estado === 'en_progreso' && (user?.role === 'csm' || user?.role === 'po') && <button onClick={handleDelete} className="btn-secondary text-red-600">🗑️ Eliminar</button>}
          </div>
        </div>
        {!allGreen && project.estado === 'en_progreso' && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-800 font-bold">⚠️ Para terminar, todas las secciones deben estar en verde:</p>
            <ul className="text-xs text-amber-700 mt-1">{progress && Object.entries(progress).filter(([, s]) => s !== 'green').map(([k]) => <li key={k}>• {pageNames[k] || k}</li>)}</ul>
          </div>
        )}
      </div>

      {/* Summary sections */}
      {[
        { key: 'cliente', title: '1. Cliente', content: (
          <dl className="grid grid-cols-2 gap-1 text-sm">
            <dt className="text-on-surface-variant">ID Interno:</dt><dd className="font-mono">PRJ-{String(project.projectNumber || 0).padStart(5, '0')}</dd>
            <dt className="text-on-surface-variant">Cliente:</dt><dd>{project.nombreCliente || '—'}</dd>
            <dt className="text-on-surface-variant">Proyecto:</dt><dd>{project.nombreProyecto || '—'}</dd>
            <dt className="text-on-surface-variant">CRM:</dt><dd>{project.crmId || '—'}</dd>
            <dt className="text-on-surface-variant">Tribu:</dt><dd>{project.tribe?.name || '—'}</dd>
            <dt className="text-on-surface-variant">Fecha:</dt><dd>{project.fechaInicio ? new Date(project.fechaInicio).toLocaleDateString('es-AR') : '—'}</dd>
            <dt className="text-on-surface-variant">Importancia:</dt><dd>{project.importancia != null ? `${project.importancia}` : '—'}</dd>
            <dt className="text-on-surface-variant">Pedido:</dt><dd className="col-span-2 whitespace-pre-wrap">{project.pedido || '—'}</dd>
          </dl>
        )},
        { key: 'diagnostico', title: '2. Diagnóstico', content: project.symptoms.length === 0 ? <p className="text-sm text-on-surface-variant">No hay síntomas.</p> : project.symptoms.map((s: any, i: number) => <div key={s.id} className="text-sm mb-2 p-2 bg-surface-container-low rounded"><p><strong>#{i + 1}</strong> {s.what}</p></div>) },
        { key: 'evidencia', title: '3. Evidencia', content: <p className="text-sm whitespace-pre-wrap">{project.evidencia || 'No hay datos.'}</p> },
        { key: 'vozDolor', title: '4. Voz del Dolor', content: <p className="text-sm whitespace-pre-wrap">{project.vozDolor || 'No hay datos.'}</p> },
        { key: 'causas', title: '5. Causas', content: project.causas.length === 0 ? <p className="text-sm text-on-surface-variant">No hay causas.</p> : project.causas.map((c: any, i: number) => <div key={c.id} className="text-sm mb-2 p-2 bg-surface-container-low rounded"><p><strong>#{i + 1}</strong> {c.why1}</p><p className="text-purple-700 font-medium">Raíz: {c.rootCause}</p></div>) },
        { key: 'impacto', title: '6. Impacto', content: <div><p className="text-sm whitespace-pre-wrap mb-2">{project.impactoNegocio || 'No hay datos.'}</p>{project.kpis.length > 0 && <div className="space-y-1">{project.kpis.map((k: any, i: number) => <div key={k.id} className="text-sm">#{i + 1} {k.nombre} | Actual: {k.valorActual} → Objetivo: {k.valorObjetivo}</div>)}</div>}</div> },
        { key: 'dependencias', title: '7. Dependencias', content: <div><p className="text-sm whitespace-pre-wrap mb-2">{project.dependencias || 'No hay dependencias.'}</p>{project.urgencias?.length > 0 && <div className="space-y-2 mt-2"><p className="text-xs font-bold text-on-surface-variant">Urgencias:</p>{project.urgencias.map((u: any, i: number) => <div key={u.id} className="text-sm p-2 bg-surface-container-low rounded"><p><span className={`badge text-[9px] mr-2 ${u.tipo === 'alta' ? 'bg-red-100 text-red-700' : u.tipo === 'media' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{u.tipo.toUpperCase()}</span>{u.justificacion || '—'}</p>{u.fechaDeseada && <p className="text-xs text-on-surface-variant mt-1">Fecha deseada: {new Date(u.fechaDeseada).toLocaleDateString('es-AR')}</p>}</div>)}</div>}</div> },
        { key: 'adjuntos', title: '8. Adjuntos', content: project.attachments.length === 0 ? <p className="text-sm text-on-surface-variant">No hay adjuntos.</p> : project.attachments.map((a: any, i: number) => <div key={a.id} className="text-sm">#{i + 1} {a.title} | {a.originalName} | {Math.round(a.fileSize / 1024)} KB</div>) },
      ].map(section => (
        <div key={section.key} className="border border-outline-variant/15 rounded-xl overflow-hidden mb-4">
          <div className="flex items-center justify-between px-4 py-3 bg-surface-container-low border-b border-outline-variant/10">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${progress?.[section.key] === 'green' ? 'bg-emerald-500' : progress?.[section.key] === 'yellow' ? 'bg-amber-500' : 'bg-red-400'}`} />
              <h4 className="text-sm font-bold text-on-surface">{section.title}</h4>
            </div>
            {project.estado === 'en_progreso' && <button onClick={() => router.push(`/projects/${id}/${section.key === 'adjuntos' ? 'cliente' : section.key}`)} className="text-xs text-primary font-bold">Editar</button>}
          </div>
          <div className="p-4">{section.content}</div>
        </div>
      ))}

      {/* Historial de cambios */}
      {history.length > 0 && (
        <div className="border border-outline-variant/15 rounded-xl overflow-hidden mt-6">
          <div className="flex items-center gap-2 px-4 py-3 bg-surface-container-low border-b border-outline-variant/10">
            <svg className="w-4 h-4 text-on-surface-variant" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <h4 className="text-sm font-bold text-on-surface">Historial de cambios ({history.length})</h4>
          </div>
          <div className="divide-y divide-outline-variant/5">
            {history.map((h: any, i: number) => {
              const estadoConfig: Record<string, { color: string; label: string }> = {
                en_progreso: { color: 'bg-amber-500', label: 'En Progreso' },
                terminado: { color: 'bg-emerald-500', label: 'Terminado' },
                cerrado: { color: 'bg-gray-400', label: 'Cerrado' },
                cancelado: { color: 'bg-red-500', label: 'Cancelado' },
                rechazado: { color: 'bg-orange-500', label: 'Rechazado' },
                reabierto: { color: 'bg-blue-500', label: 'Reabierto' },
              };
              const cfg = estadoConfig[h.estado] || { color: 'bg-gray-300', label: h.estado };
              return (
                <div key={h.id} className="flex items-start gap-3 px-4 py-3">
                  <div className="flex flex-col items-center mt-1 shrink-0">
                    <span className={`w-2.5 h-2.5 rounded-full ${cfg.color}`} />
                    {i < history.length - 1 && <div className="w-px h-6 bg-outline-variant/20 mt-1" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-on-surface">{cfg.label}</p>
                      <span className="text-xs text-on-surface-variant shrink-0">{new Date(h.createdAt).toLocaleString('es-AR')}</span>
                    </div>
                    <p className="text-xs text-on-surface-variant">por <strong>{h.user?.name || '—'}</strong> ({h.user?.role || '—'})</p>
                    {h.motivo && <p className="text-xs text-amber-700 mt-1 p-2 bg-amber-50 rounded">{h.motivo}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex justify-between pt-6">
        <button onClick={() => router.push(`/projects/${id}/dependencias`)} className="btn-secondary">← Anterior</button>
        <button onClick={() => router.push('/dashboard')} className="btn-secondary">Volver al Dashboard</button>
      </div>

      {/* Confirm Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-elevated">
            <h3 className="text-lg font-bold text-on-surface mb-3">
              {showConfirm === 'terminado' ? '¿Marcar como Terminado?' : showConfirm === 'cerrado' ? '¿Marcar como Cerrado?' : showConfirm === 'cancelado' ? '¿Cancelar proyecto?' : showConfirm === 'rechazar' ? '¿Rechazar proyecto?' : '¿Reabrir proyecto?'}
            </h3>
            <p className="text-sm text-on-surface-variant mb-4">
              {showConfirm === 'terminado' ? 'El CSM no podrá editar. El PO podrá cerrar o rechazar.'
                : showConfirm === 'cerrado' ? 'Se cerrará definitivamente y se entregará a desarrollo.'
                : showConfirm === 'cancelado' ? 'El proyecto se cancelará. Solo un Admin podrá reabrirlo.'
                : showConfirm === 'rechazar' ? 'Volverá a En Progreso. El CSM podrá editar nuevamente.'
                : 'Volverá a En Progreso. Se limpiarán todos los datos de auditoría.'}
            </p>
            {(showConfirm === 'rechazar' || showConfirm === 'cancelado') && (
              <div className="mb-4">
                <label className="block text-xs font-bold text-on-surface-variant mb-1">Motivo (requerido)</label>
                <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={3} className="input-field" placeholder="Explicá por qué se rechaza/cancela este proyecto..." />
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button onClick={() => { setShowConfirm(null); setMotivo(''); }} className="btn-secondary">Cancelar</button>
              <button
                onClick={() => {
                  const targetEstado = showConfirm === 'terminado' ? 'terminado'
                    : showConfirm === 'cerrado' ? 'cerrado'
                    : showConfirm === 'cancelado' ? 'cancelado'
                    : 'en_progreso';
                  handleEstado(targetEstado);
                }}
                disabled={(showConfirm === 'cancelado' || showConfirm === 'rechazar') && !motivo.trim()}
                className={`btn-primary ${showConfirm === 'cancelado' ? 'bg-red-600 hover:bg-red-700' : ''} disabled:opacity-50`}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
