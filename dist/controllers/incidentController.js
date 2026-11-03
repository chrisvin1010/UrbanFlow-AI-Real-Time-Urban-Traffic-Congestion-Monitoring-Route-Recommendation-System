"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IncidentController = void 0;
const TrafficIncident_1 = require("../models/TrafficIncident");
const AuditLog_1 = require("../models/AuditLog");
const redis_1 = require("../config/redis");
const trafficSocket_1 = require("../sockets/trafficSocket");
class IncidentController {
    static async getIncidents(req, res) {
        try {
            const { type, severity, status, search } = req.query;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 50;
            const filter = {};
            if (type && type !== 'all')
                filter.type = type;
            if (severity && severity !== 'all')
                filter.severity = severity;
            if (status && status !== 'all')
                filter.status = status;
            if (search) {
                filter.$or = [
                    { title: { $regex: search, $options: 'i' } },
                    { roadName: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } },
                ];
            }
            const total = await TrafficIncident_1.TrafficIncident.countDocuments(filter);
            const incidents = await TrafficIncident_1.TrafficIncident.find(filter)
                .populate('reportedBy', 'name email')
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit);
            res.status(200).json({
                success: true,
                data: incidents,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                },
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async getIncidentById(req, res) {
        try {
            const incident = await TrafficIncident_1.TrafficIncident.findById(req.params.id).populate('reportedBy', 'name email');
            if (!incident) {
                res.status(404).json({ success: false, message: 'Traffic incident not found' });
                return;
            }
            res.status(200).json({
                success: true,
                data: incident,
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async createIncident(req, res) {
        try {
            const { title, type, description, roadName, latitude, longitude, severity = 'medium', impactRadiusMeters = 500, estimatedDelayMinutes = 10, } = req.body;
            const incident = await TrafficIncident_1.TrafficIncident.create({
                title,
                type,
                description,
                roadName,
                latitude,
                longitude,
                location: {
                    type: 'Point',
                    coordinates: [longitude, latitude], // GeoJSON [lng, lat]
                },
                severity,
                status: 'reported',
                impactRadiusMeters,
                estimatedDelayMinutes,
                reportedBy: req.user ? req.user._id : undefined,
            });
            await redis_1.CacheManager.del('dashboard:*');
            await redis_1.CacheManager.del('analytics:*');
            (0, trafficSocket_1.broadcastSocketEvent)('incident:created', incident);
            if (req.user) {
                await AuditLog_1.AuditLog.create({
                    user: req.user._id,
                    userName: req.user.name,
                    action: 'INCIDENT_REPORTED',
                    entityType: 'TrafficIncident',
                    entityId: incident._id.toString(),
                    details: { title, type, roadName, severity },
                });
            }
            res.status(201).json({
                success: true,
                message: 'Traffic incident reported successfully.',
                data: incident,
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async updateIncident(req, res) {
        try {
            const incident = await TrafficIncident_1.TrafficIncident.findById(req.params.id);
            if (!incident) {
                res.status(404).json({ success: false, message: 'Traffic incident not found' });
                return;
            }
            const updates = req.body;
            if (updates.status && updates.status === 'resolved' && incident.status !== 'resolved') {
                incident.resolvedAt = new Date();
            }
            Object.assign(incident, updates);
            await incident.save();
            await redis_1.CacheManager.del('dashboard:*');
            await redis_1.CacheManager.del('analytics:*');
            (0, trafficSocket_1.broadcastSocketEvent)('incident:updated', incident);
            if (req.user) {
                await AuditLog_1.AuditLog.create({
                    user: req.user._id,
                    userName: req.user.name,
                    action: 'INCIDENT_UPDATED',
                    entityType: 'TrafficIncident',
                    entityId: incident._id.toString(),
                    details: updates,
                });
            }
            res.status(200).json({
                success: true,
                message: 'Traffic incident updated successfully.',
                data: incident,
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async deleteIncident(req, res) {
        try {
            const incident = await TrafficIncident_1.TrafficIncident.findByIdAndDelete(req.params.id);
            if (!incident) {
                res.status(404).json({ success: false, message: 'Traffic incident not found' });
                return;
            }
            await redis_1.CacheManager.del('dashboard:*');
            (0, trafficSocket_1.broadcastSocketEvent)('incident:deleted', { id: req.params.id });
            if (req.user) {
                await AuditLog_1.AuditLog.create({
                    user: req.user._id,
                    userName: req.user.name,
                    action: 'INCIDENT_DELETED',
                    entityType: 'TrafficIncident',
                    entityId: req.params.id,
                });
            }
            res.status(200).json({
                success: true,
                message: 'Traffic incident deleted successfully.',
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
exports.IncidentController = IncidentController;
//# sourceMappingURL=incidentController.js.map