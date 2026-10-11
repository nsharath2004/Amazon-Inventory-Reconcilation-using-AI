import React, { useState, useEffect } from 'react';
import { 
  Boxes, 
  Layers, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  ScanSearch, 
  FileSpreadsheet, 
  ArrowRight,
  RefreshCw,
  Cpu,
  Sparkles
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend 
} from 'recharts';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import ModeBadge from '../components/ModeBadge';

const STATUS_COLORS = {
  MATCH: '#10b981',        // Emerald
  OVERSTOCKED: '#f59e0b',  // Amber
  UNDERSTOCKED: '#f43f5e', // Rose
  UNRECONCILED: '#94a3b8'  // Slate
};

export default function DashboardPage({ setTab, onQuickAnalyze }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getDashboard();
      if (res.success) {
        setData(res.data);
      } else {
        setError(res.error || 'Failed to fetch dashboard data');
      }
    } catch (err) {
      setError(err.message || 'Error communicating with backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="w-8 h-8 border-3 border-amazon-orange border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Aggregating fulfillment warehouse statistics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-800">
        <h3 className="font-semibold text-base mb-1">Failed to Load Dashboard</h3>
        <p className="text-sm mb-4">{error}</p>
        <button 
          onClick={fetchDashboard}
          className="px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700 transition"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const {
    total_bins = 0,
    total_recorded_products = 0,
    total_predicted_products = 0,
    reconciled_bins_count = 0,
    mismatched_bins_count = 0,
    accuracy_percentage = 0,
    status_distribution = {},
    category_comparison = [],
    recent_activities = []
  } = data || {};

  // Status Distribution Chart Data
  const pieData = [
    { name: 'Match (Reconciled)', value: status_distribution.MATCH || 0, color: STATUS_COLORS.MATCH },
    { name: 'Overstocked', value: status_distribution.OVERSTOCKED || 0, color: STATUS_COLORS.OVERSTOCKED },
    { name: 'Understocked', value: status_distribution.UNDERSTOCKED || 0, color: STATUS_COLORS.UNDERSTOCKED },
    { name: 'Unreconciled', value: status_distribution.UNRECONCILED || 0, color: STATUS_COLORS.UNRECONCILED },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Warehouse Inventory Dashboard</h1>
          <p className="text-sm text-slate-500">
            Real-time computer vision reconciliation across robotic storage pods (Kiva units).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab('analyze')}
            className="flex items-center gap-2 px-4 py-2.5 bg-amazon-orange text-amazon-dark font-semibold text-sm rounded-lg hover:bg-amber-400 shadow-sm transition"
          >
            <ScanSearch className="w-4 h-4" />
            <span>New Bin Scan</span>
          </button>
          <button
            onClick={() => api.exportClientCSV()}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-300 text-slate-700 font-medium text-sm rounded-lg hover:bg-slate-50 shadow-sm transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        
        {/* Total Bins */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Bins</span>
            <Boxes className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{total_bins}</div>
          <p className="text-[11px] text-slate-400 mt-1">Registered pod bins</p>
        </div>

        {/* Total Recorded */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Recorded Items</span>
            <Layers className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{total_recorded_products}</div>
          <p className="text-[11px] text-slate-400 mt-1">Expected in database</p>
        </div>

        {/* Total Predicted */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">AI Counted</span>
            <Cpu className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{total_predicted_products}</div>
          <p className="text-[11px] text-slate-400 mt-1">Vision model predictions</p>
        </div>

        {/* Correctly Reconciled */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Matched Bins</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-700">{reconciled_bins_count}</div>
          <p className="text-[11px] text-emerald-600/80 mt-1">Variance = 0</p>
        </div>

        {/* Mismatched */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-amber-600 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Mismatched</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600">{mismatched_bins_count}</div>
          <p className="text-[11px] text-amber-600/80 mt-1">Over/Understocked</p>
        </div>

        {/* Accuracy % */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4 rounded-xl border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-300 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Match Rate</span>
            <TrendingUp className="w-4 h-4 text-amazon-orange" />
          </div>
          <div className="text-2xl font-bold text-amazon-orange">{accuracy_percentage}%</div>
          <p className="text-[11px] text-slate-300 mt-1">Reconciliation accuracy</p>
        </div>

      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Status Distribution Donut Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Inventory Status Distribution</h2>
              <p className="text-xs text-slate-500">Proportion of matched vs discrepant bins</p>
            </div>
          </div>

          <div className="h-64 w-full">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(val, name) => [`${val} bins`, name]}
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">No reconciliation data</div>
            )}
          </div>

          {/* Custom Chart Legend */}
          <div className="grid grid-cols-2 gap-2 mt-auto pt-4 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-slate-600">Match: <strong>{status_distribution.MATCH || 0}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-slate-600">Overstocked: <strong>{status_distribution.OVERSTOCKED || 0}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="text-slate-600">Understocked: <strong>{status_distribution.UNDERSTOCKED || 0}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
              <span className="text-slate-600">Unreconciled: <strong>{status_distribution.UNRECONCILED || 0}</strong></span>
            </div>
          </div>
        </div>

        {/* Recorded vs Predicted Bar Chart */}
        <div className="lg:col-span-3 bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Recorded vs Predicted Products by Category</h2>
              <p className="text-xs text-slate-500">Comparison of expected ERP count vs Computer Vision AI count</p>
            </div>
          </div>

          <div className="h-64 w-full">
            {category_comparison.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={category_comparison} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="category" 
                    tick={{ fontSize: 11, fill: '#64748b' }} 
                    angle={-15} 
                    textAnchor="end" 
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="recorded" name="Recorded (ERP)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="predicted" name="AI Predicted" fill="#ff9900" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">No category data available</div>
            )}
          </div>
        </div>

      </div>

      {/* Recent Activities Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Recent Reconciliation Activities</h2>
            <p className="text-xs text-slate-500">Latest automated bin image inspections</p>
          </div>
          <button
            onClick={() => setTab('history')}
            className="text-xs font-semibold text-amazon-blue hover:text-blue-700 flex items-center gap-1 transition"
          >
            <span>View Full History</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-5 py-3.5">Bin ID</th>
                <th className="px-5 py-3.5">Warehouse Location</th>
                <th className="px-5 py-3.5 text-center">Recorded</th>
                <th className="px-5 py-3.5 text-center">AI Predicted</th>
                <th className="px-5 py-3.5 text-center">Variance</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Mode</th>
                <th className="px-5 py-3.5 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {recent_activities.length > 0 ? (
                recent_activities.map((act) => (
                  <tr key={act.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-3.5 font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-slate-300" />
                      {act.bin_id}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500 max-w-xs truncate">
                      {act.warehouse_location || 'General Pod Floor'}
                    </td>
                    <td className="px-5 py-3.5 text-center font-medium">{act.recorded_count}</td>
                    <td className="px-5 py-3.5 text-center font-bold text-slate-900">{act.predicted_count}</td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                        act.variance === 0 
                          ? 'bg-slate-100 text-slate-600'
                          : act.variance > 0 
                          ? 'bg-amber-100 text-amber-800' 
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {act.variance > 0 ? `+${act.variance}` : act.variance}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={act.status} size="sm" />
                    </td>
                    <td className="px-5 py-3.5">
                      <ModeBadge mode={act.prediction_mode} size="sm" />
                    </td>
                    <td className="px-5 py-3.5 text-right text-xs text-slate-400">
                      {act.created_at ? act.created_at.replace('T', ' ').substring(0, 16) : 'Just now'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-5 py-8 text-center text-slate-400 text-sm">
                    No recent activities recorded yet. Run a bin scan to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
