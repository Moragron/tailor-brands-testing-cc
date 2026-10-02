import { useEffect, useState } from 'react';

export type LoaderMessage = { text: string; /** Optional secondary line, e.g. a source or file name */ source?: string };

export type PercentLoaderProps = {
  percent: number;
  /** Accessible name of the progress bar */
  label: string;
  headline?: string;
  message?: LoaderMessage;
};

/** Determinate progress: large percentage, bar, and an optional status line that can change over time. */
export function PercentLoader({ percent, label, headline, message }: PercentLoaderProps) {
  const p = Math.max(0, Math.min(100, Math.round(percent)));
  return (
    <div className="tb-loader">
      {headline && <h2 className="tb-h2">{headline}</h2>}
      <div className="tb-loader__percent" aria-hidden>{p}%</div>
      <div className="tb-loader__track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={p} aria-label={label}>
        <div className="tb-loader__fill" style={{ width: `${p}%` }} />
      </div>
      {message && (
        <div className="tb-loader__status" aria-live="polite">
          <p className="tb-body">{message.text}</p>
          {message.source && <p className="tb-caption">{message.source}</p>}
        </div>
      )}
    </div>
  );
}

/** Drives percent 0→100 over `durationMs` and rotates `messages` evenly across it; calls onDone at 100%. */
export function useSimulatedProgress(messages: LoaderMessage[], durationMs = 15000, onDone?: () => void) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const e = Math.min(t - start, durationMs);
      setElapsed(e);
      if (e < durationMs) raf = requestAnimationFrame(tick);
      else onDone?.();
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [durationMs]); // eslint-disable-line react-hooks/exhaustive-deps
  const percent = (elapsed / durationMs) * 100;
  const message = messages[Math.min(messages.length - 1, Math.floor((elapsed / durationMs) * messages.length))];
  return { percent, message };
}
