import http from 'http';
import { createApp } from './app';
import { connectDatabase, disconnectDatabase, isDatabaseInMemory } from './config/database';
import { initRedis } from './config/redis';
import { initSocketServer } from './sockets/trafficSocket';
import { trafficSimulator } from './services/trafficSimulationService';
import { ENV } from './config/environment';
import { RoadSegment } from './models/RoadSegment';
import { runSeed } from './seed/seed';

async function bootstrap() {
  console.log('====================================================');
  console.log('   UrbanFlow AI — Urban Traffic Monitoring System   ');
  console.log('====================================================');

  // 1. Connect to MongoDB (with auto in-memory fallback)
  await connectDatabase();

  // 2. Auto-seed if database has 0 road segments (guarantees out-of-the-box readiness)
  const roadCount = await RoadSegment.countDocuments();
  if (roadCount === 0) {
    console.log('[Bootstrap] Database is empty. Running initial seed automatically...');
    await runSeed();
  } else {
    console.log(`[Bootstrap] Database contains ${roadCount} monitored road segments.`);
  }

  // 3. Initialize Redis cache client (or in-memory cache fallback)
  initRedis();

  // 4. Create Express app and HTTP server
  const app = createApp();
  const server = http.createServer(app);

  // 5. Initialize Socket.IO server
  initSocketServer(server);

  // 6. Start Traffic Simulation background engine if enabled
  if (ENV.TRAFFIC_SIMULATION_ENABLED) {
    trafficSimulator.startSimulation();
  }

  // 7. Listen on configured PORT
  server.listen(ENV.PORT, () => {
    console.log(`[Server] UrbanFlow AI Backend is running on: http://localhost:${ENV.PORT}`);
    console.log(`[Server] Environment: ${ENV.NODE_ENV}`);
    console.log(`[Server] Database Provider: ${isDatabaseInMemory() ? 'MongoMemoryServer (Embedded)' : 'MongoDB Server'}`);
    console.log(`[Server] Real-time Transports: WebSocket & Polling Fallback Enabled`);
  });

  // Graceful shutdown handling
  const shutdown = async (signal: string) => {
    console.log(`\n[Server] Received ${signal}. Gracefully shutting down...`);
    trafficSimulator.stopSimulation();
    server.close(async () => {
      await disconnectDatabase();
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
