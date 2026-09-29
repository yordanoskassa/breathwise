import { AbsoluteFill, Audio, interpolate, Sequence, staticFile } from 'remotion';

import { SceneIn } from './components/Beat';
import { Accuracy } from './scenes/Accuracy';
import { Close } from './scenes/Close';
import { Demo } from './scenes/Demo';
import { Global } from './scenes/Global';
import { Hook } from './scenes/Hook';
import { How } from './scenes/How';
import { Money } from './scenes/Money';
import { Result } from './scenes/Result';
import { Title } from './scenes/Title';
import { type SceneName, sceneLength, sceneStart, TOTAL_FRAMES } from './timeline';
import { C } from './theme';

const ORDER: { name: SceneName; Comp: React.FC; flash: number; color?: string; pulse?: number }[] = [
  { name: 'hook', Comp: Hook, flash: 0 },
  { name: 'title', Comp: Title, flash: 0.9, color: C.teal },
  { name: 'demo', Comp: Demo, flash: 0.35 },
  { name: 'how', Comp: How, flash: 0.2 },
  { name: 'result', Comp: Result, flash: 0.7, color: C.amber, pulse: 4 },
  { name: 'accuracy', Comp: Accuracy, flash: 0.35, pulse: 4 },
  { name: 'money', Comp: Money, flash: 0.35, color: C.violet, pulse: 4 },
  { name: 'global', Comp: Global, flash: 0.25 },
  { name: 'close', Comp: Close, flash: 0.15 },
];

export const Main: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.bg }}>
    {ORDER.map(({ name, Comp, flash, color, pulse }) => (
      <Sequence key={name} from={sceneStart(name)} durationInFrames={sceneLength(name)} name={name}>
        <SceneIn offset={sceneStart(name)} flash={flash} color={color} pulseEvery={pulse ?? 0}>
          <Comp />
        </SceneIn>
      </Sequence>
    ))}
    <Audio
      src={staticFile('audio/track.mp3')}
      volume={(f) => interpolate(f, [0, 8, TOTAL_FRAMES - 30, TOTAL_FRAMES], [0, 1, 1, 0], { extrapolateRight: 'clamp' })}
    />
  </AbsoluteFill>
);
