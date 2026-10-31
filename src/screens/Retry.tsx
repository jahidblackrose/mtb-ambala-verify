import { CameraOff, Lightbulb, Glasses, Smile, type LucideIcon } from "lucide-react";
import { ActionButton, BottomAction } from "@/components/BottomAction";
import { revokeObjectUrl } from "@/lib/image";
import { useFlow } from "@/flow/FlowProvider";

/** Screen 5b — photo didn't match: remaining attempts + tips, back to capture. */
export function RetryScreen() {
  const { state, dispatch, t } = useFlow();

  const items: { tip: string; Icon: LucideIcon }[] = [
    { tip: t("verify.tip1"), Icon: Lightbulb },
    { tip: t("verify.tip2"), Icon: Smile },
    { tip: t("verify.tip3"), Icon: Glasses },
  ];

  return (
    <>
      <div className="flex flex-1 flex-col items-center gap-4 px-4 py-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10">
          <CameraOff className="h-8 w-8 text-amber-500" aria-hidden />
        </div>
        <h2 className="text-lg font-bold text-foreground">{t("verify.captureAgain")}</h2>
        {state.remainingAttempts != null && (
          <p className="text-sm font-semibold text-brand-purple" aria-live="polite">
            {t("verify.remaining", { n: state.remainingAttempts })}
          </p>
        )}
        <ul className="w-full max-w-xs space-y-2 rounded-2xl border border-border bg-card p-4 shadow-sm">
          {tips.map((tip, i) => {
            const Icon = icons[i];
            return (
              <li key={tip} className="flex items-center gap-3 text-sm text-foreground">
                <Icon className="h-4 w-4 shrink-0 text-brand-green" aria-hidden />
                {tip}
              </li>
            );
          })}
        </ul>
      </div>
      <BottomAction>
        <ActionButton
          onClick={() => {
            if (state.photo) revokeObjectUrl(state.photo.objectUrl);
            dispatch({ type: "discardPhoto" });
          }}
        >
          {t("details.retry")}
        </ActionButton>
      </BottomAction>
    </>
  );
}
