'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Causa { id: string; why1: string; why2: string; why3: string; why4: string | null; why5: string | null; rootCause: string; originMetodo: boolean; originMaquina: boolean; originGobernanza: boolean; }

export default function CausasPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [causas, setCausas] = useState<Causa[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  const load = () => fetch(`/api/projects/${id}/causas`).then(r => r.json()).then(setCausas);
  useEffect(() => { load(); }, [id]);

  const isComplete = (c: any) => c.why1?.trim() && c.why2?.trim() && c.why3?.trim() && (c.originMetodo || c.originMaquina || c.originGobernanza);
  const hasAnyField = (c: any) => c.why1?.trim() || c.why2?.trim() || c.why3?.trim() || c.why4?.trim() || c.why5?.trim();

  return (
    <div>
      <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 mb-6">
        <h3 className="text-sm font-bold text-sky-700 mb-1">Análisis de Causas — 5 Porqués</h3>
        <p className="text-xs text-on-surface-variant mb-3">La técnica de los 5 Porqués permite llegar a la causa raíz de un problema. Empezá con el síntoma y preguntá &quot;¿por qué?&quot; sucesivamente. Completá mínimo 3 porqués (máximo 5) y seleccioná al menos un origen.</p>
        <div className="bg-white/50 rounded-lg p-3 space-y-1">
          <p className="text-xs font-bold text-on-surface mb-1">Ejemplo práctico:</p>
          <p className="text-xs text-on-surface-variant"><strong>Por qué 1:</strong> El sistema se cae porque no tiene cache de consultas</p>
          <p className="text-xs text-on-surface-variant"><strong>Por qué 2:</strong> No tiene cache porque nunca se implementó al diseñar la arquitectura</p>
          <p className="text-xs text-on-surface-variant"><strong>Por qué 3:</strong> No se diseñó con performance porque no había un requerimiento explícito de velocidad</p>
          <p className="text-xs text-on-surface-variant"><strong>Por qué 4:</strong> El cliente no sabía que necesitaba performance porque nunca midieron tiempos de respuesta</p>
          <p className="text-xs text-on-surface-variant mt-1"><strong>Causa raíz:</strong> <span className="text-purple-700 font-medium">El cliente no sabía que necesitaba performance porque nunca midieron tiempos de respuesta</span></p>
          <p className="text-xs text-on-surface-variant"><strong>Origen:</strong> Método (proceso de relevamiento incompleto)</p>
        </div>
        <p className="text-xs text-on-surface-variant/70 mt-2">La causa raíz se calcula automáticamente con el último por qué completado. Podés tener múltiples causas incompletas y completarlas después.</p>
      </div>

      {causas.length > 0 && (
        <div className="bg-white border border-outline-variant/15 rounded-xl overflow-hidden mb-4">
          <div className="px-4 py-3 bg-surface-container-low border-b border-outline-variant/10">
            <span className="text-sm font-bold text-on-surface">Causas ({causas.length})</span>
          </div>
          {causas.map((c, i) => (
            <div key={c.id}>
              <button onClick={() => setEditingId(editingId === c.id ? null : c.id)} className="w-full px-4 py-3 flex items-center hover:bg-surface-container-low/40 text-left transition-colors">
                <span className={`w-3 h-3 rounded-full mr-3 ${isComplete(c) ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <div className="flex-1 min-w-0"><p className="text-sm font-medium text-on-surface truncate"><span className="font-bold">#{i + 1}</span> {c.why1 || '(sin descripción)'}</p></div>
                <span className={`badge text-[9px] ${isComplete(c) ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{isComplete(c) ? 'Completa' : 'Incompleta'}</span>
              </button>
              {editingId === c.id && <div className="px-4 pb-4"><CausaEdit causa={c} projectId={id} onSaved={load} onDeleted={() => { load(); setEditingId(null); }} /></div>}
            </div>
          ))}
        </div>
      )}

      {causas.length === 0 && !showNew && (
        <div className="text-center py-8 text-on-surface-variant/60 border-2 border-dashed border-outline-variant/20 rounded-xl mb-4">No hay causas cargadas.</div>
      )}

      {showNew && <CausaNew projectId={id} onSaved={() => { load(); setShowNew(false); }} onCancel={() => setShowNew(false)} />}

      {!showNew && (
        <button onClick={() => setShowNew(true)} className="w-full px-4 py-3 border-2 border-dashed border-primary/30 text-primary rounded-xl hover:bg-primary/5 text-sm font-bold transition-colors">
          + Agregar causa
        </button>
      )}

      <div className="flex justify-between pt-6">
        <button onClick={() => router.push(`/projects/${id}/voz-dolor`)} className="btn-secondary">← Anterior</button>
        <button onClick={() => router.push(`/projects/${id}/impacto`)} className="btn-primary">Siguiente →</button>
      </div>
    </div>
  );
}

function CausaNew({ projectId, onSaved, onCancel }: any) {
  const [form, setForm] = useState({ why1: '', why2: '', why3: '', why4: '', why5: '', originMetodo: false, originMaquina: false, originGobernanza: false });
  const hasAnyField = form.why1.trim() || form.why2.trim() || form.why3.trim() || form.why4.trim() || form.why5.trim();
  const isComplete = form.why1.trim() && form.why2.trim() && form.why3.trim() && (form.originMetodo || form.originMaquina || form.originGobernanza);

  const handleSave = async () => {
    if (!hasAnyField) return;
    await fetch(`/api/projects/${projectId}/causas`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    onSaved();
  };

  return <CausaForm form={form} setForm={setForm} onSave={handleSave} onCancel={onCancel} isNew isComplete={isComplete} hasAnyField={hasAnyField} />;
}

function CausaEdit({ causa, projectId, onSaved, onDeleted }: any) {
  const [form, setForm] = useState({ why1: causa.why1, why2: causa.why2, why3: causa.why3, why4: causa.why4 || '', why5: causa.why5 || '', originMetodo: causa.originMetodo, originMaquina: causa.originMaquina, originGobernanza: causa.originGobernanza });
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleChange = (field: string, value: any) => {
    const newForm = { ...form, [field]: value };
    setForm(newForm);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetch(`/api/projects/${projectId}/causas/${causa.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newForm) }).then(onSaved);
    }, 500);
  };

  const handleDelete = async () => {
    if (!confirm('¿Eliminar causa?')) return;
    await fetch(`/api/projects/${projectId}/causas/${causa.id}`, { method: 'DELETE' });
    onDeleted();
  };

  return <CausaForm form={form} setForm={setForm} onChange={handleChange} onDelete={handleDelete} isComplete={form.why1.trim() && form.why2.trim() && form.why3.trim() && (form.originMetodo || form.originMaquina || form.originGobernanza)} />;
}

function CausaForm({ form, setForm, onSave, onCancel, onChange, onDelete, isNew, isComplete, hasAnyField }: any) {
  const rootCause = form.why5?.trim() || form.why4?.trim() || form.why3?.trim() || '';
  const handleChange = onChange || ((field: string, value: any) => setForm({ ...form, [field]: value }));

  const whys = [
    { key: 'why1', label: '¿Por qué 1?', ph: 'El sistema no tiene cache', req: true },
    { key: 'why2', label: '¿Por qué 2?', ph: 'Nunca se implementó cache', req: true },
    { key: 'why3', label: '¿Por qué 3? (mínimo)', ph: 'No había requerimiento de performance', req: true },
    { key: 'why4', label: '¿Por qué 4? (opcional)', ph: '', req: false },
    { key: 'why5', label: '¿Por qué 5? (opcional)', ph: '', req: false },
  ];

  return (
    <div className={`border rounded-xl p-4 mb-4 ${isComplete ? 'border-emerald-300 bg-emerald-50/50' : hasAnyField ? 'border-amber-300 bg-amber-50/50' : 'border-outline-variant/20 bg-white'}`}>
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-bold text-on-surface">{isNew ? 'Nueva causa' : 'Editar causa'}{isComplete && <span className="ml-2 text-emerald-600 text-xs">✓ Completa</span>}{!isComplete && hasAnyField && <span className="ml-2 text-amber-600 text-xs">⚠ Parcial</span>}</span>
        <div className="flex gap-2">{onDelete && <button onClick={onDelete} className="text-red-500 text-xs font-bold">Eliminar</button>}<button onClick={onCancel} className="text-on-surface-variant text-xs font-bold">{isNew ? 'Cancelar' : 'Cerrar'}</button></div>
      </div>
      <div className="space-y-3">
        {whys.map(w => (
          <div key={w.key}><label className="block text-xs font-bold text-on-surface-variant mb-1">{w.label} {w.req && <span className="text-red-500">*</span>}</label><input type="text" value={form[w.key]} onChange={(e) => handleChange(w.key, e.target.value)} className="input-field text-sm" placeholder={w.ph} /></div>
        ))}
        {rootCause && <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg"><p className="text-xs font-bold text-purple-600 mb-1">🎯 Causa raíz (auto)</p><p className="text-sm text-purple-900">{rootCause}</p></div>}
        <div><label className="block text-xs font-bold text-on-surface-variant mb-2">Origen <span className="text-red-500">*</span></label>
          <div className="flex gap-4">
            {[['originMetodo', 'Método'], ['originMaquina', 'Máquina'], ['originGobernanza', 'Gobernanza']].map(([k, l]) => (
              <label key={k as string} className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form[k as string]} onChange={(e) => handleChange(k as string, e.target.checked)} className="w-4 h-4 text-primary rounded" /><span className="text-sm text-on-surface">{l as string}</span></label>
            ))}
          </div>
        </div>
      </div>
      {isNew && onSave && <div className="mt-4 flex justify-end"><button onClick={onSave} disabled={!hasAnyField} className="btn-primary disabled:opacity-50">Guardar causa</button></div>}
    </div>
  );
}
