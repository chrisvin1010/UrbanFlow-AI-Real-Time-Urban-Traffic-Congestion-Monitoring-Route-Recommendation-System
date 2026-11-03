import { RoadSegment } from '../models/RoadSegment';
import { TrafficSnapshot } from '../models/TrafficSnapshot';
import { TrafficIncident } from '../models/TrafficIncident';
import { CacheManager } from '../config/redis';

export class AnalyticsService {
  public async getOverview(areaFilter?: string) {
    const cacheKey = `analytics:overview:${areaFilter || 'all'}`;
    const cached = await CacheManager.get(cacheKey);
    if (cached) return cached;

    const query: any = {};
    if (areaFilter && areaFilter !== 'all') {
      query.area = areaFilter;
    }

    const roads = await RoadSegment.find(query);
    const totalRoads = roads.length;
    const congestedRoads = roads.filter((r) => r.congestionScore >= 60).length;
    const avgSpeed =
      totalRoads > 0
        ? Math.round(roads.reduce((acc, r) => acc + r.currentSpeed, 0) / totalRoads)
        : 45;
    const avgCongestion =
      totalRoads > 0
        ? Math.round(roads.reduce((acc, r) => acc + r.congestionScore, 0) / totalRoads)
        : 25;
    const totalVehicles = roads.reduce((acc, r) => acc + (r.vehicleCount || 0), 0);

    const incidentsQuery: any = { status: { $ne: 'resolved' } };
    const activeIncidents = await TrafficIncident.countDocuments(incidentsQuery);

    // Area-wise aggregation
    const areaBreakdownMap = new Map<string, { count: number; totalSpeed: number; totalCongestion: number; vehicles: number }>();
    for (const r of roads) {
      const area = r.area || 'Unknown';
      const existing = areaBreakdownMap.get(area) || { count: 0, totalSpeed: 0, totalCongestion: 0, vehicles: 0 };
      existing.count += 1;
      existing.totalSpeed += r.currentSpeed;
      existing.totalCongestion += r.congestionScore;
      existing.vehicles += r.vehicleCount || 0;
      areaBreakdownMap.set(area, existing);
    }

    const areaComparisons = Array.from(areaBreakdownMap.entries()).map(([area, stats]) => ({
      area,
      roadCount: stats.count,
      avgSpeed: Math.round(stats.totalSpeed / stats.count),
      avgCongestion: Math.round(stats.totalCongestion / stats.count),
      totalVehicles: stats.vehicles,
    }));

    const result = {
      totalRoads,
      congestedRoads,
      avgSpeed,
      avgCongestion,
      totalVehicles,
      activeIncidents,
      areaComparisons,
      generatedAt: new Date().toISOString(),
    };

    await CacheManager.set(cacheKey, result, 30);
    return result;
  }

  public async getPeakHours() {
    const cacheKey = 'analytics:peak_hours';
    const cached = await CacheManager.get(cacheKey);
    if (cached) return cached;

    // Simulate 24-hour typical urban curve with realistic peaks
    const hourlyData = [
      { hour: '00:00', avgSpeed: 58, congestion: 12, volume: 450, isPeak: false },
      { hour: '02:00', avgSpeed: 60, congestion: 8, volume: 220, isPeak: false },
      { hour: '04:00', avgSpeed: 60, congestion: 10, volume: 310, isPeak: false },
      { hour: '06:00', avgSpeed: 52, congestion: 28, volume: 1850, isPeak: false },
      { hour: '07:00', avgSpeed: 38, congestion: 58, volume: 3400, isPeak: false },
      { hour: '08:00', avgSpeed: 24, congestion: 84, volume: 5800, isPeak: true },
      { hour: '09:00', avgSpeed: 29, congestion: 72, volume: 4900, isPeak: true },
      { hour: '10:00', avgSpeed: 42, congestion: 46, volume: 3200, isPeak: false },
      { hour: '12:00', avgSpeed: 39, congestion: 52, volume: 3600, isPeak: false },
      { hour: '14:00', avgSpeed: 44, congestion: 42, volume: 3100, isPeak: false },
      { hour: '16:00', avgSpeed: 32, congestion: 68, volume: 4600, isPeak: false },
      { hour: '17:00', avgSpeed: 21, congestion: 89, volume: 6200, isPeak: true },
      { hour: '18:00', avgSpeed: 23, congestion: 85, volume: 5900, isPeak: true },
      { hour: '19:00', avgSpeed: 34, congestion: 60, volume: 4200, isPeak: false },
      { hour: '20:00', avgSpeed: 46, congestion: 38, volume: 2700, isPeak: false },
      { hour: '22:00', avgSpeed: 54, congestion: 20, volume: 1400, isPeak: false },
    ];

    const result = {
      morningPeak: { time: '08:00 - 09:30', congestionAvg: 78, bottleneckArea: 'Downtown & Financial District' },
      eveningPeak: { time: '17:00 - 18:30', congestionAvg: 87, bottleneckArea: 'Bay Bridge, US-101 & SoMa' },
      hourlyData,
    };

    await CacheManager.set(cacheKey, result, 60);
    return result;
  }

  public async getRoadComparisons(limit: number = 10) {
    const roads = await RoadSegment.find({}).sort({ congestionScore: -1 }).limit(limit);
    return roads.map((r) => ({
      id: r._id,
      roadName: r.roadName,
      area: r.area,
      currentSpeed: r.currentSpeed,
      freeFlowSpeed: r.freeFlowSpeed,
      congestionScore: r.congestionScore,
      vehicleCount: r.vehicleCount,
      congestionCategory: r.congestionCategory,
    }));
  }

  public async exportCsvReport(area?: string): Promise<string> {
    const query: any = {};
    if (area && area !== 'all') {
      query.area = area;
    }

    const roads = await RoadSegment.find(query).sort({ congestionScore: -1 });
    const incidents = await TrafficIncident.find({}).limit(50);

    let csv = 'ROAD_ID,ROAD_NAME,AREA,CURRENT_SPEED_KMH,FREE_FLOW_SPEED_KMH,CONGESTION_PERCENT,CONGESTION_CATEGORY,VEHICLE_COUNT,DATA_SOURCE,LAST_UPDATED\n';

    for (const r of roads) {
      const line = [
        `"${r._id}"`,
        `"${r.roadName.replace(/"/g, '""')}"`,
        `"${r.area}"`,
        r.currentSpeed,
        r.freeFlowSpeed,
        r.congestionScore,
        `"${r.congestionCategory}"`,
        r.vehicleCount || 0,
        `"${r.trafficSource}"`,
        `"${r.lastUpdated.toISOString()}"`,
      ].join(',');
      csv += line + '\n';
    }

    csv += '\n--- ACTIVE INCIDENTS REPORT ---\n';
    csv += 'INCIDENT_ID,TITLE,TYPE,SEVERITY,STATUS,ROAD_NAME,ESTIMATED_DELAY_MINS,REPORTED_AT\n';
    for (const inc of incidents) {
      const incLine = [
        `"${inc._id}"`,
        `"${inc.title.replace(/"/g, '""')}"`,
        `"${inc.type}"`,
        `"${inc.severity}"`,
        `"${inc.status}"`,
        `"${inc.roadName.replace(/"/g, '""')}"`,
        inc.estimatedDelayMinutes,
        `"${inc.createdAt.toISOString()}"`,
      ].join(',');
      csv += incLine + '\n';
    }

    return csv;
  }
}

export const analyticsService = new AnalyticsService();
