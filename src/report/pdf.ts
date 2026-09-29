/** One-page PDF for the child's doctor, generated on the device. */
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { classify, formatAge } from '@/clinical/who';
import { t } from '@/i18n';
import type { Child, Measurement } from '@/store/app';

function waveSvg(m: Measurement, w = 520, h = 110): string {
  if (m.wave.length < 2) return '';
  const abs = m.wave.map(Math.abs).sort((a, b) => a - b);
  const scale = Math.max(abs[Math.floor(abs.length * 0.95)] ?? 1, 0.3);
  const pts = m.wave.map((v, i) => {
    const x = (i / (m.wave.length - 1)) * w;
    const y = h / 2 - Math.max(-1.15, Math.min(1.15, v / scale)) * (h / 2 - 8);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const dots = m.breathTimes
    .map((bt) => {
      const i = Math.round(bt * m.waveRate);
      const p = pts[i];
      return p ? `<circle cx="${p.split(',')[0]}" cy="${p.split(',')[1]}" r="3" fill="#0B7A63"/>` : '';
    })
    .join('');
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><polyline fill="none" stroke="#12B795" stroke-width="2" points="${pts.join(' ')}"/>${dots}</svg>`;
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
}

export function reportHtml(m: Measurement, child: Child | null): string {
  const cls = classify(m.rate, m.ageMonths, m.signs);
  const tone = { normal: '#0B7A63', fast: '#B86E00', danger: '#C4203F', unknown: '#555' }[cls.tone];
  const date = new Date(m.at).toLocaleString();
  const signs = m.signs.length
    ? `<ul>${m.signs.map((s) => `<li>${esc(t('sign.' + s))}</li>`).join('')}</ul>`
    : '<p>None reported.</p>';
  return `<!doctype html><html><head><meta charset="utf-8"/>
<style>
 body{font-family:-apple-system,Helvetica,Arial,sans-serif;color:#111;padding:36px;}
 h1{font-size:22px;margin:0}.muted{color:#666;font-size:12px}
 .rate{font-size:64px;font-weight:800;letter-spacing:-2px;margin:18px 0 0}
 .badge{display:inline-block;padding:6px 12px;border-radius:999px;color:#fff;background:${tone};font-weight:700}
 table{border-collapse:collapse;margin-top:14px;font-size:13px}td{padding:4px 14px 4px 0}
 .box{border:1px solid #ddd;border-radius:12px;padding:14px;margin-top:18px}
</style></head><body>
<h1>Breathwise breathing report</h1>
<div class="muted">${esc(date)}</div>
<div class="rate">${m.rate} <span style="font-size:18px;font-weight:600">breaths/min</span></div>
<span class="badge">${esc(t(cls.key))}</span>
<table>
<tr><td class="muted">Name</td><td>${esc(child?.name ?? '—')}</td></tr>
<tr><td class="muted">Age</td><td>${esc(formatAge(m.ageMonths, t))}</td></tr>
<tr><td class="muted">${cls.threshold.who ? 'WHO IMCI fast-breathing cut-off' : 'Reference upper limit'}</td><td>${cls.threshold.fastAt}/min</td></tr>
<tr><td class="muted">Method</td><td>${m.method === 'camera' ? 'Contactless camera count' : 'Manual tap count'} · ${m.countedBreaths} breaths in ${Math.round(m.countedSeconds)} s</td></tr>
${m.confidenceLabel ? `<tr><td class="muted">Signal confidence</td><td>${m.confidenceLabel}</td></tr>` : ''}
${m.verifyTaps ? `<tr><td class="muted">Caregiver tap check</td><td>${m.verifyTaps} taps</td></tr>` : ''}
</table>
${m.wave.length ? `<div class="box"><div class="muted">Breathing signal (dots = counted breaths)</div>${waveSvg(m)}</div>` : ''}
<div class="box"><div class="muted">Danger signs checked by caregiver</div>${signs}</div>
<p class="muted" style="margin-top:24px">${esc(t('r.disclaimer'))}</p>
</body></html>`;
}

export async function shareReport(m: Measurement, child: Child | null): Promise<void> {
  const { uri } = await Print.printToFileAsync({ html: reportHtml(m, child) });
  await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
}
