import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  TrendingUp, 
  Info, 
  GraduationCap,
  Layers,
  Sparkles
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend 
} from 'recharts';
import api from '../services/api';

const PIE_COLORS = ['#10b981', '#f59e0b', '#f43f5e'];

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await api.getAnalytics();
        if (res.success) {
          setData(res.data);
        } else {
          setError(res.error || 'Failed to fetch analytics');
        }
      } catch (err) {
        setError(err.message || 'Error communicating with backend');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="w-8 h-8 border-3 border-amazon-orange border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Aggregating fulfillment warehouse analytics...</p>
      </div>
    );
  }

  const {
    total_scans = 0,
    match_count = 0,
    mismatch_count = 0,
    match_rate = 0,
    overstocked_count = 0,
    understocked_count = 0,
    variance_distribution = [],
    timeline = []
  } = data || {};

  const mismatchBreakdown = [
    { name: 'Matched', value: match_count, color: '#10b981' },
    { name: 'Overstocked (+Δ)', value: overstocked_count, color: '#f59e0b' },
    { name: 'Understocked (-Δ)', value: understocked_count, color: '#f43f5e' }
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Reports & Performance Analytics</h1>
          <p className="text-sm text-slate-500">
            Audit metrics, discrepancy trends, and academic research performance benchmarks.
          </p>
        </div>
        <a
          href={api.getReportsExportUrl()}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white font-semibold text-sm rounded-lg hover:bg-emerald-700 shadow-sm transition self-start sm:self-auto"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Export Reconciliation Report (CSV)</span>
        </a>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Total Scans Audited
          </span>
          <div className="text-3xl font-extrabold text-slate-900">{total_scans}</div>
          <p className="text-xs text-slate-500 mt-1">Recorded audit passes</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider block mb-1">
            Reconciled (Matches)
          </span>
          <div className="text-3xl font-extrabold text-emerald-600">{match_count}</div>
          <p className="text-xs text-emerald-700/80 mt-1">Variance = 0 items</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider block mb-1">
            Mismatches Flagged
          </span>
          <div className="text-3xl font-extrabold text-amber-600">{mismatch_count}</div>
          <p className="text-xs text-amber-700/80 mt-1">Over / Understocked</p>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-xl border border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1">
            Reconciliation Match Rate
          </span>
          <div className="text-3xl font-extrabold text-amazon-orange">{match_rate}%</div>
          <p className="text-xs text-slate-300 mt-1">Warehouse operational match</p>
        </div>

      </div>

      {/* Research & Conceptual Distinction Alert */}
      <div className="p-5 rounded-xl bg-blue-50 border border-blue-200 text-blue-950 flex flex-col md:flex-row gap-4 items-start shadow-sm">
        <div className="p-2.5 rounded-lg bg-blue-100 text-blue-700 shrink-0">
          <GraduationCap className="w-6 h-6" />
        </div>
        <div className="space-y-1.5 text-xs">
          <h4 className="font-bold text-sm text-blue-900">
            Critical Metric Distinction: Inventory Match Rate vs Model Prediction Accuracy
          </h4>
          <p className="text-blue-800 leading-relaxed">
            <strong>1. Inventory Reconciliation Match Rate ({match_rate}%):</strong> Reflects whether the physical inventory matches the database record (<code className="font-mono">variance == 0</code>). This measures warehouse supply chain integrity.
          </p>
          <p className="text-blue-800 leading-relaxed">
            <strong>2. Machine Learning Model Accuracy (Stanford Benchmark ~56.2%):</strong> Measures whether the computer vision neural network predicts the exact count (0 to 5) given noisy, occluded bin images with multiple items. As established in the Stanford ABID research paper (Rodriguez Bertorello et al.), random baseline is 16.6%, SVM baseline is ~30%, and deep ResNet achieves ~56.2% with RMSE of 0.90 items.
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Timeline Trends Chart */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-slate-900">Reconciliation Activity Over Time</h3>
            <p className="text-xs text-slate-500">Daily frequency of completed bin inspections and detected variances</p>
          </div>

          <div className="h-64 w-full">
            {timeline.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="colorMatches" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Area type="monotone" dataKey="scans" name="Total Scans" stroke="#3b82f6" fillOpacity={1} fill="url(#colorScans)" />
                  <Area type="monotone" dataKey="matches" name="Matched (Accurate)" stroke="#10b981" fillOpacity={1} fill="url(#colorMatches)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">No timeline events logged</div>
            )}
          </div>
        </div>

        {/* Discrepancy Magnitude Distribution */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-slate-900">Variance Discrepancy Distribution (Δ)</h3>
            <p className="text-xs text-slate-500">Distribution of discrepancy magnitude across audited bins</p>
          </div>

          <div className="h-64 w-full">
            {variance_distribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={variance_distribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="variance" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <RechartsTooltip 
                    formatter={(val) => [`${val} occurrences`, 'Frequency']}
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  />
                  <Bar dataKey="count" name="Frequency" fill="#ff9900" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">No variance records</div>
            )}
          </div>
        </div>

      </div>

      {/* Understocked vs Overstocked Breakdown */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900 mb-2">Discrepancy Breakdown by Direction</h3>
        <p className="text-xs text-slate-500 mb-4">Ratio between overstocked bins (excess inventory) and understocked bins (shortages)</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mismatchBreakdown}
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  dataKey="value"
                >
                  {mismatchBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
              <span className="font-bold text-emerald-800">Correctly Stocked: {match_count} bins</span>
              <p className="text-emerald-700 mt-0.5">Physical items match database record exactly (Variance = 0).</p>
            </div>
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
              <span className="font-bold text-amber-800">Overstocked: {overstocked_count} bins</span>
              <p className="text-amber-700 mt-0.5">Physical count exceeds database record (Extra items placed into bin).</p>
            </div>
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200">
              <span className="font-bold text-rose-800">Understocked: {understocked_count} bins</span>
              <p className="text-rose-700 mt-0.5">Physical count is less than database record (Items missing or misplaced).</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
