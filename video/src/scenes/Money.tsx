import { AbsoluteFill, Img, staticFile } from 'remotion';

import { Field } from '../components/Field';
import { Clip, Phone } from '../components/Phone';
import { P, Reveal, useIn } from '../components/Text';
import { CLIPS, localBeat } from '../timeline';
import { C, display, text } from '../theme';

const b = (k: number) => localBeat('money', k);

const Column: React.FC<{ at: number; who: string; price: string; lines: string[]; accent: string }> = ({ at, who, price, lines, accent }) => {
  const p = useIn(at, 14);
  return (
    <div style={{ width: 440, opacity: p, transform: `translateY(${(1 - p) * 16}px)` }}>
      <div style={{ fontFamily: text, fontWeight: 700, fontSize: 30, color: C.gray }}>{who}</div>
      <div style={{ fontFamily: display, fontSize: 46, color: accent, marginTop: 6, lineHeight: 1.05, whiteSpace: 'nowrap' }}>{price}</div>
      <div style={{ marginTop: 16 }}>
        {lines.map((l) => (
          <div key={l} style={{ fontFamily: text, fontSize: 27, color: C.ink, padding: '10px 0', borderTop: `1.5px solid ${C.lineOnWhite}` }}>
            {l}
          </div>
        ))}
      </div>
    </div>
  );
};

export const Money: React.FC = () => {
  const enter = useIn(0, 16);
  const logo = useIn(b(5.5), 14);
  return (
    <Field color={C.white}>
      <AbsoluteFill style={{ padding: '110px 140px' }}>
        <Reveal size={92} gap={5} lines={['Counting is free.', <span key="f" style={{ color: C.green }}>Forever.</span>]} />
        <div style={{ display: 'flex', gap: 60, marginTop: 40 }}>
          <Column at={b(1.5)} who="Health workers" price="Free, always" accent={C.green} lines={['Unlimited quick checks', 'Paid for by Family plans']} />
          <div style={{ width: 1.5, background: C.lineOnWhite }} />
          <Column
            at={b(2.5)}
            who="Families"
            price="7-day free trial"
            accent={C.ink}
            lines={['Unlimited children', 'Trends and a PDF for the doctor', 'Sick-night recheck reminders']}
          />
        </div>
        <P at={b(4)} size={30} color={C.ink} style={{ marginTop: 28, width: 900, fontWeight: 700 }}>
          Every Family plan keeps Breathwise free for community health workers.
        </P>
        <div style={{ display: 'flex', alignItems: 'center', gap: 26, marginTop: 26, opacity: logo, transform: `translateY(${(1 - logo) * 12}px)` }}>
          <div style={{ fontFamily: text, fontSize: 26, color: C.gray }}>Subscriptions by</div>
          <Img src={staticFile('brand/revenuecat-logo-dark.svg')} style={{ height: 52 }} />
          <div style={{ fontFamily: text, fontSize: 22, color: C.gray, marginLeft: 8 }}>entitlements · paywall · restore · Customer Center</div>
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: 'flex-end', justifyContent: 'center', paddingRight: 170 }}>
        <div style={{ transform: `translateY(${(1 - enter) * 120}px)`, opacity: enter }}>
          <Phone height={900}>
            <Clip file="walkthrough.mp4" from={CLIPS.walk.paywall} rate={0.8} />
            {/* Hide the dev-build notice at the bottom of the sheet. */}
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '31%', background: 'linear-gradient(to bottom, rgba(8,11,22,0) 0%, #080b16 24%)' }} />
          </Phone>
        </div>
      </AbsoluteFill>
    </Field>
  );
};
