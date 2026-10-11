import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Cpu, 
  Sparkles, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Terminal, 
  BookOpen, 
  Database,
  ShieldCheck,
  Server
} from 'lucide-react';
import api from '../services/api';
import ModeBadge from '../components/ModeBadge';
import ConfirmDialog from '../components/ConfirmDialog';

export default function SettingsPage({ systemMode, onToggleMode, onSeedData, seeding }) {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      const res = await api.getHealth();
      setHealth(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, [systemMode]);

  const modelEngine = health?.model_engine || {};

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System & Machine Learning Settings</h1>
        <p className="text-sm text-slate-500">
          Inference engine configuration, training diagnostics, and fulfillment database administration.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* ML Inference Engine Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Computer Vision Inference Engine</h3>
                <p className="text-xs text-slate-500">PyTorch ResNet vs OpenCV Simulation</p>
              </div>
            </div>
            <ModeBadge mode={systemMode} size="md" />
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div>
                <span className="font-semibold text-slate-800 block">Current Operating Mode</span>
                <span className="text-slate-500 text-[11px]">
                  {systemMode === 'AI_MODEL' 
                    ? 'Using PyTorch Deep Learning model fine-tuned on warehouse bins' 
                    : 'Using OpenCV heuristic edge/contour demo analyzer'}
                </span>
              </div>
              <button
                onClick={onToggleMode}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs shadow-sm transition ${
                  systemMode === 'AI_MODEL'
                    ? 'bg-amber-500 hover:bg-amber-600 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                Switch to {systemMode === 'AI_MODEL' ? 'Demo Mode' : 'AI Model'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-slate-600 pt-1">
              <div className="p-2.5 rounded-lg border border-slate-100 bg-white">
                <span className="text-slate-400 block text-[11px]">PyTorch Version</span>
                <span className="font-mono font-bold text-slate-800">{health?.pytorch_version || '2.x CPU'}</span>
              </div>
              <div className="p-2.5 rounded-lg border border-slate-100 bg-white">
                <span className="text-slate-400 block text-[11px]">Compute Device</span>
                <span className="font-mono font-bold text-slate-800">
                  {health?.cuda_available ? 'CUDA GPU' : 'CPU (Optimized)'}
                </span>
              </div>
              <div className="p-2.5 rounded-lg border border-slate-100 bg-white">
                <span className="text-slate-400 block text-[11px]">Checkpoint Status</span>
                <span className={`font-semibold flex items-center gap-1 ${modelEngine.checkpoint_exists ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {modelEngine.checkpoint_exists ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                  {modelEngine.checkpoint_exists ? 'Model Weights Loaded' : 'No Checkpoint (Demo)'}
                </span>
              </div>
              <div className="p-2.5 rounded-lg border border-slate-100 bg-white">
                <span className="text-slate-400 block text-[11px]">Best Validation Acc</span>
                <span className="font-bold text-slate-800">
                  {modelEngine.trained_accuracy ? `${modelEngine.trained_accuracy}%` : '56.2% (Benchmark)'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Database & Data Controls */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="p-2 bg-amber-50 text-amazon-orange rounded-lg">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Inventory Database Management</h3>
              <p className="text-xs text-slate-500">SQLite local storage & sample dataset seeding</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <p className="text-slate-600 leading-relaxed">
              The application stores inventory records and reconciliation audit logs locally in SQLite (<code className="bg-slate-100 px-1 py-0.5 rounded font-mono">backend/inventory.db</code>).
            </p>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-800 block">Reset & Seed Sample Data</span>
                <span className="text-slate-500 text-[11px]">Populate 12 realistic bins and historical scan audits</span>
              </div>
              <button
                onClick={() => setIsResetConfirmOpen(true)}
                disabled={seeding}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg text-xs transition flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${seeding ? 'animate-spin' : ''}`} />
                <span>{seeding ? 'Seeding...' : 'Reset Data'}</span>
              </button>
            </div>

            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Full CRUD functionality enabled for bins and automated audit logs.</span>
            </div>
          </div>
        </div>

      </div>

      {/* Terminal & Training Guide */}
      <div className="bg-slate-900 text-white p-6 rounded-xl border border-slate-800 shadow-md space-y-4">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-amazon-orange" />
          <h3 className="font-bold text-sm text-white">How to Train the PyTorch Model (CLI Commands)</h3>
        </div>

        <p className="text-xs text-slate-400">
          You can fine-tune the ResNet model on additional bin images or train from scratch on Windows using PowerShell:
        </p>

        <div className="bg-black/60 rounded-lg p-4 font-mono text-xs text-slate-300 space-y-2 border border-slate-800 overflow-x-auto">
          <p className="text-slate-500"># 1. Train ResNet18 model on warehouse bin images (0 to 5 count classes):</p>
          <p className="text-emerald-400 font-semibold">cd "c:\5th Sem PES\ML\ML_MINI_PROJECT\amazon-inventory-ai\ml"</p>
          <p className="text-emerald-400 font-semibold">python train.py --model resnet18 --epochs 5 --batch_size 16</p>
          
          <p className="text-slate-500 pt-2"># 2. Evaluate model on test set (Accuracy, Confusion Matrix, MAE, RMSE):</p>
          <p className="text-emerald-400 font-semibold">python evaluate.py</p>

          <p className="text-slate-500 pt-2"># 3. Start Backend Flask Server:</p>
          <p className="text-emerald-400 font-semibold">cd "c:\5th Sem PES\ML\ML_MINI_PROJECT\amazon-inventory-ai\backend"</p>
          <p className="text-emerald-400 font-semibold">python app.py</p>
        </div>
      </div>

      {/* Academic Citation & Guidelines Reference */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3 text-xs">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-amazon-orange" />
          <h3 className="font-bold text-sm text-slate-800">Academic Project Context & Citations</h3>
        </div>
        <p className="text-slate-600 leading-relaxed">
          <strong>Course:</strong> UE24CS352A - Machine Learning Mini-Project, PES University.<br />
          <strong>Research Basis:</strong> Inspired by <em>"Amazon Inventory Reconciliation Using AI"</em>, Stanford University (Pablo Rodriguez Bertorello, Sravan Sripada, Nutchapol Dendumrongsup) using the Amazon Bin Image Dataset (ABID).
        </p>
        <p className="text-slate-500 text-[11px] italic">
          Disclaimer: This is an academic research prototype and is not connected to Amazon's proprietary fulfillment production network.
        </p>
      </div>

      {/* Confirm Seed Reset Dialog */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={async () => {
          setIsResetConfirmOpen(false);
          await onSeedData();
        }}
        title="Re-Seed Demo Data"
        message="This will re-initialize the database and seed fresh sample inventory bins and audit logs. Any custom bins will be reset. Do you wish to continue?"
        confirmText="Re-Seed Database"
        isDanger={false}
        loading={seeding}
      />

    </div>
  );
}
