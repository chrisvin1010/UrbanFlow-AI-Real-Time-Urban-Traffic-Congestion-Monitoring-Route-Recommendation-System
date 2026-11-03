import React from 'react';
import { Menu, Navigation, ShieldCheck } from 'lucide-react';
import { LiveIndicator } from '../common/LiveIndicator';
import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
  onToggleMobileMenu: () => void;
  selectedArea: string;
  setSelectedArea: (area: string) => void;
  availableAreas: string[];
  lastUpdated?: string;
  onRefresh?: () => void;
  isSimulating?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleMobileMenu,
  selectedArea,
  setSelectedArea,
  availableAreas,
  lastUpdated,
  onRefresh,
  isSimulating,
}) => {
  const { user, isAdmin } = useAuth();

  return (
    <header className="h-16 bg-navy-900/95 border-b border-navy-750 px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-30 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-navy-800 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-navy-800 border border-navy-700 text-xs font-semibold text-slate-200">
            <Navigation className="w-3.5 h-3.5 text-cyan-400 rotate-45" />
            <span>San Francisco, CA</span>
          </div>

          {isAdmin && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
              <ShieldCheck className="w-3 h-3 text-cyan-400" />
              ADMIN MODE
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Area Filter Selector */}
        <div className="hidden md:flex items-center gap-2">
          <label htmlFor="area-filter" className="text-xs text-slate-400 font-medium">
            District:
          </label>
          <select
            id="area-filter"
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            className="bg-navy-850 border border-navy-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 transition-colors"
          >
            <option value="all">All City Corridors</option>
            {availableAreas.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
        </div>

        {/* Live Socket Status & Telemetry Engine Tick */}
        <LiveIndicator
          lastUpdated={lastUpdated}
          onTriggerTick={onRefresh}
          isSimulating={isSimulating}
        />
      </div>
    </header>
  );
};
