// ==========================================
// UrbanFlow AI - Shared Type Definitions
// ==========================================

export type UserRole = 'admin' | 'user';

export interface UserPreferences {
  theme: 'dark' | 'light' | 'system';
  speedUnit: 'km/h' | 'mph';
  defaultCity: string;
  defaultMapCenter: [number, number]; // [lat, lng]
  defaultZoom: number;
  notificationAlerts: boolean;
  refreshIntervalSeconds: number;
}

export interface IUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export type CongestionCategory = 'free_flow' | 'moderate' | 'heavy' | 'severe';

export interface GeoCoordinate {
  lat: number;
  lng: number;
}

export interface IRoadSegment {
  id: string;
  roadName: string;
  area: string;
  city: string;
  coordinates: [number, number][]; // [lat, lng][] array for Leaflet polyline
  leafletCoordinates: [number, number][]; // alias for Leaflet
  currentSpeed: number; // in km/h
  freeFlowSpeed: number; // in km/h
  congestionScore: number; // 0 to 100
  congestionCategory: CongestionCategory;
  vehicleCount: number;
  trafficSource: 'simulated' | 'live_feed' | 'manual';
  lengthKm: number;
  lanes: number;
  lastUpdated: string;
}

export interface ITrafficSnapshot {
  id: string;
  roadSegmentId: string;
  roadName: string;
  averageSpeed: number;
  vehicleCount: number;
  congestionScore: number;
  recordedAt: string;
  dataSource: 'simulated' | 'live_feed';
}

export type IncidentType = 'accident' | 'construction' | 'congestion' | 'hazard' | 'roadwork' | 'event';
export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';
export type IncidentStatus = 'reported' | 'investigating' | 'confirmed' | 'clearing' | 'resolved';

export interface ITrafficIncident {
  id: string;
  title: string;
  type: IncidentType;
  description: string;
  roadName: string;
  latitude: number;
  longitude: number;
  location: {
    lat: number;
    lng: number;
  };
  severity: IncidentSeverity;
  status: IncidentStatus;
  reportedBy?: {
    id: string;
    name: string;
    email: string;
  };
  impactRadiusMeters: number;
  estimatedDelayMinutes: number;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface IRouteAlternative {
  id: string;
  name: string;
  summary: string;
  distanceMeters: number;
  durationSeconds: number; // base duration
  estimatedDurationSeconds: number; // traffic-adjusted
  delaySeconds: number;
  averageCongestionScore: number;
  congestionCategory: CongestionCategory;
  coordinates: [number, number][]; // [lat, lng][]
  rankingScore: number;
  recommendationReason: string;
  congestedSegmentsCount: number;
}

export interface IRouteRecommendationResponse {
  origin: {
    name: string;
    lat: number;
    lng: number;
  };
  destination: {
    name: string;
    lat: number;
    lng: number;
  };
  bestRoute: IRouteAlternative;
  alternatives: IRouteAlternative[];
  routingProvider: string;
  trafficDataSource: 'simulated_live_overlay' | 'historical_baseline';
  disclaimer: string;
}

export interface IDashboardSummary {
  totalRoadsMonitored: number;
  congestedRoadsCount: number;
  freeFlowRoadsCount: number;
  averageSpeedKmh: number;
  averageCongestionScore: number;
  estimatedCitywideDelayMinutes: number;
  activeIncidentsCount: number;
  criticalIncidentsCount: number;
  lastUpdated: string;
  trafficStatus: 'optimal' | 'moderate' | 'congested' | 'severe';
  dataSource: string;
}

export interface ICongestionDistribution {
  category: CongestionCategory;
  label: string;
  count: number;
  percentage: number;
  color: string;
}

export interface ITrafficTrendPoint {
  hour: string; // e.g. "08:00"
  averageSpeed: number;
  averageCongestion: number;
  vehicleVolume: number;
  isPeakHour?: boolean;
}

export interface ISystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptimeSeconds: number;
  database: {
    connected: boolean;
    provider: 'mongodb' | 'in-memory-mongo';
    latencyMs: number;
  };
  redis: {
    connected: boolean;
    type: 'redis' | 'in-memory-fallback';
    cachedKeysCount: number;
  };
  simulation: {
    active: boolean;
    lastTick: string;
    intervalMs: number;
  };
  routingProvider: {
    status: 'online' | 'degraded';
    name: string;
  };
}
