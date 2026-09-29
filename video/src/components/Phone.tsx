import { OffthreadVideo, staticFile } from 'remotion';

import { FPS } from '../theme';

/** Screen aspect of the recorded iPhone 17 Pro footage (1206×2622). */
export const SCREEN_ASPECT = 1206 / 2622;

/** Titanium-edged phone frame; children fill the screen. */
export const Phone: React.FC<{ height: number; children: React.ReactNode; glow?: string }> = ({ height, children, glow }) => {
  const bezel = height * 0.018;
  const screenH = height - bezel * 2;
  const screenW = screenH * SCREEN_ASPECT;
  const w = screenW + bezel * 2;
  const radius = height * 0.085;
  return (
    <div
      style={{
        width: w,
        height,
        borderRadius: radius,
        padding: bezel,
        background: 'linear-gradient(145deg, #5a5f6b 0%, #1d2027 18%, #0b0c10 50%, #262a33 82%, #6b707c 100%)',
        boxShadow: `0 40px 120px rgba(0,0,0,0.65), 0 0 0 1.5px rgba(255,255,255,0.08)${glow ? `, 0 0 140px ${glow}33` : ''}`,
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
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(115deg, rgba(255,255,255,0.07) 0%, transparent 28%, transparent 70%, rgba(255,255,255,0.03) 100%)',
            pointerEvents: 'none',
          }}
        />
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
