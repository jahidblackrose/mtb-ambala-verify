import { useEffect, useRef } from "react";
import { CheckCircle2 } from "lucide-react";
import { sendBridgeResult } from "@/lib/bridge";
import { useFlow } from "@/flow/FlowProvider";

/** Screen 6 — success: bridge message sent, state wiped, no way back into the flow. */
export function SuccessScreen() {
  const { state, dispatch, t } = useFlow();
  const sentRef = useRef(false);

  useEffect(() => {
    if (sentRef.current) return;
    sentRef.current = true;
    sendBridgeResult(state.applicationId, "MATCHED");
    dispatch({ type: "wipe" });
  }, [state.applicationId, dispatch]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="animate-check-pop flex h-24 w-24 items-center justify-center rounded-full bg-brand-green/15">
        <CheckCircle2 className="h-16 w-16 text-brand-green" aria-hidden />
      </div>
      <h2 className="text-xl font-bold text-foreground">{t("success.title")}</h2>
      <div className="rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
        <p className="text-xs text-muted-foreground">{t("label.applicationId")}</p>
        <p className="text-base font-bold text-brand-purple">{state.applicationId}</p>
      </div>
      <p className="text-sm text-muted-foreground">{t("success.body")}</p>
    </div>
  );
}
