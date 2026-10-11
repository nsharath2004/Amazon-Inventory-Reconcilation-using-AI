import React, { useState, useEffect } from 'react';
import { 
  History as HistoryIcon, 
  Search, 
  Filter, 
  FileSpreadsheet, 
  Eye, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronLeft, 
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import ModeBadge from '../components/ModeBadge';
import Modal from '../components/Modal';

export default function HistoryPage() {
  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(0);
  const limit = 10;

  // Selected detail modal
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getHistory({
        search,
        status: statusFilter,
        limit,
        offset: page * limit
      });
      if (res.success) {
        setRecords(res.data.records);
        setTotal(res.data.total);
      } else {
        setError(res.error || 'Failed to fetch reconciliation history');
      }
    } catch (err) {
      setError(err.message || 'Error communicating with backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [search, statusFilter, page]);

  const totalPages = Math.ceil(total / limit);

  const handleOpenDetail = (rec) => {
    setSelectedRecord(rec);
    setIsDetailOpen(true);
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Reconciliation Audit History</h1>
          <p className="text-sm text-slate-500">
            Archival log of all computer vision inspections, discrepancy records, and inventory adjustments.
          </p>
        </div>
        <button
          onClick={() => api.exportClientCSV()}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-300 text-slate-700 font-semibold text-sm rounded-lg hover:bg-slate-50 shadow-sm transition self-start sm:self-auto"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>Export Full History (CSV)</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Bin ID, Location, Category..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amazon-orange/50 focus:border-amazon-orange"
          />
        </div>

        {/* Status Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {['ALL', 'MATCH', 'OVERSTOCKED', 'UNDERSTOCKED'].map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setPage(0);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                statusFilter === st
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

      </div>

      {/* History Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Image</th>
                <th className="px-5 py-3.5">Bin ID</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5 text-center">Recorded</th>
                <th className="px-5 py-3.5 text-center">AI Count</th>
                <th className="px-5 py-3.5 text-center">Variance</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Mode</th>
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="10" className="px-5 py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-amazon-orange border-t-transparent rounded-full animate-spin" />
                      <span>Loading reconciliation logs...</span>
                    </div>
                  </td>
                </tr>
              ) : records.length > 0 ? (
                records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div 
                        onClick={() => handleOpenDetail(rec)}
                        className="w-11 h-11 rounded-lg overflow-hidden border border-slate-200 cursor-pointer hover:opacity-80 transition bg-slate-100 shadow-inner"
                      >
                        <img 
                          src={rec.image_path} 
                          alt={rec.bin_id} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%2394a3b8%22 stroke-width=%222%22><rect width=%2218%22 height=%2218%22 x=%223%22 y=%223%22 rx=%222%22/></svg>';
                          }}
                        />
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900 whitespace-nowrap">
                      {rec.bin_id}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600 whitespace-nowrap">
                      {rec.category || 'General'}
                    </td>
                    <td className="px-5 py-3.5 text-center font-bold text-slate-800">
                      {rec.recorded_count}
                    </td>
                    <td className="px-5 py-3.5 text-center font-bold text-slate-900">
                      {rec.predicted_count}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                        rec.variance === 0 
                          ? 'bg-slate-100 text-slate-600'
                          : rec.variance > 0 
                          ? 'bg-amber-100 text-amber-800' 
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {rec.variance > 0 ? `+${rec.variance}` : rec.variance}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <StatusBadge status={rec.status} size="sm" />
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <ModeBadge mode={rec.prediction_mode} size="sm" />
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-400 whitespace-nowrap">
                      {rec.created_at ? rec.created_at.replace('T', ' ').substring(0, 16) : 'N/A'}
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleOpenDetail(rec)}
                        className="px-2.5 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition text-xs font-semibold flex items-center gap-1 ml-auto"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="px-5 py-12 text-center text-slate-400">
                    No reconciliation history found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <strong>{records.length > 0 ? page * limit + 1 : 0}</strong> to <strong>{Math.min(total, (page + 1) * limit)}</strong> of <strong>{total}</strong> audit records
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className={`p-1.5 rounded-lg border ${
                page === 0 ? 'border-slate-200 text-slate-300 cursor-not-allowed' : 'border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium">Page {totalPages > 0 ? page + 1 : 1} of {totalPages || 1}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className={`p-1.5 rounded-lg border ${
                page >= totalPages - 1 ? 'border-slate-200 text-slate-300 cursor-not-allowed' : 'border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Record Details Modal */}
      <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title={`Audit Inspection Record #${selectedRecord?.id}`}>
        {selectedRecord && (
          <div className="space-y-4">
            {/* Image Preview */}
            <div className="w-full h-64 bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center border border-slate-800">
              <img 
                src={selectedRecord.image_path} 
                alt={selectedRecord.bin_id} 
                className="max-h-full max-w-full object-contain"
              />
            </div>

            {/* Reconciliation Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-center text-xs">
              <div>
                <p className="text-slate-400 font-medium">Bin ID</p>
                <p className="text-sm font-bold text-slate-900">{selectedRecord.bin_id}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Recorded (ERP)</p>
                <p className="text-sm font-bold text-slate-900">{selectedRecord.recorded_count} items</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">AI Predicted</p>
                <p className="text-sm font-bold text-slate-900">{selectedRecord.predicted_count} items</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Variance</p>
                <p className={`text-sm font-bold ${
                  selectedRecord.variance === 0 ? 'text-slate-700' : selectedRecord.variance > 0 ? 'text-amber-600' : 'text-rose-600'
                }`}>
                  {selectedRecord.variance > 0 ? `+${selectedRecord.variance}` : selectedRecord.variance}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">Status:</span>
                <StatusBadge status={selectedRecord.status} size="sm" />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">Engine:</span>
                <ModeBadge mode={selectedRecord.prediction_mode} size="sm" />
              </div>
            </div>

            {selectedRecord.confidence !== null && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
                <div className="flex justify-between font-semibold mb-1">
                  <span>Model Confidence:</span>
                  <span>{(selectedRecord.confidence * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full h-1.5 bg-emerald-200 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${selectedRecord.confidence * 100}%` }} />
                </div>
              </div>
            )}

            {selectedRecord.notes && (
              <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <strong>Analysis Notes:</strong> {selectedRecord.notes}
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsDetailOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition"
              >
                Close Record
              </button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
