import type { ApiName } from "./types";

/**
 * In-memory overrides for the hidden dev panel (mock mode only).
 * Never touch storage; this lives and dies with the page.
 */

const statusOverrides = new Map<ApiName, string>();

export function setStatusOverride(name: ApiName, status: string | null) {
  if (status == null) statusOverrides.delete(name);
  else statusOverrides.set(name, status);
}

export function getStatusOverride(name: ApiName): string | null {
  return statusOverrides.get(name) ?? null;
}

let faceResultOverride: "MATCHED" | "RETRY" | "FAILED" | null = null;

export function setFaceResultOverride(result: "MATCHED" | "RETRY" | "FAILED" | null) {
  faceResultOverride = result;
}

export function getFaceResultOverride() {
  return faceResultOverride;
}

/** Force face results from the URL: ?mock=fail or ?mock=final-fail. */
export function applyMockUrlParams(search: string) {
  const force = new URLSearchParams(search).get("mock");
  if (force === "fail") setFaceResultOverride("RETRY");
  if (force === "final-fail") setFaceResultOverride("FAILED");
}
