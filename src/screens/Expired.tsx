import { useEffect, useRef } from "react";
import { Link2Off } from "lucide-react";
import { sendBridgeResult } from "@/lib/bridge";
import { useFlow } from "@/flow/FlowProvider";

/**
 * Screen 8 — invalid / expired link (also session timeout and inactivity).
 * Sends the EXPIRED bridge message and wipes state.
 */
export function ExpiredScreen() {
  const { state, dispatch, t } = useFlow();
  const sentRef = useRef(false);

  useEffect(() => {
    if (sentRef.current) return;
    sentRef.current = true;
    sendBridgeResult(state.applicationId, "EXPIRED");
    dispatch({ type: "wipe" });
  }, [state.applicationId, dispatch]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-amber-500/10">
        <Link2Off className="h-16 w-16 text-amber-500" aria-hidden />
      </div>
      <h2 className="text-xl font-bold text-foreground">{t("expired.title")}</h2>
      <p className="max-w-xs text-sm text-muted-foreground">{t("expired.body")}</p>
    </div>
  );
}
