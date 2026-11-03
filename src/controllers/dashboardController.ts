import { Request, Response } from 'express';
import { RoadSegment } from '../models/RoadSegment';
import { TrafficIncident } from '../models/TrafficIncident';
import { CacheManager } from '../config/redis';
import { IDashboardSummary, ICongestionDistribution, ITrafficTrendPoint } from '@shared/types';

export class DashboardController {
  public static async getSummary(req: Request, res: Response): Promise<void> {
    try {
      const area = req.query.area as string;
      const cacheKey = `dashboard:summary:${area || 'all'}`;
      const cached = await CacheManager.get<IDashboardSummary>(cacheKey);

      if (cached) {
        res.status(200).json({ success: true, data: cached });
        return;
      }

      const query: any = {};
      if (area && area !== 'all') {
        query.area = area;
      }

      const roads = await RoadSegment.find(query);
      const totalRoads = roads.length;
      const congestedRoads = roads.filter((r) => r.congestionScore >= 60).length;
      const freeFlowRoads = roads.filter((r) => r.congestionScore < 30).length;

      const avgSpeed =
        totalRoads > 0
          ? Math.round(roads.reduce((acc, r) => acc + r.currentSpeed, 0) / totalRoads)
          : 50;

      const avgCongestion =
        totalRoads > 0
          ? Math.round(roads.reduce((acc, r) => acc + r.congestionScore, 0) / totalRoads)
          : 25;

      // Estimated citywide delay: 0.35 min per unit of congestion score above 30
      const delayMins = Math.max(0, Math.round((avgCongestion - 20) * 0.4));

      const activeIncidents = await TrafficIncident.countDocuments({ status: { $ne: 'resolved' } });
      const criticalIncidents = await TrafficIncident.countDocuments({
        status: { $ne: 'resolved' },
        severity: 'critical',
      });

      let trafficStatus: 'optimal' | 'moderate' | 'congested' | 'severe' = 'optimal';
      if (avgCongestion >= 75) trafficStatus = 'severe';
      else if (avgCongestion >= 55) trafficStatus = 'congested';
      else if (avgCongestion >= 35) trafficStatus = 'moderate';

      const summary: IDashboardSummary = {
        totalRoadsMonitored: totalRoads,
        congestedRoadsCount: congestedRoads,
        freeFlowRoadsCount: freeFlowRoads,
        averageSpeedKmh: avgSpeed,
        averageCongestionScore: avgCongestion,
        estimatedCitywideDelayMinutes: delayMins,
        activeIncidentsCount: activeIncidents,
        criticalIncidentsCount: criticalIncidents,
        lastUpdated: new Date().toISOString(),
        trafficStatus,
        dataSource: 'MongoDB Real-Time Telemetry & Simulation',
      };

      await CacheManager.set(cacheKey, summary, 15);

      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async getCongestionDistribution(req: Request, res: Response): Promise<void> {
    try {
      const area = req.query.area as string;
      const cacheKey = `dashboard:distribution:${area || 'all'}`;
      const cached = await CacheManager.get<ICongestionDistribution[]>(cacheKey);

      if (cached) {
        res.status(200).json({ success: true, data: cached });
        return;
      }

      const query: any = {};
      if (area && area !== 'all') {
        query.area = area;
      }

      const roads = await RoadSegment.find(query);
      const total = Math.max(1, roads.length);

      const counts = {
        free_flow: 0,
        moderate: 0,
        heavy: 0,
        severe: 0,
      };

      for (const r of roads) {
        if (r.congestionScore < 30) counts.free_flow++;
        else if (r.congestionScore < 60) counts.moderate++;
        else if (r.congestionScore < 80) counts.heavy++;
        else counts.severe++;
      }

      const distribution: ICongestionDistribution[] = [
        {
          category: 'free_flow',
          label: 'Free Flow (<30%)',
          count: counts.free_flow,
          percentage: Math.round((counts.free_flow / total) * 100),
          color: '#10b981', // emerald-500
        },
        {
          category: 'moderate',
          label: 'Moderate (30-59%)',
          count: counts.moderate,
          percentage: Math.round((counts.moderate / total) * 100),
          color: '#f59e0b', // amber-500
        },
        {
          category: 'heavy',
          label: 'Heavy (60-79%)',
          count: counts.heavy,
          percentage: Math.round((counts.heavy / total) * 100),
          color: '#f97316', // orange-500
        },
        {
          category: 'severe',
          label: 'Severe (80%+)',
          count: counts.severe,
          percentage: Math.round((counts.severe / total) * 100),
          color: '#ef4444', // red-500
        },
      ];

      await CacheManager.set(cacheKey, distribution, 15);
      res.status(200).json({ success: true, data: distribution });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async getTrafficTrends(req: Request, res: Response): Promise<void> {
    try {
      const area = req.query.area as string;
      const cacheKey = `dashboard:trends:${area || 'all'}`;
      const cached = await CacheManager.get<ITrafficTrendPoint[]>(cacheKey);

      if (cached) {
        res.status(200).json({ success: true, data: cached });
        return;
      }

      // 12 data points representing recent 12-hour progression
      const currentHour = new Date().getHours();
      const points: ITrafficTrendPoint[] = [];

      for (let i = 11; i >= 0; i--) {
        const hourVal = (currentHour - i + 24) % 24;
        const hourStr = `${hourVal.toString().padStart(2, '0')}:00`;
        const isPeak = (hourVal >= 8 && hourVal <= 9) || (hourVal >= 17 && hourVal <= 18);

        // Realistic variations
        let baseCongestion = 30;
        if (isPeak) baseCongestion = 78 + Math.round(Math.random() * 12);
        else if (hourVal >= 11 && hourVal <= 14) baseCongestion = 48 + Math.round(Math.random() * 8);
        else if (hourVal >= 22 || hourVal <= 5) baseCongestion = 12 + Math.round(Math.random() * 6);
        else baseCongestion = 35 + Math.round(Math.random() * 10);

        const speed = Math.round(65 - (baseCongestion / 100) * 42);
        const volume = Math.round(baseCongestion * 65 + 300);

        points.push({
          hour: hourStr,
          averageSpeed: speed,
          averageCongestion: baseCongestion,
          vehicleVolume: volume,
          isPeakHour: isPeak,
        });
      }

      await CacheManager.set(cacheKey, points, 30);
      res.status(200).json({ success: true, data: points });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async getTopCongestedRoads(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt((req.query.limit as string) || '5', 10);
      const roads = await RoadSegment.find({})
        .sort({ congestionScore: -1 })
        .limit(limit)
        .select('roadName area currentSpeed freeFlowSpeed congestionScore congestionCategory vehicleCount lengthKm lastUpdated');

      res.status(200).json({
        success: true,
        data: roads,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async getRecentEvents(_req: Request, res: Response): Promise<void> {
    try {
      const incidents = await TrafficIncident.find({})
        .sort({ createdAt: -1 })
        .limit(6)
        .select('title type roadName severity status estimatedDelayMinutes createdAt');

      res.status(200).json({
        success: true,
        data: incidents,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
