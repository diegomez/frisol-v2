import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import puppeteer from 'puppeteer';

function esc(t: string | null): string {
  if (!t) return '';
  return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function fmtDate(d: Date | string | null): string {
  if (!d) return '—';
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
}

function fmtDateTime(d: Date | string | null): string {
  if (!d) return '—';
  const dt = new Date(d);
  return `${fmtDate(d)} ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      csm: true, tribe: true,
      terminadoBy: { select: { name: true } },
      cerradoBy: { select: { name: true } },
      symptoms: { orderBy: { createdAt: 'asc' } },
      causas: { orderBy: { createdAt: 'asc' } },
      kpis: { orderBy: { createdAt: 'asc' } },
      attachments: { orderBy: { uploadedAt: 'desc' } },
    },
  });

  if (!project) return NextResponse.json({ message: 'No encontrado' }, { status: 404 });

  const isDraft = project.estado === 'en_progreso';
  const estadoLabel = isDraft ? 'En Progreso' : project.estado === 'terminado' ? 'Terminado' : 'Cerrado';

  const symptomsHtml = project.symptoms.map((s, i) => `
    <div class="item"><h4>Síntoma #${i + 1}</h4>
    <p><strong>Qué:</strong> ${esc(s.what)}</p><p><strong>Quién:</strong> ${esc(s.who)}</p>
    <p><strong>Cuándo:</strong> ${esc(s.whenField)}</p><p><strong>Dónde:</strong> ${esc(s.whereField)}</p>
    <p><strong>Cómo:</strong> ${esc(s.how)}</p><p><strong>Declaración:</strong> ${esc(s.declaration)}</p></div>
  `).join('') || '<p class="empty">No hay síntomas.</p>';

  const causasHtml = project.causas.map((c, i) => {
    const origins = [c.originMetodo && 'Método', c.originMaquina && 'Máquina', c.originGobernanza && 'Gobernanza'].filter(Boolean).join(', ');
    return `<div class="item"><h4>Causa #${i + 1}</h4>
    <p><strong>Por qué 1:</strong> ${esc(c.why1)}</p><p><strong>Por qué 2:</strong> ${esc(c.why2)}</p>
    <p><strong>Por qué 3:</strong> ${esc(c.why3)}</p>${c.why4 ? `<p><strong>Por qué 4:</strong> ${esc(c.why4)}</p>` : ''}${c.why5 ? `<p><strong>Por qué 5:</strong> ${esc(c.why5)}</p>` : ''}
    <p class="root"><strong>Causa raíz:</strong> ${esc(c.rootCause)}</p><p><strong>Origen:</strong> ${origins}</p></div>`;
  }).join('') || '<p class="empty">No hay causas.</p>';

  const kpisHtml = project.kpis.length > 0
    ? `<table><thead><tr><th>Nombre</th><th>Actual</th><th>Objetivo</th></tr></thead><tbody>${project.kpis.map(k => `<tr><td>${esc(k.nombre)}</td><td>${esc(k.valorActual)}</td><td>${esc(k.valorObjetivo)}</td></tr>`).join('')}</tbody></table>`
    : '<p class="empty">No hay KPIs.</p>';

  const attachmentsHtml = project.attachments.length > 0
    ? `<table><thead><tr><th>Título</th><th>Archivo</th><th>Tamaño</th><th>Fecha</th></tr></thead><tbody>${project.attachments.map(a => `<tr><td>${esc(a.title)}</td><td>${esc(a.originalName)}</td><td>${Math.round((a.fileSize || 0) / 1024)} KB</td><td>${fmtDate(a.uploadedAt)}</td></tr>`).join('')}</tbody></table>`
    : '<p class="empty">No hay adjuntos.</p>';

  let auditHtml = '';
  if (project.terminadoBy) auditHtml += `<tr><td><span class="badge-t">Terminado</span></td><td>${esc(project.terminadoBy.name)}</td><td>${fmtDateTime(project.terminadoAt)}</td></tr>`;
  if (project.cerradoBy) auditHtml += `<tr><td><span class="badge-c">Cerrado</span></td><td>${esc(project.cerradoBy.name)}</td><td>${fmtDateTime(project.cerradoAt)}</td></tr>`;

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    *{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:11px;color:#1f2937;line-height:1.5}
    .header{border-bottom:3px solid #004253;padding-bottom:15px;margin-bottom:20px}
    .header h1{font-size:20px;color:#004253}.header .sub{font-size:11px;color:#6b7280}
    .client{font-size:15px;color:#004253;font-weight:bold;line-height:2;margin-top:10px}.client .lbl{font-size:11px;color:#6b7280;font-weight:normal}
    .badge{display:inline-block;padding:2px 8px;border-radius:10px;color:#fff;font-size:9px;font-weight:bold}
    .badge-d{background:#f59e0b}.badge-t{background:#16a34a}.badge-c{background:#6b7280}
    .section{margin-bottom:18px;page-break-inside:avoid}.section h2{font-size:13px;color:#004253;border-bottom:1px solid #e5e7eb;padding-bottom:4px;margin-bottom:8px}
    .item{background:#f9fafb;border:1px solid #e5e7eb;border-radius:5px;padding:8px;margin-bottom:6px}.item h4{font-size:11px;color:#374151;margin-bottom:4px}
    .root{background:#f3e8ff;border:1px solid #d8b4fe;border-radius:4px;padding:5px;margin-top:4px}
    .empty{color:#9ca3af;font-style:italic}table{width:100%;border-collapse:collapse;font-size:10px}
    th{background:#f3f4f6;padding:5px 7px;text-align:left;border:1px solid #e5e7eb}td{padding:5px 7px;border:1px solid #e5e7eb}
    .text-block{white-space:pre-wrap;background:#f9fafb;border:1px solid #e5e7eb;border-radius:5px;padding:8px}
    .footer{margin-top:25px;padding-top:8px;border-top:1px solid #e5e7eb;font-size:8px;color:#9ca3af;text-align:center}
    ${isDraft ? '.watermark{position:absolute;top:40%;left:50%;transform:translate(-50%,-50%) rotate(-30deg);font-size:100px;color:rgba(245,158,11,0.1);font-weight:900;letter-spacing:12px;white-space:nowrap;pointer-events:none;z-index:0}' : ''}
  </style></head><body>
    ${isDraft ? '<div class="watermark">BORRADOR</div>' : ''}
    <div class="header"><h1>FRISOL — Reporte de Proyecto</h1><div class="sub">Framework 4D — Traspaso Comercial → Desarrollo</div>
    <div class="client"><span class="lbl">ID Interno:</span> PRJ-${String(project.projectNumber || 0).padStart(5, '0')}<br><span class="lbl">Proyecto:</span> ${esc(project.nombreProyecto || 'Sin nombre')}<br><span class="lbl">Cliente:</span> ${esc(project.nombreCliente || 'Sin cliente')}<br><span class="lbl">CRM:</span> ${esc(project.crmId || '—')}<br><span class="lbl">Tribu:</span> ${esc(project.tribe?.name || '—')}<br><span class="lbl">Fecha:</span> ${fmtDate(project.fechaInicio)}</div>
    <div style="margin-top:8px;font-size:10px;color:#6b7280"><strong>Estado:</strong> <span class="badge ${isDraft ? 'badge-d' : project.estado === 'terminado' ? 'badge-t' : 'badge-c'}">${estadoLabel}</span> &nbsp;<strong>Generado:</strong> ${fmtDate(new Date())}</div></div>

    <div class="section"><h2>1. Cliente</h2><p><strong>Interlocutores:</strong></p><div class="text-block">${esc(project.interlocutores || 'No especificado')}</div></div>
    <div class="section"><h2>2. Diagnóstico 5WTH</h2>${symptomsHtml}</div>
    <div class="section"><h2>3. Evidencia</h2><div class="text-block">${esc(project.evidencia || 'No hay datos.')}</div></div>
    <div class="section"><h2>4. Voz del Dolor</h2><div class="text-block">${esc(project.vozDolor || 'No hay datos.')}</div></div>
    <div class="section"><h2>5. Análisis de Causas</h2>${causasHtml}</div>
    <div class="section"><h2>6. Impacto y Business Case</h2><p><strong>Impacto:</strong></p><div class="text-block">${esc(project.impactoNegocio || 'No hay datos.')}</div><h4 style="margin-top:8px">KPIs</h4>${kpisHtml}</div>
    <div class="section"><h2>7. Archivos Adjuntos</h2>${attachmentsHtml}</div>
    ${auditHtml ? `<div class="section"><h2>Historial de cambios</h2><table><thead><tr><th>Estado</th><th>Usuario</th><th>Fecha</th></tr></thead><tbody>${auditHtml}</tbody></table></div>` : ''}
    <div class="footer">Frisol v2 — Generado automáticamente — ${new Date().toISOString()}</div>
  </body></html>`;

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({ format: 'A4', margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' }, printBackground: true });
    return new NextResponse(Buffer.from(pdf), {
      headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="frisol-${project.nombreProyecto || 'proyecto'}.pdf"` },
    });
  } finally {
    await browser.close();
  }
}
