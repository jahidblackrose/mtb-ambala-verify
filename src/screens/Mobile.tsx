import { Smartphone } from "lucide-react";
import { ActionButton, BottomAction } from "@/components/BottomAction";
import { useFlow } from "@/flow/FlowProvider";

/** Screen 1 — mobile number + send OTP. */
export function MobileScreen() {
  const { state, sendOtp, busy, t } = useFlow();
  const blocked = state.actionBlocked;

  return (
    <>
      <div className="flex flex-1 flex-col items-center px-4 py-6">
        <div className="w-full rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-primary/10">
            <Smartphone className="h-8 w-8 text-brand-primary" aria-hidden />
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{t("mobile.intro")}</p>
          <p className="mt-1 text-xs text-muted-foreground/80">{t("mobile.customerMobile")}</p>
          <p className="mt-2 text-3xl font-bold tracking-wide text-brand-purple" dir="ltr">
            {state.mobileMasked || "—"}
          </p>
          {state.apiMessage && (
            <p className="mt-4 rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
              {state.apiMessage}
            </p>
          )}
        </div>
      </div>
      <BottomAction>
        <ActionButton onClick={() => void sendOtp()} loading={busy} disabled={blocked} aria-live="polite">
          {t("otp.send")}
        </ActionButton>
      </BottomAction>
    </>
  );
}
