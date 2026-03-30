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
      <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 mb-6">
        <h3 className="text-sm font-bold text-primary mb-1">Descripción del Cliente</h3>
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
          <input type="text" value={project.internalId || ''} disabled className="input-field bg-gray-100 cursor-not-allowed font-mono" />
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
