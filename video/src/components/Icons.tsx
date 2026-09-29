/** Minimal line icons (SVG, so they render identically in headless Chrome). */
type P = { color?: string; size?: number };

const S: React.FC<P & { children: React.ReactNode }> = ({ color = 'currentColor', size = 26, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

export const IconScan: React.FC<P> = (p) => (
  <S {...p}>
    <path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3" />
    <circle cx="12" cy="12" r="3.2" />
  </S>
);
export const IconGrid: React.FC<P> = (p) => (
  <S {...p}>
    <rect x="4" y="4" width="6" height="6" rx="1.5" />
    <rect x="14" y="4" width="6" height="6" rx="1.5" />
    <rect x="4" y="14" width="6" height="6" rx="1.5" />
    <rect x="14" y="14" width="6" height="6" rx="1.5" />
  </S>
);
export const IconWave: React.FC<P> = (p) => (
  <S {...p}>
    <path d="M2 12c2.5 0 2.5-6 5-6s2.5 12 5 12 2.5-12 5-12 2.5 6 5 6" />
  </S>
);
export const IconTimer: React.FC<P> = (p) => (
  <S {...p}>
    <circle cx="12" cy="13" r="8" />
    <path d="M12 9v4l2.5 2.5M9 2h6" />
  </S>
);
export const IconLock: React.FC<P> = (p) => (
  <S {...p}>
    <rect x="5" y="11" width="14" height="10" rx="2.5" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </S>
);
export const IconHeart: React.FC<P> = (p) => (
  <S {...p}>
    <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
  </S>
);
export const IconCheck: React.FC<P> = (p) => (
  <S {...p}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </S>
);
export const IconAlert: React.FC<P> = (p) => (
  <S {...p}>
    <path d="M12 3l9.5 17h-19L12 3z" />
    <path d="M12 10v4M12 17.2v.3" />
  </S>
);
export const IconGlobe: React.FC<P> = (p) => (
  <S {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.8 3 2.8 15 0 18M12 3c-2.8 3-2.8 15 0 18" />
  </S>
);
export const IconDoc: React.FC<P> = (p) => (
  <S {...p}>
    <path d="M7 3h7l5 5v13H7z" />
    <path d="M14 3v5h5M10 13h6M10 17h6" />
  </S>
);
export const IconMoon: React.FC<P> = (p) => (
  <S {...p}>
    <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
  </S>
);
export const IconUsers: React.FC<P> = (p) => (
  <S {...p}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20a6.5 6.5 0 0 0-4-6" />
  </S>
);
