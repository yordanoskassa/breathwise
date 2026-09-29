/**
 * WHO IMCI fast-breathing cut-offs and general danger signs.
 * Source: WHO Integrated Management of Childhood Illness (IMCI) chart
 * booklet. Under 5s use the WHO pneumonia thresholds; older children and
 * adults get a general reference range instead (clearly labelled).
 */
import type { Tone } from '@/theme';

export type AgeBand = 'young-infant' | 'infant' | 'child' | 'school' | 'adult';

export type Threshold = {
  band: AgeBand;
  /** Rate at or above this is "fast breathing". */
  fastAt: number;
  /** Typical resting range for display. */
  normal: [number, number];
  /** True when the cut-off is the WHO IMCI pneumonia rule. */
  who: boolean;
};

export function ageInMonths(birthISO: string, at: Date = new Date()): number {
  const b = new Date(birthISO);
  let m = (at.getFullYear() - b.getFullYear()) * 12 + (at.getMonth() - b.getMonth());
  if (at.getDate() < b.getDate()) m -= 1;
  return Math.max(0, m);
}

export function thresholdFor(ageMonths: number): Threshold {
  if (ageMonths < 2) return { band: 'young-infant', fastAt: 60, normal: [30, 59], who: true };
  if (ageMonths < 12) return { band: 'infant', fastAt: 50, normal: [25, 49], who: true };
  if (ageMonths < 60) return { band: 'child', fastAt: 40, normal: [20, 39], who: true };
  if (ageMonths < 144) return { band: 'school', fastAt: 31, normal: [18, 30], who: false };
  return { band: 'adult', fastAt: 21, normal: [12, 20], who: false };
}

export const DANGER_SIGNS = [
  'indrawing',
  'drink',
  'vomits',
  'convulsions',
  'lethargic',
  'stridor',
  'blue',
] as const;
export type DangerSign = (typeof DANGER_SIGNS)[number];

export type Classification = {
  tone: Tone;
  /** i18n key for the headline, e.g. "class.fast". */
  key: 'class.danger' | 'class.fast' | 'class.normal';
  threshold: Threshold;
};

export function classify(rate: number, ageMonths: number, signs: DangerSign[] = []): Classification {
  const threshold = thresholdFor(ageMonths);
  if (signs.length > 0) return { tone: 'danger', key: 'class.danger', threshold };
  if (rate >= threshold.fastAt) return { tone: 'fast', key: 'class.fast', threshold };
  return { tone: 'normal', key: 'class.normal', threshold };
}

/** Age chips for quick checks without a saved profile (health-worker mode). */
export const QUICK_AGES: { key: string; months: number }[] = [
  { key: 'age.under2m', months: 1 },
  { key: 'age.2to11m', months: 6 },
  { key: 'age.1to4y', months: 30 },
  { key: 'age.5to11y', months: 96 },
  { key: 'age.12plus', months: 240 },
];

export function formatAge(months: number, t: (k: string, v?: Record<string, string | number>) => string): string {
  if (months < 1) return t('age.newborn');
  if (months < 24) return t('age.months', { n: months });
  return t('age.years', { n: Math.floor(months / 12) });
}
