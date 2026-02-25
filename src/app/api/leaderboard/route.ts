import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchImageModels, getModelById, DEFAULT_IMAGE_MODELS } from "@/lib/models";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

interface ModelStats {
  modelId: string;
  modelName: string;
  provider: string;
  wins: number;
  losses: number;
  winRate: number;
  matches: number;
  elo: number;
}

let cachedLeaderboard: ModelStats[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const K = 32;
const START_ELO = 1500;

function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

export async function GET(request: NextRequest) {
  const rl = rateLimit(request, { window: 60, max: 60 });
  if (!rl.success) return rateLimitResponse();

  const now = Date.now();
  if (cachedLeaderboard && now - cacheTimestamp < CACHE_TTL_MS) {
    return NextResponse.json(cachedLeaderboard);
  }

  const supabase = await createClient();

  // Fetch owner votes from generations
  const { data: generations, error: genError } = await supabase
    .from("generations")
    .select("model_a, model_b, selected_winner, created_at")
    .not("selected_winner", "is", null)
    .order("created_at", { ascending: true });

  if (genError) {
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }

  // Fetch community votes
  const { data: communityVotes, error: cvError } = await supabase
    .from("community_votes")
    .select("generation_id, voted_for, created_at")
    .order("created_at", { ascending: true });

  // Build a lookup for generation model info (for community votes)
  const genModelMap = new Map<string, { model_a: string; model_b: string }>();

  if (!cvError && communityVotes?.length) {
    const genIds = [...new Set(communityVotes.map((v) => v.generation_id))];
    const { data: genLookup } = await supabase
      .from("generations")
      .select("id, model_a, model_b")
      .in("id", genIds);

    for (const g of genLookup || []) {
      genModelMap.set(g.id, { model_a: g.model_a, model_b: g.model_b });
    }
  }

  // Ensure model cache is populated for name lookups
  await fetchImageModels();

  // Build unified vote list sorted by created_at
  interface Vote {
    modelA: string;
    modelB: string;
    winner: "a" | "b";
    createdAt: string;
  }

  const allVotes: Vote[] = [];

  for (const gen of generations || []) {
    allVotes.push({
      modelA: gen.model_a,
      modelB: gen.model_b,
      winner: gen.selected_winner as "a" | "b",
      createdAt: gen.created_at,
    });
  }

  for (const cv of communityVotes || []) {
    const models = genModelMap.get(cv.generation_id);
    if (!models) continue;
    allVotes.push({
      modelA: models.model_a,
      modelB: models.model_b,
      winner: cv.voted_for as "a" | "b",
      createdAt: cv.created_at,
    });
  }

  allVotes.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  // Compute ELO ratings
  const elos = new Map<string, number>();
  const stats = new Map<string, { wins: number; losses: number }>();

  for (const vote of allVotes) {
    const winnerId = vote.winner === "a" ? vote.modelA : vote.modelB;
    const loserId = vote.winner === "a" ? vote.modelB : vote.modelA;

    if (!elos.has(winnerId)) elos.set(winnerId, START_ELO);
    if (!elos.has(loserId)) elos.set(loserId, START_ELO);
    if (!stats.has(winnerId)) stats.set(winnerId, { wins: 0, losses: 0 });
    if (!stats.has(loserId)) stats.set(loserId, { wins: 0, losses: 0 });

    const rW = elos.get(winnerId)!;
    const rL = elos.get(loserId)!;

    const eW = expectedScore(rW, rL);
    const eL = expectedScore(rL, rW);

    elos.set(winnerId, rW + K * (1 - eW));
    elos.set(loserId, rL + K * (0 - eL));

    stats.get(winnerId)!.wins++;
    stats.get(loserId)!.losses++;
  }

  const leaderboard: ModelStats[] = [];

  for (const [modelId, { wins, losses }] of stats) {
    const matches = wins + losses;
    if (matches < 5) continue; // Min 5 matches to rank

    const model = getModelById(modelId);
    const fallback = DEFAULT_IMAGE_MODELS.find((m) => m.id === modelId);
    const name = model?.name || fallback?.name || modelId.split("/").pop() || modelId;
    const provider = model?.provider || fallback?.provider || modelId.split("/")[0] || "Unknown";

    leaderboard.push({
      modelId,
      modelName: name,
      provider,
      wins,
      losses,
      winRate: Math.round((wins / matches) * 1000) / 10,
      matches,
      elo: Math.round(elos.get(modelId) || START_ELO),
    });
  }

  leaderboard.sort((a, b) => b.elo - a.elo);

  cachedLeaderboard = leaderboard;
  cacheTimestamp = now;

  return NextResponse.json(leaderboard);
}
