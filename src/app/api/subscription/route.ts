import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getSubscription, getUsage, PLAN_LIMITS } from "@/lib/subscription";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceClient = createServiceClient();
  const subscription = await getSubscription(serviceClient, user.id);
  if (!subscription) {
    return NextResponse.json({ subscription: null });
  }

  const used = await getUsage(serviceClient, user.id, subscription.current_period_start);
  const limit = PLAN_LIMITS[subscription.plan] ?? 0;

  return NextResponse.json({
    subscription: {
      plan: subscription.plan,
      status: subscription.status,
      cancel_at_period_end: subscription.cancel_at_period_end,
      current_period_end: subscription.current_period_end,
    },
    usage: { used, limit },
  });
}
