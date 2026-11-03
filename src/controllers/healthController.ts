import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { CacheManager } from '../config/redis';

export class HealthController {
  public static async getHealth(_req: Request, res: Response): Promise<void> {
    const isDbReady = mongoose.connection.readyState === 1;

    res.status(isDbReady ? 200 : 503).json({
      status: isDbReady ? 'UP' : 'DOWN',
      timestamp: new Date().toISOString(),
      service: 'UrbanFlow AI Traffic Backend',
      database: isDbReady ? 'CONNECTED' : 'DISCONNECTED',
      cache: CacheManager.isUsingRedis() ? 'REDIS_ONLINE' : 'IN_MEMORY_FALLBACK',
    });
  }
}
