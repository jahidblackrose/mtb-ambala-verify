export type ClientPlatform = "webview-android" | "webview-ios" | "web";

/** Detect the platform string sent as the X-Client-Platform header. */
export function detectPlatform(): ClientPlatform {
  if (typeof navigator === "undefined") return "web";
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) {
    // Android WebView UAs contain "; wv)".
    return /;\s*wv\)/i.test(ua) ? "webview-android" : "web";
  }
  if (/iPhone|iPad|iPod/i.test(ua)) {
    // iOS WebViews report like Safari but without the "Safari/" token.
    return /Safari\/[\d.]+$/.test(ua) ? "web" : "webview-ios";
  }
  return "web";
}
