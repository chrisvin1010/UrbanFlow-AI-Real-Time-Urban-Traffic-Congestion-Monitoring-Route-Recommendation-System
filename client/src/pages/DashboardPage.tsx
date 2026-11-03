import React, { useEffect, useState, useCallback } from 'react';
import {
  Route,
  AlertTriangle,
  Gauge,
  Clock,
  Layers,
  TrendingUp,
  RefreshCw,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { dashboardApi, trafficApi } from '../services/api';
import { MetricCard } from '../components/common/MetricCard';
import { CongestionBadge } from '../components/common/CongestionBadge';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useSocket } from '../context/SocketContext';
import {
  IDashboardSummary,
  ICongestionDistribution,
  ITrafficTrendPoint,
  IRoadSegment,
  ITrafficIncident,
} from '@shared/types';

interface DashboardPageProps {
  selectedArea: string;
  onNavigateToRoad: (roadId: string) => void;
  onNavigateToMap: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  selectedArea,
  onNavigateToRoad,
  onNavigateToMap,
}) => {
  const { lastTrafficUpdate } = useSocket();

  const [summary, setSummary] = useState<IDashboardSummary | null>(null);
  const [distribution, setDistribution] = useState<ICongestionDistribution[]>([]);
  const [trends, setTrends] = useState<ITrafficTrendPoint[]>([]);
  const [topRoads, setTopRoads] = useState<IRoadSegment[]>([]);
  const [recentEvents, setRecentEvents] = useState<ITrafficIncident[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [sumRes, distRes, trendRes, topRes, eventsRes] = await Promise.all([
        dashboardApi.getSummary(selectedArea),
        dashboardApi.getCongestionDistribution(selectedArea),
        dashboardApi.getTrafficTrends(selectedArea),
        dashboardApi.getTopCongested(5),
        dashboardApi.getRecentEvents(),
      ]);

      setSummary(sumRes);
      setDistribution(distRes);
      setTrends(trendRes);
      setTopRoads(topRes);
      setRecentEvents(eventsRes);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedArea]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // When real-time socket packet arrives, update telemetry
  useEffect(() => {
    if (lastTrafficUpdate) {
      fetchDashboardData();
    }
  }, [lastTrafficUpdate, fetchDashboardData]);

  const handleManualTrigger = async () => {
    setIsSimulating(true);
    try {
      await trafficApi.triggerSimulation();
      await fetchDashboardData();
    } finally {
      setIsSimulating(false);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'optimal':
        return 'text-emerald-400 bg-emerald-950/60 border-emerald-500/30';
      case 'moderate':
        return 'text-amber-400 bg-amber-950/60 border-amber-500/30';
      case 'congested':
        return 'text-orange-400 bg-orange-950/60 border-orange-500/30';
      case 'severe':
        return 'text-rose-400 bg-rose-950/60 border-rose-500/30';
      default:
        return 'text-cyan-400 bg-cyan-950/60 border-cyan-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Status Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-navy-850/60 border border-navy-700/80 p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Urban Traffic Intelligence
            </h1>
            <span
              className={`text-xs uppercase font-mono font-bold px-2.5 py-0.5 rounded-full border ${getStatusColor(
                summary?.trafficStatus
              )}`}
            >
              {summary?.trafficStatus || 'ANALYZING'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time telemetry aggregated from {summary?.totalRoadsMonitored || 25} monitored arteries across{' '}
            {selectedArea === 'all' ? 'San Francisco' : selectedArea}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchDashboardData}
            isLoading={isLoading}
            icon={<RefreshCw className="w-3.5 h-3.5 text-cyan-400" />}
          >
            Sync Data
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onNavigateToMap}
            icon={<ExternalLink className="w-3.5 h-3.5" />}
          >
            Live Map View
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Monitored Roads"
          value={summary?.totalRoadsMonitored || 0}
          unit="segments"
          subtitle={`${summary?.freeFlowRoadsCount || 0} free-flowing`}
          icon={<Route className="w-5 h-5" />}
          accentColor="cyan"
        />

        <MetricCard
          title="Congested Segments"
          value={summary?.congestedRoadsCount || 0}
          unit="roads"
          subtitle="Severity score ≥ 60%"
          icon={<AlertTriangle className="w-5 h-5" />}
          accentColor="rose"
        />

        <MetricCard
          title="Average Speed"
          value={summary?.averageSpeedKmh || 0}
          unit="km/h"
          subtitle="Free-flow base: ~50 km/h"
          icon={<Gauge className="w-5 h-5" />}
          accentColor="emerald"
        />

        <MetricCard
          title="Congestion Index"
          value={`${summary?.averageCongestionScore || 0}%`}
          subtitle="Citywide weighted mean"
          icon={<TrendingUp className="w-5 h-5" />}
          accentColor="amber"
        />

        <MetricCard
          title="Estimated Delay"
          value={`+${summary?.estimatedCitywideDelayMinutes ?? 0}`}
          unit="mins"
          subtitle="Avg commute detour"
          icon={<Clock className="w-5 h-5" />}
          accentColor="blue"
        />
      </div>

      {/* Charts Row: Hourly Trends & Congestion Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hourly Traffic Trend Chart (2 cols) */}
        <Card className="lg:col-span-2">
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                Hourly Traffic Velocity & Congestion Profile
              </span>
            }
            subtitle="12-hour historical trend across major arterials"
          />
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="congestionGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="speedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="hour" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="averageCongestion"
                  name="Congestion %"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#congestionGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="averageSpeed"
                  name="Speed (km/h)"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#speedGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Congestion Distribution Donut Chart (1 col) */}
        <Card>
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                Congestion Distribution
              </span>
            }
            subtitle="Road category split"
          />
          <CardContent className="h-72 flex flex-col justify-between">
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="count"
                  >
                    {distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#1e293b',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                      color: '#f8fafc',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Custom Legend */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-navy-750">
              {distribution.map((item) => (
                <div key={item.category} className="flex items-center gap-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-300 truncate">{item.label.split(' ')[0]}</span>
                  <span className="font-mono text-slate-400 ml-auto">{item.percentage}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Grid: Top Congested Roads & Recent Incidents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Congested Roads Table (2 cols) */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Top Bottleneck Corridors"
            subtitle="Corridors experiencing highest congestion delay"
            action={
              <button
                onClick={onNavigateToMap}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-medium inline-flex items-center gap-1"
              >
                Inspect All on Map <ChevronRight className="w-3.5 h-3.5" />
              </button>
            }
          />
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-navy-750 text-[11px] uppercase tracking-wider text-slate-400 bg-navy-950/40">
                  <th className="py-3 px-4">Road Name</th>
                  <th className="py-3 px-3">District</th>
                  <th className="py-3 px-3 text-right">Speed</th>
                  <th className="py-3 px-3 text-right">Congestion</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-750 text-xs">
                {topRoads.map((road) => (
                  <tr
                    key={road.id}
                    onClick={() => onNavigateToRoad(road.id)}
                    className="hover:bg-navy-800/60 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-medium text-slate-100 flex items-center gap-2">
                      <Route className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="truncate max-w-[200px]">{road.roadName}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-400">{road.area}</td>
                    <td className="py-3 px-3 text-right font-mono font-medium text-slate-200">
                      {road.currentSpeed} <span className="text-[10px] text-slate-500">km/h</span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-rose-400">
                      {road.congestionScore}%
                    </td>
                    <td className="py-3 px-4 text-center">
                      <CongestionBadge category={road.congestionCategory} showScore={false} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Recent Traffic Incidents (1 col) */}
        <Card>
          <CardHeader
            title="Recent Hazard Telemetry"
            subtitle={`${recentEvents.length} active incidents logged`}
          />
          <CardContent className="p-4 space-y-3">
            {recentEvents.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No active traffic hazards reported.</p>
            ) : (
              recentEvents.map((event) => (
                <div
                  key={event.id}
                  className="p-3 rounded-lg bg-navy-950/60 border border-navy-700/80 hover:border-slate-600 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-xs text-slate-200 leading-snug">
                      {event.title}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded uppercase font-semibold shrink-0 ${
                        event.severity === 'critical'
                          ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                          : event.severity === 'high'
                          ? 'bg-orange-950 text-orange-300 border border-orange-500/40'
                          : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      {event.severity}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                    <span>{event.roadName}</span>
                    <span className="text-cyan-400 font-mono">+{event.estimatedDelayMinutes}m delay</span>
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
