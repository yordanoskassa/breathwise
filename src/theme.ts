/**
 * Night-first palette: measurements happen next to a sleeping child, so the
 * UI is dark by design — it won't wake anyone or wreck night vision.
 */
export const C = {
  bg: '#04060C',
  bgTop: '#0A1224',
  surface: 'rgba(22, 30, 50, 0.72)',
  surfaceSolid: '#101829',
  surfaceHi: '#18223A',
  border: 'rgba(255,255,255,0.08)',
  borderHi: 'rgba(255,255,255,0.16)',
  text: '#F3F6FB',
  dim: '#98A3BA',
  faint: '#5E6A84',
  teal: '#3CF0C8',
  sky: '#4DA8FF',
  violet: '#8C7DFF',
  amber: '#FFB547',
  coral: '#FF5C7A',
  white: '#FFFFFF',
} as const;

export const GRADIENT = {
  breath: [C.teal, C.sky] as const,
  aurora: ['#0B1A33', '#04060C'] as const,
  danger: ['#FF5C7A', '#FF8A5C'] as const,
  warn: ['#FFB547', '#FFD36E'] as const,
  calm: ['#3CF0C8', '#4DA8FF'] as const,
};

export const R = { sm: 12, md: 18, lg: 26, xl: 34, pill: 999 } as const;
export const S = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export type Tone = 'normal' | 'fast' | 'danger' | 'unknown';

export function toneColor(tone: Tone): string {
  switch (tone) {
    case 'danger':
      return C.coral;
    case 'fast':
      return C.amber;
    case 'normal':
      return C.teal;
    default:
      return C.dim;
  }
}
