import { SupabaseClient } from "@supabase/supabase-js";

export const PLAN_LIMITS: Record<string, number> = {
  starter: 50,
  pro: 200,
  power: 500,
};

export function priceToPlan(priceId: string): string | undefined {
  const mapping: Record<string, string> = {};
  const pairs: [string | undefined, string][] = [
    [process.env.STRIPE_PRICE_STARTER_MONTHLY, "starter"],
    [process.env.STRIPE_PRICE_STARTER_ANNUAL, "starter"],
    [process.env.STRIPE_PRICE_PRO_MONTHLY, "pro"],
    [process.env.STRIPE_PRICE_PRO_ANNUAL, "pro"],
    [process.env.STRIPE_PRICE_POWER_MONTHLY, "power"],
    [process.env.STRIPE_PRICE_POWER_ANNUAL, "power"],
  ];
  for (const [key, val] of pairs) {
    if (key) mapping[key] = val;
  }
  return mapping[priceId];
}

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  stripe_price_id: string;
  plan: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
}

export async function getSubscription(
  supabase: SupabaseClient,
  userId: string
): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .in("status", ["active", "past_due"])
    .single();

  if (error) {
    console.error("getSubscription error:", error.message, "userId:", userId);
    return null;
  }
  if (!data) return null;
  return data as Subscription;
}

export async function getUsage(
  supabase: SupabaseClient,
  userId: string,
  periodStart: string
): Promise<number> {
  const { count, error } = await supabase
    .from("generations")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", periodStart);

  if (error) {
    console.error("Usage count error:", error);
    return 0;
  }
  return count ?? 0;
}

export async function checkCanGenerate(
  supabase: SupabaseClient,
  userId: string
): Promise<
  | { allowed: true; subscription: Subscription; usage: { used: number; limit: number } }
  | { allowed: false; reason: "NO_SUBSCRIPTION" }
  | { allowed: false; reason: "USAGE_LIMIT"; usage: { used: number; limit: number } }
> {
  const subscription = await getSubscription(supabase, userId);
  if (!subscription) {
    return { allowed: false, reason: "NO_SUBSCRIPTION" };
  }

  const limit = PLAN_LIMITS[subscription.plan] ?? 0;
  const used = await getUsage(supabase, userId, subscription.current_period_start);

  if (used >= limit) {
    return { allowed: false, reason: "USAGE_LIMIT", usage: { used, limit } };
  }

  return { allowed: true, subscription, usage: { used, limit } };
}
