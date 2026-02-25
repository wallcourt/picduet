"use client";

import DemoAnimation from "./DemoAnimation";

const modelBadges = [
  "Gemini 3 Pro",
  "GPT-5 Image",
  "FLUX.2 Pro",
  "Seedream 4.5",
  "Recraft V3",
];

export default function HeroSection() {
  return (
    <section className="px-4 pb-16 pt-12 sm:pt-20">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
        {/* Text column */}
        <div>
          <h1 className="text-4xl font-bold leading-tight text-foreground sm:text-5xl">
            One prompt.
            <br />
            Two AI models.
            <br />
            <span className="text-muted">You pick the winner.</span>
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted">
            PicDuet generates images from two AI models side-by-side in a blind
            test. Compare, choose your favorite, then reveal which model made
            it.
          </p>

          <a
            href="/pricing"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-medium text-accent-text transition-opacity hover:opacity-90"
          >
            Start Your First Duel
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
              />
            </svg>
          </a>

          {/* Model badges */}
          <div className="mt-8 flex flex-wrap gap-2">
            {modelBadges.map((name) => (
              <span
                key={name}
                className="rounded-full border border-border px-3 py-1 text-xs text-muted"
              >
                {name}
              </span>
            ))}
          </div>
        </div>

        {/* Demo column */}
        <div className="w-full max-w-md lg:max-w-none">
          <DemoAnimation />
        </div>
      </div>
    </section>
  );
}
