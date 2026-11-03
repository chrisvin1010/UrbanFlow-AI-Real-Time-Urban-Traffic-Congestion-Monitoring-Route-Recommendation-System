"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const User_1 = require("../models/User");
const AuditLog_1 = require("../models/AuditLog");
const redis_1 = require("../config/redis");
const database_1 = require("../config/database");
const trafficSimulationService_1 = require("../services/trafficSimulationService");
const mongoose_1 = __importDefault(require("mongoose"));
class AdminController {
    static async getUsers(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const total = await User_1.User.countDocuments({});
            const users = await User_1.User.find({})
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
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async updateUserRole(req, res) {
        try {
            const { id } = req.params;
            const { role } = req.body;
            if (!['admin', 'user'].includes(role)) {
                res.status(400).json({ success: false, message: 'Invalid role specified. Must be admin or user.' });
                return;
            }
            const user = await User_1.User.findById(id);
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
                await AuditLog_1.AuditLog.create({
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
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async getSystemHealth(_req, res) {
        try {
            const dbConnected = mongoose_1.default.connection.readyState === 1;
            const simStatus = trafficSimulationService_1.trafficSimulator.getStatus();
            const isRedis = redis_1.CacheManager.isUsingRedis();
            const health = {
                status: dbConnected ? 'healthy' : 'degraded',
                uptimeSeconds: Math.round(process.uptime()),
                timestamp: new Date().toISOString(),
                database: {
                    connected: dbConnected,
                    provider: (0, database_1.isDatabaseInMemory)() ? 'in-memory-mongo' : 'mongodb',
                    state: mongoose_1.default.connection.readyState,
                },
                redis: {
                    connected: isRedis,
                    type: isRedis ? 'redis' : 'in-memory-fallback',
                    cachedKeysCount: redis_1.CacheManager.getKeyCount(),
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
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async getAuditLogs(_req, res) {
        try {
            const logs = await AuditLog_1.AuditLog.find({})
                .sort({ createdAt: -1 })
                .limit(40);
            res.status(200).json({
                success: true,
                data: logs,
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
exports.AdminController = AdminController;
//# sourceMappingURL=adminController.js.map