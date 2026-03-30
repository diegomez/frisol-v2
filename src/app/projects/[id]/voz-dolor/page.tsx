'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function VozDolorPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [value, setValue] = useState('');
  const [initialized, setInitialized] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    fetch(`/api/projects/${id}`).then(r => r.json()).then(p => {
      if (!initialized) { setValue(p.vozDolor || ''); setInitialized(true); }
    });
  }, [id, initialized]);

  const save = (v: string) => {
    setSaveStatus('saving');
    fetch(`/api/projects/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ vozDolor: v }) })
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
        <h3 className="text-sm font-bold text-primary mb-1">Voz del Dolor — Insights</h3>
        <p className="text-xs text-on-surface-variant mb-2">Cargá cómo se siente el usuario, citas textuales, frustraciones.</p>
        <ul className="list-disc list-inside text-xs text-on-surface-variant/70 space-y-0.5">
          <li>&quot;Cada lunes pierdo 2 horas peleando con el sistema&quot; — Juan Pérez, CFO</li>
          <li>El equipo está frustrado porque el proceso les quita tiempo de ventas</li>
        </ul>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Voz del Dolor (Insights)</label>
          <textarea value={value} onChange={(e) => handleChange(e.target.value)} rows={10} className="input-field" placeholder="Ingresá las impresiones del usuario, citas textuales, sentimientos..." />
        </div>
        <div className="flex justify-between items-center pt-4">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push(`/projects/${id}/evidencia`)} className="btn-secondary">← Anterior</button>
            <div className="text-sm text-on-surface-variant">
              {saveStatus === 'saving' && <span className="text-amber-600">Guardando...</span>}
              {saveStatus === 'saved' && <span className="text-emerald-600">✓ Guardado</span>}
            </div>
          </div>
          <button onClick={() => router.push(`/projects/${id}/causas`)} className="btn-primary">Siguiente →</button>
        </div>
      </div>
    </div>
  );
}
