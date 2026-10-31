import { useState } from "react";
import { X } from "lucide-react";
import { config } from "@/config";
import { mockOtpHint } from "@/api/mock";
import { setFaceResultOverride, setStatusOverride } from "@/api/mockState";
import { useFlow } from "@/flow/FlowProvider";
import type { Step } from "@/flow/machine";
import type { ApiName } from "@/api/types";

const STEPS: Step[] = ["mobile", "otp", "details", "camera", "preview", "verify", "retry", "success", "failed", "expired"];

const ENDPOINTS: ApiName[] = ["session", "sendotp", "verifyotp", "details", "terms", "face"];
const STATUSES = ["none", "404", "401", "410", "422", "429", "500", "timeout"];

/**
 * Hidden dev panel, mock mode only: tap the logo 5 times to open.
 * Jump to any screen, force API statuses per endpoint, force face results.
 */
export function DevPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { dispatch, state } = useFlow();
  const [face, setFace] = useState("none");

  if (!config.useMock || !open) return null;

  const jump = (step: Step) => {
    if (!state.accessToken) {
      dispatch({
        type: "hydrateSession",
        data: {
          applicationId: "APP-TEST-001",
          customerName: "Test Customer",
          mobileMasked: "017*****001",
          sessionState: "ACTIVE",
          linkExpiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
          accessToken: "mock-access-token",
        },
      });
    }
    if (["camera", "preview", "verify", "retry"].includes(step) && !state.tncAccepted) {
      dispatch({ type: "detailsLoaded", details: {
        applicationId: "APP-TEST-001",
        customerName: "Test Customer",
        customerNameBn: "পরীক্ষা গ্রাহক",
        nidMasked: "XXXXXXX1234",
        dobMasked: "1990-**-**",
        mobileMasked: "017*****001",
        retailerName: "Test Shop",
      }, terms: { tncId: "TNC-TEST-001", version: "1.0", title: "Terms & Conditions", content: "<p>Mock terms.</p>" } });
      dispatch({ type: "tncAccepted", tncId: "TNC-TEST-001" });
    }
    if (["preview", "verify", "retry"].includes(step) && !state.photo) {
      // A tiny 1px-ish demo photo so the guard allows preview/verify.
      const img = "R0lGODlhAQABAIAAAP///wAAACwAAAAAAQABAAACAkQBADs=";
      dispatch({
        type: "photoCaptured",
        photo: { objectUrl: `data:image/gif;base64,${img}`, base64: img },
        livenessMethod: "blink",
      });
    }
    dispatch({ type: "setStep", step });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40" role="dialog" aria-label="Dev panel">
      <div className="max-h-[80vh] w-full overflow-y-auto rounded-t-2xl bg-card p-4 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground">Dev panel (mock)</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="h-10 w-10 rounded-full border border-border">
            <X className="mx-auto h-4 w-4" />
          </button>
        </div>

        <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Jump to screen</p>
        <div className="mb-4 flex flex-wrap gap-2">
          {STEPS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => jump(s)}
              className="rounded-full border border-brand-purple px-3 py-2 text-xs font-medium text-brand-purple"
            >
              {s}
            </button>
          ))}
        </div>

        <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Force API status</p>
        <div className="mb-4 grid grid-cols-2 gap-2">
          {ENDPOINTS.map((ep) => (
            <label key={ep} className="flex items-center justify-between gap-2 rounded-lg border border-border px-2 py-1.5 text-xs">
              <span className="truncate">{ep}</span>
              <select
                className="rounded bg-muted px-1 py-0.5"
                defaultValue="none"
                onChange={(e) => setStatusOverride(ep, e.target.value === "none" ? null : e.target.value)}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>

        <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Force face result</p>
        <div className="mb-2 flex gap-2">
          {["none", "MATCHED", "RETRY", "FAILED"].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => {
                setFace(r);
                setFaceResultOverride(r === "none" ? null : (r as "MATCHED" | "RETRY" | "FAILED"));
              }}
              className={`rounded-full px-3 py-2 text-xs font-medium ${
                face === r ? "bg-brand-magenta text-white" : "border border-border text-foreground"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">Mock OTP: {mockOtpHint}</p>
      </div>
    </div>
  );
}
