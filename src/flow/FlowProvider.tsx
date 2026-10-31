import { createContext, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from "react";
import { apiPost } from "@/api/client";
import type { DetailsData, FaceData, SessionData, SendOtpData, TermsData } from "@/api/types";
import { translate, type Lang, type TFn } from "@/i18n";
import {
  flowReducer,
  initialState,
  type FlowAction,
  type FlowState,
} from "./machine";

export type ActionKind = "session" | "sendotp" | "verifyotp" | "face";

interface FlowContextValue {
  state: FlowState;
  dispatch: (a: FlowAction) => void;
  lang: Lang;
  setLang: (l: Lang) => void;
  t: TFn;
  startSession: () => Promise<void>;
  sendOtp: () => Promise<void>;
  submitOtp: (otp: string) => Promise<void>;
  verifyFace: () => Promise<void>;
  busy: boolean;
}

const FlowContext = createContext<FlowContextValue | null>(null);

export function useFlow(): FlowContextValue {
  const ctx = useContext(FlowContext);
  if (!ctx) throw new Error("useFlow must be used inside FlowProvider");
  return ctx;
}

export function FlowProvider({
  linkToken,
  children,
}: {
  linkToken: string;
  children: ReactNode;
}) {
  const [state, dispatch] = useReducer(flowReducer, initialState);
  const busyRef = useRef(false);
  const [busy, setBusy] = useState(false);

  // Keep a ref of the latest state for async callbacks without re-creating them.
  const stateRef = useRef(state);
  stateRef.current = state;

  // Bangla first; the document lang also switches the font.
  useEffect(() => {
    document.documentElement.lang = state.lang;
  }, [state.lang]);

  const t = useMemo<TFn>(() => {
    const l = state.lang;
    return (key, vars) => translate(l, key, vars);
  }, [state.lang]);

  async function run(kind: ActionKind, fn: () => Promise<void>) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    dispatch({ type: "setLastAction", action: kind });
    try {
      await fn();
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  const startSession = () =>
    run("session", async () => {
      const r = await apiPost<SessionData>("session", { linkToken }, { lang: stateRef.current.lang });
      dispatch({ type: "setCorrelationId", id: r.kind === "ok" ? "" : r.correlationId });
      if (r.kind === "ok") {
        dispatch({ type: "hydrateSession", data: r.data });
        if (r.data.sessionState === "ACTIVE") dispatch({ type: "setStep", step: "mobile" });
        else if (r.data.sessionState === "OTP_VERIFIED") dispatch({ type: "setStep", step: "details" });
        else dispatch({ type: "expired" });
        return;
      }
      if (r.kind === "invalidLink" || r.kind === "authExpired" || r.kind === "linkExpired") {
        dispatch({ type: "expired" });
        return;
      }
      if (r.kind === "wrongState") {
        // Reload the session once; if it is still wrong, expire.
        const again = await apiPost<SessionData>("session", { linkToken }, { lang: stateRef.current.lang });
        if (again.kind === "ok" && (again.data.sessionState === "ACTIVE" || again.data.sessionState === "OTP_VERIFIED")) {
          dispatch({ type: "hydrateSession", data: again.data });
          dispatch({ type: "setStep", step: again.data.sessionState === "ACTIVE" ? "mobile" : "details" });
          return;
        }
        dispatch({ type: "expired" });
        return;
      }
      dispatch({ type: "error", message: null, apiMessage: r.kind === "validation" ? r.message : null });
    });

  const sendOtp = () =>
    run("sendotp", async () => {
      const r = await apiPost<SendOtpData>("sendotp", {}, {
        accessToken: stateRef.current.accessToken,
        lang: stateRef.current.lang,
      });
      dispatch({ type: "setCorrelationId", id: r.kind === "ok" ? "" : r.correlationId });
      if (r.kind === "ok") {
        dispatch({ type: "otpSent", otpExpiresAt: r.data.otpExpiresAt, mobileMasked: r.data.mobileMasked });
        return;
      }
      if (r.kind === "authExpired" || r.kind === "linkExpired" || r.kind === "invalidLink") {
        dispatch({ type: "expired" });
        return;
      }
      if (r.kind === "tooMany" || r.kind === "system") {
        dispatch({ type: "error", message: null, apiMessage: r.kind === "tooMany" ? r.message : null });
        return;
      }
      dispatch({ type: "error", message: null, apiMessage: r.message });
    });

  const submitOtp = (otp: string) =>
    run("verifyotp", async () => {
      const r = await apiPost<undefined>("verifyotp", { otp }, {
        accessToken: stateRef.current.accessToken,
        lang: stateRef.current.lang,
      });
      dispatch({ type: "setCorrelationId", id: r.kind === "ok" ? "" : r.correlationId });
      if (r.kind === "ok") {
        dispatch({ type: "otpVerified" });
        return;
      }
      if (r.kind === "authExpired" || r.kind === "linkExpired" || r.kind === "invalidLink") {
        dispatch({ type: "expired" });
        return;
      }
      if (r.kind === "system") {
        dispatch({ type: "error", message: null, apiMessage: null });
        return;
      }
      // 422 wrong OTP and 429 too many are surfaced by the OTP screen itself.
      throw Object.assign(new Error("otp-" + r.kind), { otpKind: r.kind, otpMessage: r.message });
    });

  const verifyFace = () =>
    run("face", async () => {
      const s = stateRef.current;
      const r = await apiPost<FaceData>("face", {
        tncId: s.tncId,
        tncAccepted: true,
        photoBase64: s.photo?.base64 ?? "",
        mimeType: "image/jpeg",
        liveness: { passed: true, method: s.livenessMethod ?? "fallback" },
      }, {
        accessToken: s.accessToken,
        lang: s.lang,
        timeoutMs: 60_000,
      });
      dispatch({ type: "setCorrelationId", id: r.kind === "ok" ? "" : r.correlationId });
      if (r.kind === "ok") {
        if (r.data.result === "MATCHED") dispatch({ type: "faceMatched" });
        else if (r.data.result === "RETRY") {
          dispatch({ type: "faceRetry", remainingAttempts: r.data.remainingAttempts ?? null, apiMessage: null });
        } else dispatch({ type: "faceFailed" });
        return;
      }
      if (r.kind === "authExpired" || r.kind === "linkExpired" || r.kind === "invalidLink") {
        dispatch({ type: "expired" });
        return;
      }
      if (r.kind === "tooMany") {
        dispatch({ type: "faceRetry", remainingAttempts: 0, apiMessage: r.message });
        return;
      }
      dispatch({ type: "error", message: null, apiMessage: r.kind === "validation" ? r.message : null });
    });

  const value: FlowContextValue = {
    state,
    dispatch,
    lang: state.lang,
    setLang: (l) => dispatch({ type: "setLang", lang: l }),
    t,
    startSession,
    sendOtp,
    submitOtp,
    verifyFace,
    busy,
  };

  return <FlowContext.Provider value={value}>{children}</FlowContext.Provider>;
}

import { useState } from "react";
