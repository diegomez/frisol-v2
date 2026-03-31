'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Urgencia {
  id: string;
  tipo: string;
  justificacion: string;
  fechaDeseada: string | null;
}

export default function DependenciasPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [dependencias, setDependencias] = useState('');
  const [initialized, setInitialized] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [urgencias, setUrgencias] = useState<Urgencia[]>([]);
  const [editingUrgenciaId, setEditingUrgenciaId] = useState<string | null>(null);
  const [showNewUrgencia, setShowNewUrgencia] = useState(false);
  const [project, setProject] = useState<any>(null);

  const isEditable = project?.estado === 'en_progreso';

  const loadUrgencias = () => fetch(`/api/projects/${id}/urgencias`).then(r => r.json()).then(setUrgencias);
  useEffect(() => {
    fetch(`/api/projects/${id}`).then(r => r.json()).then(p => { setProject(p); if (!initialized) { setDependencias(p.dependencias || ''); setInitialized(true); } });
    loadUrgencias();
  }, [id, initialized]);

  const saveDependencias = (v: string) => {
    setSaveStatus('saving');
    fetch(`/api/projects/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dependencias: v }) })
      .then(() => { setSaveStatus('saved'); (window as any).__frisolReloadProgress?.(); setTimeout(() => setSaveStatus('idle'), 2000); });
  };

  const handleChange = (v: string) => {
    if (!isEditable) return;
    setDependencias(v); setSaveStatus('saving');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => saveDependencias(v), 500);
  };

  useEffect(() => { return () => { if (debounceRef.current) { clearTimeout(debounceRef.current); if (dependencias.trim()) saveDependencias(dependencias); } }; }, [dependencias]);

  return (
    <div>
      <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 mb-6">
        <h3 className="text-sm font-bold text-sky-700 mb-1">Dependencias</h3>
        <p className="text-xs text-on-surface-variant mb-3">Identificá las dependencias críticas que podrían afectar la entrega del proyecto. Luego cargá las urgencias con su nivel de prioridad y fecha deseada.</p>
        <div className="bg-white/50 rounded-lg p-3 space-y-1">
          <p className="text-xs font-bold text-on-surface mb-1">Ejemplos de dependencias:</p>
          <p className="text-xs text-on-surface-variant">• Desarrollo técnico/API</p>
          <p className="text-xs text-on-surface-variant">• Contenidos</p>
          <p className="text-xs text-on-surface-variant">• Aprobación legal</p>
          <p className="text-xs text-on-surface-variant">• Definición de base de usuarios</p>
          <p className="text-xs text-on-surface-variant">• Infraestructura / DevOps</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Dependencias Textarea */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Dependencias <span className="text-red-500">*</span></label>
          <textarea value={dependencias} onChange={(e) => handleChange(e.target.value)} rows={5} className="input-field" placeholder="Describí las dependencias del proyecto: desarrollo técnico, contenidos, aprobación legal, etc..." disabled={!isEditable} />
          <div className="text-sm text-on-surface-variant mt-1">{saveStatus === 'saving' && <span className="text-amber-600">Guardando...</span>}{saveStatus === 'saved' && <span className="text-emerald-600">✓ Guardado</span>}</div>
        </div>

        {/* Urgencias */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">Urgencias <span className="text-on-surface-variant/60 font-normal">(opcional)</span></label>
          {urgencias.length > 0 && (
            <div className="bg-white border border-outline-variant/15 rounded-xl overflow-hidden mb-3">
              {urgencias.map((u, i) => (
                <div key={u.id}>
                  <button onClick={() => setEditingUrgenciaId(editingUrgenciaId === u.id ? null : u.id)} className="w-full px-4 py-3 flex items-center hover:bg-surface-container-low/40 text-left transition-colors">
                    <span className={`w-3 h-3 rounded-full mr-3 ${u.tipo === 'alta' ? 'bg-red-500' : u.tipo === 'media' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                    <div className="flex-1">
                      <p className="text-sm"><span className="font-bold">#{i + 1}</span> <span className={`badge text-[9px] ${u.tipo === 'alta' ? 'bg-red-100 text-red-700' : u.tipo === 'media' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{u.tipo.toUpperCase()}</span> {u.justificacion ? (u.justificacion.length > 60 ? u.justificacion.substring(0, 60) + '...' : u.justificacion) : '(sin justificación)'}</p>
                      {u.fechaDeseada && <p className="text-xs text-on-surface-variant mt-0.5">Fecha deseada: {new Date(u.fechaDeseada).toLocaleDateString('es-AR')}</p>}
                    </div>
                  </button>
                  {editingUrgenciaId === u.id && <div className="px-4 pb-4"><UrgenciaEdit urgencia={u} projectId={id} isEditable={isEditable} onSaved={loadUrgencias} onDeleted={() => { loadUrgencias(); setEditingUrgenciaId(null); }} onCancel={() => setEditingUrgenciaId(null)} /></div>}
                </div>
              ))}
            </div>
          )}
          {urgencias.length === 0 && !showNewUrgencia && <div className="text-center py-6 text-on-surface-variant/60 border-2 border-dashed border-outline-variant/20 rounded-xl mb-3">No hay urgencias cargadas.</div>}
          {showNewUrgencia && <UrgenciaNew projectId={id} isEditable={isEditable} onSaved={() => { loadUrgencias(); setShowNewUrgencia(false); }} onCancel={() => setShowNewUrgencia(false)} />}
          {!showNewUrgencia && isEditable && (
            <button onClick={() => setShowNewUrgencia(true)} className="w-full px-4 py-3 border-2 border-dashed border-primary/30 text-primary rounded-xl hover:bg-primary/5 text-sm font-bold transition-colors">
              + Agregar urgencia
            </button>
          )}
        </div>

        <div className="flex justify-between pt-4">
          <button onClick={() => router.push(`/projects/${id}/impacto`)} className="btn-secondary">← Anterior</button>
          <button onClick={() => router.push(`/projects/${id}/cierre`)} className="btn-primary">Siguiente →</button>
        </div>
      </div>
    </div>
  );
}

function UrgenciaNew({ projectId, isEditable, onSaved, onCancel }: any) {
  const [form, setForm] = useState({ tipo: 'media', justificacion: '', fechaDeseada: '' });
  const hasAnyField = form.tipo.trim() || form.justificacion.trim() || form.fechaDeseada.trim();

  const handleSave = async () => {
    if (!hasAnyField) return;
    await fetch(`/api/projects/${projectId}/urgencias`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    onSaved();
  };

  return <UrgenciaForm form={form} setForm={setForm} onSave={handleSave} onCancel={onCancel} isNew isEditable={isEditable} hasAnyField={hasAnyField} />;
}

function UrgenciaEdit({ urgencia, projectId, isEditable, onSaved, onDeleted, onCancel }: any) {
  const [form, setForm] = useState({ tipo: urgencia.tipo, justificacion: urgencia.justificacion, fechaDeseada: urgencia.fechaDeseada ? urgencia.fechaDeseada.split('T')[0] : '' });
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleChange = (field: string, value: string) => {
    if (!isEditable) return;
    const newForm = { ...form, [field]: value }; setForm(newForm);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetch(`/api/projects/${projectId}/urgencias/${urgencia.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newForm) }).then(onSaved);
    }, 500);
  };

  const handleDelete = async () => { if (!confirm('¿Eliminar urgencia?')) return; await fetch(`/api/projects/${projectId}/urgencias/${urgencia.id}`, { method: 'DELETE' }); onDeleted(); };

  return <UrgenciaForm form={form} setForm={setForm} onChange={handleChange} onDelete={isEditable ? handleDelete : undefined} onCancel={onCancel} isEditable={isEditable} hasAnyField={true} />;
}

function UrgenciaForm({ form, setForm, onSave, onCancel, onChange, onDelete, isNew, isEditable, hasAnyField }: any) {
  const handleChange = onChange || ((f: string, v: string) => setForm({ ...form, [f]: v }));

  return (
    <div className={`border rounded-xl p-4 mb-3 ${hasAnyField ? 'border-amber-300 bg-amber-50/50' : 'border-outline-variant/20 bg-white'}`}>
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-bold text-on-surface">{isNew ? 'Nueva urgencia' : 'Editar urgencia'}</span>
        <div className="flex gap-2">{onDelete && isEditable && <button onClick={onDelete} className="text-red-500 text-xs font-bold">Eliminar</button>}<button onClick={onCancel} className="text-on-surface-variant text-xs font-bold">{isNew ? 'Cancelar' : 'Cerrar'}</button></div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-bold text-on-surface-variant mb-1">Tipo de urgencia</label>
          <select value={form.tipo} onChange={(e) => handleChange('tipo', e.target.value)} className="input-field text-sm" disabled={!isEditable}>
            <option value="alta">Alta</option>
            <option value="media">Media</option>
            <option value="baja">Baja</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-on-surface-variant mb-1">Fecha deseada</label>
          <input type="date" value={form.fechaDeseada} onChange={(e) => handleChange('fechaDeseada', e.target.value)} className="input-field text-sm" disabled={!isEditable} />
        </div>
        <div className="col-span-3 sm:col-span-1">
          <label className="block text-xs font-bold text-on-surface-variant mb-1">Justificación</label>
          <textarea value={form.justificacion} onChange={(e) => handleChange('justificacion', e.target.value)} rows={2} className="input-field text-sm" placeholder="Explicá por qué es urgente..." disabled={!isEditable} />
        </div>
      </div>
      {isNew && onSave && <div className="mt-4 flex justify-end"><button onClick={onSave} disabled={!hasAnyField} className="btn-primary disabled:opacity-50">Guardar urgencia</button></div>}
    </div>
  );
}
