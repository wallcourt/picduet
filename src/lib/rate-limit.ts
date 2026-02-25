import { NextRequest, NextResponse } from "next/server";

interface RateLimitOptions {
  window: number; // time window in seconds
  max: number; // max requests per window
}

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// Cleanup stale entries every 5 minutes
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 5 * 60 * 1000;

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);
    if (entry.timestamps.length === 0) store.delete(key);
  }
}

function getIP(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function rateLimit(
  request: NextRequest,
  { window, max }: RateLimitOptions
): { success: boolean; remaining: number } {
  const windowMs = window * 1000;
  cleanup(windowMs);

  const ip = getIP(request);
  const now = Date.now();
  const entry = store.get(ip) || { timestamps: [] };

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

  if (entry.timestamps.length >= max) {
    store.set(ip, entry);
    return { success: false, remaining: 0 };
  }

  entry.timestamps.push(now);
  store.set(ip, entry);
  return { success: true, remaining: max - entry.timestamps.length };
}

export function rateLimitResponse() {
  return NextResponse.json(
    { error: "Too many requests. Please try again later." },
    { status: 429 }
  );
}
