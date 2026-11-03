import React, { useEffect, useState, useCallback } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  Download,
  Clock,
  Gauge,
  TrendingUp,
  BarChart2,
  Calendar,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';
import { analyticsApi } from '../services/api';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { MetricCard } from '../components/common/MetricCard';

interface AnalyticsPageProps {
  selectedArea: string;
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ selectedArea }) => {
  const [overview, setOverview] = useState<any>(null);
  const [peakHours, setPeakHours] = useState<any>(null);
  const [roadComparisons, setRoadComparisons] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      const [ovRes, peakRes, compRes] = await Promise.all([
        analyticsApi.getOverview(selectedArea),
        analyticsApi.getPeakHours(),
        analyticsApi.getRoadComparison(8),
      ]);
      setOverview(ovRes);
      setPeakHours(peakRes);
      setRoadComparisons(compRes);
    } catch (err) {
      console.error('Failed to load analytics data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedArea]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleExportCsv = () => {
    const url = analyticsApi.getExportUrl(selectedArea);
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Analytics Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-navy-850/60 border border-navy-700/80 p-5 rounded-2xl">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-cyan-400" />
            Urban Mobility & Congestion Analytics
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Historical aggregations, peak-hour congestion patterns, and downloadable telemetry data
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleExportCsv}
          icon={<FileSpreadsheet className="w-4 h-4" />}
        >
          Export CSV Report
        </Button>
      </div>

      {/* Peak Hour Intelligence Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-navy-700/80 p-5 bg-gradient-to-br from-navy-850 to-navy-900">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase text-slate-400 font-semibold">
                Morning Peak Congestion Window
              </span>
              <h3 className="text-xl font-bold text-white mt-0.5">
                {peakHours?.morningPeak?.time || '08:00 - 09:30'}
              </h3>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-navy-750 flex items-center justify-between text-xs">
            <span className="text-slate-400">Primary Bottleneck:</span>
            <span className="font-semibold text-slate-200">
              {peakHours?.morningPeak?.bottleneckArea || 'Downtown & Financial District'}
            </span>
          </div>
        </Card>

        <Card className="border-navy-700/80 p-5 bg-gradient-to-br from-navy-850 to-navy-900">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase text-slate-400 font-semibold">
                Evening Rush Hour Window
              </span>
              <h3 className="text-xl font-bold text-white mt-0.5">
                {peakHours?.eveningPeak?.time || '17:00 - 18:30'}
              </h3>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-navy-750 flex items-center justify-between text-xs">
            <span className="text-slate-400">Primary Bottleneck:</span>
            <span className="font-semibold text-slate-200">
              {peakHours?.eveningPeak?.bottleneckArea || 'Bay Bridge, US-101 & SoMa'}
            </span>
          </div>
        </Card>
      </div>

      {/* Hourly Traffic Volume & Congestion Chart */}
      <Card>
        <CardHeader
          title="24-Hour Diurnal Congestion & Vehicle Volume Profile"
          subtitle="Hourly trend tracking peak traffic spikes and speed degradation"
        />
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={peakHours?.hourlyData || []}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="hour" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis
                yAxisId="left"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                label={{ value: 'Congestion %', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                label={{ value: 'Vehicles/hr', angle: 90, position: 'insideRight', fill: '#64748b', fontSize: 10 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#1e293b',
                  borderRadius: '0.75rem',
                  fontSize: '12px',
                  color: '#f8fafc',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar
                yAxisId="left"
                dataKey="congestion"
                name="Congestion Index %"
                fill="#f97316"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                yAxisId="right"
                dataKey="volume"
                name="Vehicle Volume"
                fill="#06b6d4"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* District Comparison & Road Velocity Comparisons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* District Comparison */}
        <Card>
          <CardHeader
            title="District-Wise Congestion Breakdown"
            subtitle="Comparison of average speeds and congestion indexes by urban zone"
          />
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={overview?.areaComparisons || []}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 30, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" stroke="#64748b" fontSize={11} domain={[0, 100]} />
                <YAxis dataKey="area" type="category" stroke="#64748b" fontSize={10} width={100} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                />
                <Bar dataKey="avgCongestion" name="Avg Congestion %" fill="#06b6d4" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Arteries Speed vs Free-Flow */}
        <Card>
          <CardHeader
            title="Artery Speed Deficit Comparison"
            subtitle="Comparing real-time velocity against free-flow design capacity"
          />
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={roadComparisons}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="roadName"
                  stroke="#64748b"
                  fontSize={9}
                  tickLine={false}
                  tickFormatter={(val) => val.split(' ')[0]}
                />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="currentSpeed" name="Current Speed (km/h)" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="freeFlowSpeed" name="Free-Flow Speed (km/h)" fill="#334155" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
