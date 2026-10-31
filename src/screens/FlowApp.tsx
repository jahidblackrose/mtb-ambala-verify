import { useCallback, useEffect, useRef, useState } from "react";
import { AppBar } from "@/components/AppBar";
import { DevPanel } from "@/components/DevPanel";
import { InactivityDialog } from "@/components/InactivityDialog";
import { SessionTimer } from "@/components/SessionTimer";
import { StepProgress } from "@/components/StepProgress";
import { apiPost } from "@/api/client";
import { applyMockUrlParams } from "@/api/mockState";
import { FlowProvider, useFlow } from "@/flow/FlowProvider";
import type { Step } from "@/flow/machine";
import { useBackButton } from "@/hooks/useBackButton";
import { useInactivity } from "@/hooks/useInactivity";
import { CameraScreen } from "./Camera";
import { DetailsScreen } from "./Details";
import { ErrorScreen } from "./ErrorScreen";
import { ExpiredScreen } from "./Expired";
import { FailedScreen } from "./Failed";
import { LoadingScreen } from "./Loading";
import { MobileScreen } from "./Mobile";
import { OtpScreen } from "./Otp";
import { PreviewScreen } from "./Preview";
import { RetryScreen } from "./Retry";
import { SuccessScreen } from "./Success";
import { VerifyScreen } from "./Verify";

const BACK_TARGET: Partial<Record<Step, Step>> = {
  otp: "mobile",
  details: "otp",
  camera: "details",
  preview: "camera",
  verify: "preview",
};

const ACTIVE_STEPS: Step[] = ["mobile", "otp", "details", "camera", "preview", "verify", "verifying", "retry"];

/** The whole verification flow: app shell, timers, dialogs and the step machine. */
export function FlowApp({ linkToken }: { linkToken: string }) {
  return (
    <FlowProvider linkToken={linkToken}>
      <FlowShell />
    </FlowProvider>
  );
}

function FlowShell() {
  const { state, dispatch, startSession, t } = useFlow();
  const [devOpen, setDevOpen] = useState(false);
  const [warnOpen, setWarnOpen] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const startedRef = useRef(false);
  const errorReports = useRef(0);

  // One-time setup: strip the token from the URL/history, honour ?mock= forcing.
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.history.replaceState(null, "", "/v");
    applyMockUrlParams(window.location.search);
    // HTTPS only, except localhost (dev/preview).
    if (window.location.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(window.location.hostname)) {
      dispatch({ type: "error", message: "insecure", apiMessage: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Screen 0: start the session exactly once.
  useEffect(() => {
    if (state.step === "loading" && !startedRef.current) {
      startedRef.current = true;
      void startSession();
    }
  }, [state.step, startSession]);

  // Unexpected errors: report via Verify/clienterror (max 3 per session, no PII).
  useEffect(() => {
    const report = (message: string, stack: string) => {
      const s = stateRef.current;
      if (!s.accessToken || errorReports.current >= 3) return;
      errorReports.current += 1;
      void apiPost(
        "clienterror",
        { message: message.slice(0, 500), stack: stack.slice(0, 2000), page: s.step, correlationId: s.lastCorrelationId ?? "" },
        { accessToken: s.accessToken, lang: s.lang },
      );
    };
    const onRejection = (e: PromiseRejectionEvent) => report(String(e.reason?.message ?? e.reason), String(e.reason?.stack ?? ""));
    const onError = (e: ErrorEvent) => report(e.message, e.error?.stack ?? "");
    window.addEventListener("unhandledrejection", onRejection);
    window.addEventListener("error", onError);
    return () => {
      window.removeEventListener("unhandledrejection", onRejection);
      window.removeEventListener("error", onError);
    };
  }, []);

  const stateRef = useRef(state);
  stateRef.current = state;

  const endFlow = useCallback(() => {
    setWarnOpen(false);
    dispatch({ type: "wipe" });
    dispatch({ type: "expired" });
  }, [dispatch]);

  const inactivity = useInactivity({
    enabled: ACTIVE_STEPS.includes(state.step),
    onWarn: () => setWarnOpen(true),
    onExpire: endFlow,
  });

  const backable = state.step === "mobile" || BACK_TARGET[state.step] != null;
  useBackButton(backable, () => {
    const target = BACK_TARGET[stateRef.current.step];
    if (target) dispatch({ type: "setStep", step: target });
    else setExitOpen(true); // on the first step: confirm exit
  });

  const screen = (() => {
    switch (state.step) {
      case "loading":
        return <LoadingScreen />;
      case "mobile":
        return <MobileScreen />;
      case "otp":
        return <OtpScreen />;
      case "details":
        return <DetailsScreen />;
      case "camera":
        return <CameraScreen />;
      case "preview":
        return <PreviewScreen />;
      case "verify":
        return <VerifyScreen />;
      case "verifying":
        return <VerifyingOverlay label={t("verify.running")} />;
      case "retry":
        return <RetryScreen />;
      case "success":
        return <SuccessScreen />;
      case "failed":
        return <FailedScreen />;
      case "expired":
        return <ExpiredScreen />;
      case "error":
        return <ErrorScreen />;
      default:
        return <LoadingScreen />;
    }
  })();

  const showProgress = ACTIVE_STEPS.includes(state.step) || state.step === "success";

  return (
    <div className="mx-auto flex h-[100dvh] w-full max-w-[480px] flex-col overflow-hidden bg-background shadow-2xl">
      <AppBar
        timerChip={ACTIVE_STEPS.includes(state.step) ? <SessionTimer onExpire={endFlow} /> : null}
        onDevOpen={() => setDevOpen(true)}
      />
      {showProgress && <StepProgress />}
      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto" aria-live="polite">
        {screen}
      </main>

      <DevPanel open={devOpen} onClose={() => setDevOpen(false)} />
      {warnOpen && (
        <InactivityDialog
          onStay={() => {
            setWarnOpen(false);
            inactivity.reset();
          }}
          onExitNow={endFlow}
        />
      )}
      {exitOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6" role="alertdialog" aria-modal>
          <div className="w-full max-w-sm rounded-2xl bg-card p-5 text-center shadow-xl">
            <h2 className="text-lg font-semibold text-foreground">{t("exit.title")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("exit.body")}</p>
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setExitOpen(false)}
                className="h-12 rounded-xl bg-brand-primary font-semibold text-white active:bg-brand-primary/90"
              >
                {t("dialog.no")}
              </button>
              <button
                type="button"
                onClick={endFlow}
                className="h-12 rounded-xl border border-border font-medium text-muted-foreground"
              >
                {t("dialog.yes")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Full-screen blocking overlay while Verify/face runs. */
function VerifyingOverlay({ label }: { label: string }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/60 px-6" role="status" aria-live="polite">
      <span className="h-12 w-12 animate-spin rounded-full border-4 border-white/30 border-t-white" />
      <p className="text-base font-semibold text-white">{label}</p>
    </div>
  );
}
