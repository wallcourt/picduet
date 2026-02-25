"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Generation {
  id: string;
  prompt: string;
  model_a: string;
  model_b: string;
  image_a_url: string | null;
  image_b_url: string | null;
  selected_winner: string | null;
  parent_id: string | null;
  created_at: string;
}

interface GenerationHistoryProps {
  onSelect: (generation: Generation) => void;
  refreshTrigger: number;
  onClose?: () => void;
}

export default function GenerationHistory({
  onSelect,
  refreshTrigger,
  onClose,
}: GenerationHistoryProps) {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchGenerations() {
      const { data } = await supabase
        .from("generations")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (data) setGenerations(data);
      setLoading(false);
    }
    fetchGenerations();
  }, [refreshTrigger, supabase]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="text-sm font-medium text-foreground">History</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center rounded text-muted transition-colors hover:text-foreground"
          >
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {loading ? (
          <div className="space-y-2 px-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-12 rounded-lg" />
            ))}
          </div>
        ) : generations.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <p className="text-xs text-tertiary">No generations yet</p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {generations.map((gen) => (
              <button
                key={gen.id}
                onClick={() => onSelect(gen)}
                className="group w-full rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-surface-hover"
              >
                <p className="truncate text-xs text-muted group-hover:text-foreground">
                  {gen.prompt}
                </p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="text-[10px] text-tertiary">
                    {new Date(gen.created_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {gen.parent_id && (
                    <span className="rounded bg-surface-hover px-1.5 py-0.5 text-[9px] font-medium text-tertiary">
                      refinement
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
