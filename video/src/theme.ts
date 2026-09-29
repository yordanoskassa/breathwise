import { loadFont as loadDisplay } from '@remotion/google-fonts/ArchivoBlack';
import { loadFont as loadText } from '@remotion/google-fonts/AtkinsonHyperlegibleNext';
import { Easing } from 'remotion';

/**
 * Flat, poster-like system: solid colour fields, no gradients or glows.
 * Archivo Black for headlines; Atkinson Hyperlegible Next (designed for
 * low-vision readers) for everything else — it suits a health tool.
 */
export const display = loadDisplay().fontFamily;
export const text = loadText('normal', { weights: ['400', '500', '700', '800'], subsets: ['latin'] }).fontFamily;
export const fontFamily = text;

export const C = {
  ink: '#121416',
  inkSoft: '#2A2D31',
  white: '#FFFFFF',
  paper: '#F2F2EF',
  green: '#0A8F6D',
  greenDeep: '#066B51',
  yellow: '#FFC21A',
  red: '#E3342A',
  gray: '#6B7075',
  grayOnInk: '#9CA2A8',
  lineOnWhite: 'rgba(18,20,22,0.16)',
  lineOnInk: 'rgba(255,255,255,0.18)',
} as const;

/** Crisp ease-out; no bounce anywhere. */
export const EASE = Easing.bezier(0.16, 0.84, 0.3, 1);

export const FPS = 30;
export const W = 1920;
export const H = 1080;
