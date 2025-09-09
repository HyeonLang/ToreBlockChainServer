import { Request, Response, NextFunction } from "express";

type Bucket = { tokens: number; lastRefillMs: number };
const buckets = new Map<string, Bucket>();

const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 60000);
const MAX_TOKENS = Number(process.env.RATE_LIMIT_MAX || 60);

export function rateLimit(req: Request, res: Response, next: NextFunction) {
  const key = req.ip + ":" + (req.header("x-api-key") || "anon");
  const now = Date.now();
  const refillRate = MAX_TOKENS / WINDOW_MS; // tokens per ms

  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { tokens: MAX_TOKENS, lastRefillMs: now };
    buckets.set(key, bucket);
  }

  const elapsed = now - bucket.lastRefillMs;
  bucket.tokens = Math.min(MAX_TOKENS, bucket.tokens + elapsed * refillRate);
  bucket.lastRefillMs = now;

  if (bucket.tokens < 1) {
    const retryMs = Math.ceil((1 - bucket.tokens) / refillRate);
    res.setHeader("Retry-After", Math.ceil(retryMs / 1000).toString());
    return res.status(429).json({ error: "Too Many Requests" });
  }

  bucket.tokens -= 1;
  return next();
}



