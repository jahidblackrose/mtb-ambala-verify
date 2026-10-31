import { useCallback, useRef, useState } from "react";
import { ActionButton, BottomAction } from "@/components/BottomAction";
import { OtpInput } from "@/components/OtpInput";
import { useFlow } from "@/flow/FlowProvider";
import { useCountdown } from "@/hooks/useCountdown";
import { isSystemKind } from "@/api/status";

const RESEND_COOLDOWN_S = 60;

/** Screen 2 — enter the 6-digit OTP, with resend cooldown and expiry countdown. */
export function OtpScreen() {
  const { state, sendOtp, submitOtp, busy, t } = useFlow();
  const [otp, setOtp] = useState("");
  const [shake, setShake] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [tooMany, setTooMany] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_S);
  const cooldownTimer = useRef<number | null>(null);

  const otpSeconds = useCountdown(state.otpExpiresAt);
  const expired = otpSeconds != null && otpSeconds <= 0;

  const startCooldown = useCallback(() => {
    setCooldown(RESEND_COOLDOWN_S);
    if (cooldownTimer.current) window.clearInterval(cooldownTimer.current);
    cooldownTimer.current = window.setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          if (cooldownTimer.current) window.clearInterval(cooldownTimer.current);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }, []);

  const onSubmit = async () => {
    if (otp.length !== 6) return;
    setErrorText(null);
    try {
      await submitOtp(otp);
    } catch (err) {
      const kind = (err as { otpKind?: string }).otpKind;
      const message = (err as { otpMessage?: string }).otpMessage;
      if (kind === "invalidOtp") {
        setShake(true);
        setErrorText([t("otp.wrong"), message].filter(Boolean).join(" — "));
        setOtp("");
        window.setTimeout(() => setShake(false), 450);
      } else if (kind === "tooMany") {
        setTooMany(true);
        setErrorText(t("otp.tooMany"));
        setOtp("");
      } else {
        setErrorText(message || t("error.body"));
      }
    }
  };

  const onResend = () => {
    if (cooldown > 0) return;
    setTooMany(false);
    setErrorText(null);
    setOtp("");
    startCooldown();
    void sendOtp();
  };

  const resendDisabled = cooldown > 0 || busy;

  return (
    <>
      <div className="flex flex-1 flex-col gap-4 px-4 py-6">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-center text-lg font-bold text-brand-purple">{t("otp.title")}</h2>
          <p className="mt-1 text-center text-sm text-muted-foreground">
            {t("otp.sentTo")} <span className="font-semibold text-foreground">{state.mobileMasked}</span>
          </p>
          <div className="mt-5">
            <OtpInput value={otp} onChange={setOtp} onComplete={(v) => void onSubmit(v)} shake={shake} disabled={tooMany} />
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">{t("otp.helper")}</p>
          <p className="mt-2 text-center text-xs font-medium tabular-nums" aria-live="polite">
            {expired ? (
              <span className="text-destructive">{t("otp.expired")}</span>
            ) : (
              <span className="text-muted-foreground">
                {t("expiresIn")} {otpSeconds ?? "--"}{state.lang === "bn" ? " সে" : "s"}
              </span>
            )}
          </p>
          {errorText && (
            <p className="mt-3 rounded-xl bg-destructive/10 px-3 py-2 text-center text-sm text-destructive" role="alert">
              {errorText}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onResend}
          disabled={resendDisabled}
          className={`mx-auto h-12 rounded-xl px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:text-muted-foreground ${
            expired && !resendDisabled ? "text-brand-magenta underline" : "text-brand-purple"
          }`}
        >
          {cooldown > 0 ? t("otp.resendIn", { n: cooldown }) : t("otp.resend")}
        </button>
      </div>
      <BottomAction>
        <ActionButton
          onClick={() => void onSubmit()}
          loading={busy}
          disabled={otp.length !== 6 || tooMany || expired}
        >
          {t("otp.submit")}
        </ActionButton>
      </BottomAction>
    </>
  );
}

export { isSystemKind };
