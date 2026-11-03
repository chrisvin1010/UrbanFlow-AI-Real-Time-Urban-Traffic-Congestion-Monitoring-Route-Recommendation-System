import React, { useEffect, useState, useCallback } from 'react';
import {
  Search,
  Route,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Gauge,
  Layers,
} from 'lucide-react';
import { roadApi } from '../services/api';
import { IRoadSegment } from '@shared/types';
import { CongestionBadge } from '../components/common/CongestionBadge';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

interface RoadMonitoringPageProps {
  onSelectRoadForMap: (roadId: string) => void;
}

export const RoadMonitoringPage: React.FC<RoadMonitoringPageProps> = ({ onSelectRoadForMap }) => {
  const [roads, setRoads] = useState<IRoadSegment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Sorting
  const [search, setSearch] = useState('');
  const [area, setArea] = useState('all');
  const [category, setCategory] = useState('all');
  const [availableAreas, setAvailableAreas] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('congestionScore');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchRoads = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await roadApi.getRoads({
        page,
        limit: 15,
        search: search.trim() || undefined,
        area: area !== 'all' ? area : undefined,
        category: category !== 'all' ? category : undefined,
        sortBy,
        order: sortOrder,
      });

      setRoads(res.data);
      setTotal(res.pagination.total);
      setTotalPages(res.pagination.totalPages);
      if (res.filters?.availableAreas) {
        setAvailableAreas(res.filters.availableAreas);
      }
    } catch (err) {
      console.error('Failed to load roads:', err);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, area, category, sortBy, sortOrder]);

  useEffect(() => {
    fetchRoads();
  }, [fetchRoads]);

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-navy-850/60 border border-navy-700/80 p-5 rounded-2xl">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Route className="w-6 h-6 text-cyan-400" />
            Road Network Telemetry Monitor
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time speeds, velocity deficits, and density metrics across monitored urban corridors
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-3 py-1.5 rounded-lg bg-navy-950/80 border border-navy-700 text-slate-300">
            {total} Active Segments
          </span>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-navy-850/60 border border-navy-700/80 p-4 rounded-xl flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search road name or district..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full bg-navy-950/70 border border-navy-750 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-400"
          />
        </div>

        <select
          value={area}
          onChange={(e) => {
            setArea(e.target.value);
            setPage(1);
          }}
          className="bg-navy-950/70 border border-navy-750 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
        >
          <option value="all">All Districts</option>
          {availableAreas.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>

        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
          className="bg-navy-950/70 border border-navy-750 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
        >
          <option value="all">All Congestion States</option>
          <option value="free_flow">Free Flow (&lt;30%)</option>
          <option value="moderate">Moderate (30-59%)</option>
          <option value="heavy">Heavy (60-79%)</option>
          <option value="severe">Severe (80%+)</option>
        </select>
      </div>

      {/* Table Card */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-navy-750 text-[11px] uppercase tracking-wider text-slate-400 bg-navy-950/40">
                <th
                  onClick={() => toggleSort('roadName')}
                  className="py-3 px-4 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Road Name</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3">District</th>
                <th
                  onClick={() => toggleSort('currentSpeed')}
                  className="py-3 px-3 cursor-pointer hover:text-white text-right"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Speed / Free-Flow</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('congestionScore')}
                  className="py-3 px-3 cursor-pointer hover:text-white text-right"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Congestion %</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('vehicleCount')}
                  className="py-3 px-3 cursor-pointer hover:text-white text-right"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Volume</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-750 text-xs">
              {roads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No road segments match current filters.
                  </td>
                </tr>
              ) : (
                roads.map((road) => (
                  <tr
                    key={road.id}
                    className="hover:bg-navy-800/40 cursor-pointer transition-colors"
                    onClick={() => onSelectRoadForMap(road.id)}
                  >
                    <td className="py-3.5 px-4 font-semibold text-slate-100 flex items-center gap-2">
                      <Route className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>{road.roadName}</span>
                    </td>
                    <td className="py-3.5 px-3 text-slate-400">{road.area}</td>
                    <td className="py-3.5 px-3 text-right font-mono">
                      <span className="font-bold text-slate-100">{road.currentSpeed}</span>
                      <span className="text-slate-500 text-[10px]"> / {road.freeFlowSpeed} km/h</span>
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-bold text-rose-400">
                      {road.congestionScore}%
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-slate-300">
                      {road.vehicleCount || 0}{' '}
                      <span className="text-[10px] text-slate-500">veh/hr</span>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <CongestionBadge category={road.congestionCategory} showScore={false} />
                    </td>
                    <td className="py-3.5 px-4 text-right text-[11px] font-mono text-slate-400">
                      {new Date(road.lastUpdated).toLocaleTimeString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>

        {/* Pagination Controls */}
        <div className="p-4 border-t border-navy-750 flex items-center justify-between gap-4 text-xs">
          <span className="text-slate-400">
            Page {page} of {totalPages || 1}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              icon={<ChevronLeft className="w-3.5 h-3.5" />}
            >
              Prev
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              icon={<ChevronRight className="w-3.5 h-3.5" />}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
