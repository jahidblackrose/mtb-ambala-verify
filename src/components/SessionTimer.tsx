import { Clock } from "lucide-react";
import { formatCountdown, useCountdown } from "@/hooks/useCountdown";
import { useFlow } from "@/flow/FlowProvider";

/**
 * Session countdown chip in the header. Turns amber under 2 minutes;
 * at 0 the caller moves to the Expired screen.
 */
export function SessionTimer({ onExpire }: { onExpire: () => void }) {
  const { state, t } = useFlow();
  const seconds = useCountdown(state.linkExpiresAt, onExpire);
  if (seconds == null) return null;
  const warn = seconds < 120 && seconds > 0;

  return (
    <div
      role="timer"
      aria-live="polite"
      aria-label={t("expiresIn")}
      className={`flex h-9 items-center gap-1 rounded-full border px-2.5 text-xs font-semibold tabular-nums ${
        warn ? "border-amber-500 bg-amber-500/10 text-amber-600" : "border-border bg-background text-muted-foreground"
      }`}
    >
      <Clock className="h-3.5 w-3.5" aria-hidden />
      {formatCountdown(seconds)}
    </div>
  );
}
