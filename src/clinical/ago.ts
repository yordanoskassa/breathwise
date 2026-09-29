export function ago(ts: number, t: (k: string, v?: Record<string, string | number>) => string): string {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return t('ago.now');
  if (m < 60) return t('ago.m', { n: m });
  const h = Math.floor(m / 60);
  if (h < 24) return t('ago.h', { n: h });
  return t('ago.d', { n: Math.floor(h / 24) });
}
