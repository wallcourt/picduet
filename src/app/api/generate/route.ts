import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { generateImage } from "@/lib/openrouter";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { validatePrompt, validateModelId, validateSourceImage } from "@/lib/validation";
import { checkCanGenerate } from "@/lib/subscription";

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

  // Check subscription and usage limits (service role bypasses RLS)
  const serviceClient = createServiceClient();
  const canGenerate = await checkCanGenerate(serviceClient, user.id);
  if (!canGenerate.allowed) {
    if (canGenerate.reason === "NO_SUBSCRIPTION") {
      return NextResponse.json(
        { error: "Subscription required", code: "NO_SUBSCRIPTION" },
        { status: 403 }
      );
    }
    return NextResponse.json(
      {
        error: "Monthly limit reached",
        code: "USAGE_LIMIT",
        usage: canGenerate.usage,
      },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { prompt, modelA, modelB, sourceImage, parentId } = body;

  const promptCheck = validatePrompt(prompt);
  if (!promptCheck.valid) {
    return NextResponse.json({ error: promptCheck.error }, { status: 400 });
  }

  const modelACheck = validateModelId(modelA);
  if (!modelACheck.valid) {
    return NextResponse.json({ error: modelACheck.error }, { status: 400 });
  }

  const modelBCheck = validateModelId(modelB);
  if (!modelBCheck.valid) {
    return NextResponse.json({ error: modelBCheck.error }, { status: 400 });
  }

  if (sourceImage !== undefined) {
    const imgCheck = validateSourceImage(sourceImage);
    if (!imgCheck.valid) {
      return NextResponse.json({ error: imgCheck.error }, { status: 400 });
    }
  }

  // Fire both requests in parallel
  const [resultA, resultB] = await Promise.all([
    generateImage({ model: modelA, prompt: promptCheck.value, sourceImage }),
    generateImage({ model: modelB, prompt: promptCheck.value, sourceImage }),
  ]);

  // Save to database
  const { data: generation, error: dbError } = await supabase
    .from("generations")
    .insert({
      user_id: user.id,
      prompt: promptCheck.value,
      model_a: modelA,
      model_b: modelB,
      image_a_url: resultA.imageUrl,
      image_b_url: resultB.imageUrl,
      parent_id: parentId || null,
    })
    .select()
    .single();

  if (dbError) {
    console.error("DB error:", dbError);
  }

  return NextResponse.json({
    id: generation?.id ?? null,
    imageA: resultA.imageUrl,
    imageB: resultB.imageUrl,
    errorA: resultA.error,
    errorB: resultB.error,
    ...(dbError && { warning: "Generation saved but may not appear in history" }),
  });
}
