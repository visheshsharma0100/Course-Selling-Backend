import { createClient } from "redis";

let client = null;
let connectionAttempted = false;

const getClient = async () => {
    if (client?.isOpen) return client;
    if (connectionAttempted || !process.env.REDIS_URL) return null;
    connectionAttempted = true;
    client = createClient({
        url: process.env.REDIS_URL,
        socket: { connectTimeout: 700, reconnectStrategy: false },
    });
    client.on("error", () => {});
    try {
        await client.connect();
        return client;
    } catch {
        client = null;
        return null;
    }
};

export const cachePublicGet = (keyFor, ttlSeconds = 60) => async (req, res, next) => {
    const key = keyFor(req);
    const redis = await getClient();
    if (redis) {
        try {
            const cached = await redis.get(key);
            if (cached) return res.status(200).json(JSON.parse(cached));
        } catch { /* Redis is an optional performance layer. */ }
    }

    const sendJson = res.json.bind(res);
    res.json = (body) => {
        if (redis && res.statusCode >= 200 && res.statusCode < 300) {
            redis.set(key, JSON.stringify(body), { EX: ttlSeconds }).catch(() => {});
        }
        return sendJson(body);
    };
    return next();
};

export const invalidateCourseCache = async (courseId) => {
    const redis = await getClient();
    if (!redis) return;
    const keys = ["skillstack:courses:published", ...(courseId ? [`skillstack:course:${courseId}`] : [])];
    await redis.del(keys).catch(() => {});
};
