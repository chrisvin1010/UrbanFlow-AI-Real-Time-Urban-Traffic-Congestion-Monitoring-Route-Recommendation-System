import React, { useEffect, useState, useCallback } from 'react';
import {
  Shield,
  Users,
  Activity,
  Server,
  Database,
  Radio,
  Cpu,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { adminApi, trafficApi, roadApi } from '../services/api';
import { IUser, ISystemHealth } from '@shared/types';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export const AdminPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { success, error: toastError } = useToast();

  const [users, setUsers] = useState<IUser[]>([]);
  const [health, setHealth] = useState<ISystemHealth | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTicking, setIsTicking] = useState(false);

  // New Road Modal
  const [isAddRoadOpen, setIsAddRoadOpen] = useState(false);
  const [newRoadName, setNewRoadName] = useState('');
  const [newRoadArea, setNewRoadArea] = useState('Downtown');
  const [newFreeFlow, setNewFreeFlow] = useState('50');
  const [newCoords, setNewCoords] = useState('37.7800, -122.4100; 37.7850, -122.4050');

  const fetchAdminData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [uRes, hRes, logsRes] = await Promise.all([
        adminApi.getUsers(1, 20),
        adminApi.getSystemHealth(),
        adminApi.getAuditLogs(),
      ]);
      setUsers(uRes.data);
      setHealth(hRes);
      setAuditLogs(logsRes);
    } catch (err: any) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  const handleRoleToggle = async (targetUser: IUser) => {
    const newRole = targetUser.role === 'admin' ? 'user' : 'admin';
    try {
      await adminApi.updateUserRole(targetUser.id, newRole);
      success('Role Updated', `User ${targetUser.name} is now a ${newRole}.`);
      fetchAdminData();
    } catch (err: any) {
      toastError('Update Failed', err.response?.data?.message || 'Could not update role');
    }
  };

  const handleManualSimulation = async () => {
    setIsTicking(true);
    try {
      const res = await trafficApi.triggerSimulation();
      success('Simulation Tick Complete', res.message);
      await fetchAdminData();
    } catch (err: any) {
      toastError('Engine Error', err.response?.data?.message || 'Simulation tick failed');
    } finally {
      setIsTicking(false);
    }
  };

  const handleCreateRoad = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Parse coordinates formatted as lat, lng; lat, lng
      const pairs = newCoords.split(';').map((pt) => {
        const [lat, lng] = pt.trim().split(',').map((n) => parseFloat(n.trim()));
        return [lat, lng] as [number, number];
      });

      if (pairs.some((p) => isNaN(p[0]) || isNaN(p[1]))) {
        toastError('Coordinate Error', 'Invalid coordinate format. Use "lat, lng; lat, lng"');
        return;
      }

      await roadApi.createRoad({
        roadName: newRoadName,
        area: newRoadArea,
        freeFlowSpeed: parseFloat(newFreeFlow),
        coordinates: pairs,
      });

      success('Road Registered', `Corridor ${newRoadName} is now tracked.`);
      setIsAddRoadOpen(false);
      setNewRoadName('');
    } catch (err: any) {
      toastError('Creation Failed', err.response?.data?.message || 'Failed to create road');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-navy-850/60 border border-navy-700/80 p-5 rounded-2xl">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Shield className="w-6 h-6 text-cyan-400" />
            System Administration & Control Center
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            System diagnostics, Redis caching status, user permissions, and corridor management
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchAdminData}
            icon={<RefreshCw className="w-3.5 h-3.5 text-cyan-400" />}
          >
            Refresh Status
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleManualSimulation}
            isLoading={isTicking}
            icon={<Zap className="w-3.5 h-3.5" />}
          >
            Force Engine Tick
          </Button>
        </div>
      </div>

      {/* System Health Diagnostics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Database Status */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              MongoDB Database
            </span>
            <Database className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                health?.database.connected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
              }`}
            />
            <span className="text-base font-bold text-slate-100">
              {health?.database.connected ? 'CONNECTED' : 'OFFLINE'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">
            Provider: {health?.database.provider || 'mongodb'}
          </p>
        </Card>

        {/* Redis Cache Status */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Cache Subsystem
            </span>
            <Cpu className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                health?.redis.connected ? 'bg-emerald-500' : 'bg-cyan-500'
              }`}
            />
            <span className="text-base font-bold text-slate-100 uppercase">
              {health?.redis.type || 'In-Memory Fallback'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">
            Cached Keys: {health?.redis.cachedKeysCount ?? 0} active
          </p>
        </Card>

        {/* Traffic Simulation Engine */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Simulation Engine
            </span>
            <Radio className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-base font-bold text-slate-100">
              {health?.simulation.active ? 'TICKING' : 'PAUSED'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">
            Interval: {(health?.simulation.intervalMs || 15000) / 1000}s cycle
          </p>
        </Card>

        {/* Routing Provider Status */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Routing Provider
            </span>
            <Server className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-base font-bold text-slate-100">ONLINE</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-mono truncate">
            {health?.routingProvider.name || 'OSRM Service'}
          </p>
        </Card>
      </div>

      {/* User Management & Access Control Table */}
      <Card>
        <CardHeader
          title={
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              User Accounts & Role Permissions
            </span>
          }
          subtitle="Manage operator and commuter privilege levels"
        />
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-navy-750 text-[11px] uppercase tracking-wider text-slate-400 bg-navy-950/40">
                <th className="py-3 px-4">Operator Name</th>
                <th className="py-3 px-3">Email Address</th>
                <th className="py-3 px-3">Assigned Role</th>
                <th className="py-3 px-3">Registered Date</th>
                <th className="py-3 px-4 text-right">Role Management</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-750 text-xs">
              {users.map((u) => {
                const isSelf = currentUser?.id === u.id;
                return (
                  <tr key={u.id} className="hover:bg-navy-800/40 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-100 flex items-center gap-2">
                      <span>{u.name}</span>
                      {isSelf && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                          YOU
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-400 font-mono">{u.email}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                          u.role === 'admin'
                            ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                            : 'bg-navy-750 text-slate-300'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {!isSelf && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleRoleToggle(u)}
                        >
                          Make {u.role === 'admin' ? 'User' : 'Admin'}
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Audit Logs */}
      <Card>
        <CardHeader
          title="Security & System Audit Log"
          subtitle="Recent authentication events, role modifications, and system triggers"
        />
        <CardContent className="p-4 space-y-2 max-h-60 overflow-y-auto font-mono text-xs">
          {auditLogs.length === 0 ? (
            <p className="text-slate-500 text-center py-4">No audit logs recorded yet.</p>
          ) : (
            auditLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-2 rounded bg-navy-950/50 border border-navy-750/60"
              >
                <div className="flex items-center gap-2">
                  <span className="text-cyan-400 font-semibold">[{log.action}]</span>
                  <span className="text-slate-300">{log.userName || 'System'}:</span>
                  <span className="text-slate-400 font-sans">{log.entityType}</span>
                </div>
                <span className="text-[10px] text-slate-500">
                  {new Date(log.createdAt).toLocaleTimeString()}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};
