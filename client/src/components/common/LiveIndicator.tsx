import React from 'react';
import { useSocket } from '../../context/SocketContext';
import { Activity, Play, Zap } from 'lucide-react';

interface LiveIndicatorProps {
  lastUpdated?: string;
  onTriggerTick?: () => void;
  isSimulating?: boolean;
}

export const LiveIndicator: React.FC<LiveIndicatorProps> = ({
  lastUpdated,
  onTriggerTick,
  isSimulating = false,
}) => {
  const { isConnected, triggerSimulationStep } = useSocket();

  const handleSimulate = () => {
    if (onTriggerTick) {
      onTriggerTick();
    } else {
      triggerSimulationStep();
    }
  };

  return (
    <div className="flex items-center gap-2.5 bg-navy-850 border border-navy-700/80 px-3 py-1.5 rounded-full shadow-sm">
      <div className="flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          {isConnected && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          )}
          <span
            className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
              isConnected ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
          />
        </span>
        <span className="text-xs font-medium text-slate-300 flex items-center gap-1">
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">
            {isConnected ? 'Live Telemetry' : 'Polling Sync'}
          </span>
        </span>
      </div>

      <div className="h-3 w-px bg-navy-700 hidden sm:block" />

      {lastUpdated && (
        <span className="text-[11px] text-slate-400 font-mono hidden md:inline">
          {new Date(lastUpdated).toLocaleTimeString()}
        </span>
      )}

      <button
        onClick={handleSimulate}
        disabled={isSimulating}
        title="Trigger simulated traffic tick immediately"
        className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/30 px-2 py-0.5 rounded-md flex items-center gap-1 transition-all active:scale-95 disabled:opacity-50"
      >
        <Zap className="w-3 h-3 text-cyan-400" />
        <span className="hidden lg:inline">Tick Engine</span>
      </button>
    </div>
  );
};
