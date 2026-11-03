import React, { useEffect, useState, useMemo } from 'react';
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import {
  Search,
  Layers,
  Info,
  AlertTriangle,
  X,
  Gauge,
  Car,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { roadApi, incidentApi } from '../services/api';
import { IRoadSegment, ITrafficIncident, CongestionCategory } from '@shared/types';
import { CongestionBadge } from '../components/common/CongestionBadge';
import { Button } from '../components/ui/Button';

// Color map for polylines
const CONGESTION_COLORS: Record<CongestionCategory, string> = {
  free_flow: '#10b981', // green
  moderate: '#f59e0b',  // yellow
  heavy: '#f97316',     // orange
  severe: '#ef4444',    // red
};

// Component to dynamically pan/zoom map to selected road
const MapFocusController: React.FC<{ targetCoords?: [number, number][] }> = ({ targetCoords }) => {
  const map = useMap();
  useEffect(() => {
    if (targetCoords && targetCoords.length > 0) {
      const bounds = L.latLngBounds(targetCoords);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15, animate: true });
    }
  }, [targetCoords, map]);
  return null;
};

// Helper for custom incident DivIcon
const createIncidentIcon = (severity: string) => {
  const colors: Record<string, string> = {
    critical: '#ef4444',
    high: '#f97316',
    medium: '#f59e0b',
    low: '#06b6d4',
  };
  const color = colors[severity] || '#ef4444';

  return L.divIcon({
    className: 'custom-incident-pin',
    html: `
      <div style="
        background: ${color};
        width: 26px;
        height: 26px;
        border-radius: 50%;
        border: 2px solid #ffffff;
        box-shadow: 0 0 12px ${color};
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
};

interface MapPageProps {
  initialSelectedRoadId?: string | null;
}

export const MapPage: React.FC<MapPageProps> = ({ initialSelectedRoadId }) => {
  const [roads, setRoads] = useState<IRoadSegment[]>([]);
  const [incidents, setIncidents] = useState<ITrafficIncident[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showIncidents, setShowIncidents] = useState<boolean>(true);
  const [selectedRoad, setSelectedRoad] = useState<IRoadSegment | null>(null);

  // Demonstration city center (San Francisco)
  const defaultCenter: [number, number] = [37.7749, -122.4194];

  useEffect(() => {
    async function loadMapData() {
      try {
        const [roadsRes, incRes] = await Promise.all([
          roadApi.getRoads({ limit: 100 }),
          incidentApi.getIncidents({ limit: 50 }),
        ]);
        setRoads(roadsRes.data);
        setIncidents(incRes.data);

        if (initialSelectedRoadId) {
          const match = roadsRes.data.find((r) => r.id === initialSelectedRoadId);
          if (match) setSelectedRoad(match);
        }
      } catch (err) {
        console.error('Failed to load map telemetry data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadMapData();
  }, [initialSelectedRoadId]);

  const filteredRoads = useMemo(() => {
    return roads.filter((r) => {
      const matchSearch =
        r.roadName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.area.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = categoryFilter === 'all' || r.congestionCategory === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [roads, searchQuery, categoryFilter]);

  return (
    <div className="relative h-[calc(100vh-8.5rem)] min-h-[500px] rounded-2xl overflow-hidden border border-navy-700/80 shadow-surface flex flex-col">
      {/* Top Map Floating Filter Bar */}
      <div className="absolute top-4 left-4 right-4 z-[1000] flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto bg-navy-900/90 backdrop-blur-md p-2 rounded-xl border border-navy-700 shadow-xl max-w-lg w-full sm:w-auto">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search road or district..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-navy-950/70 border border-navy-750 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-navy-950/70 border border-navy-750 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
          >
            <option value="all">All Congestion Levels</option>
            <option value="free_flow">Free Flow (&lt;30%)</option>
            <option value="moderate">Moderate (30-59%)</option>
            <option value="heavy">Heavy (60-79%)</option>
            <option value="severe">Severe (80%+)</option>
          </select>

          <button
            onClick={() => setShowIncidents(!showIncidents)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors ${
              showIncidents
                ? 'bg-rose-950/80 border-rose-500/40 text-rose-300'
                : 'bg-navy-950/70 border-navy-750 text-slate-400'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Incidents</span>
          </button>
        </div>

        {/* Floating City & Live Status Pill */}
        <div className="hidden md:flex items-center gap-2 pointer-events-auto bg-navy-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-navy-700 shadow-xl text-xs text-slate-300">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-semibold text-white">San Francisco Arterial Network</span>
          <span className="text-[10px] text-slate-400">({filteredRoads.length} Active Corridors)</span>
        </div>
      </div>

      {/* Main Leaflet Map Canvas */}
      <div className="flex-1 w-full h-full relative">
        <MapContainer
          center={defaultCenter}
          zoom={13}
          style={{ width: '100%', height: '100%' }}
          scrollWheelZoom={true}
        >
          {/* Map focus handler when a road is selected */}
          <MapFocusController targetCoords={selectedRoad?.leafletCoordinates} />

          {/* OpenStreetMap Tile Layer with sleeker dark tile CSS filter */}
          <TileLayer
            className="dark-tiles"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Render Monitored Road Segments as Congestion-Color Polylines */}
          {filteredRoads.map((road) => {
            const isSelected = selectedRoad?.id === road.id;
            const strokeColor = CONGESTION_COLORS[road.congestionCategory] || '#06b6d4';

            return (
              <Polyline
                key={road.id}
                positions={road.leafletCoordinates}
                pathOptions={{
                  color: isSelected ? '#ffffff' : strokeColor,
                  weight: isSelected ? 8 : 5,
                  opacity: isSelected ? 1.0 : 0.85,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
                eventHandlers={{
                  click: () => setSelectedRoad(road),
                }}
              >
                <Popup>
                  <div className="text-xs space-y-2 p-1 min-w-[200px]">
                    <div className="font-bold text-slate-100 text-sm border-b border-navy-750 pb-1">
                      {road.roadName}
                    </div>
                    <div className="text-[11px] text-slate-400">{road.area}</div>
                    <div className="grid grid-cols-2 gap-2 pt-1 font-mono">
                      <div>
                        <span className="text-slate-400 text-[10px] block">Current Speed</span>
                        <span className="font-bold text-white text-sm">{road.currentSpeed} km/h</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">Congestion</span>
                        <span className="font-bold text-rose-400 text-sm">{road.congestionScore}%</span>
                      </div>
                    </div>
                    <div className="pt-2 flex items-center justify-between">
                      <CongestionBadge category={road.congestionCategory} score={road.congestionScore} />
                      <button
                        onClick={() => setSelectedRoad(road)}
                        className="text-[11px] text-cyan-400 hover:underline font-semibold"
                      >
                        Inspect Details
                      </button>
                    </div>
                  </div>
                </Popup>
              </Polyline>
            );
          })}

          {/* Render Incident Markers */}
          {showIncidents &&
            incidents.map((incident) => {
              if (incident.status === 'resolved') return null;
              return (
                <Marker
                  key={incident.id}
                  position={[incident.latitude, incident.longitude]}
                  icon={createIncidentIcon(incident.severity)}
                >
                  <Popup>
                    <div className="text-xs space-y-1.5 p-1 min-w-[210px]">
                      <div className="flex items-center justify-between gap-2 border-b border-navy-750 pb-1">
                        <span className="font-bold text-rose-400 text-sm">{incident.title}</span>
                        <span className="uppercase text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-950 text-rose-300">
                          {incident.severity}
                        </span>
                      </div>
                      <p className="text-slate-300 text-[11px]">{incident.description}</p>
                      <div className="text-[10px] text-slate-400 pt-1">
                        Road: <span className="text-slate-200">{incident.roadName}</span>
                      </div>
                      <div className="text-[10px] text-cyan-400 font-mono">
                        Estimated Delay: +{incident.estimatedDelayMinutes} mins
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
        </MapContainer>

        {/* Road Detail Side Panel / Inspector Drawer */}
        {selectedRoad && (
          <div className="absolute top-20 right-4 bottom-4 w-80 sm:w-96 bg-navy-900/95 border border-navy-700/90 rounded-2xl p-5 shadow-2xl backdrop-blur-md z-[1000] flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
            <div>
              <div className="flex items-start justify-between gap-3 border-b border-navy-750 pb-3">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    Corridor Telemetry
                  </span>
                  <h3 className="text-base font-bold text-white mt-0.5">{selectedRoad.roadName}</h3>
                  <p className="text-xs text-slate-400">{selectedRoad.area}</p>
                </div>
                <button
                  onClick={() => setSelectedRoad(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-navy-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3.5">
                <div className="flex items-center justify-between p-3 rounded-xl bg-navy-950/60 border border-navy-800">
                  <span className="text-xs text-slate-300">Congestion Category</span>
                  <CongestionBadge category={selectedRoad.congestionCategory} score={selectedRoad.congestionScore} />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-xl bg-navy-950/60 border border-navy-800">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                      <Gauge className="w-3.5 h-3.5 text-cyan-400" /> Current Speed
                    </span>
                    <p className="text-lg font-bold font-mono text-slate-100 mt-1">
                      {selectedRoad.currentSpeed} <span className="text-xs text-slate-400 font-sans">km/h</span>
                    </p>
                    <span className="text-[10px] text-slate-500">Free-flow: {selectedRoad.freeFlowSpeed} km/h</span>
                  </div>

                  <div className="p-3 rounded-xl bg-navy-950/60 border border-navy-800">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                      <Car className="w-3.5 h-3.5 text-amber-400" /> Traffic Volume
                    </span>
                    <p className="text-lg font-bold font-mono text-slate-100 mt-1">
                      {selectedRoad.vehicleCount || 0} <span className="text-xs text-slate-400 font-sans">veh/hr</span>
                    </p>
                    <span className="text-[10px] text-slate-500">{selectedRoad.lanes} lanes</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-navy-950/60 border border-navy-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Road Length</span>
                    <span className="font-mono text-slate-200">{selectedRoad.lengthKm || 1.5} km</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Data Source</span>
                    <span className="font-mono text-cyan-400 uppercase text-[11px]">
                      {selectedRoad.trafficSource} Telemetry
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Last Telemetry Tick</span>
                    <span className="font-mono text-slate-400 text-[10px]">
                      {new Date(selectedRoad.lastUpdated).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                {/* Simulation Transparency Banner */}
                <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-[11px] text-slate-300 leading-relaxed flex items-start gap-2">
                  <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span>
                    Geometry via OpenStreetMap. Speed and congestion telemetry are computed in real time via UrbanFlow AI simulation engine.
                  </span>
                </div>
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSelectedRoad(null)}
              className="w-full mt-4"
            >
              Close Inspector
            </Button>
          </div>
        )}

        {/* Bottom Floating Map Legend */}
        <div className="absolute bottom-4 left-4 z-[1000] pointer-events-auto bg-navy-900/90 backdrop-blur-md p-3 rounded-xl border border-navy-700 shadow-xl hidden sm:flex items-center gap-4 text-xs">
          <span className="font-semibold text-slate-300">Congestion:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-slate-400">&lt;30%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1.5 rounded-full bg-amber-500" />
            <span className="text-slate-400">30-59%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1.5 rounded-full bg-orange-500" />
            <span className="text-slate-400">60-79%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1.5 rounded-full bg-rose-500" />
            <span className="text-slate-400">80%+</span>
          </div>
        </div>
      </div>
    </div>
  );
};
