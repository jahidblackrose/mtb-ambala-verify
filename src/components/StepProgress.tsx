import { Check } from "lucide-react";
import { useFlow } from "@/flow/FlowProvider";
import type { Step } from "@/flow/machine";

const ORDER: Step[][] = [
  ["mobile"],
  ["otp"],
  ["details"],
  ["camera", "preview"],
  ["verify", "verifying", "retry"],
];

/** 5-step progress bar: Mobile → OTP → Details → Photo → Verify. */
export function StepProgress() {
  const { state, t } = useFlow();
  const keys = ["step.mobile", "step.otp", "step.details", "step.photo", "step.verify"];
  const allDone = state.step === "success" || state.step === "failed" || state.step === "expired";
  const currentIndex = ORDER.findIndex((group) => group.includes(state.step));

  return (
    <nav aria-label="Progress" className="shrink-0 bg-card px-3 pb-2 pt-2">
      <ol className="flex items-start gap-1">
        {keys.map((key, i) => {
          const done = allDone || currentIndex > i;
          const current = !allDone && currentIndex === i;
          return (
            <li key={key} className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <div
                aria-current={current ? "step" : undefined}
                className={`flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-bold transition-colors ${
                  done
                    ? "border-brand-green bg-brand-green text-white"
                    : current
                      ? "border-brand-primary bg-brand-primary text-white"
                      : "border-border bg-background text-muted-foreground"
                }`}
              >
                {done ? <Check className="h-4 w-4" aria-hidden /> : i + 1}
              </div>
              <span
                className={`truncate text-center text-[10px] leading-tight ${
                  current ? "font-semibold text-brand-primary" : done ? "text-brand-green" : "text-muted-foreground"
                }`}
              >
                {t(key)}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
