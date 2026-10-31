interface ImportMetaEnv {
  readonly VITE_API_BASE?: string;
  readonly VITE_USE_MOCK?: string;
  readonly VITE_ALLOW_LIVENESS_FALLBACK?: string;
  readonly VITE_APP_VERSION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

const flag = (v: string | undefined, dflt: string) => (v ?? dflt) === "true";

export const config = {
  /** MTB REST API base, e.g. https://api.mtb.example/ambala/api/v1 */
  apiBase: import.meta.env.VITE_API_BASE ?? "",
  /** Mock mode: required in preview, off in production. */
  useMock: flag(import.meta.env.VITE_USE_MOCK, "true"),
  /** Allow capture without the blink check if the face model can't load. */
  allowLivenessFallback: flag(import.meta.env.VITE_ALLOW_LIVENESS_FALLBACK, "true"),
  /** Sent as the X-App-Version header. */
  appVersion: import.meta.env.VITE_APP_VERSION ?? "1.0.0",
} as const;
