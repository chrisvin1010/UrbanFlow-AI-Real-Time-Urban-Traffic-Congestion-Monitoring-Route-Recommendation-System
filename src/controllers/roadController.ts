import { Request, Response } from 'express';
import { RoadSegment, IRoadSegmentDocument } from '../models/RoadSegment';
import { TrafficSnapshot } from '../models/TrafficSnapshot';
import { AuditLog } from '../models/AuditLog';
import { calculateCongestionCategory } from '../services/trafficSimulationService';
import { CacheManager } from '../config/redis';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export class RoadController {
  public static async getRoads(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const search = (req.query.search as string || '').trim();
      const area = req.query.area as string;
      const category = req.query.category as string;
      const sortBy = (req.query.sortBy as string) || 'congestionScore';
      const order = req.query.order === 'asc' ? 1 : -1;

      const filter: any = {};
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

      const total = await RoadSegment.countDocuments(filter);
      const roads = await RoadSegment.find(filter)
        .sort({ [sortBy]: order })
        .skip((page - 1) * limit)
        .limit(limit);

      // Unique areas list for filtering dropdown
      const areas = await RoadSegment.distinct('area');

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
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async getRoadById(req: Request, res: Response): Promise<void> {
    try {
      const road = await RoadSegment.findById(req.params.id);
      if (!road) {
        res.status(404).json({ success: false, message: 'Road segment not found' });
        return;
      }

      // Recent snapshots for this road
      const snapshots = await TrafficSnapshot.find({ roadSegment: road._id })
        .sort({ recordedAt: -1 })
        .limit(20);

      res.status(200).json({
        success: true,
        data: {
          road,
          history: snapshots,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async createRoad(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const {
        roadName,
        area,
        city = 'San Francisco',
        coordinates,
        freeFlowSpeed = 50,
        currentSpeed,
        lanes = 2,
        lengthKm = 1.2,
      } = req.body;

      // coordinates is [ [lat, lng], ... ]
      const leafletCoordinates: [number, number][] = coordinates;
      // Convert to GeoJSON [ [lng, lat], ... ]
      const geoCoordinates: number[][] = coordinates.map((c: [number, number]) => [c[1], c[0]]);

      const speed = currentSpeed !== undefined ? currentSpeed : freeFlowSpeed;
      const score = Math.max(0, Math.min(100, Math.round((1 - speed / freeFlowSpeed) * 100)));
      const category = calculateCongestionCategory(score);

      const road = await RoadSegment.create({
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

      await CacheManager.del('dashboard:*');
      await CacheManager.del('roads:*');

      if (req.user) {
        await AuditLog.create({
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
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async updateRoad(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const road = await RoadSegment.findById(req.params.id);
      if (!road) {
        res.status(404).json({ success: false, message: 'Road segment not found' });
        return;
      }

      const updates = req.body;

      if (updates.coordinates) {
        road.leafletCoordinates = updates.coordinates;
        road.geometry = {
          type: 'LineString',
          coordinates: updates.coordinates.map((c: [number, number]) => [c[1], c[0]]),
        };
      }

      if (updates.currentSpeed !== undefined) {
        road.currentSpeed = updates.currentSpeed;
        const freeFlow = updates.freeFlowSpeed || road.freeFlowSpeed;
        road.congestionScore = Math.max(0, Math.min(100, Math.round((1 - road.currentSpeed / freeFlow) * 100)));
        road.congestionCategory = calculateCongestionCategory(road.congestionScore);
      }

      if (updates.freeFlowSpeed !== undefined) road.freeFlowSpeed = updates.freeFlowSpeed;
      if (updates.roadName !== undefined) road.roadName = updates.roadName;
      if (updates.area !== undefined) road.area = updates.area;
      if (updates.vehicleCount !== undefined) road.vehicleCount = updates.vehicleCount;
      if (updates.lanes !== undefined) road.lanes = updates.lanes;

      road.lastUpdated = new Date();
      await road.save();

      await CacheManager.del('dashboard:*');
      await CacheManager.del('roads:*');

      if (req.user) {
        await AuditLog.create({
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
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async deleteRoad(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const road = await RoadSegment.findByIdAndDelete(req.params.id);
      if (!road) {
        res.status(404).json({ success: false, message: 'Road segment not found' });
        return;
      }

      await CacheManager.del('dashboard:*');
      await CacheManager.del('roads:*');

      if (req.user) {
        await AuditLog.create({
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
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
