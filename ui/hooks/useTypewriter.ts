import { useState, useEffect, useRef } from 'react';

export function useTypewriter(
  target: string | null,
  onComplete?: () => void,
  msPerChar = 30,
): string {
  const [displayed, setDisplayed] = useState('');
  const runIdRef = useRef(0);

  useEffect(() => {
    if (target === null) {
      setDisplayed('');
      return;
    }
    const runId = ++runIdRef.current;
    let i = 0;
    setDisplayed('');
    const interval = setInterval(() => {
      if (runIdRef.current !== runId) {
        clearInterval(interval);
        return;
      }
      setDisplayed(target.slice(0, ++i));
      if (i >= target.length) {
        clearInterval(interval);
        onComplete?.();
      }
    }, msPerChar);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, msPerChar]);

  return displayed;
}
