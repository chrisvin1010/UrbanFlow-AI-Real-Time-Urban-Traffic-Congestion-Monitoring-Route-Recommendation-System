"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthController = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const redis_1 = require("../config/redis");
class HealthController {
    static async getHealth(_req, res) {
        const isDbReady = mongoose_1.default.connection.readyState === 1;
        res.status(isDbReady ? 200 : 503).json({
            status: isDbReady ? 'UP' : 'DOWN',
            timestamp: new Date().toISOString(),
            service: 'UrbanFlow AI Traffic Backend',
            database: isDbReady ? 'CONNECTED' : 'DISCONNECTED',
            cache: redis_1.CacheManager.isUsingRedis() ? 'REDIS_ONLINE' : 'IN_MEMORY_FALLBACK',
        });
    }
}
exports.HealthController = HealthController;
//# sourceMappingURL=healthController.js.map