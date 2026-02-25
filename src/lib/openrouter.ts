import { isDedicatedImageModel } from "./models";

export interface GenerateImageParams {
  model: string;
  prompt: string;
  sourceImage?: string; // base64 data URL for img2img
}

export interface GenerateImageResult {
  imageUrl: string | null;
  error?: string;
}

export async function generateImage(
  params: GenerateImageParams
): Promise<GenerateImageResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return { imageUrl: null, error: "OpenRouter API key not configured" };
  }

  const { model, prompt, sourceImage } = params;
  const isDedicated = isDedicatedImageModel(model);

  // Build messages based on whether this is txt2img or img2img
  let messages;
  if (sourceImage) {
    messages = [
      {
        role: "user" as const,
        content: [
          { type: "text" as const, text: `Edit this image: ${prompt}` },
          {
            type: "image_url" as const,
            image_url: { url: sourceImage },
          },
        ],
      },
    ];
  } else {
    messages = [{ role: "user" as const, content: prompt }];
  }

  // Dedicated image models use ["image"], chat models use ["image", "text"]
  const modalities = isDedicated ? ["image"] : ["image", "text"];

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
          model,
          messages,
          modalities,
          image_config: { aspect_ratio: "1:1" },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        imageUrl: null,
        error: errorData?.error?.message || `API error: ${response.status}`,
      };
    }

    const data = await response.json();

    // Extract image from response - OpenRouter returns images in different formats
    // Check for inline images in content parts
    const content = data.choices?.[0]?.message?.content;
    if (Array.isArray(content)) {
      for (const part of content) {
        if (part.type === "image_url") {
          return { imageUrl: part.image_url.url };
        }
      }
    }

    // Check for images array
    const images = data.choices?.[0]?.message?.images;
    if (images && images.length > 0) {
      return { imageUrl: images[0].image_url?.url || images[0].url };
    }

    return { imageUrl: null, error: "No image in response" };
  } catch (err) {
    return {
      imageUrl: null,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
