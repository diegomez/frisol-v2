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
  const [project, setProject] = useState<any>(null);

  const isEditable = project?.estado === 'en_progreso';

  useEffect(() => {
    fetch(`/api/projects/${id}`).then(r => r.json()).then(p => {
      setProject(p);
      if (!initialized) { setValue(p.vozDolor || ''); setInitialized(true); }
    });
  }, [id, initialized]);

  const save = (v: string) => {
    setSaveStatus('saving');
    fetch(`/api/projects/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ vozDolor: v }) })
      .then(() => { setSaveStatus('saved'); (window as any).__frisolReloadProgress?.(); setTimeout(() => setSaveStatus('idle'), 2000); });
  };

  const handleChange = (v: string) => {
    if (!isEditable) return;
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
      <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 mb-6">
        <h3 className="text-sm font-bold text-sky-700 mb-1">Voz del Dolor — Insights</h3>
        <p className="text-xs text-on-surface-variant mb-3">Capturá cómo se siente el usuario frente al problema, citas textuales, frustraciones expresadas. Esta información le da contexto emocional al equipo de desarrollo y humaniza el caso de negocio.</p>
        <div className="bg-white/50 rounded-lg p-3 space-y-1">
          <p className="text-xs font-bold text-on-surface mb-1">Ejemplos prácticos:</p>
          <p className="text-xs text-on-surface-variant">• <em>&quot;Cada lunes pierdo 2 horas peleando con el sistema antes de poder hacer mi primer factura&quot;</em> — Juan Pérez, CFO</p>
          <p className="text-xs text-on-surface-variant">• El equipo de ventas está frustrado porque el proceso manual les quita tiempo que podrían usar para vender</p>
          <p className="text-xs text-on-surface-variant">• Sienten que la herramienta no fue diseñada para su flujo de trabajo real</p>
          <p className="text-xs text-on-surface-variant">• Un cliente amenazó con irse a la competencia por las demoras causadas por el sistema</p>
          <p className="text-xs text-on-surface-variant">• El equipo ya no confía en el sistema y tiene procesos paralelos en Excel como workaround</p>
        </div>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Voz del Dolor (Insights)</label>
          <textarea value={value} onChange={(e) => handleChange(e.target.value)} rows={10} className="input-field" placeholder="Ingresá las impresiones del usuario, citas textuales, sentimientos..." disabled={!isEditable} />
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
