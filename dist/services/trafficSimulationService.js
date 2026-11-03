"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trafficSimulator = exports.TrafficSimulationService = void 0;
exports.calculateCongestionCategory = calculateCongestionCategory;
exports.getTimeMultiplier = getTimeMultiplier;
const RoadSegment_1 = require("../models/RoadSegment");
const TrafficSnapshot_1 = require("../models/TrafficSnapshot");
const TrafficIncident_1 = require("../models/TrafficIncident");
const redis_1 = require("../config/redis");
const environment_1 = require("../config/environment");
function calculateCongestionCategory(score) {
    if (score < 30)
        return 'free_flow';
    if (score < 60)
        return 'moderate';
    if (score < 80)
        return 'heavy';
    return 'severe';
}
function getTimeMultiplier(date = new Date()) {
    const hours = date.getHours() + date.getMinutes() / 60;
    // Morning rush: 7:30 - 9:30
    if (hours >= 7.5 && hours <= 9.5) {
        const peak = 8.5;
        const diff = Math.abs(hours - peak);
        return 1.6 - diff * 0.4;
    }
    // Evening rush: 16:30 - 19:00
    if (hours >= 16.5 && hours <= 19.0) {
        const peak = 17.75;
        const diff = Math.abs(hours - peak);
        return 1.8 - diff * 0.5;
    }
    // Midday: 11:30 - 14:00
    if (hours >= 11.5 && hours <= 14.0) {
        return 1.1;
    }
    // Late night: 22:00 - 06:00
    if (hours >= 22 || hours <= 6) {
        return 0.35;
    }
    // Normal shoulder hours
    return 0.85;
}
class TrafficSimulationService {
    intervalTimer = null;
    socketBroadcaster = null;
    isSimulating = false;
    lastTickTime = null;
    setBroadcaster(broadcaster) {
        this.socketBroadcaster = broadcaster;
    }
    startSimulation() {
        if (this.isSimulating)
            return;
        this.isSimulating = true;
        console.log(`[Simulation] Engine started. Ticking every ${environment_1.ENV.TRAFFIC_SIMULATION_INTERVAL_MS}ms.`);
        this.intervalTimer = setInterval(async () => {
            try {
                await this.simulateTick();
            }
            catch (err) {
                console.error('[Simulation] Error in simulation tick:', err.message);
            }
        }, environment_1.ENV.TRAFFIC_SIMULATION_INTERVAL_MS);
    }
    stopSimulation() {
        if (this.intervalTimer) {
            clearInterval(this.intervalTimer);
            this.intervalTimer = null;
        }
        this.isSimulating = false;
        console.log('[Simulation] Engine paused.');
    }
    getStatus() {
        return {
            active: this.isSimulating,
            intervalMs: environment_1.ENV.TRAFFIC_SIMULATION_INTERVAL_MS,
            lastTick: this.lastTickTime ? this.lastTickTime.toISOString() : null,
        };
    }
    async simulateTick() {
        const roads = await RoadSegment_1.RoadSegment.find({});
        if (roads.length === 0) {
            return { updatedRoadsCount: 0, timestamp: new Date().toISOString() };
        }
        const activeIncidents = await TrafficIncident_1.TrafficIncident.find({
            status: { $in: ['reported', 'investigating', 'confirmed', 'clearing'] },
        });
        const incidentRoadNames = new Set(activeIncidents.map((inc) => inc.roadName.toLowerCase()));
        const timeMultiplier = getTimeMultiplier();
        const updatedRoads = [];
        const snapshotsToInsert = [];
        const now = new Date();
        for (const road of roads) {
            const hasActiveIncident = incidentRoadNames.has(road.roadName.toLowerCase());
            // Base variation: stochastic noise (-10% to +10%)
            const noise = (Math.random() - 0.5) * 0.2;
            // High traffic arteries have a higher base capacity load
            const isMajorHighway = road.roadName.includes('Freeway') || road.roadName.includes('Bridge') || road.roadName.includes('Avenue');
            const arteryWeight = isMajorHighway ? 1.25 : 0.95;
            let targetCongestionScore = Math.min(100, Math.max(5, (30 * timeMultiplier * arteryWeight + noise * 40)));
            // If active incident on this road, spike congestion
            if (hasActiveIncident) {
                targetCongestionScore = Math.min(100, targetCongestionScore + 35 + Math.random() * 15);
            }
            // Smooth transition from current score to target score (damping factor 0.35)
            const current = road.congestionScore || 25;
            const newCongestionScore = Math.round(Math.max(5, Math.min(98, current + (targetCongestionScore - current) * 0.35 + (Math.random() * 6 - 3))));
            // Speed calculation: inverse relation to congestion
            // Speed drops as score increases
            const speedRatio = Math.max(0.15, 1 - (newCongestionScore / 100) * 0.85);
            const newSpeed = Math.round(road.freeFlowSpeed * speedRatio);
            // Vehicle count estimate based on congestion & lanes
            const maxRoadCapacity = road.lanes * 180 * (road.lengthKm || 1.2);
            const newVehicleCount = Math.round((newCongestionScore / 100) * maxRoadCapacity + Math.random() * 15);
            const category = calculateCongestionCategory(newCongestionScore);
            road.currentSpeed = newSpeed;
            road.congestionScore = newCongestionScore;
            road.congestionCategory = category;
            road.vehicleCount = newVehicleCount;
            road.lastUpdated = now;
            road.trafficSource = 'simulated';
            updatedRoads.push(road);
            // Periodically generate snapshot (e.g., 20% sample or all)
            snapshotsToInsert.push({
                roadSegment: road._id,
                roadName: road.roadName,
                averageSpeed: newSpeed,
                vehicleCount: newVehicleCount,
                congestionScore: newCongestionScore,
                recordedAt: now,
                dataSource: 'simulated',
            });
        }
        // Bulk save roads
        await Promise.all(updatedRoads.map((r) => r.save()));
        // Insert snapshots
        if (snapshotsToInsert.length > 0) {
            await TrafficSnapshot_1.TrafficSnapshot.insertMany(snapshotsToInsert);
        }
        // Invalidate Redis/Memory caches for current traffic & dashboard
        await redis_1.CacheManager.del('dashboard:*');
        await redis_1.CacheManager.del('traffic:current*');
        await redis_1.CacheManager.del('analytics:*');
        this.lastTickTime = now;
        // Broadcast update via Socket.IO
        if (this.socketBroadcaster) {
            this.socketBroadcaster('traffic:update', {
                timestamp: now.toISOString(),
                roadsCount: updatedRoads.length,
                roads: updatedRoads.slice(0, 10).map((r) => ({
                    id: r._id,
                    roadName: r.roadName,
                    congestionScore: r.congestionScore,
                    currentSpeed: r.currentSpeed,
                    congestionCategory: r.congestionCategory,
                })),
            });
        }
        return {
            updatedRoadsCount: updatedRoads.length,
            timestamp: now.toISOString(),
        };
    }
}
exports.TrafficSimulationService = TrafficSimulationService;
exports.trafficSimulator = new TrafficSimulationService();
//# sourceMappingURL=trafficSimulationService.js.map