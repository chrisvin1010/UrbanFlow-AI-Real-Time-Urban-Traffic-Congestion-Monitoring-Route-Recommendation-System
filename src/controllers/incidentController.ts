import { Request, Response } from 'express';
import { TrafficIncident } from '../models/TrafficIncident';
import { AuditLog } from '../models/AuditLog';
import { CacheManager } from '../config/redis';
import { broadcastSocketEvent } from '../sockets/trafficSocket';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export class IncidentController {
  public static async getIncidents(req: Request, res: Response): Promise<void> {
    try {
      const { type, severity, status, search } = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      const filter: any = {};
      if (type && type !== 'all') filter.type = type;
      if (severity && severity !== 'all') filter.severity = severity;
      if (status && status !== 'all') filter.status = status;
      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: 'i' } },
          { roadName: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ];
      }

      const total = await TrafficIncident.countDocuments(filter);
      const incidents = await TrafficIncident.find(filter)
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
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async getIncidentById(req: Request, res: Response): Promise<void> {
    try {
      const incident = await TrafficIncident.findById(req.params.id).populate('reportedBy', 'name email');
      if (!incident) {
        res.status(404).json({ success: false, message: 'Traffic incident not found' });
        return;
      }

      res.status(200).json({
        success: true,
        data: incident,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async createIncident(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const {
        title,
        type,
        description,
        roadName,
        latitude,
        longitude,
        severity = 'medium',
        impactRadiusMeters = 500,
        estimatedDelayMinutes = 10,
      } = req.body;

      const incident = await TrafficIncident.create({
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

      await CacheManager.del('dashboard:*');
      await CacheManager.del('analytics:*');

      broadcastSocketEvent('incident:created', incident);

      if (req.user) {
        await AuditLog.create({
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
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async updateIncident(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const incident = await TrafficIncident.findById(req.params.id);
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

      await CacheManager.del('dashboard:*');
      await CacheManager.del('analytics:*');

      broadcastSocketEvent('incident:updated', incident);

      if (req.user) {
        await AuditLog.create({
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
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async deleteIncident(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const incident = await TrafficIncident.findByIdAndDelete(req.params.id);
      if (!incident) {
        res.status(404).json({ success: false, message: 'Traffic incident not found' });
        return;
      }

      await CacheManager.del('dashboard:*');
      broadcastSocketEvent('incident:deleted', { id: req.params.id });

      if (req.user) {
        await AuditLog.create({
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
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
