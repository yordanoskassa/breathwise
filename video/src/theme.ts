import { loadFont } from '@remotion/google-fonts/Inter';

export const { fontFamily } = loadFont('normal', { weights: ['400', '500', '600', '700', '800', '900'], subsets: ['latin'] });

export const C = {
  bg: '#04060C',
  navy: '#0A1224',
  surface: 'rgba(22, 30, 50, 0.72)',
  border: 'rgba(255,255,255,0.10)',
  text: '#F3F6FB',
  dim: '#98A3BA',
  faint: '#5E6A84',
  teal: '#3CF0C8',
  sky: '#4DA8FF',
  violet: '#8C7DFF',
  amber: '#FFB547',
  coral: '#FF5C7A',
} as const;

export const FPS = 30;
export const W = 1920;
export const H = 1080;
