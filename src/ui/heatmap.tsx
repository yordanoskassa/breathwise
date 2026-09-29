/**
 * Overlay drawn on the camera preview: every grid cell that is breathing
 * glows, and once the engine locks on, corner brackets snap around the
 * breathing region. This is the "you can see it think" moment.
 */
import { Blur, Canvas, Group, Path, RoundedRect, Skia } from '@shopify/react-native-skia';
import { useEffect, useMemo } from 'react';
import { Easing, useDerivedValue, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { GRID_COLS, GRID_ROWS } from '@/dsp/grid';
import { C } from '@/theme';

type Box = { x: number; y: number; w: number; h: number };

const HOT = 0.55;

function isHot(heat: ArrayLike<number>, gx: number, gy: number): boolean {
  if (gx < 0 || gy < 0 || gx >= GRID_COLS || gy >= GRID_ROWS) return false;
  return heat[gy * GRID_COLS + gx] >= HOT;
}

/**
 * Box around the breathing region: hot cells that have hot neighbours (so a
 * lone flickering tile can't stretch it), trimmed to the 10th–90th
 * percentile of their positions.
 */
function hotBox(heat: ArrayLike<number>, cw: number, ch: number, width: number, height: number): Box | null {
  const xs: number[] = [];
  const ys: number[] = [];
  for (let gy = 0; gy < GRID_ROWS; gy++) {
    for (let gx = 0; gx < GRID_COLS; gx++) {
      if (!isHot(heat, gx, gy)) continue;
      let neighbours = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && isHot(heat, gx + dx, gy + dy)) neighbours++;
      if (neighbours < 2) continue;
      xs.push(gx);
      ys.push(gy);
    }
  }
  if (xs.length < 2) return null;
  xs.sort((a, b) => a - b);
  ys.sort((a, b) => a - b);
  const q = (arr: number[], p: number) => arr[Math.min(arr.length - 1, Math.floor(p * arr.length))];
  const pad = 6;
  const x0 = Math.max(4, q(xs, 0.08) * cw - pad);
  const y0 = Math.max(4, q(ys, 0.08) * ch - pad);
  const x1 = Math.min(width - 4, (q(xs, 0.92) + 1) * cw + pad);
  const y1 = Math.min(height - 4, (q(ys, 0.92) + 1) * ch + pad);
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

export function HeatOverlay({
  heat,
  width,
  height,
  locked,
  pulse,
}: {
  heat: ArrayLike<number>;
  width: number;
  height: number;
  locked: boolean;
  pulse: number;
}) {
  const cw = width / GRID_COLS;
  const ch = height / GRID_ROWS;
  const box = useMemo(() => (locked ? hotBox(heat, cw, ch, width, height) : null), [heat, cw, ch, width, height, locked]);

  const bx = useSharedValue(width / 2);
  const by = useSharedValue(height / 2);
  const bw = useSharedValue(0);
  const bh = useSharedValue(0);
  const glow = useSharedValue(0);

  useEffect(() => {
    if (!box) {
      bw.value = withTiming(0, { duration: 250 });
      bh.value = withTiming(0, { duration: 250 });
      return;
    }
    const spring = { damping: 16, stiffness: 140 };
    bx.value = withSpring(box.x, spring);
    by.value = withSpring(box.y, spring);
    bw.value = withSpring(box.w, spring);
    bh.value = withSpring(box.h, spring);
  }, [box, bx, by, bw, bh]);

  useEffect(() => {
    if (!pulse) return;
    glow.value = 1;
    glow.value = withTiming(0, { duration: 900, easing: Easing.out(Easing.quad) });
  }, [pulse, glow]);

  const brackets = useDerivedValue(() => {
    const p = Skia.Path.Make();
    const w = bw.value;
    const h = bh.value;
    if (w < 4 || h < 4) return p;
    const x = bx.value;
    const y = by.value;
    const L = Math.min(22, w / 3, h / 3);
    p.moveTo(x, y + L).lineTo(x, y).lineTo(x + L, y);
    p.moveTo(x + w - L, y).lineTo(x + w, y).lineTo(x + w, y + L);
    p.moveTo(x + w, y + h - L).lineTo(x + w, y + h).lineTo(x + w - L, y + h);
    p.moveTo(x + L, y + h).lineTo(x, y + h).lineTo(x, y + h - L);
    return p;
  });
  const bracketWidth = useDerivedValue(() => 3 + 2 * glow.value);
  const cellBoost = useDerivedValue(() => 0.55 + 0.45 * glow.value);

  const cells = [];
  for (let i = 0; i < heat.length; i++) {
    const hv = heat[i];
    if (hv < 0.08) continue;
    const gx = i % GRID_COLS;
    const gy = Math.floor(i / GRID_COLS);
    cells.push(
      <RoundedRect
        key={i}
        x={gx * cw + 1.5}
        y={gy * ch + 1.5}
        width={cw - 3}
        height={ch - 3}
        r={5}
        color={hv > 0.5 ? C.teal : C.sky}
        opacity={Math.min(0.75, hv * hv * 0.9)}
      />,
    );
  }

  return (
    <Canvas style={{ position: 'absolute', left: 0, top: 0, width, height }} pointerEvents="none">
      <Group opacity={cellBoost}>
        <Group>
          {cells}
          <Blur blur={6} />
        </Group>
        <Group opacity={0.6}>{cells}</Group>
      </Group>
      <Path path={brackets} style="stroke" strokeWidth={bracketWidth} strokeCap="round" strokeJoin="round" color={C.white} />
    </Canvas>
  );
}
