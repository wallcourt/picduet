"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const DEMO_PROMPT = "A cat astronaut floating in space, oil painting style";
const MODEL_A_NAME = "FLUX.2 Pro";
const MODEL_B_NAME = "GPT-5 Image";

type Phase =
  | "typing"
  | "pressing"
  | "loading"
  | "reveal"
  | "picking"
  | "model-reveal"
  | "hold"
  | "fading";

export default function DemoAnimation() {
  const [phase, setPhase] = useState<Phase>("typing");
  const [typedChars, setTypedChars] = useState(0);
  const [pickedSide, setPickedSide] = useState<"a" | "b" | null>(null);
  const [fading, setFading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const resetDemo = useCallback(() => {
    setFading(true);
    timerRef.current = setTimeout(() => {
      setPhase("typing");
      setTypedChars(0);
      setPickedSide(null);
      setFading(false);
    }, 500);
  }, []);

  // Phase machine
  useEffect(() => {
    clearTimers();

    switch (phase) {
      case "typing": {
        let i = 0;
        intervalRef.current = setInterval(() => {
          i++;
          setTypedChars(i);
          if (i >= DEMO_PROMPT.length) {
            clearInterval(intervalRef.current!);
            timerRef.current = setTimeout(() => setPhase("pressing"), 400);
          }
        }, 50);
        break;
      }
      case "pressing":
        timerRef.current = setTimeout(() => setPhase("loading"), 300);
        break;
      case "loading":
        timerRef.current = setTimeout(() => setPhase("reveal"), 2000);
        break;
      case "reveal":
        timerRef.current = setTimeout(() => setPhase("picking"), 200);
        break;
      case "picking":
        // Auto-pick after 2.5s if user hasn't clicked
        timerRef.current = setTimeout(() => {
          setPickedSide("a");
          timerRef.current = setTimeout(() => setPhase("model-reveal"), 600);
        }, 2500);
        break;
      case "model-reveal":
        timerRef.current = setTimeout(() => setPhase("hold"), 100);
        break;
      case "hold":
        timerRef.current = setTimeout(() => setPhase("fading"), 2500);
        break;
      case "fading":
        resetDemo();
        break;
    }

    return clearTimers;
  }, [phase, clearTimers, resetDemo]);

  const handlePick = useCallback(
    (side: "a" | "b") => {
      if (phase !== "picking" && phase !== "reveal") return;
      clearTimers();
      setPickedSide(side);
      timerRef.current = setTimeout(() => setPhase("model-reveal"), 600);
    },
    [phase, clearTimers]
  );

  const showImages = ["reveal", "picking", "model-reveal", "hold", "fading"].includes(phase);
  const showButtons = ["reveal", "picking"].includes(phase);
  const showModels = ["model-reveal", "hold", "fading"].includes(phase);
  const isLoading = phase === "loading";
  const promptText = DEMO_PROMPT.slice(0, typedChars);
  const showCursor = phase === "typing";

  return (
    <div
      className={`relative rounded-2xl border border-border bg-surface p-4 sm:p-5 transition-opacity duration-500 ${
        fading ? "animate-fade-out" : ""
      }`}
    >
      {/* Prompt bar */}
      <div className="rounded-xl border border-border bg-background px-4 py-3">
        <p className="min-h-[1.5rem] text-sm text-foreground">
          {promptText}
          {showCursor && (
            <span className="animate-cursor ml-px inline-block h-4 w-[2px] translate-y-[2px] bg-accent" />
          )}
          {!showCursor && typedChars === 0 && (
            <span className="text-tertiary">Describe your image...</span>
          )}
        </p>
      </div>

      {/* Generate button */}
      <button
        className={`mt-3 w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-accent-text transition-transform ${
          phase === "pressing" ? "scale-95" : ""
        }`}
        tabIndex={-1}
      >
        {isLoading ? "Generating..." : "Generate Duel"}
      </button>

      {/* Image cards */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        {/* Card A */}
        <div
          className={`rounded-xl border transition-colors ${
            pickedSide === "a" ? "border-2 border-winner" : "border-border"
          }`}
        >
          {/* Label */}
          <div className="flex items-center gap-2 px-3 py-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-xs font-medium text-foreground">
              {showModels ? (
                <span className="animate-reveal inline-block">{MODEL_A_NAME}</span>
              ) : (
                "Model A"
              )}
            </span>
          </div>

          {/* Image area */}
          <div
            className={`mx-2 mb-2 overflow-hidden rounded-lg ${
              isLoading ? "loading-gradient-border p-px" : ""
            }`}
          >
            <div className="aspect-square w-full">
              {isLoading ? (
                <div className="flex h-full items-center justify-center rounded-[7px] bg-surface">
                  <div className="relative h-10 w-10">
                    <svg className="loading-ring h-full w-full" viewBox="0 0 48 48" fill="none">
                      <circle cx="24" cy="24" r="20" stroke="var(--border-hover)" strokeWidth="2" />
                      <path
                        d="M44 24a20 20 0 01-20 20"
                        stroke="var(--text-secondary)"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                </div>
              ) : showImages ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src="/demo/demo-a.svg"
                  alt="Demo image A"
                  className="animate-demo-reveal h-full w-full rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-surface">
                  <svg
                    className="h-8 w-8 text-border-hover"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
                    />
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Pick button */}
          {showButtons && (
            <div className="px-2 pb-2">
              <button
                onClick={() => handlePick("a")}
                className="w-full rounded-lg border border-border px-3 py-1.5 text-xs text-muted transition-colors hover:border-border-hover hover:text-foreground"
              >
                Pick this one
              </button>
            </div>
          )}
          {pickedSide === "a" && !showButtons && (
            <div className="px-2 pb-2">
              <div className="w-full rounded-lg border border-winner bg-winner/10 px-3 py-1.5 text-center text-xs font-medium text-winner">
                Winner
              </div>
            </div>
          )}
        </div>

        {/* Card B */}
        <div
          className={`rounded-xl border transition-colors ${
            pickedSide === "b" ? "border-2 border-winner" : "border-border"
          }`}
        >
          {/* Label */}
          <div className="flex items-center gap-2 px-3 py-2">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            <span className="text-xs font-medium text-foreground">
              {showModels ? (
                <span className="animate-reveal inline-block">{MODEL_B_NAME}</span>
              ) : (
                "Model B"
              )}
            </span>
          </div>

          {/* Image area */}
          <div
            className={`mx-2 mb-2 overflow-hidden rounded-lg ${
              isLoading ? "loading-gradient-border p-px" : ""
            }`}
          >
            <div className="aspect-square w-full">
              {isLoading ? (
                <div className="flex h-full items-center justify-center rounded-[7px] bg-surface">
                  <div className="relative h-10 w-10">
                    <svg className="loading-ring h-full w-full" viewBox="0 0 48 48" fill="none">
                      <circle cx="24" cy="24" r="20" stroke="var(--border-hover)" strokeWidth="2" />
                      <path
                        d="M44 24a20 20 0 01-20 20"
                        stroke="var(--text-secondary)"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                </div>
              ) : showImages ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src="/demo/demo-b.svg"
                  alt="Demo image B"
                  className="animate-demo-reveal h-full w-full rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-surface">
                  <svg
                    className="h-8 w-8 text-border-hover"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
                    />
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Pick button */}
          {showButtons && (
            <div className="px-2 pb-2">
              <button
                onClick={() => handlePick("b")}
                className="w-full rounded-lg border border-border px-3 py-1.5 text-xs text-muted transition-colors hover:border-border-hover hover:text-foreground"
              >
                Pick this one
              </button>
            </div>
          )}
          {pickedSide === "b" && !showButtons && (
            <div className="px-2 pb-2">
              <div className="w-full rounded-lg border border-winner bg-winner/10 px-3 py-1.5 text-center text-xs font-medium text-winner">
                Winner
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
