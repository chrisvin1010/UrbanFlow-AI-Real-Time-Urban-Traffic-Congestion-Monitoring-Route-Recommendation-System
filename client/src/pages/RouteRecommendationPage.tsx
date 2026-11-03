import React, { useState } from 'react';
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
  Navigation,
  MapPin,
  Clock,
  Gauge,
  ArrowRight,
  Sparkles,
  Info,
  CheckCircle2,
  Sliders,
  TrendingDown,
} from 'lucide-react';
import { routeApi } from '../services/api';
import { IRouteRecommendationResponse, IRouteAlternative } from '@shared/types';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { CongestionBadge } from '../components/common/CongestionBadge';

const createPinIcon = (color: string, label: string) => {
  return L.divIcon({
    className: 'custom-route-pin',
    html: `
      <div style="
        background: ${color};
        color: #ffffff;
        font-weight: bold;
        font-size: 11px;
        padding: 4px 8px;
        border-radius: 9999px;
        border: 2px solid #ffffff;
        box-shadow: 0 0 10px ${color};
        white-space: nowrap;
        display: flex;
        align-items: center;
        gap: 4px;
      ">
        ${label}
      </div>
    `,
    iconSize: [60, 24],
    iconAnchor: [30, 24],
  });
};

const RouteBoundsAdjuster: React.FC<{ coords?: [number, number][] }> = ({ coords }) => {
  const map = useMap();
  React.useEffect(() => {
    if (coords && coords.length > 0) {
      const bounds = L.latLngBounds(coords);
      map.fitBounds(bounds, { padding: [50, 50], animate: true });
    }
  }, [coords, map]);
  return null;
};

export const RouteRecommendationPage: React.FC = () => {
  const [origin, setOrigin] = useState('Market Street');
  const [destination, setDestination] = useState('Golden Gate Bridge');
  const [preference, setPreference] = useState<'fastest' | 'least_congested' | 'shortest'>('fastest');
  const [isLoading, setIsLoading] = useState(false);
  const [routeResult, setRouteResult] = useState<IRouteRecommendationResponse | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const quickLocations = [
    'Market Street',
    'Golden Gate Bridge',
    'Fisherman\'s Wharf',
    'SoMa',
    'Mission District',
    'Presidio',
    'Twin Peaks',
  ];

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!origin.trim() || !destination.trim()) {
      setErrorMessage('Please provide both origin and destination.');
      return;
    }

    setErrorMessage('');
    setIsLoading(true);

    try {
      const res = await routeApi.recommendRoute({
        origin,
        destination,
        preference,
      });
      setRouteResult(res);
      setSelectedRouteId(res.bestRoute.id);
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || 'Unable to compute route. Check location inputs.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const activeRoute: IRouteAlternative | undefined = React.useMemo(() => {
    if (!routeResult) return undefined;
    if (selectedRouteId === routeResult.bestRoute.id) return routeResult.bestRoute;
    return routeResult.alternatives.find((a) => a.id === selectedRouteId) || routeResult.bestRoute;
  }, [routeResult, selectedRouteId]);

  return (
    <div className="space-y-6">
      {/* Title & Preference Bar */}
      <div className="bg-navy-850/60 border border-navy-700/80 p-5 rounded-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <Navigation className="w-6 h-6 text-cyan-400" />
              Smart Route Recommendation Engine
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Congestion-aware multi-criteria route optimization powered by OSRM and real-time telemetry
            </p>
          </div>

          {/* Preference Selector */}
          <div className="flex items-center gap-1.5 p-1 bg-navy-950/70 border border-navy-750 rounded-xl">
            {(
              [
                { id: 'fastest', label: 'Fastest' },
                { id: 'least_congested', label: 'Least Congested' },
                { id: 'shortest', label: 'Shortest' },
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPreference(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  preference === p.id
                    ? 'bg-cyan-500 text-navy-950 font-semibold shadow-glow-cyan'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Origin / Destination Search Form */}
        <form onSubmit={handleSearch} className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5">
            <Input
              placeholder="Origin: e.g. Market Street or Union Square"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              icon={<MapPin className="w-4 h-4 text-emerald-400" />}
            />
          </div>

          <div className="md:col-span-5">
            <Input
              placeholder="Destination: e.g. Golden Gate Bridge"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              icon={<Navigation className="w-4 h-4 text-cyan-400" />}
            />
          </div>

          <div className="md:col-span-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full h-[38px]"
              isLoading={isLoading}
              icon={<Sparkles className="w-4 h-4" />}
            >
              Analyze
            </Button>
          </div>
        </form>

        {/* Quick Location Chips */}
        <div className="mt-3 flex items-center gap-2 overflow-x-auto text-[11px] text-slate-400">
          <span className="shrink-0 font-medium">Quick Points:</span>
          {quickLocations.map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => {
                if (!origin) setOrigin(loc);
                else setDestination(loc);
              }}
              className="px-2 py-0.5 rounded-md bg-navy-800 hover:bg-navy-750 text-slate-300 border border-navy-700 shrink-0 transition-colors"
            >
              {loc}
            </button>
          ))}
        </div>

        {errorMessage && (
          <div className="mt-3 p-3 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs">
            {errorMessage}
          </div>
        )}
      </div>

      {/* Main Layout: Route Options List + Route Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Route Alternatives Cards (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {routeResult ? (
            <>
              {/* Recommended Best Route */}
              <div
                onClick={() => setSelectedRouteId(routeResult.bestRoute.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  selectedRouteId === routeResult.bestRoute.id
                    ? 'bg-cyan-950/30 border-cyan-400 shadow-glow-cyan'
                    : 'bg-navy-850/80 border-navy-700 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Recommended Path
                  </span>
                  <CongestionBadge
                    category={routeResult.bestRoute.congestionCategory}
                    score={routeResult.bestRoute.averageCongestionScore}
                  />
                </div>

                <h3 className="text-base font-bold text-slate-100 mt-2">
                  {routeResult.bestRoute.name}
                </h3>
                <p className="text-xs text-slate-400">{routeResult.bestRoute.summary}</p>

                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-navy-750 text-center font-mono">
                  <div className="p-2 rounded bg-navy-950/60">
                    <span className="text-[10px] text-slate-500 uppercase block">Distance</span>
                    <span className="text-sm font-bold text-slate-200">
                      {(routeResult.bestRoute.distanceMeters / 1000).toFixed(1)} km
                    </span>
                  </div>
                  <div className="p-2 rounded bg-navy-950/60">
                    <span className="text-[10px] text-slate-500 uppercase block">Est. Time</span>
                    <span className="text-sm font-bold text-cyan-400">
                      {Math.round(routeResult.bestRoute.estimatedDurationSeconds / 60)} min
                    </span>
                  </div>
                  <div className="p-2 rounded bg-navy-950/60">
                    <span className="text-[10px] text-slate-500 uppercase block">Delay</span>
                    <span className="text-sm font-bold text-amber-400">
                      +{Math.round(routeResult.bestRoute.delaySeconds / 60)} min
                    </span>
                  </div>
                </div>

                <div className="mt-3 p-2.5 rounded-lg bg-navy-950/70 border border-navy-750 text-xs text-slate-300">
                  <span className="text-cyan-400 font-semibold">Why this route: </span>
                  {routeResult.bestRoute.recommendationReason}
                </div>
              </div>

              {/* Alternative Routes */}
              {routeResult.alternatives.map((alt) => (
                <div
                  key={alt.id}
                  onClick={() => setSelectedRouteId(alt.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    selectedRouteId === alt.id
                      ? 'bg-cyan-950/30 border-cyan-400 shadow-glow-cyan'
                      : 'bg-navy-850/80 border-navy-700 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-400">Alternative Option</span>
                    <CongestionBadge
                      category={alt.congestionCategory}
                      score={alt.averageCongestionScore}
                    />
                  </div>

                  <h4 className="text-sm font-bold text-slate-200 mt-1">{alt.name}</h4>
                  <p className="text-xs text-slate-400">{alt.summary}</p>

                  <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-navy-750 text-center font-mono">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Distance</span>
                      <span className="text-xs font-bold text-slate-300">
                        {(alt.distanceMeters / 1000).toFixed(1)} km
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Est. Time</span>
                      <span className="text-xs font-bold text-slate-200">
                        {Math.round(alt.estimatedDurationSeconds / 60)} min
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Delay</span>
                      <span className="text-xs font-bold text-slate-400">
                        +{Math.round(alt.delaySeconds / 60)} min
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Routing Transparency Disclosure */}
              <div className="p-3.5 rounded-xl bg-navy-950/70 border border-navy-750 text-[11px] text-slate-400 leading-relaxed flex items-start gap-2">
                <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>{routeResult.disclaimer}</span>
              </div>
            </>
          ) : (
            <Card className="p-8 text-center text-slate-400 space-y-3">
              <Navigation className="w-10 h-10 text-cyan-500/40 mx-auto" />
              <h3 className="font-semibold text-slate-200">Ready to calculate smart routes</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Enter an origin and destination point above, or click one of the quick points to generate a live traffic-aware routing analysis.
              </p>
            </Card>
          )}
        </div>

        {/* Right Side: Leaflet Route Map (7 cols) */}
        <div className="lg:col-span-7 h-[560px] rounded-2xl overflow-hidden border border-navy-700/80 shadow-surface relative">
          <MapContainer
            center={[37.7749, -122.4194]}
            zoom={13}
            style={{ width: '100%', height: '100%' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              className="dark-tiles"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {activeRoute && <RouteBoundsAdjuster coords={activeRoute.coordinates} />}

            {/* Inactive alternative routes (grey/dashed) */}
            {routeResult?.alternatives.map((alt) => {
              if (alt.id === selectedRouteId) return null;
              return (
                <Polyline
                  key={alt.id}
                  positions={alt.coordinates}
                  pathOptions={{
                    color: '#64748b',
                    weight: 4,
                    dashArray: '8, 8',
                    opacity: 0.7,
                  }}
                  eventHandlers={{
                    click: () => setSelectedRouteId(alt.id),
                  }}
                />
              );
            })}

            {/* Active route polyline */}
            {activeRoute && (
              <Polyline
                positions={activeRoute.coordinates}
                pathOptions={{
                  color: '#06b6d4',
                  weight: 7,
                  opacity: 0.95,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />
            )}

            {/* Origin Pin */}
            {routeResult && (
              <Marker
                position={[routeResult.origin.lat, routeResult.origin.lng]}
                icon={createPinIcon('#10b981', 'Origin')}
              >
                <Popup>{routeResult.origin.name}</Popup>
              </Marker>
            )}

            {/* Destination Pin */}
            {routeResult && (
              <Marker
                position={[routeResult.destination.lat, routeResult.destination.lng]}
                icon={createPinIcon('#06b6d4', 'Destination')}
              >
                <Popup>{routeResult.destination.name}</Popup>
              </Marker>
            )}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};
