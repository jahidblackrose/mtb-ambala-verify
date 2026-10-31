export type BridgeResult = "MATCHED" | "FAILED" | "EXPIRED";

export interface BridgePayload {
  type: "MTB_VERIFY_RESULT";
  applicationId: string;
  result: BridgeResult;
}

/**
 * Tell the retailer's native app the result. Sent once per flow end,
 * as a JSON string, to every bridge that exists.
 */
export function sendBridgeResult(applicationId: string, result: BridgeResult) {
  if (typeof window === "undefined") return;
  const payload: BridgePayload = { type: "MTB_VERIFY_RESULT", applicationId, result };
  const json = JSON.stringify(payload);
  try {
    window.ReactNativeWebView?.postMessage(json);
    window.webkit?.messageHandlers?.mtbVerify?.postMessage(json);
    window.AndroidBridge?.onVerificationResult?.(json);
    if (window.parent !== window) window.parent.postMessage(json, "*");
  } catch {
    // Bridge failures must never break the flow.
  }
}
