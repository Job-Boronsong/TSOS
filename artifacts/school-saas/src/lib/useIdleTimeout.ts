import { useEffect, useRef, useCallback } from "react";

export function useIdleTimeout(onTimeout: () => void, timeoutMs = 20 * 60 * 1000) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;

  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (warnTimerRef.current) clearTimeout(warnTimerRef.current);
    timerRef.current = setTimeout(() => onTimeoutRef.current(), timeoutMs);
    // Warn 1 minute before
    warnTimerRef.current = setTimeout(() => {
      const event = new CustomEvent("idle-warning");
      window.dispatchEvent(event);
    }, timeoutMs - 60000);
  }, [timeoutMs]);

  useEffect(() => {
    const events = ["mousemove", "keydown", "click", "touchstart", "scroll"];
    events.forEach(e => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      events.forEach(e => window.removeEventListener(e, reset));
      if (timerRef.current) clearTimeout(timerRef.current);
      if (warnTimerRef.current) clearTimeout(warnTimerRef.current);
    };
  }, [reset]);
}
