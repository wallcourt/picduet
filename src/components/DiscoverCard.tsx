"use client";

import { useState } from "react";
import { DEFAULT_IMAGE_MODELS } from "@/lib/models";

interface DiscoverCardProps {
  generation: {
    id: string;
    prompt: string;
    model_a: string;
    model_b: string;
    image_a_url: string;
    image_b_url: string;
    votesA: number;
    votesB: number;
  };
  hasVoted: boolean;
  onVote: (generationId: string, votedFor: "a" | "b") => void;
}

function getModelName(modelId: string): string {
  const model = DEFAULT_IMAGE_MODELS.find((m) => m.id === modelId);
  return model?.name || modelId.split("/").pop() || modelId;
}

export default function DiscoverCard({
  generation,
  hasVoted,
  onVote,
}: DiscoverCardProps) {
  const [voted, setVoted] = useState<"a" | "b" | null>(null);
  const [tallies, setTallies] = useState({
    a: generation.votesA,
    b: generation.votesB,
  });
  const revealed = hasVoted || voted !== null;

  const totalVotes = tallies.a + tallies.b;
  const pctA = totalVotes > 0 ? Math.round((tallies.a / totalVotes) * 100) : 50;
  const pctB = totalVotes > 0 ? 100 - pctA : 50;

  async function handleVote(side: "a" | "b") {
    if (revealed) return;
    setVoted(side);
    onVote(generation.id, side);

    try {
      const res = await fetch("/api/community-vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ generationId: generation.id, votedFor: side }),
      });
      const data = await res.json();
      if (data.votesA !== undefined) {
        setTallies({ a: data.votesA, b: data.votesB });
      }
    } catch {
      // vote already recorded in UI
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden">
      {/* Prompt */}
      <div className="px-4 pt-4 pb-3">
        <p className="text-sm text-muted line-clamp-2">{generation.prompt}</p>
      </div>

      {/* Images side-by-side */}
      <div className="grid grid-cols-2 gap-px bg-border">
        {(["a", "b"] as const).map((side) => {
          const imageUrl =
            side === "a" ? generation.image_a_url : generation.image_b_url;
          const modelId =
            side === "a" ? generation.model_a : generation.model_b;
          const dotColor =
            side === "a" ? "bg-emerald-400" : "bg-amber-400";
          const pct = side === "a" ? pctA : pctB;
          const isChosen = voted === side;

          return (
            <div key={side} className="relative">
              {/* Image */}
              <div className="aspect-square w-full overflow-hidden bg-background">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt={revealed ? getModelName(modelId) : `Model ${side.toUpperCase()}`}
                  className="h-full w-full object-cover"
                />
              </div>

              {/* Vote button or revealed info */}
              <div className="px-3 py-2.5 bg-surface">
                {revealed ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${dotColor}`} />
                      <span className="animate-reveal text-xs font-medium text-foreground">
                        {getModelName(modelId)}
                      </span>
                    </div>
                    {/* Vote tally bar */}
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-background">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            side === "a" ? "bg-emerald-400" : "bg-amber-400"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs tabular-nums text-muted">
                        {pct}%
                      </span>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => handleVote(side)}
                    className={`w-full rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                      isChosen
                        ? "border-winner bg-winner/10 text-winner"
                        : "border-border text-muted hover:border-border-hover hover:text-foreground"
                    }`}
                  >
                    Model {side.toUpperCase()}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Total votes footer */}
      {revealed && totalVotes > 0 && (
        <div className="px-4 py-2 text-center">
          <span className="text-xs text-tertiary">
            {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
          </span>
        </div>
      )}
    </div>
  );
}
