'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Symptom { id: string; what: string; who: string; whenField: string; whereField: string; how: string; declaration: string; }

export default function DiagnosticoPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  const load = () => fetch(`/api/projects/${id}/symptoms`).then(r => r.json()).then(setSymptoms);
  useEffect(() => { load(); }, [id]);

  const isComplete = (s: any) => s.what?.trim() && s.who?.trim() && s.whenField?.trim() && s.whereField?.trim() && s.how?.trim() && s.declaration?.trim();
  const hasAnyField = (s: any) => s.what?.trim() || s.who?.trim() || s.whenField?.trim() || s.whereField?.trim() || s.how?.trim() || s.declaration?.trim();

  return (
    <div>
      <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 mb-6">
        <h3 className="text-sm font-bold text-sky-700 mb-1">Diagnóstico 5WTH</h3>
        <p className="text-xs text-on-surface-variant mb-3">La técnica 5WTH permite capturar información estructurada sobre cada síntoma del problema. Usá esta técnica para asegurar que el equipo de desarrollo reciba información completa y accionable.</p>
        <div className="bg-white/50 rounded-lg p-3 space-y-1">
          <p className="text-xs font-bold text-on-surface mb-1">Ejemplo práctico:</p>
          <p className="text-xs text-on-surface-variant"><strong>Qué:</strong> El sistema de facturación se cae cuando hay más de 50 usuarios simultáneos</p>
          <p className="text-xs text-on-surface-variant"><strong>Quién:</strong> Equipo de ventas (30 personas) y clientes premium que acceden al portal</p>
          <p className="text-xs text-on-surface-variant"><strong>Cuándo:</strong> Todos los lunes a las 9am durante el cierre de mes, y los viernes a las 5pm</p>
          <p className="text-xs text-on-surface-variant"><strong>Dónde:</strong> Módulo de facturación del portal web, en el servidor de reportes</p>
          <p className="text-xs text-on-surface-variant"><strong>Cómo:</strong> Timeout de 30 segundos, error 500 en pantalla, la página queda en blanco</p>
          <p className="text-xs text-on-surface-variant"><strong>Declaración:</strong> El módulo de facturación colapsa en horas pico causando pérdida de ventas y frustración en el equipo comercial</p>
        </div>
        <p className="text-xs text-on-surface-variant/70 mt-2">Podés guardar cada síntoma parcialmente con al menos un campo. Agregá todos los síntomas que identifiques, sin límite.</p>
      </div>

      {symptoms.length > 0 && (
        <div className="bg-white border border-outline-variant/15 rounded-xl overflow-hidden mb-4">
          <div className="px-4 py-3 bg-surface-container-low border-b border-outline-variant/10">
            <span className="text-sm font-bold text-on-surface">Síntomas ({symptoms.length})</span>
          </div>
          {symptoms.map((s, i) => (
            <div key={s.id}>
              <button onClick={() => setEditingId(editingId === s.id ? null : s.id)} className="w-full px-4 py-3 flex items-center hover:bg-surface-container-low/40 text-left transition-colors">
                <span className={`w-3 h-3 rounded-full mr-3 ${isComplete(s) ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-on-surface truncate"><span className="font-bold">#{i + 1}</span> {s.what || '(sin descripción)'}</p>
                </div>
                <span className={`badge text-[9px] ${isComplete(s) ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{isComplete(s) ? 'Completo' : 'Incompleto'}</span>
              </button>
              {editingId === s.id && (
                <div className="px-4 pb-4">
                  <SymptomEdit symptom={s} projectId={id} onSaved={load} onDeleted={() => { load(); setEditingId(null); }} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {symptoms.length === 0 && !showNew && (
        <div className="text-center py-8 text-on-surface-variant/60 border-2 border-dashed border-outline-variant/20 rounded-xl mb-4">
          No hay síntomas cargados.
        </div>
      )}

      {showNew && <SymptomNew projectId={id} onSaved={() => { load(); setShowNew(false); }} onCancel={() => setShowNew(false)} />}

      {!showNew && (
        <button onClick={() => setShowNew(true)} className="w-full px-4 py-3 border-2 border-dashed border-primary/30 text-primary rounded-xl hover:bg-primary/5 text-sm font-bold transition-colors">
          + Agregar síntoma
        </button>
      )}

      <div className="flex justify-between pt-6">
        <button onClick={() => router.push(`/projects/${id}/cliente`)} className="btn-secondary">← Anterior</button>
        <button onClick={() => router.push(`/projects/${id}/evidencia`)} className="btn-primary">Siguiente →</button>
      </div>
    </div>
  );
}

function SymptomNew({ projectId, onSaved, onCancel }: { projectId: string; onSaved: () => void; onCancel: () => void }) {
  const [form, setForm] = useState({ what: '', who: '', whenField: '', whereField: '', how: '', declaration: '' });
  const hasAnyField = Object.values(form).some(v => v.trim());
  const isComplete = Object.values(form).every(v => v.trim());

  const handleSave = async () => {
    if (!hasAnyField) return;
    await fetch(`/api/projects/${projectId}/symptoms`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    onSaved();
  };

  return <SymptomForm form={form} onChange={(f: string, v: string) => setForm({ ...form, [f]: v })} onSave={handleSave} onCancel={onCancel} isNew isComplete={isComplete} hasAnyField={hasAnyField} />;
}

function SymptomEdit({ symptom, projectId, onSaved, onDeleted }: { symptom: Symptom; projectId: string; onSaved: () => void; onDeleted: () => void }) {
  const [form, setForm] = useState({ what: symptom.what, who: symptom.who, whenField: symptom.whenField, whereField: symptom.whereField, how: symptom.how, declaration: symptom.declaration });
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleChange = (field: string, value: string) => {
    const newForm = { ...form, [field]: value };
    setForm(newForm);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetch(`/api/projects/${projectId}/symptoms/${symptom.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newForm) }).then(onSaved);
    }, 500);
  };

  const handleDelete = async () => {
    if (!confirm('¿Eliminar síntoma?')) return;
    await fetch(`/api/projects/${projectId}/symptoms/${symptom.id}`, { method: 'DELETE' });
    onDeleted();
  };

  return <SymptomForm form={form} onChange={handleChange} onDelete={handleDelete} isComplete={Object.values(form).every(v => v.trim())} hasAnyField={Object.values(form).some(v => v.trim())} />;
}

function SymptomForm({ form, onChange, onSave, onCancel, onDelete, isNew, isComplete, hasAnyField }: any) {
  const fields = [
    { key: 'what', label: '¿Qué sucede?', ph: 'El sistema se cae con 50+ usuarios' },
    { key: 'who', label: '¿Quién?', ph: 'Equipo de ventas, clientes premium' },
    { key: 'whenField', label: '¿Cuándo?', ph: 'Lunes a las 9am durante cierre de mes' },
    { key: 'whereField', label: '¿Dónde?', ph: 'Módulo de facturación' },
    { key: 'how', label: '¿Cómo?', ph: 'Timeout de 30s, error 500' },
    { key: 'declaration', label: 'Declaración', ph: 'El módulo colapsa en horas pico' },
  ];

  return (
    <div className={`border rounded-xl p-4 mb-4 ${isComplete ? 'border-emerald-300 bg-emerald-50/50' : hasAnyField ? 'border-amber-300 bg-amber-50/50' : 'border-outline-variant/20 bg-white'}`}>
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-bold text-on-surface">{isNew ? 'Nuevo síntoma' : 'Editar síntoma'}
          {isComplete && <span className="ml-2 text-emerald-600 text-xs">✓ Completo</span>}
          {!isComplete && hasAnyField && <span className="ml-2 text-amber-600 text-xs">⚠ Parcial</span>}
        </span>
        <div className="flex gap-2">
          {onDelete && <button onClick={onDelete} className="text-red-500 text-xs font-bold">Eliminar</button>}
          <button onClick={onCancel} className="text-on-surface-variant text-xs font-bold">{isNew ? 'Cancelar' : 'Cerrar'}</button>
        </div>
      </div>
      <div className="space-y-3">
        {fields.map(f => (
          <div key={f.key}>
            <label className="block text-xs font-bold text-on-surface-variant mb-1">{f.label} <span className="text-red-500">*</span></label>
            {f.key === 'declaration' ? (
              <textarea value={form[f.key]} onChange={(e) => onChange(f.key, e.target.value)} rows={3} className="input-field text-sm" placeholder={f.ph} />
            ) : (
              <input type="text" value={form[f.key]} onChange={(e) => onChange(f.key, e.target.value)} className="input-field text-sm" placeholder={f.ph} />
            )}
          </div>
        ))}
      </div>
      {isNew && onSave && (
        <div className="mt-4 flex justify-end">
          <button onClick={onSave} disabled={!hasAnyField} className="btn-primary disabled:opacity-50">Guardar síntoma</button>
        </div>
      )}
    </div>
  );
}
