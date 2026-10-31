import { useEffect, useRef } from "react";

/**
 * 6-box OTP input: numeric keypad, auto-advance, backspace-to-previous,
 * paste support for the full code, autocomplete one-time-code.
 */
export function OtpInput({
  value,
  onChange,
  onComplete,
  disabled,
  shake,
}: {
  value: string;
  onChange: (v: string) => void;
  onComplete?: (v: string) => void;
  disabled?: boolean;
  shake?: boolean;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const completedRef = useRef(false);

  useEffect(() => {
    if (!disabled) refs.current[0]?.focus();
  }, [disabled]);

  useEffect(() => {
    if (value.length === 6 && !completedRef.current) {
      completedRef.current = true;
      onComplete?.(value);
    }
    if (value.length < 6) completedRef.current = false;
  }, [value, onComplete]);

  const setChar = (index: number, char: string) => {
    const digits = char.replace(/\D/g, "");
    if (!digits) return;
    const next = (value.padEnd(6, " ").substring(0, index) + digits + value.padEnd(6, " ").substring(index + digits.length))
      .replace(/ /g, "")
      .slice(0, 6);
    const focusIdx = Math.min(index + digits.length, 5);
    onChange(next);
    refs.current[focusIdx]?.focus();
  };

  return (
    <div className={shake ? "animate-otp-shake" : undefined}>
      <div className="flex justify-center gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={i === 0 ? 6 : 1}
            autoComplete={i === 0 ? "one-time-code" : "off"}
            aria-label={`OTP digit ${i + 1}`}
            disabled={disabled}
            value={value[i] ?? ""}
            onChange={(e) => setChar(i, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Backspace") {
                if (value[i]) {
                  onChange(value.slice(0, i) + value.slice(i + 1));
                } else if (i > 0) {
                  onChange(value.slice(0, i - 1) + value.slice(i));
                  refs.current[i - 1]?.focus();
                }
                e.preventDefault();
              }
              if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
              if (e.key === "ArrowRight" && i < 5) refs.current[i + 1]?.focus();
            }}
            onPaste={(e) => {
              const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
              if (digits) {
                e.preventDefault();
                onChange(digits);
                refs.current[Math.min(digits.length, 5)]?.focus();
              }
            }}
            onFocus={(e) => e.target.select()}
            className="h-14 w-12 rounded-xl border border-input bg-background text-center text-2xl font-bold text-foreground transition-colors focus:border-brand-magenta focus:outline-none focus:ring-2 focus:ring-brand-magenta/30 disabled:opacity-50"
          />
        ))}
      </div>
    </div>
  );
}
