import { Link2Off } from "lucide-react";

/**
 * Shown for any URL that isn't /v/<token> (the router's not-found screen).
 * Same content as the in-flow Expired screen.
 */
export function InvalidScreen() {
  return (
    <div className="mx-auto flex h-[100dvh] w-full max-w-[480px] flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-amber-500/10">
        <Link2Off className="h-16 w-16 text-amber-500" aria-hidden />
      </div>
      <h1 className="text-xl font-bold text-foreground">লিংকটির মেয়াদ শেষ বা সঠিক নয়</h1>
      <h2 className="text-lg font-semibold text-foreground">This link has expired or is invalid</h2>
      <p className="max-w-xs text-sm text-muted-foreground">
        অনুগ্রহ করে নতুন লিংক নিন। / Please ask for a new link.
      </p>
    </div>
  );
}
