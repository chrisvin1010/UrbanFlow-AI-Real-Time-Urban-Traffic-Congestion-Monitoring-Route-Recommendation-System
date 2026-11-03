import { Request, Response } from 'express';
import { RoadSegment } from '../models/RoadSegment';
import { TrafficSnapshot } from '../models/TrafficSnapshot';
import { trafficSimulator } from '../services/trafficSimulationService';
import { CacheManager } from '../config/redis';

export class TrafficController {
  public static async getCurrent(req: Request, res: Response): Promise<void> {
    try {
      const area = req.query.area as string;
      const cacheKey = `traffic:current:${area || 'all'}`;
      const cached = await CacheManager.get(cacheKey);

      if (cached) {
        res.status(200).json({ success: true, data: cached });
        return;
      }

      const query: any = {};
      if (area && area !== 'all') {
        query.area = area;
      }

      const roads = await RoadSegment.find(query).select(
        'roadName area currentSpeed freeFlowSpeed congestionScore congestionCategory vehicleCount leafletCoordinates lengthKm lanes lastUpdated trafficSource'
      );

      await CacheManager.set(cacheKey, roads, 10);

      res.status(200).json({
        success: true,
        data: roads,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async getHistory(req: Request, res: Response): Promise<void> {
    try {
      const roadId = req.query.roadId as string;
      const limit = parseInt((req.query.limit as string) || '50', 10);

      const query: any = {};
      if (roadId) {
        query.roadSegment = roadId;
      }

      const snapshots = await TrafficSnapshot.find(query)
        .sort({ recordedAt: -1 })
        .limit(limit);

      res.status(200).json({
        success: true,
        data: snapshots,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async getHeatmap(_req: Request, res: Response): Promise<void> {
    try {
      const roads = await RoadSegment.find({}).select('leafletCoordinates congestionScore');
      const heatmapPoints: { lat: number; lng: number; intensity: number }[] = [];

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
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async triggerSimulation(_req: Request, res: Response): Promise<void> {
    try {
      const result = await trafficSimulator.simulateTick();
      res.status(200).json({
        success: true,
        message: `Simulation tick executed successfully. Updated ${result.updatedRoadsCount} road segments.`,
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
