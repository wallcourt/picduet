export interface ImageModel {
  id: string;
  name: string;
  provider: string;
  type: "chat" | "dedicated";
}

// Dedicated image models not listed in OpenRouter's /models endpoint
// but accessible through their generation API
const DEDICATED_IMAGE_MODELS: ImageModel[] = [
  { id: "bytedance-seed/seedream-4.5", name: "Seedream 4.5", provider: "ByteDance", type: "dedicated" },
  { id: "black-forest-labs/flux-2-klein", name: "FLUX.2 Klein 4B", provider: "Black Forest Labs", type: "dedicated" },
  { id: "black-forest-labs/flux-2-max", name: "FLUX.2 Max", provider: "Black Forest Labs", type: "dedicated" },
  { id: "black-forest-labs/flux-2-pro", name: "FLUX.2 Pro", provider: "Black Forest Labs", type: "dedicated" },
  { id: "black-forest-labs/flux-2-flex", name: "FLUX.2 Flex", provider: "Black Forest Labs", type: "dedicated" },
  { id: "sourceful/riverflow-v2-pro", name: "Riverflow V2 Pro", provider: "Sourceful", type: "dedicated" },
  { id: "sourceful/riverflow-v2-fast", name: "Riverflow V2 Fast", provider: "Sourceful", type: "dedicated" },
  { id: "sourceful/riverflow-v2-max-preview", name: "Riverflow V2 Max", provider: "Sourceful", type: "dedicated" },
  { id: "sourceful/riverflow-v2-standard-preview", name: "Riverflow V2 Standard", provider: "Sourceful", type: "dedicated" },
  { id: "sourceful/riverflow-v2-fast-preview", name: "Riverflow V2 Fast Preview", provider: "Sourceful", type: "dedicated" },
];

// Hardcoded fallback used client-side before API responds
export const DEFAULT_IMAGE_MODELS: ImageModel[] = [
  { id: "google/gemini-2.5-flash-image", name: "Gemini 2.5 Flash Image", provider: "Google", type: "chat" },
  { id: "google/gemini-3-pro-image-preview", name: "Gemini 3 Pro Image", provider: "Google", type: "chat" },
  { id: "openai/gpt-5-image", name: "GPT-5 Image", provider: "OpenAI", type: "chat" },
  { id: "openai/gpt-5-image-mini", name: "GPT-5 Image Mini", provider: "OpenAI", type: "chat" },
  ...DEDICATED_IMAGE_MODELS,
];

// --- Server-side dynamic fetching ---

interface OpenRouterModel {
  id: string;
  name: string;
  architecture: {
    output_modalities: string[];
  };
}

let cachedModels: ImageModel[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function parseProvider(modelId: string): string {
  const slug = modelId.split("/")[0];
  const providerMap: Record<string, string> = {
    google: "Google",
    openai: "OpenAI",
    anthropic: "Anthropic",
    "black-forest-labs": "Black Forest Labs",
    "bytedance-seed": "ByteDance",
    sourceful: "Sourceful",
    "x-ai": "xAI",
    mistralai: "Mistral",
    qwen: "Qwen",
    "meta-llama": "Meta",
  };
  return providerMap[slug] || slug.charAt(0).toUpperCase() + slug.slice(1);
}

function cleanModelName(raw: string): string {
  // OpenRouter prefixes names like "Google: Gemini 2.5 Flash Image (Nano Banana)"
  // Strip the "Provider: " prefix
  const colonIdx = raw.indexOf(": ");
  return colonIdx !== -1 ? raw.slice(colonIdx + 2) : raw;
}

export async function fetchImageModels(): Promise<ImageModel[]> {
  const now = Date.now();
  if (cachedModels && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedModels;
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/models", {
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const allModels: OpenRouterModel[] = data.data || [];

    // Filter for models that can output images
    const imageModels: ImageModel[] = allModels
      .filter((m) => {
        const outputMods = m.architecture?.output_modalities || [];
        return outputMods.includes("image");
      })
      .filter((m) => m.id !== "openrouter/auto") // Skip the auto router
      .map((m) => {
        const outputMods = m.architecture?.output_modalities || [];
        const hasTextOutput = outputMods.includes("text");
        return {
          id: m.id,
          name: cleanModelName(m.name),
          provider: parseProvider(m.id),
          type: hasTextOutput ? "chat" as const : "dedicated" as const,
        };
      });

    // Merge in dedicated models (dedup by id)
    const seenIds = new Set(imageModels.map((m) => m.id));
    for (const m of DEDICATED_IMAGE_MODELS) {
      if (!seenIds.has(m.id)) {
        imageModels.push(m);
      }
    }

    cachedModels = imageModels;
    cacheTimestamp = now;
    return imageModels;
  } catch {
    // Return cached if available, otherwise fallback
    return cachedModels || DEFAULT_IMAGE_MODELS;
  }
}

// --- Shared utilities ---

export function getModelById(id: string): ImageModel | undefined {
  // Check cache first, then fallback
  if (cachedModels) {
    return cachedModels.find((m) => m.id === id);
  }
  return DEFAULT_IMAGE_MODELS.find((m) => m.id === id);
}

export function isDedicatedImageModel(modelId: string): boolean {
  const model = getModelById(modelId);
  if (model) return model.type === "dedicated";
  // If unknown, assume chat mode (safer - sends both text+image modalities)
  return false;
}
