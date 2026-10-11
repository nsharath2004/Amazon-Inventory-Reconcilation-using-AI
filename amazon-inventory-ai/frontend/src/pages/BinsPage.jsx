import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  ScanSearch, 
  Pencil, 
  Trash2, 
  Eye, 
  Boxes, 
  AlertCircle, 
  CheckCircle2, 
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import ModeBadge from '../components/ModeBadge';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

const CATEGORIES = [
  "Electronics",
  "Books & Media",
  "Home & Kitchen",
  "Apparel & Shoes",
  "Toys & Games",
  "Office Supplies",
  "Health & Personal Care"
];

export default function BinsPage({ onAnalyzeBin }) {
  const [bins, setBins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Active bin selection
  const [selectedBin, setSelectedBin] = useState(null);
  const [binDetailsData, setBinDetailsData] = useState(null);
  const [formData, setFormData] = useState({
    bin_id: '',
    warehouse_location: '',
    category: 'Electronics',
    recorded_count: 2
  });
  const [formError, setFormError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchBins = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getBins({
        search,
        status: statusFilter,
        category: categoryFilter
      });
      if (res.success) {
        setBins(res.data);
      } else {
        setError(res.error || 'Failed to fetch inventory bins');
      }
    } catch (err) {
      setError(err.message || 'Error communicating with backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBins();
  }, [search, statusFilter, categoryFilter]);

  // Handle Add Bin
  const handleOpenAdd = () => {
    setFormData({
      bin_id: `BIN-${Math.floor(100 + Math.random() * 900)}`,
      warehouse_location: 'Aisle 01, Bay A, Tier 1 - BLR-FC1',
      category: 'Electronics',
      recorded_count: 2
    });
    setFormError('');
    setIsAddOpen(true);
  };

  const handleSaveAdd = async (e) => {
    e.preventDefault();
    setFormError('');
    setActionLoading(true);
    try {
      const res = await api.createBin(formData);
      if (res.success) {
        setIsAddOpen(false);
        fetchBins();
      } else {
        setFormError(res.error || 'Failed to create bin');
      }
    } catch (err) {
      setFormError(err.response?.data?.error || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Edit Bin
  const handleOpenEdit = (bin) => {
    setSelectedBin(bin);
    setFormData({
      bin_id: bin.bin_id,
      warehouse_location: bin.warehouse_location,
      category: bin.category,
      recorded_count: bin.recorded_count
    });
    setFormError('');
    setIsEditOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setFormError('');
    setActionLoading(true);
    try {
      const res = await api.updateBin(selectedBin.bin_id, formData);
      if (res.success) {
        setIsEditOpen(false);
        fetchBins();
      } else {
        setFormError(res.error || 'Failed to update bin');
      }
    } catch (err) {
      setFormError(err.response?.data?.error || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Delete Bin
  const handleOpenDelete = (bin) => {
    setSelectedBin(bin);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedBin) return;
    setActionLoading(true);
    try {
      await api.deleteBin(selectedBin.bin_id);
      setIsDeleteOpen(false);
      fetchBins();
    } catch (err) {
      alert('Failed to delete bin: ' + (err.response?.data?.error || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  // Handle View Details
  const handleOpenDetails = async (bin) => {
    setSelectedBin(bin);
    setIsDetailsOpen(true);
    try {
      const res = await api.getBin(bin.bin_id);
      if (res.success) {
        setBinDetailsData(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Inventory Bins Management</h1>
          <p className="text-sm text-slate-500">
            Registered Kiva pod bins, expected inventory counts, and automated audit status.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-amazon-orange text-amazon-dark font-semibold text-sm rounded-lg hover:bg-amber-400 shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Bin</span>
        </button>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Bin ID, Location, Category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amazon-orange/50 focus:border-amazon-orange"
          />
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {['ALL', 'MATCH', 'OVERSTOCKED', 'UNDERSTOCKED', 'UNRECONCILED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
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

        {/* Category Dropdown */}
        <div className="w-full md:w-48">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amazon-orange/50"
          >
            <option value="ALL">All Categories</option>
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

      </div>

      {/* Bins Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Bin ID</th>
                <th className="px-5 py-3.5">Warehouse Location</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5 text-center">Recorded</th>
                <th className="px-5 py-3.5 text-center">AI Count</th>
                <th className="px-5 py-3.5 text-center">Variance</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Last Reconciled</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-5 py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-amazon-orange border-t-transparent rounded-full animate-spin" />
                      <span>Loading bins...</span>
                    </div>
                  </td>
                </tr>
              ) : bins.length > 0 ? (
                bins.map((bin) => (
                  <tr key={bin.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-3.5 font-bold text-slate-900 whitespace-nowrap">
                      {bin.bin_id}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600 max-w-xs truncate" title={bin.warehouse_location}>
                      {bin.warehouse_location}
                    </td>
                    <td className="px-5 py-3.5 text-xs font-medium text-slate-600 whitespace-nowrap">
                      {bin.category}
                    </td>
                    <td className="px-5 py-3.5 text-center font-bold text-slate-800">
                      {bin.recorded_count}
                    </td>
                    <td className="px-5 py-3.5 text-center font-semibold text-slate-900">
                      {bin.predicted_count !== null ? bin.predicted_count : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {bin.variance !== null ? (
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                          bin.variance === 0 
                            ? 'bg-slate-100 text-slate-600'
                            : bin.variance > 0 
                            ? 'bg-amber-100 text-amber-800' 
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {bin.variance > 0 ? `+${bin.variance}` : bin.variance}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <StatusBadge status={bin.status} size="sm" />
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-400 whitespace-nowrap">
                      {bin.last_reconciled_at ? bin.last_reconciled_at.replace('T', ' ').substring(0, 16) : 'Not audited'}
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onAnalyzeBin(bin)}
                          className="p-1.5 rounded-lg text-amazon-dark bg-amazon-orange hover:bg-amber-400 transition"
                          title="Scan this bin with AI"
                        >
                          <ScanSearch className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenDetails(bin)}
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition"
                          title="View Bin Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(bin)}
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition"
                          title="Edit Bin"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(bin)}
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition"
                          title="Delete Bin"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="px-5 py-12 text-center text-slate-400">
                    No bins found matching your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add Bin */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Register New Inventory Bin">
        <form onSubmit={handleSaveAdd} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs border border-rose-200">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Bin ID (Unique Identifier)</label>
            <input
              type="text"
              required
              value={formData.bin_id}
              onChange={(e) => setFormData({ ...formData, bin_id: e.target.value })}
              placeholder="e.g. BIN-205"
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm uppercase focus:ring-2 focus:ring-amazon-orange/50 focus:border-amazon-orange"
            />
            <p className="text-[11px] text-slate-400 mt-1">Unique barcode identifier on the physical storage pod.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Warehouse Location</label>
            <input
              type="text"
              required
              value={formData.warehouse_location}
              onChange={(e) => setFormData({ ...formData, warehouse_location: e.target.value })}
              placeholder="e.g. Aisle 04, Bay B, Tier 2 - BLR-FC1"
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amazon-orange/50 focus:border-amazon-orange"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-amazon-orange/50"
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Expected Product Count</label>
              <input
                type="number"
                min="0"
                max="50"
                required
                value={formData.recorded_count}
                onChange={(e) => setFormData({ ...formData, recorded_count: parseInt(e.target.value) || 0 })}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amazon-orange/50"
              />
              <p className="text-[11px] text-slate-400 mt-1">Count currently in inventory database.</p>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-2 text-sm font-semibold text-amazon-dark bg-amazon-orange hover:bg-amber-400 rounded-lg shadow-sm transition flex items-center gap-2"
            >
              {actionLoading && <div className="w-4 h-4 border-2 border-slate-800 border-t-transparent rounded-full animate-spin" />}
              <span>Save Bin</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Bin */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title={`Edit Inventory Bin: ${selectedBin?.bin_id}`}>
        <form onSubmit={handleSaveEdit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs border border-rose-200">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Warehouse Location</label>
            <input
              type="text"
              required
              value={formData.warehouse_location}
              onChange={(e) => setFormData({ ...formData, warehouse_location: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amazon-orange/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-amazon-orange/50"
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Expected Product Count</label>
              <input
                type="number"
                min="0"
                max="50"
                required
                value={formData.recorded_count}
                onChange={(e) => setFormData({ ...formData, recorded_count: parseInt(e.target.value) || 0 })}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amazon-orange/50"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-2 text-sm font-semibold text-amazon-dark bg-amazon-orange hover:bg-amber-400 rounded-lg shadow-sm transition flex items-center gap-2"
            >
              {actionLoading && <div className="w-4 h-4 border-2 border-slate-800 border-t-transparent rounded-full animate-spin" />}
              <span>Update Bin</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: View Details */}
      <Modal isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} title={`Bin Details & Audit Trail: ${selectedBin?.bin_id}`}>
        {selectedBin && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <p className="text-slate-400 font-medium">Bin ID</p>
                <p className="text-sm font-bold text-slate-800">{selectedBin.bin_id}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Category</p>
                <p className="text-sm font-semibold text-slate-800">{selectedBin.category}</p>
              </div>
              <div className="col-span-2">
                <p className="text-slate-400 font-medium">Location</p>
                <p className="text-sm text-slate-700 font-mono">{selectedBin.warehouse_location}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Expected ERP Count</p>
                <p className="text-base font-bold text-slate-900">{selectedBin.recorded_count} items</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Current Status</p>
                <div className="mt-1">
                  <StatusBadge status={selectedBin.status} size="sm" />
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Audit History for this Bin</h4>
              {binDetailsData?.history?.length > 0 ? (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {binDetailsData.history.map((h) => (
                    <div key={h.id} className="p-3 rounded-lg border border-slate-200 bg-white flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={h.status} size="sm" />
                          <span className="font-semibold text-slate-700">Predicted: {h.predicted_count} (Exp: {h.recorded_count})</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">{h.created_at}</p>
                      </div>
                      <ModeBadge mode={h.prediction_mode} size="sm" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No past reconciliation scans recorded for this bin.</p>
              )}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsDetailsOpen(false);
                  onAnalyzeBin(selectedBin);
                }}
                className="px-3.5 py-2 bg-amazon-orange text-amazon-dark text-xs font-bold rounded-lg hover:bg-amber-400 transition flex items-center gap-1.5"
              >
                <ScanSearch className="w-3.5 h-3.5" />
                <span>Perform New Scan on this Bin</span>
              </button>
              <button
                type="button"
                onClick={() => setIsDetailsOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Inventory Bin"
        message={`Are you sure you want to delete ${selectedBin?.bin_id}? All associated reconciliation scan records will also be removed. This action cannot be undone.`}
        confirmText="Delete Bin"
        loading={actionLoading}
      />

    </div>
  );
}
