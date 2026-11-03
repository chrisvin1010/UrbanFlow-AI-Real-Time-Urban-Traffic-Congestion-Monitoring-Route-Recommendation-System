"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoadController = void 0;
const RoadSegment_1 = require("../models/RoadSegment");
const TrafficSnapshot_1 = require("../models/TrafficSnapshot");
const AuditLog_1 = require("../models/AuditLog");
const trafficSimulationService_1 = require("../services/trafficSimulationService");
const redis_1 = require("../config/redis");
class RoadController {
    static async getRoads(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 50;
            const search = (req.query.search || '').trim();
            const area = req.query.area;
            const category = req.query.category;
            const sortBy = req.query.sortBy || 'congestionScore';
            const order = req.query.order === 'asc' ? 1 : -1;
            const filter = {};
            if (search) {
                filter.$or = [
                    { roadName: { $regex: search, $options: 'i' } },
                    { area: { $regex: search, $options: 'i' } },
                ];
            }
            if (area && area !== 'all') {
                filter.area = area;
            }
            if (category && category !== 'all') {
                filter.congestionCategory = category;
            }
            const total = await RoadSegment_1.RoadSegment.countDocuments(filter);
            const roads = await RoadSegment_1.RoadSegment.find(filter)
                .sort({ [sortBy]: order })
                .skip((page - 1) * limit)
                .limit(limit);
            // Unique areas list for filtering dropdown
            const areas = await RoadSegment_1.RoadSegment.distinct('area');
            res.status(200).json({
                success: true,
                data: roads,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                },
                filters: {
                    availableAreas: areas,
                },
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async getRoadById(req, res) {
        try {
            const road = await RoadSegment_1.RoadSegment.findById(req.params.id);
            if (!road) {
                res.status(404).json({ success: false, message: 'Road segment not found' });
                return;
            }
            // Recent snapshots for this road
            const snapshots = await TrafficSnapshot_1.TrafficSnapshot.find({ roadSegment: road._id })
                .sort({ recordedAt: -1 })
                .limit(20);
            res.status(200).json({
                success: true,
                data: {
                    road,
                    history: snapshots,
                },
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async createRoad(req, res) {
        try {
            const { roadName, area, city = 'San Francisco', coordinates, freeFlowSpeed = 50, currentSpeed, lanes = 2, lengthKm = 1.2, } = req.body;
            // coordinates is [ [lat, lng], ... ]
            const leafletCoordinates = coordinates;
            // Convert to GeoJSON [ [lng, lat], ... ]
            const geoCoordinates = coordinates.map((c) => [c[1], c[0]]);
            const speed = currentSpeed !== undefined ? currentSpeed : freeFlowSpeed;
            const score = Math.max(0, Math.min(100, Math.round((1 - speed / freeFlowSpeed) * 100)));
            const category = (0, trafficSimulationService_1.calculateCongestionCategory)(score);
            const road = await RoadSegment_1.RoadSegment.create({
                roadName,
                area,
                city,
                geometry: {
                    type: 'LineString',
                    coordinates: geoCoordinates,
                },
                leafletCoordinates,
                freeFlowSpeed,
                currentSpeed: speed,
                congestionScore: score,
                congestionCategory: category,
                lanes,
                lengthKm,
                vehicleCount: Math.round(lanes * 50),
                trafficSource: 'manual',
            });
            await redis_1.CacheManager.del('dashboard:*');
            await redis_1.CacheManager.del('roads:*');
            if (req.user) {
                await AuditLog_1.AuditLog.create({
                    user: req.user._id,
                    userName: req.user.name,
                    action: 'ROAD_SEGMENT_CREATED',
                    entityType: 'RoadSegment',
                    entityId: road._id.toString(),
                    details: { roadName, area },
                });
            }
            res.status(201).json({
                success: true,
                message: 'Road segment created successfully.',
                data: road,
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async updateRoad(req, res) {
        try {
            const road = await RoadSegment_1.RoadSegment.findById(req.params.id);
            if (!road) {
                res.status(404).json({ success: false, message: 'Road segment not found' });
                return;
            }
            const updates = req.body;
            if (updates.coordinates) {
                road.leafletCoordinates = updates.coordinates;
                road.geometry = {
                    type: 'LineString',
                    coordinates: updates.coordinates.map((c) => [c[1], c[0]]),
                };
            }
            if (updates.currentSpeed !== undefined) {
                road.currentSpeed = updates.currentSpeed;
                const freeFlow = updates.freeFlowSpeed || road.freeFlowSpeed;
                road.congestionScore = Math.max(0, Math.min(100, Math.round((1 - road.currentSpeed / freeFlow) * 100)));
                road.congestionCategory = (0, trafficSimulationService_1.calculateCongestionCategory)(road.congestionScore);
            }
            if (updates.freeFlowSpeed !== undefined)
                road.freeFlowSpeed = updates.freeFlowSpeed;
            if (updates.roadName !== undefined)
                road.roadName = updates.roadName;
            if (updates.area !== undefined)
                road.area = updates.area;
            if (updates.vehicleCount !== undefined)
                road.vehicleCount = updates.vehicleCount;
            if (updates.lanes !== undefined)
                road.lanes = updates.lanes;
            road.lastUpdated = new Date();
            await road.save();
            await redis_1.CacheManager.del('dashboard:*');
            await redis_1.CacheManager.del('roads:*');
            if (req.user) {
                await AuditLog_1.AuditLog.create({
                    user: req.user._id,
                    userName: req.user.name,
                    action: 'ROAD_SEGMENT_UPDATED',
                    entityType: 'RoadSegment',
                    entityId: road._id.toString(),
                });
            }
            res.status(200).json({
                success: true,
                message: 'Road segment updated successfully.',
                data: road,
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async deleteRoad(req, res) {
        try {
            const road = await RoadSegment_1.RoadSegment.findByIdAndDelete(req.params.id);
            if (!road) {
                res.status(404).json({ success: false, message: 'Road segment not found' });
                return;
            }
            await redis_1.CacheManager.del('dashboard:*');
            await redis_1.CacheManager.del('roads:*');
            if (req.user) {
                await AuditLog_1.AuditLog.create({
                    user: req.user._id,
                    userName: req.user.name,
                    action: 'ROAD_SEGMENT_DELETED',
                    entityType: 'RoadSegment',
                    entityId: req.params.id,
                    details: { roadName: road.roadName },
                });
            }
            res.status(200).json({
                success: true,
                message: 'Road segment deleted successfully.',
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
exports.RoadController = RoadController;
//# sourceMappingURL=roadController.js.map