import { AlertTriangle } from "lucide-react";
import { ActionButton, BottomAction } from "@/components/BottomAction";
import { useFlow } from "@/flow/FlowProvider";
import { cleanMessage } from "@/api/status";

/** Global error screen: retry repeats the last action; shows the correlation id. */
export function ErrorScreen() {
  const { state, dispatch, retryLast, t } = useFlow();
  const insecure = state.errorMessage === "insecure";
  const apiMessage = state.apiMessage ? cleanMessage(state.apiMessage) : null;

  return (
    <>
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-8 w-8 text-destructive" aria-hidden />
        </div>
        <h2 className="text-xl font-bold text-foreground">{t("error.title")}</h2>
        <p className="max-w-xs text-sm text-muted-foreground">{t("error.body")}</p>
        {state.lastCorrelationId && (
          <p className="max-w-xs break-all text-[11px] text-muted-foreground">
            {t("error.reference")}: {state.lastCorrelationId}
          </p>
        )}
      </div>
      <BottomAction>
        <ActionButton
          onClick={() => {
            dispatch({ type: "setApiMessage", message: null });
            retryLast();
          }}
          disabled={insecure}
        >
          {t("details.retry")}
        </ActionButton>
      </BottomAction>
    </>
  );
}
