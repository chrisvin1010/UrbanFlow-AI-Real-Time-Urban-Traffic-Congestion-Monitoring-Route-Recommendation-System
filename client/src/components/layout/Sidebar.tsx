import React from 'react';
import {
  LayoutDashboard,
  MapPin,
  Navigation,
  BarChart3,
  AlertTriangle,
  Route,
  Shield,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
}) => {
  const { user, isAdmin, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Traffic Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'map', label: 'Interactive Map', icon: <MapPin className="w-5 h-5" /> },
    { id: 'routes', label: 'Smart Routes', icon: <Navigation className="w-5 h-5" /> },
    { id: 'analytics', label: 'Traffic Analytics', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'incidents', label: 'Incidents & Hazards', icon: <AlertTriangle className="w-5 h-5" /> },
    { id: 'roads', label: 'Road Monitoring', icon: <Route className="w-5 h-5" /> },
    ...(isAdmin ? [{ id: 'admin', label: 'Admin Command', icon: <Shield className="w-5 h-5 text-cyan-400" /> }] : []),
    { id: 'settings', label: 'Preferences & Units', icon: <Settings className="w-5 h-5" /> },
  ];

  const handleNavClick = (id: string) => {
    setCurrentTab(id);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-navy-950/80 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 bg-navy-900 border-r border-navy-750 flex flex-col transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-navy-750">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-cyan-400 flex items-center justify-center text-navy-950 font-black shadow-glow-cyan shrink-0">
              <Layers className="w-5 h-5 text-navy-950" />
            </div>
            {!isCollapsed && (
              <div className="transition-opacity duration-200">
                <span className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
                  UrbanFlow <span className="text-cyan-400 font-mono text-xs px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-500/30">AI</span>
                </span>
                <p className="text-[10px] text-slate-400 font-medium">Smart Traffic Intel</p>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-navy-800 transition-colors"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 group relative ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-cyan-500/5 text-cyan-400 border border-cyan-500/30 shadow-glow-cyan/50 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-navy-800/80 border border-transparent'
                } ${isCollapsed ? 'justify-center' : ''}`}
                title={isCollapsed ? item.label : undefined}
              >
                <span className={`shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'}`}>
                  {item.icon}
                </span>

                {!isCollapsed && (
                  <span className="truncate tracking-wide">{item.label}</span>
                )}

                {isActive && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-cyan-400 rounded-l-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-3 border-t border-navy-750 bg-navy-950/40">
          <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : 'px-2 py-1.5'}`}>
            <div className="w-9 h-9 rounded-full bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-semibold text-xs shrink-0">
              {user ? user.name.slice(0, 2).toUpperCase() : 'UF'}
            </div>

            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-200 truncate">{user?.name || 'Guest User'}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded uppercase font-semibold ${
                      isAdmin ? 'bg-cyan-900/60 text-cyan-300 border border-cyan-500/30' : 'bg-navy-750 text-slate-400'
                    }`}
                  >
                    {user?.role || 'Guest'}
                  </span>
                </div>
              </div>
            )}

            {!isCollapsed && (
              <button
                onClick={logout}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-navy-800 rounded-lg transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
