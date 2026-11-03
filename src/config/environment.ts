import dotenv from 'dotenv';
import path from 'path';

// Load .env from root or server directory
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

export const ENV = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  JWT_SECRET: process.env.JWT_SECRET || 'urbanflow-super-secret-jwt-key-2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/urbanflow_db',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  REDIS_ENABLED: process.env.REDIS_ENABLED !== 'false',
  TRAFFIC_SIMULATION_ENABLED: process.env.TRAFFIC_SIMULATION_ENABLED !== 'false',
  TRAFFIC_SIMULATION_INTERVAL_MS: parseInt(process.env.TRAFFIC_SIMULATION_INTERVAL_MS || '15000', 10),
  TRAFFIC_DEFAULT_CITY: process.env.TRAFFIC_DEFAULT_CITY || 'San Francisco',
  OSRM_ROUTING_URL: process.env.OSRM_ROUTING_URL || 'https://router.project-osrm.org/route/v1/driving/',
  NOMINATIM_GEOCODING_URL: process.env.NOMINATIM_GEOCODING_URL || 'https://nominatim.openstreetmap.org/search',
};
