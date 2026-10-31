import { useCallback, useEffect, useRef } from "react";

/**
 * Inactivity watchdog: after `timeoutMs` without input, onWarn fires
 * ("Still there?" dialog); if nothing happens for `warnMs` more, onExpire fires.
 * Any pointer/key activity resets both timers.
 */
export function useInactivity(opts: {
  enabled: boolean;
  timeoutMs?: number;
  warnMs?: number;
  onWarn: () => void;
  onExpire: () => void;
}) {
  const { enabled, timeoutMs = 180_000, warnMs = 30_000 } = opts;
  const onWarnRef = useRef(opts.onWarn);
  const onExpireRef = useRef(opts.onExpire);
  onWarnRef.current = opts.onWarn;
  onExpireRef.current = opts.onExpire;

  const warnTimer = useRef<number | null>(null);
  const expireTimer = useRef<number | null>(null);
  const warnedRef = useRef(false);

  const clearTimers = useCallback(() => {
    if (warnTimer.current) window.clearTimeout(warnTimer.current);
    if (expireTimer.current) window.clearTimeout(expireTimer.current);
    warnTimer.current = null;
    expireTimer.current = null;
  }, []);

  const reset = useCallback(() => {
    clearTimers();
    warnedRef.current = false;
    if (!enabled) return;
    warnTimer.current = window.setTimeout(() => {
      warnedRef.current = true;
      onWarnRef.current();
      expireTimer.current = window.setTimeout(() => onExpireRef.current(), warnMs);
    }, timeoutMs);
  }, [clearTimers, enabled, timeoutMs, warnMs]);

  useEffect(() => {
    if (!enabled) {
      clearTimers();
      return;
    }
    reset();
    const events = ["pointerdown", "keydown", "touchstart", "scroll"] as const;
    const handler = () => reset();
    events.forEach((e) => window.addEventListener(e, handler, { passive: true }));
    return () => {
      events.forEach((e) => window.removeEventListener(e, handler));
      clearTimers();
    };
  }, [enabled, reset, clearTimers]);

  return { reset };
}
