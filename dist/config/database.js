"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDatabase = connectDatabase;
exports.isDatabaseInMemory = isDatabaseInMemory;
exports.disconnectDatabase = disconnectDatabase;
const mongoose_1 = __importDefault(require("mongoose"));
const environment_1 = require("./environment");
let isInMemory = false;
let memoryServerInstance = null;
async function connectDatabase() {
    // If explicitly requested or as default fallback attempt
    try {
        mongoose_1.default.set('strictQuery', false);
        console.log(`[Database] Attempting connection to MongoDB at: ${environment_1.ENV.MONGODB_URI}`);
        // Try connecting with a 4-second timeout to quickly detect if local mongo is offline
        await mongoose_1.default.connect(environment_1.ENV.MONGODB_URI, {
            serverSelectionTimeoutMS: 4000,
            connectTimeoutMS: 5000,
        });
        console.log('[Database] Successfully connected to external MongoDB instance.');
        isInMemory = false;
    }
    catch (error) {
        console.warn(`[Database] MongoDB connection to ${environment_1.ENV.MONGODB_URI} failed: ${error.message}`);
        console.log('[Database] Starting embedded MongoMemoryServer for zero-config local reliability...');
        try {
            const { MongoMemoryServer } = await Promise.resolve().then(() => __importStar(require('mongodb-memory-server')));
            memoryServerInstance = await MongoMemoryServer.create();
            const memoryUri = memoryServerInstance.getUri();
            await mongoose_1.default.connect(memoryUri);
            isInMemory = true;
            console.log(`[Database] Successfully initialized & connected to MongoMemoryServer at ${memoryUri}`);
        }
        catch (memError) {
            console.error('[Database] Fatal: Failed to initialize MongoMemoryServer:', memError);
            throw memError;
        }
    }
    mongoose_1.default.connection.on('error', (err) => {
        console.error('[Database] MongoDB connection error:', err);
    });
    mongoose_1.default.connection.on('disconnected', () => {
        console.warn('[Database] MongoDB disconnected.');
    });
}
function isDatabaseInMemory() {
    return isInMemory;
}
async function disconnectDatabase() {
    await mongoose_1.default.disconnect();
    if (memoryServerInstance) {
        await memoryServerInstance.stop();
    }
}
//# sourceMappingURL=database.js.map