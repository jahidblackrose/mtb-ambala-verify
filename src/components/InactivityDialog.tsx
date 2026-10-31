import { AlertTriangle } from "lucide-react";
import { useCountdown } from "@/hooks/useCountdown";
import { useFlow } from "@/flow/FlowProvider";

/** "Still there?" dialog with a 30 s countdown shown on inactivity. */
export function InactivityDialog({
  onStay,
  onExitNow,
}: {
  onStay: () => void;
  onExitNow: () => void;
}) {
  const { t } = useFlow();
  const seconds = useCountdown(new Date(Date.now() + 30_000).toISOString(), onExitNow);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6" role="alertdialog" aria-modal>
      <div className="w-full max-w-sm rounded-2xl bg-card p-5 text-center shadow-xl">
        <AlertTriangle className="mx-auto h-8 w-8 text-amber-500" aria-hidden />
        <h2 className="mt-3 text-lg font-semibold text-foreground">{t("stillThere.title")}</h2>
        <p className="mt-1 text-sm text-muted-foreground" aria-live="polite">
          {t("stillThere.body", { n: seconds ?? 0 })}
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <button
            type="button"
            onClick={onStay}
            className="h-12 rounded-xl bg-brand-magenta font-semibold text-white active:bg-brand-magenta/90"
          >
            {t("dialog.no")}
          </button>
          <button
            type="button"
            onClick={onExitNow}
            className="h-12 rounded-xl border border-border font-medium text-muted-foreground"
          >
            {t("dialog.yes")}
          </button>
        </div>
      </div>
    </div>
  );
}
