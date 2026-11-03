import { Request, Response } from 'express';
import { User } from '../models/User';
import { AuditLog } from '../models/AuditLog';
import { CacheManager } from '../config/redis';
import { isDatabaseInMemory } from '../config/database';
import { trafficSimulator } from '../services/trafficSimulationService';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import mongoose from 'mongoose';

export class AdminController {
  public static async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const total = await User.countDocuments({});
      const users = await User.find({})
        .select('-passwordHash')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      res.status(200).json({
        success: true,
        data: users,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async updateUserRole(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!['admin', 'user'].includes(role)) {
        res.status(400).json({ success: false, message: 'Invalid role specified. Must be admin or user.' });
        return;
      }

      const user = await User.findById(id);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      // Prevent admin from demoting themselves
      if (req.user && req.user._id.toString() === id && role !== 'admin') {
        res.status(400).json({ success: false, message: 'You cannot revoke your own administrator privileges.' });
        return;
      }

      const previousRole = user.role;
      user.role = role;
      await user.save();

      if (req.user) {
        await AuditLog.create({
          user: req.user._id,
          userName: req.user.name,
          action: 'USER_ROLE_CHANGED',
          entityType: 'User',
          entityId: id,
          details: { previousRole, newRole: role, targetEmail: user.email },
        });
      }

      res.status(200).json({
        success: true,
        message: `Role for ${user.name} successfully updated to '${role}'.`,
        data: user,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async getSystemHealth(_req: Request, res: Response): Promise<void> {
    try {
      const dbConnected = mongoose.connection.readyState === 1;
      const simStatus = trafficSimulator.getStatus();
      const isRedis = CacheManager.isUsingRedis();

      const health = {
        status: dbConnected ? 'healthy' : 'degraded',
        uptimeSeconds: Math.round(process.uptime()),
        timestamp: new Date().toISOString(),
        database: {
          connected: dbConnected,
          provider: isDatabaseInMemory() ? 'in-memory-mongo' : 'mongodb',
          state: mongoose.connection.readyState,
        },
        redis: {
          connected: isRedis,
          type: isRedis ? 'redis' : 'in-memory-fallback',
          cachedKeysCount: CacheManager.getKeyCount(),
        },
        simulation: {
          active: simStatus.active,
          lastTick: simStatus.lastTick,
          intervalMs: simStatus.intervalMs,
        },
        routingProvider: {
          status: 'online',
          name: 'OSRM + OpenStreetMap Nominatim',
        },
      };

      res.status(200).json({
        success: true,
        data: health,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async getAuditLogs(_req: Request, res: Response): Promise<void> {
    try {
      const logs = await AuditLog.find({})
        .sort({ createdAt: -1 })
        .limit(40);

      res.status(200).json({
        success: true,
        data: logs,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
