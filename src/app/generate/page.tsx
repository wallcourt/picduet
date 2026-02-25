"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import AuthGuard from "@/components/AuthGuard";
import Header from "@/components/Header";
import PromptInput from "@/components/PromptInput";
import ImageDuel from "@/components/ImageDuel";
import GenerationHistory from "@/components/GenerationHistory";
import { DEFAULT_IMAGE_MODELS } from "@/lib/models";

interface GenerationResult {
  id?: string;
  prompt: string;
  modelA: string;
  modelB: string;
  imageA: string | null;
  imageB: string | null;
  errorA?: string;
  errorB?: string;
}

interface UsageInfo {
  used: number;
  limit: number;
}

interface EnhanceReview {
  original: string;
  enhanced: string;
}

export default function GeneratePage() {
  const [loading, setLoading] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [selectedWinner, setSelectedWinner] = useState<"a" | "b" | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [refreshHistory, setRefreshHistory] = useState(0);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [refinementSource, setRefinementSource] = useState<string | null>(null);
  const [enhance, setEnhance] = useState(false);
  const [modelA, setModelA] = useState(DEFAULT_IMAGE_MODELS[0].id);
  const [modelB, setModelB] = useState(
    DEFAULT_IMAGE_MODELS.length > 1
      ? DEFAULT_IMAGE_MODELS[1].id
      : DEFAULT_IMAGE_MODELS[0].id
  );
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [usageBanner, setUsageBanner] = useState<string | null>(null);
  const [enhanceReview, setEnhanceReview] = useState<EnhanceReview | null>(null);
  const [promptOverride, setPromptOverride] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState<"idle" | "sharing" | "copied">("idle");
  const shareTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Fetch usage on mount
  useEffect(() => {
    fetch("/api/subscription")
      .then((res) => res.json())
      .then((data) => {
        if (data.usage) {
          setUsage(data.usage);
        }
      })
      .catch(() => {});
  }, []);

  // The actual generation call — used after prompt is finalized
  const proceedWithGeneration = useCallback(
    async (finalPrompt: string) => {
      setLoading(true);
      setSelectedWinner(null);
      setIsRevealed(false);
      setUsageBanner(null);
      setEnhanceReview(null);

      const sourceImage = refinementSource || uploadedImages[0] || undefined;

      setResult({ prompt: finalPrompt, modelA, modelB, imageA: null, imageB: null });

      try {
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: finalPrompt,
            modelA,
            modelB,
            ...(sourceImage && { sourceImage }),
            ...(refinementSource && result?.id && { parentId: result.id }),
          }),
        });

        if (response.status === 403) {
          const errorData = await response.json();
          if (errorData.code === "NO_SUBSCRIPTION") {
            window.location.href = "/pricing";
            return;
          }
          if (errorData.code === "USAGE_LIMIT") {
            setUsageBanner(
              `You've used ${errorData.usage.used} of ${errorData.usage.limit} duels this month.`
            );
            setUsage(errorData.usage);
            setResult(null);
            return;
          }
        }

        const data = await response.json();

        setResult({
          id: data.id,
          prompt: finalPrompt,
          modelA,
          modelB,
          imageA: data.imageA,
          imageB: data.imageB,
          errorA: data.errorA,
          errorB: data.errorB,
        });
        setRefreshHistory((prev) => prev + 1);

        // Update usage counter
        if (usage) {
          setUsage({ ...usage, used: usage.used + 1 });
        }

        setRefinementSource(null);
        setUploadedImages([]);
        setPromptOverride(null);
      } catch {
        setResult({
          prompt: finalPrompt,
          modelA,
          modelB,
          imageA: null,
          imageB: null,
          errorA: "Request failed",
          errorB: "Request failed",
        });
      } finally {
        setLoading(false);
      }
    },
    [modelA, modelB, refinementSource, uploadedImages, result?.id, usage]
  );

  const handleGenerate = useCallback(
    async (prompt: string, shouldEnhance: boolean) => {
      setUsageBanner(null);

      if (shouldEnhance) {
        // Phase 1: Enhance the prompt, then show review panel
        setEnhancing(true);
        const sourceImage = refinementSource || uploadedImages[0] || undefined;
        try {
          const enhanceRes = await fetch("/api/enhance-prompt", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt,
              ...(sourceImage && { sourceImage }),
            }),
          });
          const enhanceData = await enhanceRes.json();
          if (enhanceData.enhancedPrompt) {
            setEnhanceReview({
              original: prompt,
              enhanced: enhanceData.enhancedPrompt,
            });
          } else {
            // Enhancement returned nothing — go straight to generation
            proceedWithGeneration(prompt);
          }
        } catch {
          // Enhancement failed — go straight to generation
          console.warn("Enhancement failed, using original prompt");
          proceedWithGeneration(prompt);
        } finally {
          setEnhancing(false);
        }
      } else {
        // No enhance — generate immediately
        proceedWithGeneration(prompt);
      }
    },
    [refinementSource, uploadedImages, proceedWithGeneration]
  );

  const handleShare = useCallback(async () => {
    if (!result?.id || shareStatus === "sharing") return;
    setShareStatus("sharing");
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ generationId: result.id }),
      });
      const data = await res.json();
      if (data.shareUrl) {
        await navigator.clipboard.writeText(
          `${window.location.origin}${data.shareUrl}`
        );
        setShareStatus("copied");
        clearTimeout(shareTimeout.current);
        shareTimeout.current = setTimeout(() => setShareStatus("idle"), 2000);
      } else {
        setShareStatus("idle");
      }
    } catch {
      setShareStatus("idle");
    }
  }, [result?.id, shareStatus]);

  const handleSelectWinner = useCallback(
    async (winner: "a" | "b") => {
      setSelectedWinner(winner);
      setIsRevealed(true);
      const winnerImage =
        winner === "a" ? result?.imageA : result?.imageB;
      if (winnerImage) {
        setRefinementSource(winnerImage);
        setPromptOverride("");
      }
      // Persist winner to DB
      if (result?.id) {
        try {
          await fetch("/api/vote", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ generationId: result.id, winner }),
          });
        } catch {
          console.warn("Failed to save vote");
        }
      }
    },
    [result]
  );

  const handleSelectHistory = useCallback(
    (gen: {
      prompt: string;
      model_a: string;
      model_b: string;
      image_a_url: string | null;
      image_b_url: string | null;
      id: string;
      selected_winner: string | null;
    }) => {
      setModelA(gen.model_a);
      setModelB(gen.model_b);
      setResult({
        id: gen.id,
        prompt: gen.prompt,
        modelA: gen.model_a,
        modelB: gen.model_b,
        imageA: gen.image_a_url,
        imageB: gen.image_b_url,
      });
      const winner =
        gen.selected_winner === "a" || gen.selected_winner === "b"
          ? gen.selected_winner
          : null;
      setSelectedWinner(winner);
      setIsRevealed(!!winner);
      setRefinementSource(null);
      setUploadedImages([]);
      setHistoryOpen(false);
    },
    []
  );

  return (
    <AuthGuard>
      <div className="flex h-screen flex-col bg-background">
        <Header onToggleHistory={() => setHistoryOpen((prev) => !prev)} />

        <div className="flex flex-1 overflow-hidden">
          {/* History sidebar */}
          {historyOpen && (
            <aside className="w-64 shrink-0 border-r border-border bg-background overflow-y-auto">
              <GenerationHistory
                onSelect={handleSelectHistory}
                refreshTrigger={refreshHistory}
                onClose={() => setHistoryOpen(false)}
              />
            </aside>
          )}

          {/* Main content */}
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Scrollable center area: cards + input */}
            <div className="flex-1 overflow-y-auto">
              <div className="mx-auto max-w-5xl px-6 py-8 sm:px-8">
                {/* Usage limit banner */}
                {usageBanner && (
                  <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-center text-sm text-amber-200">
                    {usageBanner}{" "}
                    <a
                      href="/pricing"
                      className="font-medium text-accent underline"
                    >
                      Upgrade your plan
                    </a>
                  </div>
                )}

                {/* Model cards - always visible */}
                <ImageDuel
                  imageA={result?.imageA ?? null}
                  imageB={result?.imageB ?? null}
                  errorA={result?.errorA}
                  errorB={result?.errorB}
                  modelA={modelA}
                  modelB={modelB}
                  loading={loading}
                  selectedWinner={selectedWinner}
                  onSelectWinner={handleSelectWinner}
                  onModelAChange={setModelA}
                  onModelBChange={setModelB}
                  revealed={isRevealed}
                />

                {/* Share button */}
                {result?.id && selectedWinner && !loading && (
                  <div className="mt-4 flex justify-center">
                    <button
                      onClick={handleShare}
                      disabled={shareStatus === "sharing"}
                      className="flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm text-muted transition-colors hover:border-border-hover hover:text-foreground disabled:opacity-50"
                    >
                      {shareStatus === "copied" ? (
                        <>
                          <svg className="h-4 w-4 text-winner" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                          Link copied!
                        </>
                      ) : shareStatus === "sharing" ? (
                        "Creating link..."
                      ) : (
                        <>
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                          </svg>
                          Share this duel
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Input below the cards */}
                <div className="mt-8">
                  {/* Usage indicator */}
                  {usage && (
                    <div className="mb-3 text-center text-xs text-muted">
                      {usage.limit - usage.used} duels remaining
                    </div>
                  )}

                  {/* Enhanced prompt review panel */}
                  {enhanceReview && (
                    <div className="mb-4 rounded-2xl border border-border bg-surface p-5">
                      <div className="mb-3 flex items-center gap-2 text-xs font-medium text-muted">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                        </svg>
                        Enhanced Prompt
                      </div>
                      <p className="text-sm leading-relaxed text-foreground">
                        {enhanceReview.enhanced}
                      </p>
                      <p className="mt-3 text-xs text-muted">
                        <span className="text-tertiary">Your prompt:</span>{" "}
                        {enhanceReview.original}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          onClick={() => proceedWithGeneration(enhanceReview.enhanced)}
                          className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-text transition-opacity hover:opacity-90"
                        >
                          Use Enhanced
                        </button>
                        <button
                          onClick={() => proceedWithGeneration(enhanceReview.original)}
                          className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover"
                        >
                          Use Original
                        </button>
                        <button
                          onClick={() => {
                            setPromptOverride(enhanceReview.enhanced);
                            setEnhanceReview(null);
                          }}
                          className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  )}

                  <PromptInput
                    onSubmit={handleGenerate}
                    loading={loading || enhancing}
                    defaultPrompt={promptOverride !== null ? promptOverride : (result?.prompt || "")}
                    refinementSource={refinementSource}
                    enhance={enhance}
                    onToggleEnhance={() => setEnhance((prev) => !prev)}
                    onClearRefinement={() => {
                      setRefinementSource(null);
                      setSelectedWinner(null);
                      setPromptOverride(null);
                    }}
                    uploadedImages={uploadedImages}
                    onUploadImage={(dataUrl) =>
                      setUploadedImages((prev) => [...prev, dataUrl])
                    }
                    onRemoveImage={(index) =>
                      setUploadedImages((prev) =>
                        prev.filter((_, i) => i !== index)
                      )
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
