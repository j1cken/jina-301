import { useState, useEffect, useRef, useCallback } from 'react';
import { DEMO_SCRIPT, type FlowAction } from '@/lib/demoScript';

const READY_DEFAULTS: Record<FlowAction['type'], number> = {
  'navigate':              1500,
  'set-geo-filter':         800,
  'set-rank-reveal':        350,
  'add-first-agent-hotel':  700,
  'type-hero-query':          0,
  'set-find-query':           0,
  'open-agent':               0,
  'close-agent':              0,
  'trigger-image-search':     0,
  'trigger-ingest':           0,
  'wait':                     0,
};

export function useDemoFlow(
  onAction: (action: FlowAction) => void,
  onExit: () => void,
) {
  const [isFlowing, setIsFlowing] = useState(false);
  const [stepIndex, setStepIndex] = useState(-1);
  const [stepReady, setStepReady] = useState(false);

  // Refs to avoid stale closures in event listeners and setTimeout
  const stepRef = useRef(-1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const readyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastKeyAdvanceRef = useRef(0);
  const onActionRef = useRef(onAction);
  const onExitRef = useRef(onExit);
  useEffect(() => { onActionRef.current = onAction; }, [onAction]);
  useEffect(() => { onExitRef.current = onExit; }, [onExit]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    if (readyTimerRef.current) { clearTimeout(readyTimerRef.current); readyTimerRef.current = null; }
  }, []);

  const exit = useCallback(() => {
    clearTimer();
    stepRef.current = -1;
    setIsFlowing(false);
    setStepIndex(-1);
    onExitRef.current();
  }, [clearTimer]);

  const advance = useCallback(() => {
    clearTimer();
    const next = stepRef.current + 1;
    if (next >= DEMO_SCRIPT.length) {
      exit();
      return;
    }
    stepRef.current = next;
    setStepIndex(next);
    const step = DEMO_SCRIPT[next];
    onActionRef.current(step.action);
    if (step.autoAdvanceMs) {
      setStepReady(false);
      timerRef.current = setTimeout(advance, step.autoAdvanceMs);
    } else {
      const delay = step.readyDelayMs ?? READY_DEFAULTS[step.action.type] ?? 0;
      if (delay === 0) {
        setStepReady(true);
      } else {
        setStepReady(false);
        readyTimerRef.current = setTimeout(() => setStepReady(true), delay);
      }
    }
  }, [clearTimer, exit]);

  const back = useCallback(() => {
    clearTimer();
    const prev = Math.max(0, stepRef.current - 1);
    stepRef.current = prev;
    setStepIndex(prev);
    onActionRef.current(DEMO_SCRIPT[prev].action);
  }, [clearTimer]);

  useEffect(() => {
    if (!isFlowing) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        const now = Date.now();
        if (now - lastKeyAdvanceRef.current < 400) return;
        lastKeyAdvanceRef.current = now;
        if (e.key === 'ArrowRight') advance();
        else back();
      }
      if (e.key === 'Escape') exit();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isFlowing, advance, back, exit]);

  const start = useCallback(() => {
    stepRef.current = -1;
    setStepIndex(-1);
    setIsFlowing(true);
  }, []);

  return {
    isFlowing,
    stepIndex,
    totalSteps: DEMO_SCRIPT.length,
    currentLabel: stepIndex >= 0 ? DEMO_SCRIPT[stepIndex].label : 'Press → to begin',
    start,
    exit,
    advance,
    back,
    stepReady,
  };
}
