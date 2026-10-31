/** Business-status mapping, in one place. HTTP is usually 200 even on business errors. */

export type StatusKind =
  | "ok"
  | "validation"
  | "authExpired"
  | "invalidLink"
  | "wrongState"
  | "linkExpired"
  | "invalidOtp"
  | "tooMany"
  | "system";

const MAP: Record<string, StatusKind> = {
  "200": "ok",
  "400": "validation",
  "401": "authExpired",
  "403": "authExpired",
  "404": "invalidLink",
  "409": "wrongState",
  "410": "linkExpired",
  "422": "invalidOtp",
  "429": "tooMany",
  // "500", "-2", "603", "604" and anything unknown fall through to "system".
};

export function classifyStatus(status: string): StatusKind {
  return MAP[status] ?? "system";
}

/** Show `message` only after stripping the "<code> : " prefix, e.g. "422 : Invalid OTP…". */
export function cleanMessage(message: string): string {
  return message.replace(/^\S+\s*:\s*/, "").trim();
}

/** The statuses for which we always show generic text, never the raw message. */
export function isSystemKind(kind: StatusKind): boolean {
  return kind === "system";
}
