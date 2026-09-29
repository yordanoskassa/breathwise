import { OffthreadVideo, staticFile } from 'remotion';

import { FPS } from '../theme';

/** Screen aspect of the recorded iPhone 17 Pro footage (1206×2622). */
export const SCREEN_ASPECT = 1206 / 2622;

/** Plain dark phone body with a realistic contact shadow; no glow. */
export const Phone: React.FC<{ height: number; children: React.ReactNode; shadow?: 'light' | 'dark' }> = ({
  height,
  children,
  shadow = 'light',
}) => {
  const bezel = height * 0.017;
  const screenH = height - bezel * 2;
  const screenW = screenH * SCREEN_ASPECT;
  const w = screenW + bezel * 2;
  const radius = height * 0.08;
  return (
    <div
      style={{
        width: w,
        height,
        borderRadius: radius,
        padding: bezel,
        background: '#17181B',
        boxShadow:
          shadow === 'light'
            ? '0 2px 0 1px #2B2D31 inset, 0 30px 60px rgba(18,20,22,0.28), 0 6px 14px rgba(18,20,22,0.18)'
            : '0 2px 0 1px #2B2D31 inset, 0 0 0 1.5px rgba(255,255,255,0.10)',
        position: 'relative',
      }}>
      <div
        style={{
          width: screenW,
          height: screenH,
          borderRadius: radius - bezel,
          overflow: 'hidden',
          background: '#000',
          position: 'relative',
        }}>
        {children}
      </div>
    </div>
  );
};

/** A slice of a recorded clip. `from`/`to` are seconds in the source file. */
export const Clip: React.FC<{ file: string; from: number; to?: number; rate?: number; zoom?: number }> = ({
  file,
  from,
  to,
  rate = 1,
  zoom = 1,
}) => (
  <OffthreadVideo
    src={staticFile(`clips/${file}`)}
    trimBefore={Math.round(from * FPS)}
    trimAfter={to !== undefined ? Math.round(to * FPS) : undefined}
    playbackRate={rate}
    muted
    style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${zoom})`, transformOrigin: '50% 0%' }}
  />
);
