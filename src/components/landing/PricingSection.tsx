"use client";

import { useState } from "react";
import { plans } from "@/lib/plans";

export default function PricingSection() {
  const [annual, setAnnual] = useState(false);

  return (
    <section className="border-t border-border px-4 py-20">
      <div className="mx-auto max-w-4xl">
        <h2 className="text-center text-2xl font-bold text-foreground sm:text-3xl">
          Simple pricing
        </h2>
        <p className="mt-3 text-center text-muted">
          Pick a plan and start creating AI image duels.
        </p>

        {/* Billing toggle */}
        <div className="mt-8 flex items-center justify-center gap-3">
          <span
            className={`text-sm ${!annual ? "font-medium text-foreground" : "text-muted"}`}
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
            className={`text-sm ${annual ? "font-medium text-foreground" : "text-muted"}`}
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

              <h3 className="text-lg font-semibold text-foreground">
                {plan.name}
              </h3>

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

              <a
                href="/pricing"
                className={`mt-8 block w-full rounded-xl px-4 py-3 text-center text-sm font-medium transition-opacity hover:opacity-90 ${
                  plan.popular
                    ? "bg-accent text-accent-text"
                    : "border border-border bg-background text-foreground hover:bg-surface-hover"
                }`}
              >
                Get Started
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
