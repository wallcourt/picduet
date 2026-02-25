import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

function getPriceId(plan: string, interval: string): string | undefined {
  const prices: Record<string, Record<string, string | undefined>> = {
    starter: {
      monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY,
      annual: process.env.STRIPE_PRICE_STARTER_ANNUAL,
    },
    pro: {
      monthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
      annual: process.env.STRIPE_PRICE_PRO_ANNUAL,
    },
    power: {
      monthly: process.env.STRIPE_PRICE_POWER_MONTHLY,
      annual: process.env.STRIPE_PRICE_POWER_ANNUAL,
    },
  };
  return prices[plan]?.[interval];
}

export async function POST(request: NextRequest) {
  const rl = rateLimit(request, { window: 60, max: 10 });
  if (!rl.success) return rateLimitResponse();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!user.email) {
    return NextResponse.json({ error: "User email is required" }, { status: 400 });
  }

  const { plan, interval } = await request.json();

  const priceId = getPriceId(plan, interval);
  if (!priceId) {
    return NextResponse.json({ error: "Invalid plan or interval" }, { status: 400 });
  }

  try {
    // Look up existing Stripe customer or create one
    const customers = await getStripe().customers.list({
      email: user.email,
      limit: 1,
    });

    let customerId: string;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await getStripe().customers.create({
        email: user.email,
        metadata: { user_id: user.id },
      });
      customerId = customer.id;
    }

    const origin = request.headers.get("origin") || request.headers.get("referer")?.replace(/\/[^/]*$/, "") || "";

    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/generate?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing`,
      metadata: { user_id: user.id },
      subscription_data: {
        metadata: { user_id: user.id },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
