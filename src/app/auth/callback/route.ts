import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // If there's an explicit next URL, use it
      if (next) {
        return NextResponse.redirect(`${origin}${next}`);
      }

      // Check if user has an active subscription
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: subscription } = await supabase
          .from("subscriptions")
          .select("id")
          .eq("user_id", user.id)
          .in("status", ["active", "past_due"])
          .maybeSingle();

        if (subscription) {
          return NextResponse.redirect(`${origin}/generate`);
        }
      }

      // No subscription — send to pricing
      return NextResponse.redirect(`${origin}/pricing`);
    }
  }

  // Redirect to login on error
  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
}
