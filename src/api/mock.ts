import { config } from "@/config";
import { cleanMessage } from "./status";
import { getFaceResultOverride, getStatusOverride } from "./mockState";
import type { ApiName, DetailsData, FaceData, SendOtpData, SessionData, TermsData } from "./types";
import type { ApiResult } from "./client";

const MOCK_OTP = "123456";
const DELAY_MS = 450;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function fail(kind: string, message: string): ApiResult<never> {
  return { kind: kind as never, message: cleanMessage(message), correlationId: "mock" };
}

const session: SessionData = {
  applicationId: "APP-TEST-001",
  customerName: "Test Customer",
  mobileMasked: "017*****001",
  sessionState: "ACTIVE",
  linkExpiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  accessToken: "mock-access-token",
};

const details: DetailsData = {
  applicationId: "APP-TEST-001",
  customerName: "Test Customer",
  customerNameBn: "পরীক্ষা গ্রাহক",
  nidMasked: "XXXXXXX1234",
  dobMasked: "1990-**-**",
  mobileMasked: "017*****001",
  retailerName: "Test Shop",
};

const terms: TermsData = {
  tncId: "TNC-TEST-001",
  version: "1.0",
  title: "Terms & Conditions",
  content: `<h4>গ্রাহক যাচাই — শর্তাবলী (Terms &amp; Conditions)</h4>
<p>এই যাচাই প্রক্রিয়া সম্পন্ন করার মাধ্যমে আপনি নিম্নলিখিত শর্তাবলীতে সম্মত হচ্ছেন। / By completing this verification you agree to the following terms.</p>
<ol>
<li>প্রদত্ত তথ্য সঠিক ও সম্পূর্ণ। The information shown is accurate and complete.</li>
<li>ছবিটি জাতীয় পরিচয়পত্রের ছবির সাথে মিলিয়ে দেখা হবে। The live photo will be matched against the national ID photo.</li>
<li>এই যাচাই শুধুমাত্র নির্দিষ্ট আবেদনের জন্য প্রযোজ্য। This verification applies only to this application.</li>
<li>ব্যাংক প্রয়োজনে আবেদন বাতিল করতে পারে। The bank may cancel the application if needed.</li>
<li>ব্যক্তিগত তথ্য ব্যাংকের গোপনীয়তা নীতি অনুযায়ী সংরক্ষিত হবে। Personal data is retained under the bank's privacy policy.</li>
</ol>
<p>শর্তাবলী পড়ে সম্মত হলে এগিয়ে যান। Please accept to continue.</p>`,
};

const mockState = {
  otpSent: false,
  otpVerified: false,
  otpAttempts: 3,
  otpSends: 2,
  faceAttempts: 3,
};

function override(name: ApiName): ApiResult<never> | null {
  const s = getStatusOverride(name);
  if (!s) return null;
  const messages: Record<string, string> = {
    "404": "404 : Link not found",
    "401": "401 : Session expired",
    "410": "410 : Link or OTP expired",
    "422": "422 : Invalid OTP. Remaining attempts: 0",
    "429": "429 : Too many attempts",
    "500": "500 : Internal server error",
  };
  const kindMap: Record<string, string> = {
    "404": "invalidLink", "401": "authExpired", "410": "linkExpired",
    "422": "invalidOtp", "429": "tooMany", "500": "system", timeout: "system",
  };
  return fail(kindMap[s] ?? "system", messages[s] ?? `${s} : Mock error`);
}

/** Mock adapter following the same contract as the real API (section 6). */
export async function mockCall<T>(name: ApiName, body: unknown): Promise<ApiResult<T>> {
  await wait(DELAY_MS);
  const forced = override(name);
  if (forced) return forced as ApiResult<T>;

  switch (name) {
    case "session": {
      const s = getStatusOverride("session");
      if (s === "410" || s === "404" || s === "401") return forced ?? fail("invalidLink", `${s} : expired`);
      return { kind: "ok", data: { ...session, linkExpiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString() } as T };
    }
    case "sendotp": {
      mockState.otpSends -= 1;
      return {
        kind: "ok",
        data: {
          otpExpiresAt: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
          mobileMasked: details.mobileMasked,
        } as T,
      };
    }
    case "verifyotp": {
      const otp = (body as { otp?: string })?.otp;
      if (otp !== MOCK_OTP) {
        mockState.otpAttempts -= 1;
        if (mockState.otpAttempts <= 0) return fail("tooMany", "429 : Too many attempts");
        return fail("invalidOtp", `422 : Invalid OTP. Remaining attempts: ${mockState.otpAttempts}`);
      }
      mockState.otpVerified = true;
      return { kind: "ok", data: undefined as T };
    }
    case "details":
      return { kind: "ok", data: details as T };
    case "terms":
      return { kind: "ok", data: terms as T };
    case "face": {
      const forcedFace = getFaceResultOverride();
      const result = forcedFace ?? "MATCHED";
      if (result === "MATCHED") return { kind: "ok", data: { result: "MATCHED" } as T };
      if (result === "RETRY") {
        mockState.faceAttempts -= 1;
        if (mockState.faceAttempts <= 0) return { kind: "ok", data: { result: "FAILED" } as T };
        return { kind: "ok", data: { result: "RETRY", remainingAttempts: mockState.faceAttempts } as T };
      }
      return { kind: "ok", data: { result: "FAILED" } as T };
    }
    case "clienterror":
      return { kind: "ok", data: undefined as T };
  }
}

/** The OTP the mock accepts — used only by the dev panel hint. */
export const mockOtpHint = MOCK_OTP;

export function mockRemainingSends(): number {
  return Math.max(0, mockState.otpSends);
}

export function mockIsOtpVerified(): boolean {
  return mockState.otpVerified;
}

export function mockSessionState(state: "ACTIVE" | "OTP_VERIFIED") {
  session.sessionState = state;
}

export { config as mockConfigRef };
