import type { DetailsData, Liveness, SessionData, TermsData } from "@/api/types";

export type Step =
  | "loading"
  | "mobile"
  | "otp"
  | "details"
  | "camera"
  | "preview"
  | "verify"
  | "verifying"
  | "retry"
  | "success"
  | "failed"
  | "expired"
  | "error";

export interface Photo {
  objectUrl: string;
  base64: string;
}

export interface FlowState {
  step: Step;
  lang: "bn" | "en";
  applicationId: string;
  accessToken: string;
  linkExpiresAt: string | null;
  mobileMasked: string;
  otpExpiresAt: string | null;
  customerName: string;
  customerNameBn: string;
  nidMasked: string;
  dobMasked: string;
  retailerName: string;
  tncId: string | null;
  tncAccepted: boolean;
  photo: Photo | null;
  livenessMethod: Liveness["method"] | null;
  remainingAttempts: number | null;
  lastCorrelationId: string | null;
  lastAction: string | null;
  errorMessage: string | null;
  apiMessage: string | null;
}

export const initialState: FlowState = {
  step: "loading",
  lang: "bn",
  applicationId: "",
  accessToken: "",
  linkExpiresAt: null,
  mobileMasked: "",
  otpExpiresAt: null,
  customerName: "",
  customerNameBn: "",
  nidMasked: "",
  dobMasked: "",
  retailerName: "",
  tncId: null,
  tncAccepted: false,
  photo: null,
  livenessMethod: null,
  remainingAttempts: null,
  lastCorrelationId: null,
  lastAction: null,
  errorMessage: null,
  apiMessage: null,
};

export type FlowAction =
  | { type: "hydrateSession"; data: SessionData }
  | { type: "setStep"; step: Step }
  | { type: "setLang"; lang: "bn" | "en" }
  | { type: "otpSent"; otpExpiresAt: string; mobileMasked: string }
  | { type: "otpVerified" }
  | { type: "detailsLoaded"; details: DetailsData; terms: TermsData }
  | { type: "tncAccepted"; tncId: string }
  | { type: "photoCaptured"; photo: Photo; livenessMethod: Liveness["method"] }
  | { type: "discardPhoto" }
  | { type: "startVerify" }
  | { type: "faceRetry"; remainingAttempts: number | null; apiMessage: string | null }
  | { type: "faceMatched" }
  | { type: "faceFailed" }
  | { type: "expired" }
  | { type: "error"; message: string | null; apiMessage: string | null }
  | { type: "setLastAction"; action: string | null }
  | { type: "setCorrelationId"; id: string }
  | { type: "wipe" };

/** Guards: no camera without accepted terms, no verifying without a photo. */
function guardStep(state: FlowState, step: Step): Step {
  if (step === "camera" && !state.tncAccepted) return state.step;
  if ((step === "verifying" || step === "verify") && !state.photo) return state.step;
  return step;
}

export function flowReducer(state: FlowState, action: FlowAction): FlowState {
  switch (action.type) {
    case "hydrateSession":
      return {
        ...state,
        applicationId: action.data.applicationId,
        accessToken: action.data.accessToken,
        linkExpiresAt: action.data.linkExpiresAt,
        mobileMasked: action.data.mobileMasked,
        customerName: action.data.customerName,
        step: "loading",
      };
    case "setStep":
      return { ...state, step: guardStep(state, action.step) };
    case "setLang":
      return { ...state, lang: action.lang };
    case "otpSent":
      return { ...state, otpExpiresAt: action.otpExpiresAt, mobileMasked: action.mobileMasked, step: "otp" };
    case "otpVerified":
      return { ...state, step: "details", otpExpiresAt: null };
    case "detailsLoaded":
      return {
        ...state,
        applicationId: action.details.applicationId,
        customerName: action.details.customerName,
        customerNameBn: action.details.customerNameBn,
        nidMasked: action.details.nidMasked,
        dobMasked: action.details.dobMasked,
        mobileMasked: action.details.mobileMasked,
        retailerName: action.details.retailerName,
        tncId: action.terms.tncId,
      };
    case "tncAccepted":
      return { ...state, tncId: action.tncId, tncAccepted: true };
    case "photoCaptured":
      return { ...state, photo: action.photo, livenessMethod: action.livenessMethod, step: "preview" };
    case "discardPhoto":
      return { ...state, photo: null, livenessMethod: null, step: "camera" };
    case "startVerify":
      return state.photo ? { ...state, step: "verifying" } : state;
    case "faceRetry":
      return {
        ...state,
        step: "retry",
        remainingAttempts: action.remainingAttempts,
        apiMessage: action.apiMessage,
      };
    case "faceMatched":
      return { ...state, step: "success" };
    case "faceFailed":
      return { ...state, step: "failed" };
    case "expired":
      return { ...state, step: "expired", accessToken: "", otpExpiresAt: null };
    case "error":
      return { ...state, step: "error", errorMessage: action.message, apiMessage: action.apiMessage };
    case "setLastAction":
      return { ...state, lastAction: action.action };
    case "setCorrelationId":
      return { ...state, lastCorrelationId: action.id };
    case "wipe":
      return {
        ...state,
        accessToken: "",
        otpExpiresAt: null,
        photo: null,
        livenessMethod: null,
        remainingAttempts: null,
        errorMessage: null,
        apiMessage: null,
      };
    default:
      return state;
  }
}
