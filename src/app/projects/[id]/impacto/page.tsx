'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Kpi { id: string; nombre: string; valorActual: string; valorObjetivo: string; }

export default function ImpactoPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [impacto, setImpacto] = useState('');
  const [initialized, setInitialized] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [kpis, setKpis] = useState<Kpi[]>([]);
  const [editingKpiId, setEditingKpiId] = useState<string | null>(null);
  const [showNewKpi, setShowNewKpi] = useState(false);

  const loadKpis = () => fetch(`/api/projects/${id}/kpis`).then(r => r.json()).then(setKpis);
  useEffect(() => {
    fetch(`/api/projects/${id}`).then(r => r.json()).then(p => { if (!initialized) { setImpacto(p.impactoNegocio || ''); setInitialized(true); } });
    loadKpis();
  }, [id, initialized]);

  const saveImpacto = (v: string) => {
    setSaveStatus('saving');
    fetch(`/api/projects/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ impactoNegocio: v }) })
      .then(() => { setSaveStatus('saved'); (window as any).__frisolReloadProgress?.(); setTimeout(() => setSaveStatus('idle'), 2000); });
  };

  const handleChange = (v: string) => {
    setImpacto(v); setSaveStatus('saving');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => saveImpacto(v), 500);
  };

  useEffect(() => { return () => { if (debounceRef.current) { clearTimeout(debounceRef.current); if (impacto.trim()) saveImpacto(impacto); } }; }, [impacto]);

  const isKpiComplete = (k: any) => k.nombre?.trim() && k.valorActual?.trim() && k.valorObjetivo?.trim();
  const allKpisComplete = kpis.every(isKpiComplete);

  return (
    <div>
      <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 mb-6">
        <h3 className="text-sm font-bold text-primary mb-1">Impacto y Business Case</h3>
        <p className="text-xs text-on-surface-variant">Describí cómo el problema afecta al negocio. Luego cargá las métricas.</p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Impacto en el negocio <span className="text-red-500">*</span></label>
          <textarea value={impacto} onChange={(e) => handleChange(e.target.value)} rows={5} className="input-field" placeholder="Describí cómo el problema afecta ingresos, eficiencia o riesgo..." />
          <div className="text-sm text-on-surface-variant mt-1">{saveStatus === 'saving' && <span className="text-amber-600">Guardando...</span>}{saveStatus === 'saved' && <span className="text-emerald-600">✓ Guardado</span>}</div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">KPIs / Métricas <span className="text-red-500">*</span> (mínimo 1)</label>
          {kpis.length > 0 && (
            <div className="bg-white border border-outline-variant/15 rounded-xl overflow-hidden mb-3">
              {kpis.map((k, i) => (
                <div key={k.id}>
                  <button onClick={() => setEditingKpiId(editingKpiId === k.id ? null : k.id)} className="w-full px-4 py-3 flex items-center hover:bg-surface-container-low/40 text-left transition-colors">
                    <span className={`w-3 h-3 rounded-full mr-3 ${isKpiComplete(k) ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    <div className="flex-1"><p className="text-sm"><span className="font-bold">#{i + 1}</span> {k.nombre || '(sin nombre)'} <span className="text-on-surface-variant">| Actual: {k.valorActual} → Objetivo: {k.valorObjetivo}</span></p></div>
                  </button>
                  {editingKpiId === k.id && <div className="px-4 pb-4"><KpiEdit kpi={k} projectId={id} onSaved={loadKpis} onDeleted={() => { loadKpis(); setEditingKpiId(null); }} onCancel={() => setEditingKpiId(null)} /></div>}
                </div>
              ))}
            </div>
          )}
          {kpis.length === 0 && !showNewKpi && <div className="text-center py-6 text-on-surface-variant/60 border-2 border-dashed border-outline-variant/20 rounded-xl mb-3">No hay KPIs cargados.</div>}
          {showNewKpi && <KpiNew projectId={id} onSaved={() => { loadKpis(); setShowNewKpi(false); }} onCancel={() => setShowNewKpi(false)} />}
          {!showNewKpi && (
            <>
              <button onClick={() => setShowNewKpi(true)} className="w-full px-4 py-3 border-2 border-dashed border-primary/30 text-primary rounded-xl hover:bg-primary/5 text-sm font-bold transition-colors">
                + Agregar KPI
              </button>
            </>
          )}
        </div>

        <div className="flex justify-between pt-4">
          <button onClick={() => router.push(`/projects/${id}/causas`)} className="btn-secondary">← Anterior</button>
          <button onClick={() => router.push(`/projects/${id}/cierre`)} className="btn-primary">Siguiente →</button>
        </div>
      </div>
    </div>
  );
}

function KpiNew({ projectId, onSaved, onCancel }: any) {
  const [form, setForm] = useState({ nombre: '', valorActual: '', valorObjetivo: '' });
  const hasAnyField = form.nombre.trim() || form.valorActual.trim() || form.valorObjetivo.trim();
  const isComplete = form.nombre.trim() && form.valorActual.trim() && form.valorObjetivo.trim();

  const handleSave = async () => {
    if (!hasAnyField) return;
    await fetch(`/api/projects/${projectId}/kpis`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    onSaved();
  };

  return <KpiForm form={form} setForm={setForm} onSave={handleSave} onCancel={onCancel} isNew isComplete={isComplete} hasAnyField={hasAnyField} />;
}

function KpiEdit({ kpi, projectId, onSaved, onDeleted, onCancel }: any) {
  const [form, setForm] = useState({ nombre: kpi.nombre, valorActual: kpi.valorActual, valorObjetivo: kpi.valorObjetivo });
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleChange = (field: string, value: string) => {
    const newForm = { ...form, [field]: value }; setForm(newForm);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetch(`/api/projects/${projectId}/kpis/${kpi.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newForm) }).then(onSaved);
    }, 500);
  };

  const handleDelete = async () => { if (!confirm('¿Eliminar KPI?')) return; await fetch(`/api/projects/${projectId}/kpis/${kpi.id}`, { method: 'DELETE' }); onDeleted(); };

  return <KpiForm form={form} setForm={setForm} onChange={handleChange} onDelete={handleDelete} onCancel={onCancel} isComplete={form.nombre.trim() && form.valorActual.trim() && form.valorObjetivo.trim()} />;
}

function KpiForm({ form, setForm, onSave, onCancel, onChange, onDelete, isNew, isComplete, hasAnyField }: any) {
  const handleChange = onChange || ((f: string, v: string) => setForm({ ...form, [f]: v }));

  return (
    <div className={`border rounded-xl p-4 mb-3 ${isComplete ? 'border-emerald-300 bg-emerald-50/50' : hasAnyField ? 'border-amber-300 bg-amber-50/50' : 'border-outline-variant/20 bg-white'}`}>
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-bold text-on-surface">{isNew ? 'Nuevo KPI' : 'Editar KPI'}{isComplete && <span className="ml-2 text-emerald-600 text-xs">✓ Completo</span>}{!isComplete && hasAnyField && <span className="ml-2 text-amber-600 text-xs">⚠ Parcial</span>}</span>
        <div className="flex gap-2">{onDelete && <button onClick={onDelete} className="text-red-500 text-xs font-bold">Eliminar</button>}<button onClick={onCancel} className="text-on-surface-variant text-xs font-bold">{isNew ? 'Cancelar' : 'Cerrar'}</button></div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div><label className="block text-xs font-bold text-on-surface-variant mb-1">Nombre <span className="text-red-500">*</span></label><input type="text" value={form.nombre} onChange={(e) => handleChange('nombre', e.target.value)} className="input-field text-sm" placeholder="Tiempo de respuesta" /></div>
        <div><label className="block text-xs font-bold text-on-surface-variant mb-1">Actual <span className="text-red-500">*</span></label><input type="text" value={form.valorActual} onChange={(e) => handleChange('valorActual', e.target.value)} className="input-field text-sm" placeholder="45 segundos" /></div>
        <div><label className="block text-xs font-bold text-on-surface-variant mb-1">Objetivo <span className="text-red-500">*</span></label><input type="text" value={form.valorObjetivo} onChange={(e) => handleChange('valorObjetivo', e.target.value)} className="input-field text-sm" placeholder="5 segundos" /></div>
      </div>
      {isNew && onSave && <div className="mt-4 flex justify-end"><button onClick={onSave} disabled={!hasAnyField} className="btn-primary disabled:opacity-50">Guardar KPI</button></div>}
    </div>
  );
}
