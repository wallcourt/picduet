import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const rl = rateLimit(request, { window: 60, max: 60 });
  if (!rl.success) return rateLimitResponse();

  const supabase = await createClient();

  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor");
  const parsed = parseInt(searchParams.get("limit") || "20");
  const limit = Math.min(Number.isNaN(parsed) ? 20 : parsed, 50);

  let query = supabase
    .from("generations")
    .select(
      "id, prompt, model_a, model_b, image_a_url, image_b_url, created_at"
    )
    .eq("is_public", true)
    .not("image_a_url", "is", null)
    .not("image_b_url", "is", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data: generations, error } = await query;

  if (error) {
    console.error("Discover query error:", error);
    return NextResponse.json(
      { error: "Failed to fetch discover feed" },
      { status: 500 }
    );
  }

  // Fetch vote tallies for all returned generations
  const ids = (generations || []).map((g) => g.id);
  const { data: votes } = ids.length
    ? await supabase
        .from("community_votes")
        .select("generation_id, voted_for")
        .in("generation_id", ids)
    : { data: [] };

  const tallies: Record<string, { votesA: number; votesB: number }> = {};
  for (const v of votes || []) {
    if (!tallies[v.generation_id])
      tallies[v.generation_id] = { votesA: 0, votesB: 0 };
    if (v.voted_for === "a") tallies[v.generation_id].votesA++;
    else tallies[v.generation_id].votesB++;
  }

  const items = (generations || []).map((g) => ({
    ...g,
    votesA: tallies[g.id]?.votesA || 0,
    votesB: tallies[g.id]?.votesB || 0,
  }));

  const nextCursor =
    items.length === limit ? items[items.length - 1].created_at : null;

  return NextResponse.json({ items, nextCursor });
}
