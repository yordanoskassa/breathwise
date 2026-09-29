/**
 * Turns a camera luma (Y) plane into a coarse grid of mean-brightness cells.
 *
 * Breathing moves the chest, belly and clothing folds by a few pixels. Each
 * cell that contains an edge or texture sees its mean brightness rise and fall
 * with every breath, so a 12×16 grid of means is enough signal — and it runs
 * on the camera thread (a worklet) without ever storing or sending video.
 */

export const GRID_COLS = 12;
export const GRID_ROWS = 16;
export const GRID_CELLS = GRID_COLS * GRID_ROWS;

/**
 * Mean brightness of each grid cell, sampling every `stride`-th pixel.
 * Pure function: callable from a VisionCamera worklet and from Node tests.
 */
export function computeGrid(
  luma: Uint8Array,
  width: number,
  height: number,
  bytesPerRow: number,
  stride: number,
  out: number[],
): void {
  'worklet';
  const cellW = width / GRID_COLS;
  const cellH = height / GRID_ROWS;
  for (let gy = 0; gy < GRID_ROWS; gy++) {
    const y0 = Math.floor(gy * cellH);
    const y1 = Math.floor((gy + 1) * cellH);
    for (let gx = 0; gx < GRID_COLS; gx++) {
      const x0 = Math.floor(gx * cellW);
      const x1 = Math.floor((gx + 1) * cellW);
      let sum = 0;
      let count = 0;
      for (let y = y0; y < y1; y += stride) {
        const row = y * bytesPerRow;
        for (let x = x0; x < x1; x += stride) {
          sum += luma[row + x];
          count++;
        }
      }
      out[gy * GRID_COLS + gx] = count > 0 ? sum / count : 0;
    }
  }
}
