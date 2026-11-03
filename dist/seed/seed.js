"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runSeed = runSeed;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_1 = require("../config/database");
const User_1 = require("../models/User");
const RoadSegment_1 = require("../models/RoadSegment");
const TrafficSnapshot_1 = require("../models/TrafficSnapshot");
const TrafficIncident_1 = require("../models/TrafficIncident");
const AuditLog_1 = require("../models/AuditLog");
const trafficSimulationService_1 = require("../services/trafficSimulationService");
const seedData_1 = require("./seedData");
async function runSeed() {
    console.log('--- [UrbanFlow AI] Starting Database Seed Process ---');
    await (0, database_1.connectDatabase)();
    // Clear existing collections safely
    console.log('[Seed] Clearing previous records...');
    await Promise.all([
        User_1.User.deleteMany({}),
        RoadSegment_1.RoadSegment.deleteMany({}),
        TrafficSnapshot_1.TrafficSnapshot.deleteMany({}),
        TrafficIncident_1.TrafficIncident.deleteMany({}),
        AuditLog_1.AuditLog.deleteMany({}),
    ]);
    // Create Users
    console.log('[Seed] Creating demo accounts...');
    const salt = await bcryptjs_1.default.genSalt(10);
    const adminPasswordHash = await bcryptjs_1.default.hash('Admin@123456', salt);
    const userPasswordHash = await bcryptjs_1.default.hash('User@123456', salt);
    const adminUser = await User_1.User.create({
        name: 'Sarah Chen (Chief Traffic Engineer)',
        email: 'admin@urbanflow.ai',
        passwordHash: adminPasswordHash,
        role: 'admin',
        preferences: {
            theme: 'dark',
            speedUnit: 'km/h',
            defaultCity: 'San Francisco',
            defaultMapCenter: [37.7749, -122.4194],
            defaultZoom: 13,
            notificationAlerts: true,
            refreshIntervalSeconds: 15,
        },
    });
    const demoUser = await User_1.User.create({
        name: 'Alex Rivera (City Commuter)',
        email: 'demo@urbanflow.ai',
        passwordHash: userPasswordHash,
        role: 'user',
        preferences: {
            theme: 'dark',
            speedUnit: 'km/h',
            defaultCity: 'San Francisco',
            defaultMapCenter: [37.7749, -122.4194],
            defaultZoom: 13,
            notificationAlerts: true,
            refreshIntervalSeconds: 15,
        },
    });
    console.log(`[Seed] Seeded Admin User: ${adminUser.email}`);
    console.log(`[Seed] Seeded Commuter User: ${demoUser.email}`);
    // Create Road Segments
    console.log(`[Seed] Seeding ${seedData_1.SEED_ROADS.length} road segments...`);
    const insertedRoads = [];
    const initialSnapshots = [];
    const now = new Date();
    for (const roadData of seedData_1.SEED_ROADS) {
        const geoCoordinates = roadData.coordinates.map((c) => [c[1], c[0]]); // [lng, lat]
        const congestionScore = Math.max(5, Math.min(95, Math.round((1 - roadData.currentSpeed / roadData.freeFlowSpeed) * 100)));
        const category = (0, trafficSimulationService_1.calculateCongestionCategory)(congestionScore);
        const vehicleCount = Math.round((congestionScore / 100) * (roadData.lanes * 180 * roadData.lengthKm) + 20);
        const road = await RoadSegment_1.RoadSegment.create({
            roadName: roadData.roadName,
            area: roadData.area,
            city: roadData.city,
            geometry: {
                type: 'LineString',
                coordinates: geoCoordinates,
            },
            leafletCoordinates: roadData.coordinates,
            currentSpeed: roadData.currentSpeed,
            freeFlowSpeed: roadData.freeFlowSpeed,
            congestionScore,
            congestionCategory: category,
            vehicleCount,
            lanes: roadData.lanes,
            lengthKm: roadData.lengthKm,
            trafficSource: 'simulated',
            lastUpdated: now,
        });
        insertedRoads.push(road);
        // Create 4 historical snapshots spanning recent hours
        for (let h = 3; h >= 0; h--) {
            const snapTime = new Date(now.getTime() - h * 3600 * 1000);
            const varSpeed = Math.round(roadData.currentSpeed + (Math.random() * 8 - 4));
            const varScore = Math.max(5, Math.min(98, Math.round((1 - varSpeed / roadData.freeFlowSpeed) * 100)));
            initialSnapshots.push({
                roadSegment: road._id,
                roadName: road.roadName,
                averageSpeed: varSpeed,
                vehicleCount: Math.round(vehicleCount * (0.8 + Math.random() * 0.4)),
                congestionScore: varScore,
                recordedAt: snapTime,
                dataSource: 'simulated',
            });
        }
    }
    await TrafficSnapshot_1.TrafficSnapshot.insertMany(initialSnapshots);
    console.log(`[Seed] Created ${initialSnapshots.length} historical traffic snapshots.`);
    // Create Incidents
    console.log(`[Seed] Seeding ${seedData_1.SEED_INCIDENTS.length} traffic incidents...`);
    for (const inc of seedData_1.SEED_INCIDENTS) {
        await TrafficIncident_1.TrafficIncident.create({
            ...inc,
            location: {
                type: 'Point',
                coordinates: [inc.longitude, inc.latitude],
            },
            reportedBy: adminUser._id,
        });
    }
    // Audit log
    await AuditLog_1.AuditLog.create({
        user: adminUser._id,
        userName: adminUser.name,
        action: 'SYSTEM_SEEDED',
        entityType: 'System',
        details: {
            roadsCount: insertedRoads.length,
            incidentsCount: seedData_1.SEED_INCIDENTS.length,
            snapshotsCount: initialSnapshots.length,
        },
    });
    console.log('--- [UrbanFlow AI] Seed Process Completed Successfully! ---');
}
// Allow direct CLI invocation: tsx src/seed/seed.ts
if (require.main === module) {
    runSeed()
        .then(async () => {
        await (0, database_1.disconnectDatabase)();
        process.exit(0);
    })
        .catch((err) => {
        console.error('[Seed] Error during seed:', err);
        process.exit(1);
    });
}
//# sourceMappingURL=seed.js.map