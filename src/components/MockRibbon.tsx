import { config } from "@/config";

/** Small corner ribbon shown only in mock mode. */
export function MockRibbon() {
  if (!config.useMock) return null;
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed right-0 top-[calc(env(safe-area-inset-top)+92px)] z-40 rotate-45 rounded bg-amber-500 px-6 py-0.5 text-[10px] font-bold tracking-widest text-white shadow"
    >
      MOCK
    </div>
  );
}
