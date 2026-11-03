"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheManager = void 0;
exports.initRedis = initRedis;
const ioredis_1 = __importDefault(require("ioredis"));
const environment_1 = require("./environment");
let redisClient = null;
let isRedisConnected = false;
const memoryCacheStore = new Map();
function initRedis() {
    if (!environment_1.ENV.REDIS_ENABLED) {
        console.log('[Cache] Redis is disabled in configuration. Using in-memory fallback cache.');
        return;
    }
    try {
        redisClient = new ioredis_1.default(environment_1.ENV.REDIS_URL, {
            maxRetriesPerRequest: 1,
            connectTimeout: 2000,
            retryStrategy(times) {
                if (times > 3) {
                    // Stop retrying quickly so we don't spam logs
                    return null;
                }
                return Math.min(times * 500, 2000);
            },
            lazyConnect: true,
        });
        redisClient.connect()
            .then(() => {
            isRedisConnected = true;
            console.log(`[Cache] Connected to Redis instance at ${environment_1.ENV.REDIS_URL}`);
        })
            .catch((err) => {
            isRedisConnected = false;
            console.warn(`[Cache] Redis connection failed (${err.message}). Using in-memory fallback cache.`);
        });
        redisClient.on('error', (err) => {
            isRedisConnected = false;
        });
        redisClient.on('connect', () => {
            isRedisConnected = true;
        });
        redisClient.on('close', () => {
            isRedisConnected = false;
        });
    }
    catch (err) {
        isRedisConnected = false;
        console.warn(`[Cache] Failed to initialize Redis client: ${err.message}. Using in-memory fallback.`);
    }
}
exports.CacheManager = {
    isUsingRedis() {
        return isRedisConnected && redisClient !== null;
    },
    async get(key) {
        if (this.isUsingRedis() && redisClient) {
            try {
                const raw = await redisClient.get(key);
                if (!raw)
                    return null;
                return JSON.parse(raw);
            }
            catch (err) {
                // Fallback to memory on read error
            }
        }
        // In-memory lookup
        const entry = memoryCacheStore.get(key);
        if (!entry)
            return null;
        if (Date.now() > entry.expiresAt) {
            memoryCacheStore.delete(key);
            return null;
        }
        try {
            return JSON.parse(entry.value);
        }
        catch {
            return null;
        }
    },
    async set(key, value, ttlSeconds = 60) {
        const serialized = JSON.stringify(value);
        if (this.isUsingRedis() && redisClient) {
            try {
                await redisClient.set(key, serialized, 'EX', ttlSeconds);
                return;
            }
            catch (err) {
                // Fallback to memory
            }
        }
        // In-memory set
        memoryCacheStore.set(key, {
            value: serialized,
            expiresAt: Date.now() + ttlSeconds * 1000,
        });
    },
    async del(keyPatternOrKey) {
        if (this.isUsingRedis() && redisClient) {
            try {
                if (keyPatternOrKey.includes('*')) {
                    const keys = await redisClient.keys(keyPatternOrKey);
                    if (keys.length > 0) {
                        await redisClient.del(...keys);
                    }
                }
                else {
                    await redisClient.del(keyPatternOrKey);
                }
            }
            catch (err) {
                // Continue to memory delete
            }
        }
        // In-memory pattern delete
        if (keyPatternOrKey.includes('*')) {
            const regex = new RegExp('^' + keyPatternOrKey.replace(/\*/g, '.*') + '$');
            for (const k of memoryCacheStore.keys()) {
                if (regex.test(k)) {
                    memoryCacheStore.delete(k);
                }
            }
        }
        else {
            memoryCacheStore.delete(keyPatternOrKey);
        }
    },
    async flushAll() {
        if (this.isUsingRedis() && redisClient) {
            try {
                await redisClient.flushdb();
            }
            catch (err) { }
        }
        memoryCacheStore.clear();
    },
    getKeyCount() {
        return memoryCacheStore.size;
    }
};
//# sourceMappingURL=redis.js.map