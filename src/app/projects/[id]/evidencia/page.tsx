'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function EvidenciaPage() {
  return <TextPage title="Evidencia (Datos cuantitativos)" fieldName="evidencia" helpTitle="Evidencia Cuantitativa" helpDesc="Cargá datos numéricos y métricas que respalden el problema." helpExamples={["Tiempo de respuesta: 45s (objetivo: 5s)", "Errores: 15/semana", "Costo retrabajo: $2,500/mes"]} placeholder="Ingresá los datos cuantitativos, métricas, tiempos, costos..." prev="diagnostico" next="voz-dolor" prevLabel="← Anterior" nextLabel="Siguiente →" />;
}

function TextPage({ title, fieldName, helpTitle, helpDesc, helpExamples, placeholder, prev, next, prevLabel, nextLabel }: any) {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [value, setValue] = useState('');
  const [initialized, setInitialized] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    fetch(`/api/projects/${id}`).then(r => r.json()).then(p => {
      if (!initialized) { setValue(p[fieldName] || ''); setInitialized(true); }
    });
  }, [id, fieldName, initialized]);

  const save = (v: string) => {
    setSaveStatus('saving');
    fetch(`/api/projects/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [fieldName]: v }) })
      .then(() => { setSaveStatus('saved'); (window as any).__frisolReloadProgress?.(); setTimeout(() => setSaveStatus('idle'), 2000); });
  };

  const handleChange = (v: string) => {
    setValue(v);
    setSaveStatus('saving');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => save(v), 500);
  };

  useEffect(() => {
    return () => { if (debounceRef.current) { clearTimeout(debounceRef.current); if (value.trim()) save(value); } };
  }, [value]);

  return (
    <div>
      <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 mb-6">
        <h3 className="text-sm font-bold text-primary mb-1">{helpTitle}</h3>
        <p className="text-xs text-on-surface-variant mb-2">{helpDesc}</p>
        <ul className="list-disc list-inside text-xs text-on-surface-variant/70 space-y-0.5">{helpExamples.map((e: string, i: number) => <li key={i}>{e}</li>)}</ul>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">{title}</label>
          <textarea value={value} onChange={(e) => handleChange(e.target.value)} rows={10} className="input-field" placeholder={placeholder} />
        </div>
        <div className="flex justify-between items-center pt-4">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push(`/projects/${id}/${prev}`)} className="btn-secondary">{prevLabel}</button>
            <div className="text-sm text-on-surface-variant">
              {saveStatus === 'saving' && <span className="text-amber-600">Guardando...</span>}
              {saveStatus === 'saved' && <span className="text-emerald-600">✓ Guardado</span>}
            </div>
          </div>
          <button onClick={() => router.push(`/projects/${id}/${next}`)} className="btn-primary">{nextLabel}</button>
        </div>
      </div>
    </div>
  );
}
