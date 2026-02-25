"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";

interface ModelStats {
  modelId: string;
  modelName: string;
  provider: string;
  wins: number;
  losses: number;
  winRate: number;
  matches: number;
  elo: number;
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<ModelStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setLeaderboard(data);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground">
            Model Leaderboard
          </h1>
          <p className="mt-1 text-sm text-muted">
            ELO rankings from head-to-head image generation duels. Minimum 5
            matches to qualify.
          </p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton h-14 rounded-xl" />
            ))}
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface px-6 py-16 text-center">
            <p className="text-muted">
              Not enough data yet. Start some duels and pick winners!
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-tertiary">
                    Rank
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-tertiary">
                    Model
                  </th>
                  <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-tertiary sm:table-cell">
                    Provider
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-tertiary">
                    ELO
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-tertiary">
                    W-L
                  </th>
                  <th className="hidden px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-tertiary sm:table-cell">
                    Matches
                  </th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((model, index) => (
                  <tr
                    key={model.modelId}
                    className="border-b border-border last:border-0 transition-colors hover:bg-surface-hover"
                  >
                    <td className="px-4 py-3">
                      <span
                        className={`text-sm font-semibold ${
                          index === 0
                            ? "text-amber-400"
                            : index === 1
                            ? "text-zinc-400"
                            : index === 2
                            ? "text-amber-600"
                            : "text-tertiary"
                        }`}
                      >
                        #{index + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-foreground">
                        {model.modelName}
                      </span>
                      <span className="ml-2 text-xs text-tertiary sm:hidden">
                        {model.provider}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <span className="text-sm text-muted">
                        {model.provider}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-semibold tabular-nums text-foreground">
                        {model.elo}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm text-muted">
                        <span className="text-winner">{model.wins}</span>
                        {"-"}
                        <span className="text-red-400">{model.losses}</span>
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 text-right sm:table-cell">
                      <span className="text-sm text-tertiary">
                        {model.matches}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
