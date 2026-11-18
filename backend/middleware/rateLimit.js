// Deliberately dependency-free basic rate limiting for the current single-node
// deployment. Replace the in-memory store with Redis before running multiple
// API instances in production.
export const createRateLimiter = ({ windowMs, max, message }) => {
    const requests = new Map();

    const cleanupTimer = setInterval(() => {
        const now = Date.now();
        for (const [key, value] of requests) {
            if (value.resetAt <= now) requests.delete(key);
        }
    }, windowMs);
    cleanupTimer.unref();

    return (req, res, next) => {
        const key = req.ip || req.socket.remoteAddress || "unknown";
        const now = Date.now();
        const current = requests.get(key);
        const bucket = !current || current.resetAt <= now
            ? { count: 0, resetAt: now + windowMs }
            : current;

        bucket.count += 1;
        requests.set(key, bucket);
        res.set("RateLimit-Limit", String(max));
        res.set("RateLimit-Remaining", String(Math.max(0, max - bucket.count)));
        res.set("RateLimit-Reset", String(Math.ceil(bucket.resetAt / 1000)));

        if (bucket.count > max) {
            return res.status(429).json({ message });
        }
        return next();
    };
};
