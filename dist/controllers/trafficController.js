"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrafficController = void 0;
const RoadSegment_1 = require("../models/RoadSegment");
const TrafficSnapshot_1 = require("../models/TrafficSnapshot");
const trafficSimulationService_1 = require("../services/trafficSimulationService");
const redis_1 = require("../config/redis");
class TrafficController {
    static async getCurrent(req, res) {
        try {
            const area = req.query.area;
            const cacheKey = `traffic:current:${area || 'all'}`;
            const cached = await redis_1.CacheManager.get(cacheKey);
            if (cached) {
                res.status(200).json({ success: true, data: cached });
                return;
            }
            const query = {};
            if (area && area !== 'all') {
                query.area = area;
            }
            const roads = await RoadSegment_1.RoadSegment.find(query).select('roadName area currentSpeed freeFlowSpeed congestionScore congestionCategory vehicleCount leafletCoordinates lengthKm lanes lastUpdated trafficSource');
            await redis_1.CacheManager.set(cacheKey, roads, 10);
            res.status(200).json({
                success: true,
                data: roads,
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async getHistory(req, res) {
        try {
            const roadId = req.query.roadId;
            const limit = parseInt(req.query.limit || '50', 10);
            const query = {};
            if (roadId) {
                query.roadSegment = roadId;
            }
            const snapshots = await TrafficSnapshot_1.TrafficSnapshot.find(query)
                .sort({ recordedAt: -1 })
                .limit(limit);
            res.status(200).json({
                success: true,
                data: snapshots,
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async getHeatmap(_req, res) {
        try {
            const roads = await RoadSegment_1.RoadSegment.find({}).select('leafletCoordinates congestionScore');
            const heatmapPoints = [];
            for (const road of roads) {
                const intensity = Math.min(1.0, (road.congestionScore || 30) / 100);
                for (const coord of road.leafletCoordinates) {
                    heatmapPoints.push({
                        lat: coord[0],
                        lng: coord[1],
                        intensity,
                    });
                }
            }
            res.status(200).json({
                success: true,
                data: heatmapPoints,
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async triggerSimulation(_req, res) {
        try {
            const result = await trafficSimulationService_1.trafficSimulator.simulateTick();
            res.status(200).json({
                success: true,
                message: `Simulation tick executed successfully. Updated ${result.updatedRoadsCount} road segments.`,
                data: result,
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
exports.TrafficController = TrafficController;
//# sourceMappingURL=trafficController.js.map