'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function ClientePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const [form, setForm] = useState({
    nombreCliente: '', nombreProyecto: '', crmId: '',
    importancia: '', pedido: '',
    fechaInicio: '', interlocutores: '', tribeId: '',
  });
  const [tribes, setTribes] = useState<{ id: string; name: string }[]>([]);
  const [project, setProject] = useState<any>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [initialized, setInitialized] = useState(false);

  // Load project data
  useEffect(() => {
    fetch(`/api/projects/${id}`).then(r => r.json()).then(p => {
      setProject(p);
      if (!initialized) {
        setForm({
          nombreCliente: p.nombreCliente || '',
          nombreProyecto: p.nombreProyecto || '',
          crmId: p.crmId || '',
          importancia: p.importancia ? String(p.importancia) : '',
          pedido: p.pedido || '',
          fechaInicio: p.fechaInicio ? p.fechaInicio.split('T')[0] : '',
          interlocutores: p.interlocutores || '',
          tribeId: p.tribeId || '',
        });
        setInitialized(true);
      }
    });
    fetch('/api/tribes').then(r => r.json()).then(setTribes);
  }, [id, initialized]);

  const save = useCallback(async (data: typeof form) => {
    setSaveStatus('saving');
    await fetch(`/api/projects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombreCliente: data.nombreCliente,
        nombreProyecto: data.nombreProyecto,
        crmId: data.crmId,
        importancia: data.importancia ? parseInt(data.importancia) : null,
        pedido: data.pedido,
        fechaInicio: data.fechaInicio ? new Date(data.fechaInicio + 'T00:00:00').toISOString() : null,
        interlocutores: data.interlocutores,
        tribeId: data.tribeId || null,
      }),
    });
    setSaveStatus('saved');
    (window as any).__frisolReloadProgress?.();
    setTimeout(() => setSaveStatus('idle'), 2000);
  }, [id]);

  const handleChange = (field: string, value: string) => {
    const newForm = { ...form, [field]: value };
    setForm(newForm);
    setSaveStatus('saving');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => save(newForm), 500);
  };

  const isEditable = project?.estado === 'en_progreso';

  // Save on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) { clearTimeout(debounceRef.current); save(form); }
    };
  }, [form, save]);

  if (!project) return <div className="text-sm text-on-surface-variant">Cargando...</div>;

  return (
    <div>
      {/* Help Zone */}
      <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 mb-6">
        <h3 className="text-sm font-bold text-sky-700 mb-1">Descripción del Cliente</h3>
        <p className="text-xs text-on-surface-variant mb-2">Cargá los datos básicos del cliente visitado.</p>
        <ul className="list-disc list-inside text-xs text-on-surface-variant/70 space-y-0.5">
          <li>Cliente: &apos;TechCorp S.A.&apos; — Empresa de software</li>
          <li>CRM ID: &apos;OPP-2026-001234&apos;</li>
          <li>Interlocutores: &apos;Juan Pérez (CFO)&apos;</li>
        </ul>
      </div>

      <div className="space-y-4">
        {/* Internal ID */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">ID Interno</label>
          <input type="text" value={`PRJ-${String(project.projectNumber || 0).padStart(5, '0')}`} disabled className="input-field bg-gray-100 cursor-not-allowed font-mono" />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Nombre del cliente <span className="text-red-500">*</span></label>
          <input type="text" value={form.nombreCliente} onChange={(e) => handleChange('nombreCliente', e.target.value)} className="input-field" placeholder="Ej: TechCorp S.A." />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Nombre del proyecto <span className="text-red-500">*</span></label>
          <input type="text" value={form.nombreProyecto} onChange={(e) => handleChange('nombreProyecto', e.target.value)} className="input-field" placeholder="Ej: Automatización de reportes" />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">ID CRM <span className="text-red-500">*</span></label>
          <input type="text" value={form.crmId} onChange={(e) => handleChange('crmId', e.target.value)} className="input-field" placeholder="Ej: OPP-2026-001234" />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Importancia <span className="text-red-500">*</span></label>
          <input type="number" min={1} max={100000} value={form.importancia} onChange={(e) => handleChange('importancia', e.target.value)} className="input-field" placeholder="1 a 100000" />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Pedido</label>
          <textarea value={form.pedido} onChange={(e) => handleChange('pedido', e.target.value)} rows={4} className="input-field" placeholder="Describí lo que el usuario final le pidió al CSM..." />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Tribu</label>
          <select value={form.tribeId} onChange={(e) => handleChange('tribeId', e.target.value)} className="input-field">
            <option value="">Sin tribu</option>
            {tribes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Fecha de inicio <span className="text-red-500">*</span></label>
          <input type="date" value={form.fechaInicio} onChange={(e) => handleChange('fechaInicio', e.target.value)} className="input-field" />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Interlocutores</label>
          <textarea value={form.interlocutores} onChange={(e) => handleChange('interlocutores', e.target.value)} rows={4} className="input-field" placeholder="Ej: Juan Pérez (CFO) — jperez@techcorp.com" />
        </div>

        {/* Attachments */}
        <AttachmentsSection projectId={id} />

        {/* Save + Nav */}
        <div className="flex justify-between items-center pt-4">
          <div className="text-sm text-on-surface-variant">
            {saveStatus === 'saving' && <span className="text-amber-600">Guardando...</span>}
            {saveStatus === 'saved' && <span className="text-emerald-600">✓ Guardado</span>}
          </div>
          <button onClick={() => router.push(`/projects/${id}/diagnostico`)} className="btn-primary">
            Siguiente →
          </button>
        </div>
      </div>
    </div>
  );
}

function AttachmentsSection({ projectId }: { projectId: string }) {
  const [attachments, setAttachments] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const load = () => fetch(`/api/projects/${projectId}/attachments`).then(r => r.json()).then(setAttachments);
  useEffect(() => { load(); }, [projectId]);

  const handleUpload = async () => {
    if (!title.trim() || !file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('title', title.trim());
    await fetch(`/api/projects/${projectId}/attachments`, { method: 'POST', body: fd });
    setTitle(''); setFile(null); setShowForm(false); setUploading(false);
    load();
  };

  const handleDelete = async (attId: string) => {
    if (!confirm('¿Eliminar adjunto?')) return;
    await fetch(`/api/projects/${projectId}/attachments/${attId}`, { method: 'DELETE' });
    load();
  };

  const fmtSize = (b: number) => b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`;
  const fmtDate = (d: string) => { const dt = new Date(d); return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`; };

  return (
    <div className="border-t border-outline-variant/10 pt-4 mt-4">
      <div className="flex items-center justify-between mb-3">
        <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Archivos adjuntos ({attachments.length})</label>
        {!showForm && <button onClick={() => setShowForm(true)} className="text-sm text-primary font-bold hover:text-primary-container transition-colors">+ Agregar</button>}
      </div>

      {attachments.length > 0 && (
        <div className="bg-white border border-outline-variant/15 rounded-xl overflow-hidden mb-3">
          {attachments.map(a => (
            <div key={a.id} className="px-4 py-3 flex items-center justify-between hover:bg-surface-container-low/40 border-b border-outline-variant/5 last:border-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-on-surface truncate">{a.title}</p>
                  <p className="text-xs text-on-surface-variant">{a.originalName} · {fmtSize(a.fileSize)} · {fmtDate(a.uploadedAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                <a href={`/api/projects/${projectId}/attachments/${a.id}`} className="text-primary text-sm font-bold hover:text-primary-container">Descargar</a>
                <button onClick={() => handleDelete(a.id)} className="text-red-500 text-sm font-bold hover:text-red-600">Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {attachments.length === 0 && !showForm && (
        <div className="text-center py-4 text-on-surface-variant/60 border-2 border-dashed border-outline-variant/20 rounded-xl mb-3">No hay adjuntos.</div>
      )}

      {showForm && (
        <div className="bg-surface-container-low border border-outline-variant/15 rounded-xl p-4 space-y-3 mb-3">
          <div>
            <label className="block text-xs font-bold text-on-surface-variant mb-1">Título <span className="text-red-500">*</span></label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" placeholder="Captura del sistema actual" />
          </div>
          <div>
            <label className="block text-xs font-bold text-on-surface-variant mb-1">Archivo <span className="text-red-500">*</span></label>
            <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="w-full text-sm" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleUpload} disabled={!title.trim() || !file || uploading} className="btn-primary disabled:opacity-50">{uploading ? 'Subiendo...' : 'Subir'}</button>
            <button onClick={() => { setShowForm(false); setTitle(''); setFile(null); }} className="btn-secondary">Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}
