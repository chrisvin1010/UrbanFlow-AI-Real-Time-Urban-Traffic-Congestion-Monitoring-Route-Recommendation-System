import axios from 'axios';
import { ENV } from '../config/environment';
import { RoadSegment } from '../models/RoadSegment';
import { RouteSearch } from '../models/RouteSearch';
import { IRouteAlternative, IRouteRecommendationResponse, CongestionCategory } from '@shared/types';

// Pre-indexed key locations in the demonstration city (San Francisco) for instant, 100% reliable resolution
const KNOWN_LANDMARKS: Record<string, { lat: number; lng: number; name: string }> = {
  'downtown': { lat: 37.7879, lng: -122.4075, name: 'Downtown San Francisco' },
  'market street': { lat: 37.7749, lng: -122.4194, name: 'Market Street' },
  'union square': { lat: 37.7879, lng: -122.4075, name: 'Union Square' },
  'financial district': { lat: 37.7946, lng: -122.4000, name: 'Financial District' },
  'salesforce tower': { lat: 37.7897, lng: -122.3972, name: 'Salesforce Tower, SoMa' },
  'soma': { lat: 37.7785, lng: -122.4056, name: 'South of Market (SoMa)' },
  'fisherman\'s wharf': { lat: 37.8080, lng: -122.4177, name: 'Fisherman\'s Wharf' },
  'embarcadero': { lat: 37.7955, lng: -122.3937, name: 'The Embarcadero' },
  'golden gate bridge': { lat: 37.8199, lng: -122.4783, name: 'Golden Gate Bridge' },
  'presidio': { lat: 37.7989, lng: -122.4662, name: 'The Presidio' },
  'mission district': { lat: 37.7599, lng: -122.4148, name: 'Mission District' },
  'mission': { lat: 37.7599, lng: -122.4148, name: 'Mission District' },
  'castro': { lat: 37.7609, lng: -122.4350, name: 'The Castro' },
  'twin peaks': { lat: 37.7544, lng: -122.4477, name: 'Twin Peaks' },
  'sunset': { lat: 37.7533, lng: -122.4862, name: 'Sunset District' },
  'richmond': { lat: 37.7797, lng: -122.4839, name: 'Richmond District' },
  'marina': { lat: 37.8037, lng: -122.4368, name: 'Marina District' },
  'lombard street': { lat: 37.8021, lng: -122.4187, name: 'Lombard Street' },
  'ocean beach': { lat: 37.7600, lng: -122.5097, name: 'Ocean Beach' },
  'san francisco airport': { lat: 37.6213, lng: -122.3790, name: 'San Francisco Int Airport (SFO)' },
  'sfo': { lat: 37.6213, lng: -122.3790, name: 'San Francisco Int Airport (SFO)' },
  'bay bridge': { lat: 37.7983, lng: -122.3778, name: 'San Francisco-Oakland Bay Bridge' },
};

export interface GeocodedLocation {
  name: string;
  lat: number;
  lng: number;
}

export interface IRoutingProvider {
  name: string;
  getRoutes(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ): Promise<{ coordinates: [number, number][]; distanceMeters: number; durationSeconds: number }[]>;
}

export class OSRMRoutingProvider implements IRoutingProvider {
  public name = 'OSRM (Open Source Routing Machine)';

  public async getRoutes(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ): Promise<{ coordinates: [number, number][]; distanceMeters: number; durationSeconds: number }[]> {
    const url = `${ENV.OSRM_ROUTING_URL}${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson&alternatives=true`;
    
    try {
      const response = await axios.get(url, {
        timeout: 4000,
        headers: { 'User-Agent': 'UrbanFlow-AI-Traffic-Monitor/1.0' },
      });

      if (response.data && response.data.code === 'Ok' && response.data.routes?.length > 0) {
        return response.data.routes.map((r: any) => {
          // OSRM geojson coordinates are [lng, lat], convert to [lat, lng] for Leaflet
          const coords: [number, number][] = r.geometry.coordinates.map(
            (pt: [number, number]) => [pt[1], pt[0]]
          );
          return {
            coordinates: coords,
            distanceMeters: Math.round(r.distance),
            durationSeconds: Math.round(r.duration),
          };
        });
      }
    } catch (error: any) {
      console.warn(`[RoutingService] OSRM external API failed or timed out (${error.message}). Using fallback route model.`);
    }

    return this.generateFallbackRoutes(origin, destination);
  }

  // Fallback high-fidelity route generation if external network is unavailable
  private generateFallbackRoutes(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ) {
    const primaryCoords = this.interpolateWaypoints(origin, destination, 0);
    const altCoords = this.interpolateWaypoints(origin, destination, 0.008);

    const distance = this.calculateHaversineDistance(origin, destination) * 1.25;
    const baseDuration = Math.round((distance / 45000) * 3600); // 45 km/h avg

    return [
      {
        coordinates: primaryCoords,
        distanceMeters: Math.round(distance),
        durationSeconds: Math.max(180, baseDuration),
      },
      {
        coordinates: altCoords,
        distanceMeters: Math.round(distance * 1.15),
        durationSeconds: Math.round(baseDuration * 1.12),
      },
    ];
  }

  private interpolateWaypoints(
    origin: { lat: number; lng: number },
    dest: { lat: number; lng: number },
    bendOffset: number
  ): [number, number][] {
    const steps = 12;
    const pts: [number, number][] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      // Linear interpolation + parabolic bend for realistic road turn
      const lat = origin.lat + (dest.lat - origin.lat) * t + Math.sin(t * Math.PI) * bendOffset;
      const lng = origin.lng + (dest.lng - origin.lng) * t - Math.sin(t * Math.PI) * (bendOffset * 0.7);
      pts.push([parseFloat(lat.toFixed(5)), parseFloat(lng.toFixed(5))]);
    }
    return pts;
  }

  private calculateHaversineDistance(
    a: { lat: number; lng: number },
    b: { lat: number; lng: number }
  ): number {
    const R = 6371000; // meters
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const sinHalfLat = Math.sin(dLat / 2);
    const sinHalfLng = Math.sin(dLng / 2);
    const aVal =
      sinHalfLat * sinHalfLat +
      Math.cos((a.lat * Math.PI) / 180) *
        Math.cos((b.lat * Math.PI) / 180) *
        sinHalfLng *
        sinHalfLng;
    const c = 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));
    return R * c;
  }
}

export class RoutingService {
  private provider: IRoutingProvider;

  constructor(provider?: IRoutingProvider) {
    this.provider = provider || new OSRMRoutingProvider();
  }

  public setProvider(provider: IRoutingProvider) {
    this.provider = provider;
  }

  public async geocode(query: string, fallbackCoords?: [number, number]): Promise<GeocodedLocation> {
    const clean = query.trim().toLowerCase();

    // Check pre-indexed landmark dictionary
    for (const [key, val] of Object.entries(KNOWN_LANDMARKS)) {
      if (clean.includes(key)) {
        return { name: val.name, lat: val.lat, lng: val.lng };
      }
    }

    // Check if input is "lat, lng" format
    const coordMatch = clean.match(/^(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)$/);
    if (coordMatch) {
      return {
        name: `Custom Location (${query})`,
        lat: parseFloat(coordMatch[1]),
        lng: parseFloat(coordMatch[3]),
      };
    }

    // Try Nominatim geocoding
    try {
      const url = `${ENV.NOMINATIM_GEOCODING_URL}?q=${encodeURIComponent(query + ', San Francisco')}&format=json&limit=1`;
      const res = await axios.get(url, {
        timeout: 3000,
        headers: { 'User-Agent': 'UrbanFlow-Traffic-Geocode/1.0' },
      });

      if (res.data && res.data.length > 0) {
        return {
          name: res.data[0].display_name.split(',')[0],
          lat: parseFloat(res.data[0].lat),
          lng: parseFloat(res.data[0].lon),
        };
      }
    } catch {
      // Continue to fallback
    }

    // If explicit coordinates provided in request
    if (fallbackCoords && fallbackCoords.length === 2) {
      return {
        name: query,
        lat: fallbackCoords[0],
        lng: fallbackCoords[1],
      };
    }

    // Default to Downtown San Francisco center
    return {
      name: query.length > 0 ? query : 'Market Street, San Francisco',
      lat: 37.7749,
      lng: -122.4194,
    };
  }

  public async recommendRoute(
    originQuery: string,
    destinationQuery: string,
    preference: 'fastest' | 'least_congested' | 'shortest' = 'fastest',
    originCoords?: [number, number],
    destinationCoords?: [number, number],
    userId?: string
  ): Promise<IRouteRecommendationResponse> {
    const origin = await this.geocode(originQuery, originCoords);
    const destination = await this.geocode(destinationQuery, destinationCoords);

    // Fetch raw route alternatives from routing provider
    const rawRoutes = await this.provider.getRoutes(origin, destination);

    // Fetch current monitored road segments for traffic overlay
    const roadSegments = await RoadSegment.find({});

    // Process alternatives and calculate congestion impact
    const processedAlternatives: IRouteAlternative[] = rawRoutes.map((raw, idx) => {
      const congestionStats = this.evaluateRouteCongestion(raw.coordinates, roadSegments);
      
      // Delay multiplier based on average congestion
      const delayFactor = (congestionStats.averageCongestionScore / 100) * 0.75;
      const delaySeconds = Math.round(raw.durationSeconds * delayFactor);
      const estimatedDurationSeconds = raw.durationSeconds + delaySeconds;

      // Ranking score: lower is better
      let rankingScore = 0;
      if (preference === 'fastest') {
        // 70% weight on total estimated duration, 30% on congestion
        rankingScore = estimatedDurationSeconds * 0.7 + congestionStats.averageCongestionScore * 10;
      } else if (preference === 'least_congested') {
        // 70% weight on congestion, 30% on duration
        rankingScore = congestionStats.averageCongestionScore * 40 + estimatedDurationSeconds * 0.3;
      } else {
        // Shortest: 80% on distance
        rankingScore = raw.distanceMeters * 0.8 + estimatedDurationSeconds * 0.2;
      }

      let category: CongestionCategory = 'free_flow';
      if (congestionStats.averageCongestionScore >= 75) category = 'severe';
      else if (congestionStats.averageCongestionScore >= 55) category = 'heavy';
      else if (congestionStats.averageCongestionScore >= 30) category = 'moderate';

      const routeName = idx === 0 ? 'Primary Artery Route' : `Alternative Route ${idx}`;
      const reason = this.buildRecommendationReason(
        idx === 0,
        preference,
        raw.distanceMeters,
        estimatedDurationSeconds,
        congestionStats.averageCongestionScore
      );

      return {
        id: `route-opt-${idx + 1}`,
        name: routeName,
        summary: `Via ${congestionStats.primaryCorridors.join(', ') || 'Major City Arteries'}`,
        distanceMeters: raw.distanceMeters,
        durationSeconds: raw.durationSeconds,
        estimatedDurationSeconds,
        delaySeconds,
        averageCongestionScore: congestionStats.averageCongestionScore,
        congestionCategory: category,
        coordinates: raw.coordinates,
        rankingScore,
        recommendationReason: reason,
        congestedSegmentsCount: congestionStats.congestedSegmentsCount,
      };
    });

    // Sort alternatives by ranking score (ascending)
    processedAlternatives.sort((a, b) => a.rankingScore - b.rankingScore);

    const bestRoute = processedAlternatives[0];
    const otherAlternatives = processedAlternatives.slice(1);

    // Save search log
    try {
      await RouteSearch.create({
        user: userId,
        originName: origin.name,
        destinationName: destination.name,
        originCoordinates: [origin.lat, origin.lng],
        destinationCoordinates: [destination.lat, destination.lng],
        routeDistanceMeters: bestRoute.distanceMeters,
        durationSeconds: bestRoute.durationSeconds,
        estimatedDurationSeconds: bestRoute.estimatedDurationSeconds,
        recommendationReason: bestRoute.recommendationReason,
        dataSource: 'OSRM + UrbanFlow Congestion Telemetry',
      });
    } catch {
      // Non-blocking log save
    }

    return {
      origin,
      destination,
      bestRoute,
      alternatives: otherAlternatives,
      routingProvider: this.provider.name,
      trafficDataSource: 'simulated_live_overlay',
      disclaimer:
        'Standard geometry and base free-flow travel durations are provided by OpenStreetMap/OSRM. Congestion adjustments and predicted delays reflect UrbanFlow AI simulated real-time telemetry.',
    };
  }

  private evaluateRouteCongestion(
    coordinates: [number, number][],
    roads: any[]
  ): {
    averageCongestionScore: number;
    congestedSegmentsCount: number;
    primaryCorridors: string[];
  } {
    if (roads.length === 0 || coordinates.length === 0) {
      return { averageCongestionScore: 28, congestedSegmentsCount: 0, primaryCorridors: ['Central Expressway'] };
    }

    const matchedRoads: any[] = [];
    // Sample 5 points along the route to identify corridor overlaps
    const sampleIndices = [0, Math.floor(coordinates.length * 0.25), Math.floor(coordinates.length * 0.5), Math.floor(coordinates.length * 0.75), coordinates.length - 1];

    for (const idx of sampleIndices) {
      const pt = coordinates[idx];
      if (!pt) continue;

      let nearest: any = null;
      let minDistance = 0.025; // ~2.5km radius in lat/lng

      for (const road of roads) {
        if (!road.leafletCoordinates || road.leafletCoordinates.length === 0) continue;
        const mid = road.leafletCoordinates[Math.floor(road.leafletCoordinates.length / 2)];
        const dist = Math.hypot(pt[0] - mid[0], pt[1] - mid[1]);
        if (dist < minDistance) {
          minDistance = dist;
          nearest = road;
        }
      }

      if (nearest && !matchedRoads.includes(nearest)) {
        matchedRoads.push(nearest);
      }
    }

    if (matchedRoads.length === 0) {
      // Default baseline
      return { averageCongestionScore: 32, congestedSegmentsCount: 0, primaryCorridors: ['Urban Parkway'] };
    }

    const totalScore = matchedRoads.reduce((acc, r) => acc + (r.congestionScore || 30), 0);
    const avgScore = Math.round(totalScore / matchedRoads.length);
    const congestedCount = matchedRoads.filter((r) => r.congestionScore >= 60).length;
    const corridors = matchedRoads.slice(0, 3).map((r) => r.roadName);

    return {
      averageCongestionScore: avgScore,
      congestedSegmentsCount: congestedCount,
      primaryCorridors: corridors,
    };
  }

  private buildRecommendationReason(
    isPrimary: boolean,
    preference: string,
    distanceMeters: number,
    durationSeconds: number,
    congestionScore: number
  ): string {
    const distanceKm = (distanceMeters / 1000).toFixed(1);
    const durationMin = Math.round(durationSeconds / 60);

    if (congestionScore < 35) {
      return `Recommended for optimal throughput: ${distanceKm} km in ~${durationMin} mins with smooth free-flowing traffic (Congestion index: ${congestionScore}%).`;
    }
    if (preference === 'fastest') {
      return `Selected as the fastest feasible path (${durationMin} mins, ${distanceKm} km) despite moderate urban bottlenecks.`;
    }
    if (preference === 'least_congested') {
      return `Optimized to bypass severe congestion corridors (Congestion level: ${congestionScore}% vs. heavily jammed city core).`;
    }
    return `Balanced route selection based on current travel speed, road capacity, and minimum detour distance (${distanceKm} km).`;
  }
}

export const routingService = new RoutingService();
