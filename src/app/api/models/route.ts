import { NextRequest, NextResponse } from "next/server";
import { fetchImageModels, DEFAULT_IMAGE_MODELS } from "@/lib/models";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const rl = rateLimit(request, { window: 60, max: 60 });
  if (!rl.success) return rateLimitResponse();

  try {
    const models = await fetchImageModels();
    return NextResponse.json({ models });
  } catch {
    return NextResponse.json({ models: DEFAULT_IMAGE_MODELS });
  }
}
