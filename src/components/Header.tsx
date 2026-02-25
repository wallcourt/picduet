"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface HeaderProps {
  onToggleHistory?: () => void;
}

export default function Header({ onToggleHistory }: HeaderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [plan, setPlan] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    fetch("/api/subscription")
      .then((res) => res.json())
      .then((data) => {
        if (data.subscription?.plan) {
          setPlan(data.subscription.plan);
        }
      })
      .catch(() => {});
  }, [supabase.auth]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  async function handleBilling() {
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      console.error("Failed to open billing portal");
    }
  }

  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto grid h-14 max-w-7xl grid-cols-3 items-center px-4 sm:px-6">
        {/* Left */}
        <div className="flex items-center gap-3">
          {onToggleHistory && (
            <button
              onClick={onToggleHistory}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              </svg>
            </button>
          )}
          <a
            href="/discover"
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            Discover
          </a>
          <a
            href="/leaderboard"
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            Leaderboard
          </a>
        </div>

        {/* Center */}
        <div className="flex justify-center">
          <a href="/generate">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="PicDuet" className="h-8" />
          </a>
        </div>

        {/* Right */}
        <div className="flex items-center justify-end gap-3">
          {user && (
            <>
              {plan && (
                <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-medium capitalize text-accent">
                  {plan}
                </span>
              )}
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-hover text-sm font-medium text-muted">
                {user.email?.[0]?.toUpperCase() || "?"}
              </div>
              <button
                onClick={handleBilling}
                className="text-sm text-muted transition-colors hover:text-foreground"
              >
                Billing
              </button>
              <button
                onClick={handleSignOut}
                className="text-sm text-muted transition-colors hover:text-foreground"
              >
                Sign out
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
