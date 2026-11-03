import Redis from 'ioredis';
import { ENV } from './environment';

let redisClient: Redis | null = null;
let isRedisConnected = false;

// In-memory fallback cache store for when Redis server is not running
interface CacheEntry {
  value: string;
  expiresAt: number; // timestamp in ms
}
const memoryCacheStore = new Map<string, CacheEntry>();

export function initRedis(): void {
  if (!ENV.REDIS_ENABLED) {
    console.log('[Cache] Redis is disabled in configuration. Using in-memory fallback cache.');
    return;
  }

  try {
    redisClient = new Redis(ENV.REDIS_URL, {
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
        console.log(`[Cache] Connected to Redis instance at ${ENV.REDIS_URL}`);
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
  } catch (err: any) {
    isRedisConnected = false;
    console.warn(`[Cache] Failed to initialize Redis client: ${err.message}. Using in-memory fallback.`);
  }
}

export const CacheManager = {
  isUsingRedis(): boolean {
    return isRedisConnected && redisClient !== null;
  },

  async get<T>(key: string): Promise<T | null> {
    if (this.isUsingRedis() && redisClient) {
      try {
        const raw = await redisClient.get(key);
        if (!raw) return null;
        return JSON.parse(raw) as T;
      } catch (err) {
        // Fallback to memory on read error
      }
    }

    // In-memory lookup
    const entry = memoryCacheStore.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      memoryCacheStore.delete(key);
      return null;
    }
    try {
      return JSON.parse(entry.value) as T;
    } catch {
      return null;
    }
  },

  async set(key: string, value: any, ttlSeconds: number = 60): Promise<void> {
    const serialized = JSON.stringify(value);

    if (this.isUsingRedis() && redisClient) {
      try {
        await redisClient.set(key, serialized, 'EX', ttlSeconds);
        return;
      } catch (err) {
        // Fallback to memory
      }
    }

    // In-memory set
    memoryCacheStore.set(key, {
      value: serialized,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  },

  async del(keyPatternOrKey: string): Promise<void> {
    if (this.isUsingRedis() && redisClient) {
      try {
        if (keyPatternOrKey.includes('*')) {
          const keys = await redisClient.keys(keyPatternOrKey);
          if (keys.length > 0) {
            await redisClient.del(...keys);
          }
        } else {
          await redisClient.del(keyPatternOrKey);
        }
      } catch (err) {
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
    } else {
      memoryCacheStore.delete(keyPatternOrKey);
    }
  },

  async flushAll(): Promise<void> {
    if (this.isUsingRedis() && redisClient) {
      try {
        await redisClient.flushdb();
      } catch (err) {}
    }
    memoryCacheStore.clear();
  },

  getKeyCount(): number {
    return memoryCacheStore.size;
  }
};
