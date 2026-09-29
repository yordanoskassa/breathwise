import { AbsoluteFill, interpolate, Sequence, useCurrentFrame } from 'remotion';

import { Field } from '../components/Field';
import { Clip, Phone } from '../components/Phone';
import { Caption, Reveal, Steps, useIn } from '../components/Text';
import { CLIPS, localBeat } from '../timeline';
import { C, EASE, FPS, text } from '../theme';

const b = (k: number) => localBeat('demo', k);
const M = CLIPS.measure;

/**
 * Clip plan (cuts on beats):
 *  A  1×  home → measure → searching → lock-on lands on beat 8
 *  B  ~7× the 60-second count
 *  C  1×  final breaths; the result pops just before the section change
 */
const LOCK_BEAT = 8;
const aStart = M.lock - b(LOCK_BEAT) / FPS;
const aEnd = aStart + b(10) / FPS;
const cStart = M.resultIn - (b(20) - b(17)) / FPS + 0.6;
const bRate = (cStart - aEnd) / ((b(17) - b(10)) / FPS);

const SpeedTag: React.FC<{ len: number }> = ({ len }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, 6, len - 6, len], [0, 1, 1, 0], { extrapolateRight: 'clamp' });
  return (
    <div
      style={{
        position: 'absolute',
        top: 124,
        right: 20,
        opacity: o,
        fontFamily: text,
        fontSize: 21,
        fontWeight: 800,
        color: C.ink,
        background: C.yellow,
        padding: '6px 12px',
      }}>
      {Math.round(bRate)}× speed · 60-second count
    </div>
  );
};

export const Demo: React.FC = () => {
  const f = useCurrentFrame();
  const enter = useIn(0, 18);
  const zoom = interpolate(f, [b(6), b(7.6), b(10.5), b(11.5)], [1, 1.42, 1.42, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE,
  });

  return (
    <Field color={C.ink}>
      <AbsoluteFill style={{ justifyContent: 'center', paddingLeft: 230 }}>
        <div
          style={{
            transform: `translateY(${(1 - enter) * 120}px) scale(${zoom})`,
            transformOrigin: '50% 39%',
            opacity: enter,
            width: 'fit-content',
          }}>
          <Phone height={940} shadow="dark">
            <Sequence durationInFrames={b(10)}>
              <Clip file="measure.mp4" from={aStart} to={aEnd + 0.2} />
            </Sequence>
            <Sequence from={b(10)} durationInFrames={b(17) - b(10)}>
              <Clip file="measure.mp4" from={aEnd} to={cStart + 0.5} rate={bRate} />
              <SpeedTag len={b(17) - b(10)} />
            </Sequence>
            <Sequence from={b(17)}>
              <Clip file="measure.mp4" from={cStart} to={M.end} />
            </Sequence>
          </Phone>
        </div>
      </AbsoluteFill>
      <Caption at={10} color={C.grayOnInk} style={{ position: 'absolute', left: 230, bottom: 26, fontSize: 18 }}>
        Recorded in the iOS Simulator with a simulated baby. On a phone, it’s the live camera.
      </Caption>

      <AbsoluteFill style={{ left: 880, width: 900, paddingTop: 130 }}>
        <Reveal size={76} color={C.white} at={4} lines={['Point the camera', 'at a sleeping child.']} />
        <div style={{ height: 44 }} />
        <Steps
          onInk
          width={860}
          items={[
            { at: b(1.5), title: 'Finds the breathing by itself', sub: 'No setup, no touching, no wearable' },
            { at: b(LOCK_BEAT), title: 'Locks onto the chest', sub: 'Green tiles show where it sees breathing' },
            { at: b(11), title: 'Counts every breath as it happens', sub: 'A dot on the trace, a small vibration' },
            { at: b(14), title: 'Sixty seconds, the WHO method', sub: 'The clock pauses if the child moves' },
            { at: b(17), title: 'Nothing is recorded', sub: 'Video never leaves the phone' },
          ]}
        />
      </AbsoluteFill>
    </Field>
  );
};
