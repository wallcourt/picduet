export default function CTASection() {
  return (
    <section className="border-t border-border px-4 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
          Ready to duel?
        </h2>
        <p className="mt-4 text-lg text-muted">
          Find out which AI model matches your creative vision. Start your first
          blind image duel today.
        </p>

        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <a
            href="/pricing"
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-medium text-accent-text transition-opacity hover:opacity-90"
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
          <a
            href="/leaderboard"
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            View the leaderboard
          </a>
        </div>
      </div>

      {/* Minimal footer */}
      <div className="mt-20 border-t border-border pt-6 text-center text-xs text-tertiary">
        PicDuet &copy; {new Date().getFullYear()}
      </div>
    </section>
  );
}
