import { AbsoluteFill } from 'remotion';

import { BreathDisc, Field } from '../components/Field';
import { P, Reveal } from '../components/Text';
import { localBeat, sceneStart } from '../timeline';
import { C } from '../theme';

export const Title: React.FC = () => (
  <Field color={C.green}>
    <AbsoluteFill style={{ padding: '0 160px', justifyContent: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 56 }}>
        <BreathDisc size={180} color={C.white} offset={sceneStart('title')} />
        <Reveal size={230} color={C.white} lines={['Breathwise']} at={2} />
      </div>
      <P at={localBeat('title', 1)} size={48} color={C.white} style={{ marginTop: 30, marginLeft: 236, fontWeight: 700 }}>
        Your phone camera counts the breaths.
      </P>
    </AbsoluteFill>
  </Field>
);
