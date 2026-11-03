"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const app_1 = require("./app");
const database_1 = require("./config/database");
const redis_1 = require("./config/redis");
const trafficSocket_1 = require("./sockets/trafficSocket");
const trafficSimulationService_1 = require("./services/trafficSimulationService");
const environment_1 = require("./config/environment");
const RoadSegment_1 = require("./models/RoadSegment");
const seed_1 = require("./seed/seed");
async function bootstrap() {
    console.log('====================================================');
    console.log('   UrbanFlow AI — Urban Traffic Monitoring System   ');
    console.log('====================================================');
    // 1. Connect to MongoDB (with auto in-memory fallback)
    await (0, database_1.connectDatabase)();
    // 2. Auto-seed if database has 0 road segments (guarantees out-of-the-box readiness)
    const roadCount = await RoadSegment_1.RoadSegment.countDocuments();
    if (roadCount === 0) {
        console.log('[Bootstrap] Database is empty. Running initial seed automatically...');
        await (0, seed_1.runSeed)();
    }
    else {
        console.log(`[Bootstrap] Database contains ${roadCount} monitored road segments.`);
    }
    // 3. Initialize Redis cache client (or in-memory cache fallback)
    (0, redis_1.initRedis)();
    // 4. Create Express app and HTTP server
    const app = (0, app_1.createApp)();
    const server = http_1.default.createServer(app);
    // 5. Initialize Socket.IO server
    (0, trafficSocket_1.initSocketServer)(server);
    // 6. Start Traffic Simulation background engine if enabled
    if (environment_1.ENV.TRAFFIC_SIMULATION_ENABLED) {
        trafficSimulationService_1.trafficSimulator.startSimulation();
    }
    // 7. Listen on configured PORT
    server.listen(environment_1.ENV.PORT, () => {
        console.log(`[Server] UrbanFlow AI Backend is running on: http://localhost:${environment_1.ENV.PORT}`);
        console.log(`[Server] Environment: ${environment_1.ENV.NODE_ENV}`);
        console.log(`[Server] Database Provider: ${(0, database_1.isDatabaseInMemory)() ? 'MongoMemoryServer (Embedded)' : 'MongoDB Server'}`);
        console.log(`[Server] Real-time Transports: WebSocket & Polling Fallback Enabled`);
    });
    // Graceful shutdown handling
    const shutdown = async (signal) => {
        console.log(`\n[Server] Received ${signal}. Gracefully shutting down...`);
        trafficSimulationService_1.trafficSimulator.stopSimulation();
        server.close(async () => {
            await (0, database_1.disconnectDatabase)();
            console.log('[Server] Successfully terminated.');
            process.exit(0);
        });
    };
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
}
bootstrap().catch((err) => {
    console.error('[Bootstrap] Fatal startup error:', err);
    process.exit(1);
});
//# sourceMappingURL=server.js.map