import React from 'react';
import { 
  LayoutDashboard, 
  Boxes, 
  ScanSearch, 
  History, 
  BarChart3, 
  Settings,
  HelpCircle,
  ExternalLink
} from 'lucide-react';

export default function Sidebar({ currentTab, setTab }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'bins', label: 'Inventory Bins', icon: Boxes },
    { id: 'analyze', label: 'AI Image Analysis', icon: ScanSearch, highlight: true },
    { id: 'history', label: 'Reconciliation History', icon: History },
    { id: 'analytics', label: 'Analytics & Reports', icon: BarChart3 },
    { id: 'settings', label: 'System & ML Settings', icon: Settings },
  ];

  return (
    <aside className="w-full md:w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800">
      <div className="p-4 border-b border-slate-800/80">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Warehouse Operations</p>
      </div>

      <nav className="p-3 space-y-1 flex-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-amazon-orange text-amazon-dark shadow-sm font-semibold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-amazon-dark' : 'text-slate-400'}`} />
              <span>{item.label}</span>
              {item.highlight && !isActive && (
                <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  AI
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info Box */}
      <div className="p-4 m-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs">
        <div className="flex items-center gap-1.5 font-semibold text-white mb-1">
          <HelpCircle className="w-3.5 h-3.5 text-amazon-orange" />
          <span>Academic Project</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-normal">
          PES University • UE24CS352A
          <br />Based on Stanford ABID Paper
        </p>
      </div>
    </aside>
  );
}
