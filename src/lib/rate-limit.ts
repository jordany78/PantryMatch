type RateLimitEntry = {
  count: number;
  windowStartedAt: number;
};

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
};

const entries = new Map<string, RateLimitEntry>();

export function checkRateLimit(
  key: string,
  limit = 5,
  windowMs = 15 * 60 * 1000
): RateLimitResult {
  const now = Date.now();
  const current = entries.get(key);
  const entry = !current || now - current.windowStartedAt >= windowMs
    ? { count: 0, windowStartedAt: now }
    : current;

  entry.count += 1;
  entries.set(key, entry);

  // Avoid retaining expired users indefinitely in a long-running server.
  if (entries.size > 1000) {
    for (const [entryKey, value] of entries) {
      if (now - value.windowStartedAt >= windowMs) entries.delete(entryKey);
    }
  }

  return {
    allowed: entry.count <= limit,
    limit,
    remaining: Math.max(0, limit - entry.count),
    resetAt: entry.windowStartedAt + windowMs,
  };
}
