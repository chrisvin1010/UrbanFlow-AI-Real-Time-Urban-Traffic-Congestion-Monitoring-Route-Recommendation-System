import React, { useEffect, useState, useCallback } from 'react';
import {
  AlertTriangle,
  Plus,
  Search,
  CheckCircle,
  Clock,
  MapPin,
  Trash2,
  Filter,
} from 'lucide-react';
import { incidentApi } from '../services/api';
import { ITrafficIncident, IncidentType, IncidentSeverity, IncidentStatus } from '@shared/types';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const IncidentManagementPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { success, error: toastError } = useToast();

  const [incidents, setIncidents] = useState<ITrafficIncident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [type, setType] = useState<IncidentType>('accident');
  const [roadName, setRoadName] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<IncidentSeverity>('medium');
  const [latitude, setLatitude] = useState('37.7749');
  const [longitude, setLongitude] = useState('-122.4194');
  const [delayMins, setDelayMins] = useState('15');

  const fetchIncidents = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await incidentApi.getIncidents({
        search: search.trim() || undefined,
        severity: severityFilter !== 'all' ? severityFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        limit: 50,
      });
      setIncidents(res.data);
    } catch (err) {
      console.error('Failed to load incidents:', err);
    } finally {
      setIsLoading(false);
    }
  }, [search, severityFilter, statusFilter]);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !roadName || !description) {
      toastError('Missing Fields', 'Please complete all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      await incidentApi.createIncident({
        title,
        type,
        roadName,
        description,
        severity,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        estimatedDelayMinutes: parseInt(delayMins, 10),
      });

      success('Incident Created', 'The incident has been broadcast to traffic operations.');
      setIsModalOpen(false);
      // Reset form
      setTitle('');
      setRoadName('');
      setDescription('');
      fetchIncidents();
    } catch (err: any) {
      toastError('Submission Error', err.response?.data?.message || 'Failed to submit incident');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: IncidentStatus) => {
    try {
      await incidentApi.updateIncident(id, { status: newStatus });
      success('Status Updated', `Incident status set to ${newStatus}`);
      fetchIncidents();
    } catch (err: any) {
      toastError('Update Failed', err.response?.data?.message || 'Could not update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this incident report?')) return;
    try {
      await incidentApi.deleteIncident(id);
      success('Incident Deleted', 'The incident report has been removed.');
      fetchIncidents();
    } catch (err: any) {
      toastError('Delete Failed', err.response?.data?.message || 'Could not delete incident');
    }
  };

  const getSeverityBadge = (sev: string) => {
    const map: Record<string, string> = {
      critical: 'bg-rose-950/80 border-rose-500/40 text-rose-300',
      high: 'bg-orange-950/80 border-orange-500/40 text-orange-300',
      medium: 'bg-amber-950/80 border-amber-500/40 text-amber-300',
      low: 'bg-cyan-950/80 border-cyan-500/40 text-cyan-300',
    };
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold border ${map[sev] || ''}`}>
        {sev}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      reported: 'bg-blue-950/80 border-blue-500/40 text-blue-300',
      investigating: 'bg-indigo-950/80 border-indigo-500/40 text-indigo-300',
      confirmed: 'bg-amber-950/80 border-amber-500/40 text-amber-300',
      clearing: 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300',
      resolved: 'bg-slate-800 border-slate-700 text-slate-400 line-through',
    };
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold border ${map[status] || ''}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-navy-850/60 border border-navy-700/80 p-5 rounded-2xl">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-rose-400" />
            Traffic Incidents & Hazards Command
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time incident tracking, road obstruction reports, and rapid clearance workflow
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          icon={<Plus className="w-4 h-4" />}
        >
          Report Incident
        </Button>
      </div>

      {/* Filters Bar */}
      <div className="bg-navy-850/60 border border-navy-700/80 p-4 rounded-xl flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search incident title, road, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-navy-950/70 border border-navy-750 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-400"
          />
        </div>

        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="bg-navy-950/70 border border-navy-750 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
        >
          <option value="all">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-navy-950/70 border border-navy-750 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
        >
          <option value="all">All Statuses</option>
          <option value="reported">Reported</option>
          <option value="confirmed">Confirmed</option>
          <option value="clearing">Clearing</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {/* Incidents Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-navy-750 text-[11px] uppercase tracking-wider text-slate-400 bg-navy-950/40">
                <th className="py-3 px-4">Incident</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Severity</th>
                <th className="py-3 px-3">Road Segment</th>
                <th className="py-3 px-3">Est. Delay</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-750 text-xs">
              {incidents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No matching traffic incidents found.
                  </td>
                </tr>
              ) : (
                incidents.map((inc) => (
                  <tr key={inc.id} className="hover:bg-navy-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-100">{inc.title}</div>
                      <div className="text-[11px] text-slate-400 line-clamp-1 max-w-sm mt-0.5">
                        {inc.description}
                      </div>
                    </td>
                    <td className="py-3.5 px-3 uppercase text-[11px] font-mono text-cyan-400">
                      {inc.type}
                    </td>
                    <td className="py-3.5 px-3">{getSeverityBadge(inc.severity)}</td>
                    <td className="py-3.5 px-3 font-medium text-slate-200">{inc.roadName}</td>
                    <td className="py-3.5 px-3 font-mono font-medium text-amber-400">
                      +{inc.estimatedDelayMinutes}m
                    </td>
                    <td className="py-3.5 px-3 text-center">{getStatusBadge(inc.status)}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {inc.status !== 'resolved' ? (
                          <button
                            onClick={() => handleUpdateStatus(inc.id, 'resolved')}
                            title="Mark as Resolved"
                            className="p-1 rounded text-emerald-400 hover:bg-emerald-950/60 transition-colors"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUpdateStatus(inc.id, 'confirmed')}
                            title="Re-open Incident"
                            className="p-1 rounded text-amber-400 hover:bg-amber-950/60 transition-colors"
                          >
                            <Clock className="w-4 h-4" />
                          </button>
                        )}

                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(inc.id)}
                            title="Delete Incident"
                            className="p-1 rounded text-rose-400 hover:bg-rose-950/60 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Report Incident Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Report New Traffic Incident"
        description="Submit hazard telemetry to inform route recommendations and alert operators"
      >
        <form onSubmit={handleCreateIncident} className="space-y-4">
          <Input
            label="Incident Title"
            placeholder="e.g. Collision blocking right lanes"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Incident Type"
              value={type}
              onChange={(e) => setType(e.target.value as IncidentType)}
              options={[
                { value: 'accident', label: 'Accident' },
                { value: 'construction', label: 'Construction' },
                { value: 'congestion', label: 'Severe Bottleneck' },
                { value: 'hazard', label: 'Road Hazard' },
                { value: 'roadwork', label: 'Roadwork' },
                { value: 'event', label: 'Special Event' },
              ]}
            />

            <Select
              label="Severity Level"
              value={severity}
              onChange={(e) => setSeverity(e.target.value as IncidentSeverity)}
              options={[
                { value: 'low', label: 'Low (< 10m delay)' },
                { value: 'medium', label: 'Medium (10-20m delay)' },
                { value: 'high', label: 'High (20-40m delay)' },
                { value: 'critical', label: 'Critical (Gridlock / Blocked)' },
              ]}
            />
          </div>

          <Input
            label="Road Name / Corridor"
            placeholder="e.g. Market Street (Downtown Corridor)"
            value={roadName}
            onChange={(e) => setRoadName(e.target.value)}
            required
          />

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Latitude"
              type="number"
              step="0.0001"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              required
            />
            <Input
              label="Longitude"
              type="number"
              step="0.0001"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              required
            />
            <Input
              label="Est. Delay (min)"
              type="number"
              value={delayMins}
              onChange={(e) => setDelayMins(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Incident Details
            </label>
            <textarea
              rows={3}
              placeholder="Describe emergency responders, lane closures, or bypass instructions..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-navy-950/70 border border-navy-700 focus:border-cyan-400 rounded-lg p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-navy-750">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
            >
              Broadcast Incident
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
