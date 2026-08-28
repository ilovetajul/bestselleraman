import React, { useEffect, useRef, useState } from 'react';

interface CountdownTimerProps {
  targetTime: Date;
  serverNow: () => Date;
  onReachZero?: () => void;
  size?: 'lg' | 'xl';
  dangerThresholdSeconds?: number;
}

function formatDuration(totalSeconds: number): { h: number; m: number; s: number } {
  const clamped = Math.max(0, totalSeconds);
  const h = Math.floor(clamped / 3600);
  const m = Math.floor((clamped % 3600) / 60);
  const s = Math.floor(clamped % 60);
  return { h, m, s };
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  targetTime,
  serverNow,
  onReachZero,
  size = 'lg',
  dangerThresholdSeconds = 60,
}) => {
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    Math.round((targetTime.getTime() - serverNow().getTime()) / 1000)
  );
  const [firedZero, setFiredZero] = useState(false);

  // Always call the LATEST onReachZero, even though the interval below is
  // only re-created when targetTime changes — otherwise a stale closure
  // could fire with outdated data (e.g. answers as they were when the Live
  // screen first mounted, not the participant's final typed answers).
  const onReachZeroRef = useRef(onReachZero);
  useEffect(() => {
    onReachZeroRef.current = onReachZero;
  }, [onReachZero]);

  useEffect(() => {
    const id = window.setInterval(() => {
      const remaining = Math.round((targetTime.getTime() - serverNow().getTime()) / 1000);
      setRemainingSeconds(remaining);
      if (remaining <= 0 && !firedZero) {
        setFiredZero(true);
        onReachZeroRef.current?.();
      }
    }, 250);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetTime, firedZero]);

  const { h, m, s } = formatDuration(remainingSeconds);
  const danger = remainingSeconds <= dangerThresholdSeconds && remainingSeconds > 0;
  const isZero = remainingSeconds <= 0;

  const sizeClass = size === 'xl' ? 'text-5xl sm:text-6xl' : 'text-3xl sm:text-4xl';

  return (
    <div
      className={`font-display font-bold tabular-nums tracking-tight ${sizeClass} ${
        isZero
          ? 'text-rose-500'
          : danger
            ? 'text-rose-500 animate-pulse'
            : 'text-primary-600 dark:text-primary-300'
      }`}
      role="timer"
      aria-live="polite"
    >
      {h > 0 ? `${pad(h)} : ${pad(m)} : ${pad(s)}` : `${pad(m)} : ${pad(s)}`}
    </div>
  );
};
