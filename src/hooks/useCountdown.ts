import { useEffect, useRef, useState } from "react";

/**
 * Seconds until an ISO timestamp; ticks every second, null when no target.
 * Calls onDone exactly once when it reaches 0.
 */
export function useCountdown(targetIso: string | null, onDone?: () => void) {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const firedRef = useRef(false);

  useEffect(() => {
    if (!targetIso) {
      setSecondsLeft(null);
      return;
    }
    firedRef.current = false;
    const target = new Date(targetIso).getTime();
    const tick = () => {
      const s = Math.max(0, Math.ceil((target - Date.now()) / 1000));
      setSecondsLeft(s);
      if (s <= 0 && !firedRef.current) {
        firedRef.current = true;
        clearInterval(interval);
        onDoneRef.current?.();
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [targetIso]);

  return secondsLeft;
}

/** Format a remaining-seconds value as m:ss for the chips. */
export function formatCountdown(seconds: number | null): string {
  if (seconds == null) return "--:--";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
