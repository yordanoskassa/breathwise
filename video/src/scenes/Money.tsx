import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from 'remotion';

import { Background } from '../components/Background';
import { IconDoc, IconHeart, IconMoon, IconUsers } from '../components/Icons';
import { Clip, Phone } from '../components/Phone';
import { FadeIn, Kinetic, Label } from '../components/Text';
import { CLIPS, localBeat } from '../timeline';
import { C, fontFamily } from '../theme';

const b = (k: number) => localBeat('money', k);

const Card: React.FC<{ at: number; color: string; title: string; price: string; items: [React.ReactNode, string][] }> = ({
  at,
  color,
  title,
  price,
  items,
}) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - at, fps, config: { damping: 15, stiffness: 120 } });
  return (
    <div
      style={{
        fontFamily,
        width: 400,
        padding: '28px 30px',
        borderRadius: 26,
        background: 'rgba(16,24,41,0.82)',
        border: `1.5px solid ${color}66`,
        boxShadow: `0 0 70px ${color}22`,
        opacity: s,
        transform: `translateY(${(1 - s) * 40}px)`,
      }}>
      <div style={{ fontSize: 30, fontWeight: 800, color: C.text }}>{title}</div>
      <div style={{ fontSize: 44, fontWeight: 900, color, marginTop: 6, letterSpacing: -1 }}>{price}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 18 }}>
        {items.map(([icon, text]) => (
          <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 22, color: C.dim, fontWeight: 600 }}>
            {icon}
            {text}
          </div>
        ))}
      </div>
    </div>
  );
};

export const Money: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: f, fps, config: { damping: 18, stiffness: 90 } });
  return (
    <AbsoluteFill>
      <Background tint={C.violet} />
      <AbsoluteFill style={{ padding: '110px 130px', gap: 20 }}>
        <Label n="05" text="Business model" color={C.violet} />
        <Kinetic text="Counting is free. Forever." size={78} stagger={3} highlight={{ Forever: C.teal }} />
        <div style={{ display: 'flex', gap: 28, marginTop: 26 }}>
          <Card
            at={b(8)}
            color={C.teal}
            title="Health workers"
            price="Free, always"
            items={[
              [<IconUsers key="u" color={C.teal} size={24} />, 'Unlimited quick checks'],
              [<IconHeart key="h" color={C.teal} size={24} />, 'Funded by Family plans'],
            ]}
          />
          <Card
            at={b(10)}
            color={C.violet}
            title="Breathwise Family"
            price="7-day free trial"
            items={[
              [<IconUsers key="u" color={C.violet} size={24} />, 'Unlimited children'],
              [<IconDoc key="d" color={C.violet} size={24} />, 'Trends + PDF for the doctor'],
              [<IconMoon key="m" color={C.violet} size={24} />, 'Sick-night recheck reminders'],
            ]}
          />
        </div>
        <FadeIn at={b(16)}>
          <div style={{ fontFamily, fontSize: 28, fontWeight: 700, color: C.text, marginTop: 26, width: 860 }}>
            Every Family plan keeps Breathwise free for community health workers.
          </div>
        </FadeIn>
        <FadeIn at={b(20)}>
          <div style={{ fontFamily, fontSize: 22, color: C.dim, marginTop: 10 }}>
            RevenueCat: entitlements · custom paywall from Offerings · restore · Customer Center · Test Store
          </div>
        </FadeIn>
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: 'flex-end', justifyContent: 'center', paddingRight: 170 }}>
        <div style={{ transform: `translateX(${(1 - enter) * 400}px) rotate(${(1 - enter) * 6}deg)`, opacity: enter }}>
          <Phone height={900} glow={C.violet}>
            <Clip file="walkthrough.mp4" from={CLIPS.walk.paywall} rate={0.8} />
            {/* Fade out the bottom of the sheet (a dev-build notice lives there). */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                height: '31%',
                background: 'linear-gradient(to bottom, rgba(8,11,22,0) 0%, #080b16 24%, #080b16 100%)',
              }}
            />
          </Phone>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
