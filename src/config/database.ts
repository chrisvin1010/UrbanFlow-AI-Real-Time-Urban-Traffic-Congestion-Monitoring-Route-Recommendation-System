import mongoose from 'mongoose';
import { ENV } from './environment';

let isInMemory = false;
let memoryServerInstance: any = null;

export async function connectDatabase(): Promise<void> {
  // If explicitly requested or as default fallback attempt
  try {
    mongoose.set('strictQuery', false);
    console.log(`[Database] Attempting connection to MongoDB at: ${ENV.MONGODB_URI}`);

    // Try connecting with a 4-second timeout to quickly detect if local mongo is offline
    await mongoose.connect(ENV.MONGODB_URI, {
      serverSelectionTimeoutMS: 4000,
      connectTimeoutMS: 5000,
    });

    console.log('[Database] Successfully connected to external MongoDB instance.');
    isInMemory = false;
  } catch (error: any) {
    console.warn(`[Database] MongoDB connection to ${ENV.MONGODB_URI} failed: ${error.message}`);
    console.log('[Database] Starting embedded MongoMemoryServer for zero-config local reliability...');

    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      memoryServerInstance = await MongoMemoryServer.create();
      const memoryUri = memoryServerInstance.getUri();

      await mongoose.connect(memoryUri);
      isInMemory = true;
      console.log(`[Database] Successfully initialized & connected to MongoMemoryServer at ${memoryUri}`);
    } catch (memError: any) {
      console.error('[Database] Fatal: Failed to initialize MongoMemoryServer:', memError);
      throw memError;
    }
  }

  mongoose.connection.on('error', (err) => {
    console.error('[Database] MongoDB connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[Database] MongoDB disconnected.');
  });
}

export function isDatabaseInMemory(): boolean {
  return isInMemory;
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  if (memoryServerInstance) {
    await memoryServerInstance.stop();
  }
}
