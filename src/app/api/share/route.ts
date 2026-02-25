import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { nanoid } from "nanoid";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { validateUUID } from "@/lib/validation";

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

  const body = await request.json();
  const { generationId } = body;

  const idCheck = validateUUID(generationId);
  if (!idCheck.valid) {
    return NextResponse.json({ error: idCheck.error }, { status: 400 });
  }

  // Check that the generation belongs to this user
  const { data: generation, error: fetchError } = await supabase
    .from("generations")
    .select("id, share_id, user_id")
    .eq("id", generationId)
    .single();

  if (fetchError || !generation) {
    return NextResponse.json({ error: "Generation not found" }, { status: 404 });
  }

  if (generation.user_id !== user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // If already shared, return existing share URL
  if (generation.share_id) {
    return NextResponse.json({ shareUrl: `/share/${generation.share_id}` });
  }

  const shareId = nanoid(10);

  const { error: updateError } = await supabase
    .from("generations")
    .update({ share_id: shareId, is_public: true })
    .eq("id", generationId);

  if (updateError) {
    console.error("Share update error:", updateError);
    return NextResponse.json(
      { error: "Failed to create share link" },
      { status: 500 }
    );
  }

  return NextResponse.json({ shareUrl: `/share/${shareId}` });
}
