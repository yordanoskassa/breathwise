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
import { beatFrame, MUSIC, type SceneName, sceneLength, sceneStart, TOTAL_FRAMES } from './timeline';
import { C, FPS } from './theme';

const ORDER: { name: SceneName; Comp: React.FC }[] = [
  { name: 'hook', Comp: Hook },
  { name: 'title', Comp: Title },
  { name: 'demo', Comp: Demo },
  { name: 'how', Comp: How },
  { name: 'result', Comp: Result },
  { name: 'accuracy', Comp: Accuracy },
  { name: 'money', Comp: Money },
  { name: 'global', Comp: Global },
  { name: 'close', Comp: Close },
];

const X0 = beatFrame(MUSIC.xfadeFromBeat);
const X1 = beatFrame(MUSIC.xfadeToBeat);
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

export const Main: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.ink }}>
    {ORDER.map(({ name, Comp }) => (
      <Sequence key={name} from={sceneStart(name)} durationInFrames={sceneLength(name)} name={name}>
        <SceneIn>
          <Comp />
        </SceneIn>
      </Sequence>
    ))}

    {/* Excerpt 1: the quiet piano; fades out across one bar. */}
    <Sequence durationInFrames={X1}>
      <Audio
        src={staticFile(MUSIC.file)}
        trimBefore={Math.round(MUSIC.offset1 * FPS)}
        volume={(f) => interpolate(f, [0, 6, X0, X1], [0, 1, 1, 0], clamp)}
      />
    </Sequence>
    {/* Excerpt 2: the climax, rising in across the same bar; its last chord hits the logo. */}
    <Sequence from={X0}>
      <Audio
        src={staticFile(MUSIC.file)}
        trimBefore={Math.round((MUSIC.offset2 + X0 / FPS) * FPS)}
        volume={(f) => interpolate(f, [0, X1 - X0, TOTAL_FRAMES - X0 - 45, TOTAL_FRAMES - X0], [0, 0.9, 0.9, 0], clamp)}
      />
    </Sequence>
  </AbsoluteFill>
);
