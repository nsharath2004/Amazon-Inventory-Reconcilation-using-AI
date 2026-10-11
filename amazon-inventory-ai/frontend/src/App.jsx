import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import DashboardPage from './pages/DashboardPage';
import BinsPage from './pages/BinsPage';
import AnalyzePage from './pages/AnalyzePage';
import HistoryPage from './pages/HistoryPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import api from './services/api';

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [systemMode, setSystemMode] = useState('AI_MODEL');
  const [preselectedBin, setPreselectedBin] = useState(null);
  const [seeding, setSeeding] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sync health / mode on mount
  useEffect(() => {
    const syncStatus = async () => {
      try {
        const res = await api.getHealth();
        if (res.global_demo_mode) {
          setSystemMode('DEMO_MODE');
        } else if (res.model_engine?.model_loaded) {
          setSystemMode('AI_MODEL');
        } else {
          setSystemMode('DEMO_MODE');
        }
      } catch (e) {
        console.error('Initial health check failed:', e);
      }
    };
    syncStatus();
  }, []);

  const handleToggleMode = async () => {
    try {
      const nextMode = systemMode === 'AI_MODEL' ? true : false;
      const res = await api.toggleDemoMode(nextMode);
      setSystemMode(res.global_demo_mode ? 'DEMO_MODE' : 'AI_MODEL');
      showToast(res.message);
    } catch (err) {
      showToast('Failed to toggle operating mode: ' + err.message);
    }
  };

  const handleSeedData = async () => {
    setSeeding(true);
    try {
      const res = await api.seedDatabase();
      showToast(res.message || 'Database re-seeded successfully!');
      // Reload current view
      window.location.reload();
    } catch (err) {
      showToast('Error seeding database: ' + err.message);
    } finally {
      setSeeding(false);
    }
  };

  const handleAnalyzeBin = (bin) => {
    setPreselectedBin(bin);
    setCurrentTab('analyze');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-800">
      
      {/* Top Navbar */}
      <Navbar 
        systemMode={systemMode} 
        onToggleMode={handleToggleMode} 
        onSeedData={handleSeedData}
        seeding={seeding}
      />

      {/* Main Layout: Sidebar + Content */}
      <div className="flex-1 flex flex-col md:flex-row">
        
        {/* Navigation Sidebar */}
        <Sidebar currentTab={currentTab} setTab={setCurrentTab} />

        {/* Dynamic Main Workspace Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-y-auto">
          {currentTab === 'dashboard' && (
            <DashboardPage 
              setTab={setCurrentTab} 
              onQuickAnalyze={() => setCurrentTab('analyze')} 
            />
          )}

          {currentTab === 'bins' && (
            <BinsPage 
              onAnalyzeBin={handleAnalyzeBin} 
            />
          )}

          {currentTab === 'analyze' && (
            <AnalyzePage 
              preselectedBin={preselectedBin} 
              onNavigateToHistory={() => setCurrentTab('history')}
              onNavigateToBins={() => setCurrentTab('bins')}
            />
          )}

          {currentTab === 'history' && (
            <HistoryPage />
          )}

          {currentTab === 'analytics' && (
            <AnalyticsPage />
          )}

          {currentTab === 'settings' && (
            <SettingsPage 
              systemMode={systemMode} 
              onToggleMode={handleToggleMode} 
              onSeedData={handleSeedData}
              seeding={seeding}
            />
          )}
        </main>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <span className="w-2 h-2 rounded-full bg-amazon-orange animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
