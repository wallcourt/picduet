"use client";

import { useEffect, useState, useCallback } from "react";
import Header from "@/components/Header";
import DiscoverCard from "@/components/DiscoverCard";

interface DiscoverItem {
  id: string;
  prompt: string;
  model_a: string;
  model_b: string;
  image_a_url: string;
  image_b_url: string;
  created_at: string;
  votesA: number;
  votesB: number;
}

const VOTED_KEY = "picduet-voted";

function getVotedIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(VOTED_KEY) || "[]");
  } catch {
    return [];
  }
}

function addVotedId(id: string) {
  const ids = getVotedIds();
  if (!ids.includes(id)) {
    ids.push(id);
    localStorage.setItem(VOTED_KEY, JSON.stringify(ids));
  }
}

export default function DiscoverPage() {
  const [items, setItems] = useState<DiscoverItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [votedIds, setVotedIds] = useState<string[]>([]);

  useEffect(() => {
    setVotedIds(getVotedIds());
  }, []);

  const fetchFeed = useCallback(
    async (cursorParam?: string) => {
      setLoading(true);
      try {
        const url = new URL("/api/discover", window.location.origin);
        if (cursorParam) url.searchParams.set("cursor", cursorParam);
        url.searchParams.set("limit", "20");

        const res = await fetch(url.toString());
        const data = await res.json();

        if (data.items) {
          setItems((prev) =>
            cursorParam ? [...prev, ...data.items] : data.items
          );
          setCursor(data.nextCursor);
          setHasMore(!!data.nextCursor);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  function handleVote(generationId: string) {
    addVotedId(generationId);
    setVotedIds((prev) => [...prev, generationId]);
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground">Discover</h1>
          <p className="mt-1 text-sm text-muted">
            Browse community duels and vote for your favorites. Models are
            revealed after you pick.
          </p>
        </div>

        {loading && items.length === 0 ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-80 rounded-2xl" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface px-6 py-16 text-center">
            <p className="text-muted">
              No public duels yet. Share a duel to see it here!
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-6">
              {items.map((item) => (
                <DiscoverCard
                  key={item.id}
                  generation={item}
                  hasVoted={votedIds.includes(item.id)}
                  onVote={handleVote}
                />
              ))}
            </div>

            {hasMore && (
              <div className="mt-8 flex justify-center">
                <button
                  onClick={() => cursor && fetchFeed(cursor)}
                  disabled={loading}
                  className="rounded-xl border border-border px-6 py-2.5 text-sm text-muted transition-colors hover:border-border-hover hover:text-foreground disabled:opacity-50"
                >
                  {loading ? "Loading..." : "Load more"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
