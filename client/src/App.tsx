import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { Sidebar } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { MapPage } from './pages/MapPage';
import { RouteRecommendationPage } from './pages/RouteRecommendationPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { IncidentManagementPage } from './pages/IncidentManagementPage';
import { RoadMonitoringPage } from './pages/RoadMonitoringPage';
import { AdminPage } from './pages/AdminPage';
import { SettingsPage } from './pages/SettingsPage';
import { Loader2 } from 'lucide-react';

export const App: React.FC = () => {
  const { user, token, isLoading } = useAuth();

  // Navigation & View state
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [selectedRoadIdForMap, setSelectedRoadIdForMap] = useState<string | null>(null);
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [authView, setAuthView] = useState<'login' | 'register'>('login');

  // Sidebar responsive state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Common available areas in demonstration city
  const availableAreas = [
    'Downtown / Civic Center',
    'Waterfront / Financial District',
    'Civic Center / Cathedral Hill',
    'Russian Hill / Marina',
    'Presidio / Marina',
    'SoMa / South Beach',
    'Mission / SoMa',
    'Richmond District',
    'Nob Hill / Financial District',
    'Sunset District',
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        <span className="text-xs font-mono text-slate-400 tracking-wider uppercase">
          Initializing UrbanFlow Telemetry...
        </span>
      </div>
    );
  }

  // Not logged in: Show Modern Auth screen
  if (!token || !user) {
    if (authView === 'register') {
      return (
        <RegisterPage
          onSwitchToLogin={() => setAuthView('login')}
          onSuccess={() => setCurrentTab('dashboard')}
        />
      );
    }
    return (
      <LoginPage
        onSwitchToRegister={() => setAuthView('register')}
        onSuccess={() => setCurrentTab('dashboard')}
      />
    );
  }

  // Cross-page navigation helper: focus a specific road segment on map
  const handleNavigateToRoadOnMap = (roadId: string) => {
    setSelectedRoadIdForMap(roadId);
    setCurrentTab('map');
  };

  return (
    <div className="flex h-screen bg-navy-900 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        isMobileOpen={isMobileMenuOpen}
        setIsMobileOpen={setIsMobileMenuOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <Navbar
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          selectedArea={selectedArea}
          setSelectedArea={setSelectedArea}
          availableAreas={availableAreas}
        />

        {/* Dynamic Page Views */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {currentTab === 'dashboard' && (
              <DashboardPage
                selectedArea={selectedArea}
                onNavigateToRoad={handleNavigateToRoadOnMap}
                onNavigateToMap={() => setCurrentTab('map')}
              />
            )}

            {currentTab === 'map' && (
              <MapPage initialSelectedRoadId={selectedRoadIdForMap} />
            )}

            {currentTab === 'routes' && <RouteRecommendationPage />}

            {currentTab === 'analytics' && <AnalyticsPage selectedArea={selectedArea} />}

            {currentTab === 'incidents' && <IncidentManagementPage />}

            {currentTab === 'roads' && (
              <RoadMonitoringPage onSelectRoadForMap={handleNavigateToRoadOnMap} />
            )}

            {currentTab === 'admin' && <AdminPage />}

            {currentTab === 'settings' && <SettingsPage />}
          </div>
        </main>
      </div>
    </div>
  );
};
export default App;
