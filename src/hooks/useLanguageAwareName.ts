import { useFlow } from "@/flow/FlowProvider";

/**
 * Customer name order: customerNameBn first in Bangla mode, customerName
 * (English) first in English mode; both shown when both are non-empty.
 */
export function useLanguageAwareName(): string {
  const { state, lang } = useFlow();
  const bn = state.customerNameBn?.trim();
  const en = state.customerName?.trim();
  if (bn && en) return lang === "bn" ? `${bn} (${en})` : `${en} (${bn})`;
  return bn || en || "—";
}
