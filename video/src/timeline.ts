/**
 * Timed to "A Kind of Hope" (Scott Buckley, CC BY 4.0): 54.98 BPM, one bar
 * = 4.364 s. Two excerpts of the track, both aligned to its downbeats:
 *   1) the quiet piano from 10.85 s, so the strings lift (24.0 s) lands on
 *      the title card;
 *   2) the climax, crossfaded in over one bar, so its final chord
 *      (320.66 s) lands on the closing logo and its decay carries the end.
 */
import { FPS } from './theme';

export const BPM = 54.98;
export const BEAT_SEC = 60 / BPM;

/** Absolute frame of video beat k (beat 0 = frame 0, a downbeat). */
export const beatFrame = (k: number) => Math.round(k * BEAT_SEC * FPS);

export const SCENES = {
  hook: [0, 12], //       0.0 – 13.1 s  quiet piano
  title: [12, 16], //    13.1 – 17.5 s  strings lift
  demo: [16, 36], //     17.5 – 39.3 s
  how: [36, 48], //      39.3 – 52.4 s
  result: [48, 56], //   52.4 – 61.1 s  climax fades in
  accuracy: [56, 62], // 61.1 – 67.7 s
  money: [62, 70], //    67.7 – 76.4 s
  global: [70, 73], //   76.4 – 79.7 s
  close: [73, 999], //   79.7 – 94.0 s  final chord on beat 80
} as const;

export type SceneName = keyof typeof SCENES;

export const TOTAL_FRAMES = Math.round(94 * FPS);
export const sceneStart = (s: SceneName) => beatFrame(SCENES[s][0]);
export const sceneEnd = (s: SceneName) => (s === 'close' ? TOTAL_FRAMES : beatFrame(SCENES[s][1]));
export const sceneLength = (s: SceneName) => sceneEnd(s) - sceneStart(s);
/** Local frame (within a scene) of the scene's k-th beat (fractions allowed). */
export const localBeat = (s: SceneName, k: number) => beatFrame(SCENES[s][0] + k) - sceneStart(s);

export const MUSIC = {
  file: 'audio/hope.mp3',
  /** track seconds = video seconds + offset */
  offset1: 10.845,
  offset2: 233.39,
  /** crossfade from excerpt 1 to 2 over beats 44 → 48 */
  xfadeFromBeat: 44,
  xfadeToBeat: 48,
  hitBeat: 80,
};

/** Moments in the recorded clips, in seconds of the source file. */
export const CLIPS = {
  measure: {
    screenIn: 7.1,
    lock: 15.3,
    countEnd: 75.9,
    resultIn: 76.1,
    tick: 79.6,
    end: 85.3,
  },
  walk: {
    paywall: 171.2,
    settings: 192.4,
  },
};
