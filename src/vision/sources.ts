/**
 * Frame sources that feed brightness grids to the engine:
 *  - the real camera (VisionCamera frame output, runs on the camera thread)
 *  - a simulated patient for the iOS Simulator, which has no camera
 */
import { AlphaType, ColorType, Skia, type SkImage } from '@shopify/react-native-skia';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useFrameOutput } from 'react-native-vision-camera';
import { scheduleOnRN } from 'react-native-worklets';

import { computeGrid, GRID_CELLS } from '@/dsp/grid';
import { SyntheticScene } from '@/dsp/synthetic';

export type GridHandler = (tSeconds: number, grid: number[]) => void;

/**
 * Frame timestamps differ by platform (seconds, ms, µs or ns). Work out the
 * unit from the first frame interval, then report seconds.
 */
export function makeClock() {
  let first: number | null = null;
  let scale = 0;
  return (raw: number): number | null => {
    if (first === null) {
      first = raw;
      return null;
    }
    if (scale === 0) {
      const d = raw - first;
      if (d <= 0) return null;
      scale = d > 1e5 ? 1e-9 : d > 100 ? 1e-6 : d > 0.5 ? 1e-3 : 1;
    }
    return (raw - first) * scale;
  };
}

export function useCameraGridOutput(onGrid: GridHandler) {
  const handlerRef = useRef(onGrid);
  handlerRef.current = onGrid;
  const clockRef = useRef(makeClock());

  const receive = useCallback((timestamp: number, grid: number[]) => {
    const t = clockRef.current(timestamp);
    if (t !== null) handlerRef.current(t, grid);
  }, []);

  return useFrameOutput({
    pixelFormat: 'yuv',
    targetResolution: { width: 480, height: 640 },
    enablePhysicalBufferRotation: true,
    onFrame(frame) {
      'worklet';
      try {
        const planes = frame.isPlanar ? frame.getPlanes() : [];
        const grid: number[] = new Array(GRID_CELLS).fill(0);
        if (planes.length > 0) {
          const y = planes[0];
          computeGrid(new Uint8Array(y.getPixelBuffer()), y.width, y.height, y.bytesPerRow, 3, grid);
        } else if (frame.hasPixelBuffer) {
          computeGrid(new Uint8Array(frame.getPixelBuffer()), frame.width, frame.height, frame.bytesPerRow, 3, grid);
        }
        scheduleOnRN(receive, frame.timestamp, grid);
      } finally {
        frame.dispose();
      }
    },
  });
}

const SIM_W = 72;
const SIM_H = 96;

/** Synthetic sleeping child (for the Simulator): grids + a preview image. */
export function useSimulatedPatient(active: boolean, rateBpm: number, onGrid: GridHandler) {
  const [image, setImage] = useState<SkImage | null>(null);
  const handlerRef = useRef(onGrid);
  handlerRef.current = onGrid;

  useEffect(() => {
    if (!active) return;
    const scene = new SyntheticScene({ width: SIM_W, height: SIM_H, rateBpm, amplitudePx: 1.4, noise: 1.5, seed: 3 });
    const frame = new Uint8Array(SIM_W * SIM_H);
    const grid: number[] = new Array(GRID_CELLS).fill(0);
    const start = Date.now();
    let n = 0;
    const id = setInterval(() => {
      const t = (Date.now() - start) / 1000;
      scene.render(t, frame);
      computeGrid(frame, SIM_W, SIM_H, SIM_W, 1, grid);
      handlerRef.current(t, grid.slice());
      if (n++ % 2 === 0) {
        const data = Skia.Data.fromBytes(frame);
        setImage(
          Skia.Image.MakeImage(
            { width: SIM_W, height: SIM_H, alphaType: AlphaType.Opaque, colorType: ColorType.Gray_8 },
            data,
            SIM_W,
          ),
        );
      }
    }, 1000 / 15);
    return () => clearInterval(id);
  }, [active, rateBpm]);

  return image;
}
