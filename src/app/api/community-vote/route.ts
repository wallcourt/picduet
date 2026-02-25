import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const rl = rateLimit(request, { window: 60, max: 30 });
  if (!rl.success) return rateLimitResponse();

  const supabase = await createClient();

  const body = await request.json();
  const { generationId, votedFor } = body;

  if (!generationId || (votedFor !== "a" && votedFor !== "b")) {
    return NextResponse.json(
      { error: "Missing or invalid fields: generationId, votedFor (a|b)" },
      { status: 400 }
    );
  }

  // Compute fingerprint from IP + User-Agent
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const ua = request.headers.get("user-agent") || "unknown";
  const raw = `${ip}|${ua}`;
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(raw));
  const fingerprint = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Get authenticated user if available
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // For authenticated users, also check if they already voted by user_id
  if (user) {
    const { data: existingVote } = await supabase
      .from("community_votes")
      .select("id")
      .eq("generation_id", generationId)
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (existingVote) {
      // Already voted — return current tallies
      return returnTallies(supabase, generationId);
    }
  }

  // Insert vote — unique constraint on (generation_id, fingerprint) handles dedup
  const { error } = await supabase.from("community_votes").insert({
    generation_id: generationId,
    user_id: user?.id || null,
    voted_for: votedFor,
    fingerprint,
  });

  if (error) {
    if (error.code === "23505") {
      // Duplicate vote — still return current tallies
    } else {
      console.error("Community vote error:", error);
      return NextResponse.json(
        { error: "Failed to save vote" },
        { status: 500 }
      );
    }
  }

  return returnTallies(supabase, generationId);
}

async function returnTallies(
  supabase: Awaited<ReturnType<typeof createClient>>,
  generationId: string
) {
  const { data: votes } = await supabase
    .from("community_votes")
    .select("voted_for")
    .eq("generation_id", generationId);

  let votesA = 0;
  let votesB = 0;
  for (const v of votes || []) {
    if (v.voted_for === "a") votesA++;
    else votesB++;
  }

  return NextResponse.json({ votesA, votesB });
}
