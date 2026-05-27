const buckets = new Map();

export function createRateLimiter({ windowMs = 60000, maxRequests = 60 } = {}) {
  return (req, res, next) => {
    const key = req.ip || req.socket.remoteAddress || "unknown";
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, {
        count: 1,
        resetAt: now + windowMs
      });
      return next();
    }

    bucket.count += 1;

    if (bucket.count > maxRequests) {
      return res.status(429).json({
        success: false,
        message: "Too many requests"
      });
    }

    return next();
  };
}

export function clearRateLimitBuckets() {
  buckets.clear();
}
