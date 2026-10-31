import { useEffect, useRef } from "react";

/**
 * Handle the Android hardware back button and the browser back button.
 * A dummy history state is pushed so back always triggers onBack
 * instead of leaving the flow; the guard re-arms after every pop.
 */
export function useBackButton(enabled: boolean, onBack: () => void) {
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    let active = true;

    const push = () => window.history.pushState({ mtbBackGuard: true }, "", window.location.href);
    push();

    const onPop = (e: PopStateEvent) => {
      if (!active) return;
      // After a successful verify, back does nothing: re-arm and stay.
      onBackRef.current();
      if (active) push();
    };

    window.addEventListener("popstate", onPop);
    return () => {
      active = false;
      window.removeEventListener("popstate", onPop);
    };
  }, [enabled]);
}
