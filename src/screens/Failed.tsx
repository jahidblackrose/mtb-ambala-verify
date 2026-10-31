import { useEffect, useRef } from "react";
import { XCircle } from "lucide-react";
import { sendBridgeResult } from "@/lib/bridge";
import { useFlow } from "@/flow/FlowProvider";

/** Screen 7 — final failure: no attempts left; bridge FAILED, state wiped. */
export function FailedScreen() {
  const { state, dispatch, t } = useFlow();
  const sentRef = useRef(false);

  useEffect(() => {
    if (sentRef.current) return;
    sentRef.current = true;
    sendBridgeResult(state.applicationId, "FAILED");
    dispatch({ type: "wipe" });
  }, [state.applicationId, dispatch]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-destructive/10">
        <XCircle className="h-16 w-16 text-destructive" aria-hidden />
      </div>
      <h2 className="text-xl font-bold text-foreground">{t("failed.title")}</h2>
      <p className="max-w-xs text-sm text-muted-foreground">{t("failed.body")}</p>
    </div>
  );
}
