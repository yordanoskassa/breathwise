import { Composition } from 'remotion';

import { Main } from './Main';
import { TOTAL_FRAMES } from './timeline';
import { FPS, H, W } from './theme';

export const Root: React.FC = () => (
  <Composition id="Breathwise" component={Main} durationInFrames={TOTAL_FRAMES} fps={FPS} width={W} height={H} />
);
