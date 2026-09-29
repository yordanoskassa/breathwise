/**
 * Glue between a frame source and the UI: owns the MeasureSession, throttles
 * snapshots to ~12 fps for React, and fires voice/haptic cues on milestones.
 */
import { useCallback, useRef, useState } from 'react';

import { GRID_CELLS } from '@/dsp/grid';
import { MeasureSession, type SessionResult, type SessionSnapshot } from '@/dsp/session';
import { breathPulse, say, success, warn } from '@/feedback';

const UI_INTERVAL_MS = 80;

export function useMeasure(onDone: (r: SessionResult) => void) {
  const sessionRef = useRef<MeasureSession>(new MeasureSession(GRID_CELLS, 60));
  const [snap, setSnap] = useState<SessionSnapshot>(() => sessionRef.current.snapshot());
  const [pulse, setPulse] = useState(0);
  const lastUi = useRef(0);
  const cues = useRef({ found: false, half: false, ten: false, lastMotionCue: 0, done: false });
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  const onGrid = useCallback((t: number, grid: number[]) => {
    const session = sessionRef.current;
    const { newBreath } = session.pushFrame(t, grid);
    if (newBreath) {
      breathPulse();
      setPulse((p) => p + 1);
    }
    const now = Date.now();
    if (now - lastUi.current < UI_INTERVAL_MS && !newBreath) return;
    lastUi.current = now;
    const s = session.snapshot();
    setSnap(s);

    const c = cues.current;
    if (s.phase === 'counting' && !c.found) {
      c.found = true;
      success();
      say('v.found');
    }
    if (s.phase === 'counting' && !c.half && s.counted >= 30) {
      c.half = true;
      say('v.half');
    }
    if (s.phase === 'counting' && !c.ten && s.counted >= 50) {
      c.ten = true;
      say('v.ten');
    }
    if (s.pauseReason === 'motion' && now - c.lastMotionCue > 6000) {
      c.lastMotionCue = now;
      warn();
      say('v.hold');
    }
    if (s.phase === 'done' && !c.done) {
      c.done = true;
      success();
      doneRef.current(session.result());
    }
  }, []);

  const reset = useCallback(() => {
    sessionRef.current = new MeasureSession(GRID_CELLS, 60);
    cues.current = { found: false, half: false, ten: false, lastMotionCue: 0, done: false };
    setSnap(sessionRef.current.snapshot());
    setPulse(0);
  }, []);

  return { snap, pulse, onGrid, reset };
}
