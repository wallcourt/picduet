import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { validatePrompt, validateSourceImage } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const rl = rateLimit(request, { window: 60, max: 15 });
  if (!rl.success) return rateLimitResponse();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OpenRouter API key not configured" },
      { status: 500 }
    );
  }

  const body = await request.json();
  const { prompt, sourceImage } = body;

  const promptCheck = validatePrompt(prompt);
  if (!promptCheck.valid) {
    return NextResponse.json({ error: promptCheck.error }, { status: 400 });
  }

  if (sourceImage !== undefined) {
    const imgCheck = validateSourceImage(sourceImage);
    if (!imgCheck.valid) {
      return NextResponse.json({ error: imgCheck.error }, { status: 400 });
    }
  }

  const systemPrompt = `You are an expert image-generation prompt writer. The user will give you a short or vague image description. Your job is to expand it into a detailed, vivid prompt optimized for AI image generation. Include specifics about composition, lighting, style, colors, mood, and subject details. Keep it to 1-2 sentences. Output ONLY the enhanced prompt text, nothing else.`;

  const userContent: Array<
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string } }
  > = [{ type: "text", text: promptCheck.value }];

  if (sourceImage) {
    userContent.push({
      type: "image_url",
      image_url: { url: sourceImage },
    });
  }

  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://picduet.vercel.app",
          "X-Title": "PicDuet",
        },
        body: JSON.stringify({
          model: "x-ai/grok-4.1-fast",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userContent },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          error:
            errorData?.error?.message ||
            `API error: ${response.status}`,
        },
        { status: 502 }
      );
    }

    const data = await response.json();
    const enhancedPrompt = data.choices?.[0]?.message?.content?.trim();

    if (!enhancedPrompt) {
      return NextResponse.json(
        { error: "No response from enhancement model" },
        { status: 502 }
      );
    }

    return NextResponse.json({ enhancedPrompt });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Enhancement request failed",
      },
      { status: 500 }
    );
  }
}
