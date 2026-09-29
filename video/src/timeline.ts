/**
 * Everything is timed to the music: 150.01 BPM, first beat at 0.369 s
 * (measured from the track itself, see scripts/beats notes in README).
 * One beat ≈ 12 frames at 30 fps; one 8-beat phrase ≈ 96 frames.
 */
import { FPS } from './theme';

export const BPM = 150.01;
export const FIRST_BEAT = 0.369;
export const BEAT_SEC = 60 / BPM;

/** Absolute frame of beat k. */
export const beatFrame = (k: number) => Math.round((FIRST_BEAT + BEAT_SEC * k) * FPS);

/** Scenes as [startBeat, endBeat]. Boundaries sit on the track's sections. */
export const SCENES = {
  hook: [-1, 32], // intro (quiet)            0.0 – 13.2 s
  title: [32, 40], // drop 1 hits             13.2 – 16.4 s
  demo: [40, 96], // drop 1                   16.4 – 38.8 s
  how: [96, 128], // breakdown                38.8 – 51.6 s
  result: [128, 152], // drop 2               51.6 – 61.2 s
  accuracy: [152, 168], //                    61.2 – 67.6 s
  money: [168, 192], //                       67.6 – 77.2 s
  global: [192, 200], // breakdown 2          77.2 – 80.4 s
  close: [200, 234], // build → final hit     80.4 – 94.0 s
} as const;

export type SceneName = keyof typeof SCENES;

export const sceneStart = (s: SceneName) => (SCENES[s][0] < 0 ? 0 : beatFrame(SCENES[s][0]));
export const sceneEnd = (s: SceneName) => (s === 'close' ? TOTAL_FRAMES : beatFrame(SCENES[s][1]));
export const sceneLength = (s: SceneName) => sceneEnd(s) - sceneStart(s);

/** Local frame (within a scene) of the scene's k-th beat. */
export const localBeat = (s: SceneName, k: number) => beatFrame(Math.max(0, SCENES[s][0]) + k) - sceneStart(s);

export const TOTAL_FRAMES = Math.round(94 * FPS);

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
