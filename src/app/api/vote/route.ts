import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { validateUUID } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const rl = rateLimit(request, { window: 60, max: 30 });
  if (!rl.success) return rateLimitResponse();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { generationId, winner } = body;

  const idCheck = validateUUID(generationId);
  if (!idCheck.valid) {
    return NextResponse.json({ error: idCheck.error }, { status: 400 });
  }

  if (!winner || (winner !== "a" && winner !== "b")) {
    return NextResponse.json(
      { error: "Missing or invalid fields: generationId, winner (a|b)" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("generations")
    .update({ selected_winner: winner })
    .eq("id", generationId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Vote update error:", error);
    return NextResponse.json({ error: "Failed to save vote" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
