/**
 * End-to-end accuracy on synthetic scenes: pixels → grid → engine → count.
 * Run with `npm test` (Node's built-in runner, no extra deps).
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { runSynthetic } from './harness.ts';

const RATES = [14, 20, 28, 36, 44, 52, 62, 75];

for (const [i, rate] of RATES.entries()) {
  test(`counts ${rate}/min within ±2`, () => {
    const { result } = runSynthetic({ rateBpm: rate, seed: i + 1 });
    assert.ok(result, 'should finish a 60 s count');
    assert.ok(Math.abs(result.rate - rate) <= 2, `got ${result.rate}`);
    assert.equal(result.confidenceLabel, 'high');
  });
}

test('tiny sub-pixel chest motion (0.6 px) still counts', () => {
  const { result } = runSynthetic({ rateBpm: 40, amplitudePx: 0.6, seed: 9 });
  assert.ok(result && Math.abs(result.rate - 40) <= 2, `got ${result?.rate}`);
});

test('noisy low-light sensor still counts', () => {
  const { result } = runSynthetic({ rateBpm: 40, noise: 5, seed: 10 });
  assert.ok(result && Math.abs(result.rate - 40) <= 2, `got ${result?.rate}`);
});

test('pauses the clock through bumps and recovers', () => {
  const { result, totalSeconds } = runSynthetic({
    rateBpm: 45,
    seed: 11,
    bumps: [
      [20, 1.5, 6],
      [45, 1, 4],
    ],
  });
  assert.ok(result, 'should finish');
  assert.ok(result.motionFraction > 0, 'motion should be detected');
  assert.ok(totalSeconds > 70, 'clock should pause during motion');
  assert.ok(Math.abs(result.rate - 45) <= 3, `got ${result.rate}`);
});

test('never locks onto a scene with no breathing', () => {
  const { result, lockedAfter } = runSynthetic({ rateBpm: 30, amplitudePx: 0, seed: 13 }, 15, 60);
  assert.equal(lockedAfter, null);
  assert.equal(result, null);
});

test('locks on within 10 seconds', () => {
  const { lockedAfter } = runSynthetic({ rateBpm: 36, seed: 4 });
  assert.ok(lockedAfter !== null && lockedAfter <= 10, `locked at ${lockedAfter}`);
});
