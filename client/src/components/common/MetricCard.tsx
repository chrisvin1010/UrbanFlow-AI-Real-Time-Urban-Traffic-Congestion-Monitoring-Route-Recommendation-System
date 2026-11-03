import React from 'react';
import { Card } from '../ui/Card';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
    isNeutral?: boolean;
  };
  accentColor?: 'cyan' | 'emerald' | 'amber' | 'rose' | 'blue';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  subtitle,
  icon,
  trend,
  accentColor = 'cyan',
}) => {
  const iconBg = {
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  };

  return (
    <Card className="p-4 sm:p-5 relative overflow-hidden group hover:border-slate-600 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-medium text-slate-400 tracking-wider uppercase">{title}</p>
          <div className="flex items-baseline gap-1.5 pt-1">
            <span className="text-2xl sm:text-3xl font-bold text-slate-100 font-mono tracking-tight">
              {value}
            </span>
            {unit && <span className="text-xs font-medium text-slate-400">{unit}</span>}
          </div>
          {subtitle && <p className="text-xs text-slate-400 pt-0.5">{subtitle}</p>}
        </div>

        <div className={`p-3 rounded-xl border ${iconBg[accentColor]} shrink-0 shadow-inner`}>
          {icon}
        </div>
      </div>

      {trend && (
        <div className="mt-3 pt-3 border-t border-navy-750 flex items-center gap-1.5 text-xs">
          <span
            className={`font-semibold ${
              trend.isNeutral
                ? 'text-slate-400'
                : trend.isPositive
                ? 'text-emerald-400'
                : 'text-rose-400'
            }`}
          >
            {trend.value}
          </span>
          <span className="text-slate-500">vs historical baseline</span>
        </div>
      )}
    </Card>
  );
};
