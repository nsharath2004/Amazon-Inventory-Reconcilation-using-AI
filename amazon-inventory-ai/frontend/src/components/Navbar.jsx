import React from 'react';
import { Package2, RefreshCw, Cpu, Sparkles, Building2, ShieldAlert } from 'lucide-react';

export default function Navbar({ systemMode, onToggleMode, onSeedData, seeding }) {
  return (
    <header className="bg-amazon-dark text-white border-b border-slate-700/60 sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand & Warehouse Node */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amazon-orange flex items-center justify-center text-amazon-dark shadow-sm">
              <Package2 className="w-5 h-5 font-bold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
                  amazon <span className="text-amazon-orange font-medium text-xs px-1.5 py-0.5 rounded bg-white/10 uppercase tracking-wider">Robotics AI</span>
                </span>
                <span className="text-slate-400 text-xs hidden md:inline">| Inventory Reconciliation System</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-300">
                <Building2 className="w-3 h-3 text-amazon-accent" />
                <span>Node: <strong className="text-white">BLR-FC1</strong> (Kiva Pod Unit 08)</span>
              </div>
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-3">
            {/* AI Engine Status & Toggle */}
            <button
              onClick={onToggleMode}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                systemMode === 'AI_MODEL'
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-600/60 hover:bg-emerald-900/60'
                  : 'bg-amber-950/60 text-amber-300 border-amber-600/60 hover:bg-amber-900/60'
              }`}
              title="Click to toggle between PyTorch ResNet inference and Demo Mode"
            >
              {systemMode === 'AI_MODEL' ? (
                <>
                  <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Engine:</span>
                  <span className="font-semibold text-emerald-200">PyTorch ResNet</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Engine:</span>
                  <span className="font-semibold text-amber-200">Demo Heuristic</span>
                </>
              )}
            </button>

            {/* Re-seed demo data button */}
            <button
              onClick={onSeedData}
              disabled={seeding}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white border border-slate-700 transition"
              title="Reset sample bins and history records"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${seeding ? 'animate-spin text-amazon-orange' : ''}`} />
              <span className="hidden md:inline">{seeding ? 'Seeding...' : 'Reset Demo Data'}</span>
            </button>

            {/* Academic Notice Pill */}
            <div className="hidden lg:flex items-center gap-1.5 text-[11px] bg-white/5 text-slate-300 px-2.5 py-1 rounded-md border border-white/10" title="Inspired by Stanford University ABID Research Paper">
              <span className="w-1.5 h-1.5 rounded-full bg-amazon-orange animate-ping" />
              <span>Capstone Prototype</span>
            </div>

          </div>

        </div>
      </div>
    </header>
  );
}
