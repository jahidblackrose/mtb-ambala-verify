/** Shapes returned by the MTB API (`data` on a "200" status). */

export interface SessionData {
  applicationId: string;
  customerName: string;
  mobileMasked: string;
  sessionState: string; // "ACTIVE" | "OTP_VERIFIED" | closed states
  linkExpiresAt: string; // ISO-8601
  accessToken: string;
}

export interface SendOtpData {
  otpExpiresAt: string;
  mobileMasked: string;
}

export interface DetailsData {
  applicationId: string;
  customerName: string;
  customerNameBn: string;
  nidMasked: string;
  dobMasked: string; // "YYYY-**-**"
  mobileMasked: string;
  retailerName: string;
}

export interface TermsData {
  tncId: string;
  version: string;
  title: string;
  content: string; // may be HTML; always sanitized before render
}

export interface Liveness {
  passed: boolean;
  method: "blink" | "fallback";
}

export interface FaceData {
  result: "MATCHED" | "RETRY" | "FAILED";
  remainingAttempts?: number;
}

export type ApiName =
  | "session"
  | "sendotp"
  | "verifyotp"
  | "details"
  | "terms"
  | "face"
  | "clienterror";
