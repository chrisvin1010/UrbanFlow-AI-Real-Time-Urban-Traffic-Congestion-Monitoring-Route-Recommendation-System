import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Settings as SettingsIcon, User, Bell, Gauge, MapPin, Save, LogOut } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, updatePreferences, logout } = useAuth();
  const { success, error: toastError } = useToast();

  const [theme, setTheme] = useState(user?.preferences?.theme || 'dark');
  const [speedUnit, setSpeedUnit] = useState(user?.preferences?.speedUnit || 'km/h');
  const [defaultCity, setDefaultCity] = useState(user?.preferences?.defaultCity || 'San Francisco');
  const [notifications, setNotifications] = useState(user?.preferences?.notificationAlerts ?? true);
  const [refreshInterval, setRefreshInterval] = useState(user?.preferences?.refreshIntervalSeconds || 15);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updatePreferences({
        theme: theme as any,
        speedUnit: speedUnit as any,
        defaultCity,
        notificationAlerts: notifications,
        refreshIntervalSeconds: Number(refreshInterval),
      });
      success('Preferences Saved', 'Your system preferences have been saved to your profile.');
    } catch (err: any) {
      toastError('Save Error', err.response?.data?.message || 'Failed to update preferences');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-navy-850/60 border border-navy-700/80 p-5 rounded-2xl">
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-cyan-400" />
          Operator Preferences & System Settings
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Customize unit standards, default map coordinates, and telemetry stream intervals
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile Card */}
        <Card>
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <User className="w-4 h-4 text-cyan-400" />
                Operator Identity Profile
              </span>
            }
            subtitle="Your authenticated account credentials"
          />
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Name" value={user?.name || ''} disabled className="opacity-80" />
              <Input label="Email" value={user?.email || ''} disabled className="opacity-80" />
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <span>Security Role:</span>
              <span className="uppercase text-cyan-300 font-semibold bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/30">
                {user?.role}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Telemetry & Display Units */}
        <Card>
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-cyan-400" />
                Unit & Measurement Standards
              </span>
            }
            subtitle="Display unit conversions for telemetry tables and gauges"
          />
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Velocity Unit"
                value={speedUnit}
                onChange={(e) => setSpeedUnit(e.target.value as 'km/h' | 'mph')}
                options={[
                  { value: 'km/h', label: 'Kilometers per hour (km/h) - Metric' },
                  { value: 'mph', label: 'Miles per hour (mph) - Imperial' },
                ]}
              />

              <Select
                label="Interface Theme"
                value={theme}
                onChange={(e) => setTheme(e.target.value as 'dark' | 'light' | 'system')}
                options={[
                  { value: 'dark', label: 'Premium Dark Navy (Recommended)' },
                  { value: 'system', label: 'Match System Palette' },
                ]}
              />
            </div>
          </CardContent>
        </Card>

        {/* Map & Telemetry Configuration */}
        <Card>
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-cyan-400" />
                Default Geolocation & Telemetry Refresh
              </span>
            }
            subtitle="Default viewpoint center and background refresh interval"
          />
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Default Demonstration City"
                value={defaultCity}
                onChange={(e) => setDefaultCity(e.target.value)}
              />

              <Select
                label="Telemetry Polling Interval"
                value={String(refreshInterval)}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                options={[
                  { value: '5', label: 'Every 5 seconds (High Frequency)' },
                  { value: '15', label: 'Every 15 seconds (Standard Engine Cycle)' },
                  { value: '30', label: 'Every 30 seconds' },
                  { value: '60', label: 'Every 60 seconds (Low Bandwidth)' },
                ]}
              />
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications}
                  onChange={(e) => setNotifications(e.target.checked)}
                  className="rounded border-navy-700 text-cyan-500 focus:ring-cyan-400 bg-navy-950 w-4 h-4"
                />
                <div>
                  <span className="text-sm font-medium text-slate-200">
                    Real-time hazard notifications
                  </span>
                  <p className="text-xs text-slate-400">
                    Show instant alerts when new critical congestion bottlenecks or collisions are reported
                  </p>
                </div>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Save & Logout Buttons */}
        <div className="flex items-center justify-between pt-2">
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSaving}
            icon={<Save className="w-4 h-4" />}
          >
            Persist Preferences
          </Button>

          <Button
            type="button"
            variant="danger"
            size="md"
            onClick={logout}
            icon={<LogOut className="w-4 h-4" />}
          >
            Sign Out
          </Button>
        </div>
      </form>
    </div>
  );
};
