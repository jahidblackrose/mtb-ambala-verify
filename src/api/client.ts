import { config } from "@/config";
import { detectPlatform } from "@/lib/platform";
import { classifyStatus, cleanMessage, type StatusKind } from "./status";
import { mockCall } from "./mock";
import type { ApiName } from "./types";

export type ApiResult<T> =
  | { kind: "ok"; data: T }
  | { kind: Exclude<StatusKind, "ok">; message: string; correlationId: string };

export interface CallOptions {
  /** Bearer accessToken; omitted for Verify/session. */
  accessToken?: string;
  /** Current UI language, sent as Accept-Language. */
  lang: "bn" | "en";
  /** Timeout override; 20 s default, 60 s for face. */
  timeoutMs?: number;
}

const IDEMPOTENT: ApiName[] = ["session", "details", "terms"];

function endpointPath(name: ApiName): string {
  return `${config.apiBase}/Verify/${name}`;
}

function newCorrelationId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `cid-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function requestTimestamp(): string {
  const now = new Date();
  const offsetMinutes = -now.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const abs = Math.abs(offsetMinutes);
  const pad = (n: number) => String(n).padStart(2, "0");
  const tz = `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
  const local = new Date(now.getTime() - offsetMinutes * 60_000);
  return `${local.toISOString().slice(0, 19)}${tz}`;
}

/** Strip the data: prefix risk and trim the stack for clienterror reporting. */
export function trimStack(stack: string): string {
  return stack.slice(0, 2000);
}

async function singleCall<T>(name: ApiName, body: unknown, opts: CallOptions, correlationId: string): Promise<ApiResult<T>> {
  if (config.useMock) {
    try {
      return await mockCall<T>(name, body);
    } catch {
      return { kind: "system", message: "network", correlationId };
    }
  }

  const controller = new AbortController();
  const timeout = opts.timeoutMs ?? 20_000;
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Correlation-Id": correlationId,
      "X-Request-Timestamp": requestTimestamp(),
      "X-App-Version": config.appVersion,
      "X-Client-Platform": detectPlatform(),
      "Accept-Language": opts.lang,
    };
    if (opts.accessToken) headers["Authorization"] = `Bearer ${opts.accessToken}`;

    const res = await fetch(endpointPath(name), {
      method: "POST",
      headers,
      body: JSON.stringify(body ?? {}),
      credentials: "omit",
      cache: "no-store",
      redirect: "error",
      referrerPolicy: "no-referrer",
      mode: "cors",
      signal: controller.signal,
    });

    const contentType = res.headers.get("Content-Type") ?? "";
    if (!contentType.includes("json")) {
      return { kind: "system", message: "non-json", correlationId };
    }

    const parsed = (await res.json()) as { status?: string; message?: string; data?: T };
    const status = String(parsed.status ?? "");
    const kind = classifyStatus(status);

    if (kind === "ok") return { kind: "ok", data: (parsed.data ?? ({} as T)) as T };

    // Some servers mirror business status in the HTTP code.
    const httpKind = res.status === 401 || res.status === 403 ? "authExpired" : res.status === 404 ? "invalidLink" : res.status === 410 ? "linkExpired" : res.status === 429 ? "tooMany" : null;
    const effective = httpKind ?? kind;
    return {
      kind: effective as Exclude<StatusKind, "ok">,
      message: cleanMessage(parsed.message ?? ""),
      correlationId,
    };
  } catch (err) {
    const aborted = err instanceof DOMException && err.name === "AbortError";
    return { kind: "system", message: aborted ? "timeout" : "network", correlationId };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * The single API entry point. Every request goes through this:
 * headers per section 5, timeouts, one automatic retry for idempotent reads
 * on network failures only, and business-status mapping via classifyStatus.
 */
export async function apiPost<T>(name: ApiName, body: unknown, opts: CallOptions): Promise<ApiResult<T>> {
  const correlationId = newCorrelationId();
  const result = await singleCall<T>(name, body, opts, correlationId);

  // One automatic retry for idempotent reads on network errors / timeouts. Never for OTP or face.
  if (
    result.kind === "system" &&
    IDEMPOTENT.includes(name) &&
    (result.message === "network" || result.message === "timeout")
  ) {
    await new Promise((r) => setTimeout(r, 500));
    return singleCall<T>(name, body, opts, correlationId);
  }

  return result;
}
