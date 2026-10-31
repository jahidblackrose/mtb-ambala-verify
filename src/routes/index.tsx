import { createFileRoute, Link } from "@tanstack/react-router";
import { Link2Off } from "lucide-react";

/**
 * The app has a single entry: /v/<linkToken>. Any other path — including / —
 * shows the invalid / expired link screen (same as the router's 404 screen).
 */
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MTB Customer Verification — গ্রাহক যাচাই" },
      {
        name: "description",
        content: "Open your one-time verification link (/v/…) to start the MTB customer verification.",
      },
      { property: "og:title", content: "MTB Customer Verification — গ্রাহক যাচাই" },
      { property: "og:description", content: "Open your one-time verification link to start." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: InvalidEntry,
});

function InvalidEntry() {
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
      <Link to="/v" className="text-xs text-muted-foreground underline">
        /v
      </Link>
    </div>
  );
}
