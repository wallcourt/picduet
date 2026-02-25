"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { plans } from "@/lib/plans";
import type { User } from "@supabase/supabase-js";

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    fetch("/api/subscription")
      .then((res) => res.json())
      .then((data) => {
        if (data.subscription?.plan) {
          setCurrentPlan(data.subscription.plan);
        }
      })
      .catch(() => {});
  }, [supabase.auth]);

  async function handleSubscribe(planKey: string) {
    if (!user) {
      window.location.href = `/auth/login?next=/pricing`;
      return;
    }

    setLoadingPlan(planKey);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planKey, interval: annual ? "annual" : "monthly" }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      console.error("Failed to create checkout session");
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <div className="min-h-screen bg-background px-4 py-16">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center">
          <a href="/" className="inline-block mb-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/picduet-logo.png" alt="PicDuet" className="mx-auto h-12" />
          </a>
          <h1 className="text-3xl font-bold text-foreground">
            Choose your plan
          </h1>
          <p className="mt-3 text-muted">
            Pick a plan and start creating AI image duels.
          </p>
        </div>

        {/* Billing toggle */}
        <div className="mt-8 flex items-center justify-center gap-3">
          <span
            className={`text-sm ${!annual ? "text-foreground font-medium" : "text-muted"}`}
          >
            Monthly
          </span>
          <button
            onClick={() => setAnnual(!annual)}
            className={`relative h-6 w-11 rounded-full transition-colors ${
              annual ? "bg-accent" : "bg-surface-hover"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                annual ? "translate-x-5" : ""
              }`}
            />
          </button>
          <span
            className={`text-sm ${annual ? "text-foreground font-medium" : "text-muted"}`}
          >
            Annual
            <span className="ml-1.5 text-xs text-accent">Save 2 months</span>
          </span>
        </div>

        {/* Plan cards */}
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border p-6 ${
                plan.popular
                  ? "border-accent bg-surface"
                  : "border-border bg-surface"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-0.5 text-xs font-medium text-accent-text">
                  Most popular
                </div>
              )}

              <h2 className="text-lg font-semibold text-foreground">
                {plan.name}
              </h2>

              <div className="mt-4">
                <span className="text-3xl font-bold text-foreground">
                  ${annual ? Math.round(plan.annualPrice / 12) : plan.monthlyPrice}
                </span>
                <span className="text-muted">/mo</span>
                {annual && (
                  <p className="mt-1 text-xs text-muted">
                    ${plan.annualPrice}/year
                  </p>
                )}
              </div>

              <ul className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-sm text-muted"
                  >
                    <svg
                      className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 12.75l6 6 9-13.5"
                      />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan.key)}
                disabled={loadingPlan === plan.key || currentPlan === plan.key}
                className={`mt-8 w-full rounded-xl px-4 py-3 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50 ${
                  currentPlan === plan.key
                    ? "border border-accent bg-accent/10 text-accent cursor-default"
                    : plan.popular
                      ? "bg-accent text-accent-text"
                      : "border border-border bg-background text-foreground hover:bg-surface-hover"
                }`}
              >
                {currentPlan === plan.key
                  ? "Current Plan"
                  : loadingPlan === plan.key
                    ? "Redirecting..."
                    : currentPlan
                      ? "Switch Plan"
                      : "Subscribe"}
              </button>
            </div>
          ))}
        </div>

        {/* Footer link */}
        {user && (
          <p className="mt-8 text-center text-sm text-muted">
            Already subscribed?{" "}
            <a href="/generate" className="text-accent hover:underline">
              Go to app
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
