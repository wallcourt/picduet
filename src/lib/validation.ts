const MAX_PROMPT_LENGTH = 2000;
const MAX_SOURCE_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB

export function validatePrompt(prompt: unknown): { valid: true; value: string } | { valid: false; error: string } {
  if (typeof prompt !== "string" || !prompt.trim()) {
    return { valid: false, error: "Prompt is required" };
  }
  const trimmed = prompt.trim();
  if (trimmed.length > MAX_PROMPT_LENGTH) {
    return { valid: false, error: `Prompt must be under ${MAX_PROMPT_LENGTH} characters` };
  }
  return { valid: true, value: trimmed };
}

export function validateSourceImage(sourceImage: unknown): { valid: true } | { valid: false; error: string } {
  if (sourceImage === undefined || sourceImage === null) {
    return { valid: true };
  }
  if (typeof sourceImage !== "string") {
    return { valid: false, error: "sourceImage must be a string" };
  }
  if (!sourceImage.startsWith("data:image/")) {
    return { valid: false, error: "sourceImage must be a data:image/ URL" };
  }
  // Rough byte size estimate: base64 is ~4/3 of original
  const base64Part = sourceImage.split(",")[1];
  if (base64Part) {
    const estimatedBytes = (base64Part.length * 3) / 4;
    if (estimatedBytes > MAX_SOURCE_IMAGE_BYTES) {
      return { valid: false, error: "sourceImage must be under 10MB" };
    }
  }
  return { valid: true };
}

const MODEL_ID_PATTERN = /^[a-z0-9-]+\/[a-z0-9._-]+$/i;

export function validateModelId(id: unknown): { valid: true } | { valid: false; error: string } {
  if (typeof id !== "string" || !MODEL_ID_PATTERN.test(id)) {
    return { valid: false, error: `Invalid model ID: ${String(id)}` };
  }
  return { valid: true };
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function validateUUID(id: unknown): { valid: true } | { valid: false; error: string } {
  if (typeof id !== "string" || !UUID_PATTERN.test(id)) {
    return { valid: false, error: "Invalid ID format" };
  }
  return { valid: true };
}
