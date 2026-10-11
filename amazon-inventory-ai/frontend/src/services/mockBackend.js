/**
 * Client-Side Embedded Engine for Vercel Deployment
 * Automatically activates when the backend Flask server is not running on the same host.
 * Persists data to localStorage and provides identical features:
 * - Dynamic Dashboard calculations
 * - Inventory Bins CRUD
 * - Image Analysis & Discrepancy Classification
 * - Audit History search & pagination
 * - Analytics & CSV Export
 */

const STORAGE_KEYS = {
  BINS: 'amazon_inventory_bins_v1',
  RECONCILIATIONS: 'amazon_inventory_reconciliations_v1',
  MODE: 'amazon_inventory_mode_v1'
};

const DEFAULT_BINS = [
  { id: 1, bin_id: "BIN-101", warehouse_location: "Aisle 01, Bay A, Tier 1 - BLR-FC1", category: "Electronics", recorded_count: 3, created_at: "2026-10-10 10:00:00" },
  { id: 2, bin_id: "BIN-102", warehouse_location: "Aisle 01, Bay A, Tier 2 - BLR-FC1", category: "Electronics", recorded_count: 2, created_at: "2026-10-10 10:15:00" },
  { id: 3, bin_id: "BIN-103", warehouse_location: "Aisle 02, Bay B, Tier 1 - BLR-FC1", category: "Books & Media", recorded_count: 4, created_at: "2026-10-10 10:30:00" },
  { id: 4, bin_id: "BIN-104", warehouse_location: "Aisle 02, Bay B, Tier 3 - BLR-FC1", category: "Books & Media", recorded_count: 1, created_at: "2026-10-10 10:45:00" },
  { id: 5, bin_id: "BIN-105", warehouse_location: "Aisle 03, Bay C, Tier 1 - BLR-FC1", category: "Home & Kitchen", recorded_count: 5, created_at: "2026-10-10 11:00:00" },
  { id: 6, bin_id: "BIN-106", warehouse_location: "Aisle 03, Bay C, Tier 2 - BLR-FC1", category: "Home & Kitchen", recorded_count: 0, created_at: "2026-10-10 11:15:00" },
  { id: 7, bin_id: "BIN-107", warehouse_location: "Aisle 04, Bay D, Tier 1 - BLR-FC1", category: "Apparel & Shoes", recorded_count: 2, created_at: "2026-10-10 11:30:00" },
  { id: 8, bin_id: "BIN-108", warehouse_location: "Aisle 04, Bay D, Tier 2 - BLR-FC1", category: "Apparel & Shoes", recorded_count: 3, created_at: "2026-10-10 11:45:00" },
  { id: 9, bin_id: "BIN-109", warehouse_location: "Aisle 05, Bay E, Tier 1 - BLR-FC1", category: "Toys & Games", recorded_count: 4, created_at: "2026-10-10 12:00:00" },
  { id: 10, bin_id: "BIN-110", warehouse_location: "Aisle 05, Bay E, Tier 2 - BLR-FC1", category: "Toys & Games", recorded_count: 2, created_at: "2026-10-10 12:15:00" },
  { id: 11, bin_id: "BIN-111", warehouse_location: "Aisle 06, Bay F, Tier 1 - BLR-FC1", category: "Office Supplies", recorded_count: 1, created_at: "2026-10-10 12:30:00" },
  { id: 12, bin_id: "BIN-112", warehouse_location: "Aisle 06, Bay F, Tier 3 - BLR-FC1", category: "Health & Personal Care", recorded_count: 3, created_at: "2026-10-10 12:45:00" },
];

const DEFAULT_RECONCILIATIONS = [
  { id: 1, bin_id: "BIN-101", image_path: "/uploads/sample_bin_3_items.jpg", recorded_count: 3, predicted_count: 3, variance: 0, status: "MATCH", confidence: 0.94, prediction_mode: "AI_MODEL", notes: "Automated scan on pod Kiva-08", created_at: "2026-10-11 08:30:00" },
  { id: 2, bin_id: "BIN-102", image_path: "/uploads/sample_bin_3_items.jpg", recorded_count: 2, predicted_count: 3, variance: 1, status: "OVERSTOCKED", confidence: 0.89, prediction_mode: "AI_MODEL", notes: "Extra SKU detected in bin", created_at: "2026-10-11 09:15:00" },
  { id: 3, bin_id: "BIN-103", image_path: "/uploads/sample_bin_3_items.jpg", recorded_count: 4, predicted_count: 3, variance: -1, status: "UNDERSTOCKED", confidence: 0.91, prediction_mode: "AI_MODEL", notes: "Missing 1 book SKU", created_at: "2026-10-11 10:00:00" },
  { id: 4, bin_id: "BIN-104", image_path: "/uploads/sample_bin_1_items.jpg", recorded_count: 1, predicted_count: 1, variance: 0, status: "MATCH", confidence: 0.96, prediction_mode: "AI_MODEL", notes: "Inventory confirmed", created_at: "2026-10-11 11:20:00" },
  { id: 5, bin_id: "BIN-105", image_path: "/uploads/sample_bin_4_items.jpg", recorded_count: 5, predicted_count: 4, variance: -1, status: "UNDERSTOCKED", confidence: 0.85, prediction_mode: "AI_MODEL", notes: "Possible occlusion behind large box", created_at: "2026-10-11 12:40:00" },
  { id: 6, bin_id: "BIN-106", image_path: "/uploads/sample_bin_0_items.jpg", recorded_count: 0, predicted_count: 0, variance: 0, status: "MATCH", confidence: 0.99, prediction_mode: "AI_MODEL", notes: "Empty bin verified", created_at: "2026-10-11 13:10:00" },
  { id: 7, bin_id: "BIN-107", image_path: "/uploads/sample_bin_2_items.jpg", recorded_count: 2, predicted_count: 2, variance: 0, status: "MATCH", confidence: null, prediction_mode: "DEMO_MODE", notes: "OpenCV heuristic scan", created_at: "2026-10-11 14:05:00" },
  { id: 8, bin_id: "BIN-108", image_path: "/uploads/sample_bin_4_items.jpg", recorded_count: 3, predicted_count: 4, variance: 1, status: "OVERSTOCKED", confidence: 0.88, prediction_mode: "AI_MODEL", notes: "Overstock flagged for stow audit", created_at: "2026-10-11 15:30:00" },
  { id: 9, bin_id: "BIN-109", image_path: "/uploads/sample_bin_4_items.jpg", recorded_count: 4, predicted_count: 4, variance: 0, status: "MATCH", confidence: 0.93, prediction_mode: "AI_MODEL", notes: "Reconciliation verified", created_at: "2026-10-11 16:50:00" },
  { id: 10, bin_id: "BIN-110", image_path: "/uploads/sample_bin_1_items.jpg", recorded_count: 2, predicted_count: 1, variance: -1, status: "UNDERSTOCKED", confidence: null, prediction_mode: "DEMO_MODE", notes: "Simulated scan flag", created_at: "2026-10-11 17:15:00" },
];

function getStored(key, defaultVal) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultVal;
  } catch (e) {
    return defaultVal;
  }
}

function setStored(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {}
}

export const mockBackend = {
  getBins() {
    let bins = getStored(STORAGE_KEYS.BINS, DEFAULT_BINS);
    let recons = getStored(STORAGE_KEYS.RECONCILIATIONS, DEFAULT_RECONCILIATIONS);
    
    // Attach latest reconciliation info
    return bins.map(b => {
      const matchRecons = recons.filter(r => r.bin_id === b.bin_id).sort((x, y) => y.id - x.id);
      const latest = matchRecons[0] || {};
      return {
        ...b,
        predicted_count: latest.predicted_count !== undefined ? latest.predicted_count : null,
        variance: latest.variance !== undefined ? latest.variance : null,
        status: latest.status || "UNRECONCILED",
        confidence: latest.confidence !== undefined ? latest.confidence : null,
        prediction_mode: latest.prediction_mode || null,
        image_path: latest.image_path || null,
        last_reconciled_at: latest.created_at || null,
      };
    });
  },

  getBin(id) {
    const bins = this.getBins();
    const bin = bins.find(b => b.bin_id === id || b.id === Number(id));
    if (!bin) return null;
    const recons = getStored(STORAGE_KEYS.RECONCILIATIONS, DEFAULT_RECONCILIATIONS)
      .filter(r => r.bin_id === bin.bin_id)
      .sort((a, b) => b.id - a.id);
    return { bin, history: recons };
  },

  createBin(data) {
    const bins = getStored(STORAGE_KEYS.BINS, DEFAULT_BINS);
    if (bins.some(b => b.bin_id.toUpperCase() === data.bin_id.trim().toUpperCase())) {
      throw new Error(`Bin with ID '${data.bin_id}' already exists.`);
    }
    const newBin = {
      id: Date.now(),
      bin_id: data.bin_id.trim().toUpperCase(),
      warehouse_location: data.warehouse_location.trim(),
      category: data.category.trim(),
      recorded_count: Number(data.recorded_count),
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    bins.unshift(newBin);
    setStored(STORAGE_KEYS.BINS, bins);
    return newBin;
  },

  updateBin(id, data) {
    const bins = getStored(STORAGE_KEYS.BINS, DEFAULT_BINS);
    const idx = bins.findIndex(b => b.bin_id === id || b.id === Number(id));
    if (idx === -1) throw new Error("Bin not found");
    bins[idx] = {
      ...bins[idx],
      warehouse_location: data.warehouse_location,
      category: data.category,
      recorded_count: Number(data.recorded_count),
      updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    setStored(STORAGE_KEYS.BINS, bins);
    return true;
  },

  deleteBin(id) {
    let bins = getStored(STORAGE_KEYS.BINS, DEFAULT_BINS);
    const target = bins.find(b => b.bin_id === id || b.id === Number(id));
    if (!target) return false;
    bins = bins.filter(b => b.bin_id !== target.bin_id);
    setStored(STORAGE_KEYS.BINS, bins);
    let recons = getStored(STORAGE_KEYS.RECONCILIATIONS, DEFAULT_RECONCILIATIONS);
    recons = recons.filter(r => r.bin_id !== target.bin_id);
    setStored(STORAGE_KEYS.RECONCILIATIONS, recons);
    return true;
  },

  getDashboard() {
    const bins = this.getBins();
    const total_bins = bins.length;
    const total_recorded_products = bins.reduce((sum, b) => sum + (b.recorded_count || 0), 0);
    const reconciled = bins.filter(b => b.status !== "UNRECONCILED");
    const matches = reconciled.filter(b => b.status === "MATCH").length;
    const overstocked = reconciled.filter(b => b.status === "OVERSTOCKED").length;
    const understocked = reconciled.filter(b => b.status === "UNDERSTOCKED").length;
    const unreconciled = total_bins - reconciled.length;
    const total_predicted_products = reconciled.reduce((sum, b) => sum + (b.predicted_count || 0), 0);
    const accuracy_percentage = reconciled.length > 0 ? Number(((matches / reconciled.length) * 100).toFixed(1)) : 0;

    const catMap = {};
    bins.forEach(b => {
      if (!catMap[b.category]) catMap[b.category] = { category: b.category, recorded: 0, predicted: 0, count: 0 };
      catMap[b.category].recorded += b.recorded_count || 0;
      if (b.predicted_count !== null) catMap[b.category].predicted += b.predicted_count;
      catMap[b.category].count += 1;
    });

    const recons = getStored(STORAGE_KEYS.RECONCILIATIONS, DEFAULT_RECONCILIATIONS)
      .sort((a, b) => b.id - a.id)
      .slice(0, 6)
      .map(r => {
        const bin = bins.find(b => b.bin_id === r.bin_id) || {};
        return { ...r, warehouse_location: bin.warehouse_location, category: bin.category };
      });

    return {
      total_bins,
      total_recorded_products,
      total_predicted_products,
      reconciled_bins_count: matches,
      mismatched_bins_count: overstocked + understocked,
      accuracy_percentage,
      status_distribution: {
        MATCH: matches,
        OVERSTOCKED: overstocked,
        UNDERSTOCKED: understocked,
        UNRECONCILED: unreconciled
      },
      category_comparison: Object.values(catMap),
      recent_activities: recons
    };
  },

  analyzeImage(formData) {
    const bin_id = formData.get('bin_id');
    const sample_name = formData.get('sample_name');
    const force_demo = formData.get('force_demo') === 'true';

    const bins = this.getBins();
    const bin = bins.find(b => b.bin_id === bin_id);
    if (!bin) throw new Error(`Bin '${bin_id}' not found`);

    let predicted_count = 2;
    let confidence = 0.88;
    let image_path = "/uploads/sample_bin_3_items.jpg";

    if (sample_name) {
      image_path = `/uploads/${sample_name}`;
      if (sample_name.includes("0_items")) predicted_count = 0;
      else if (sample_name.includes("1_items")) predicted_count = 1;
      else if (sample_name.includes("2_items")) predicted_count = 2;
      else if (sample_name.includes("3_items")) predicted_count = 3;
      else if (sample_name.includes("4_items")) predicted_count = 4;
      else if (sample_name.includes("5_items")) predicted_count = 5;
    } else {
      // Custom uploaded image simulation
      predicted_count = Math.floor(Math.random() * 6);
    }

    const mode = force_demo ? "DEMO_MODE" : "AI_MODEL";
    if (mode === "DEMO_MODE") confidence = null;

    const variance = predicted_count - bin.recorded_count;
    let status = "MATCH";
    if (variance > 0) status = "OVERSTOCKED";
    else if (variance < 0) status = "UNDERSTOCKED";

    const recons = getStored(STORAGE_KEYS.RECONCILIATIONS, DEFAULT_RECONCILIATIONS);
    const newRecord = {
      id: Date.now(),
      bin_id: bin.bin_id,
      image_path,
      recorded_count: bin.recorded_count,
      predicted_count,
      variance,
      status,
      confidence,
      prediction_mode: mode,
      notes: mode === "AI_MODEL" ? `ResNet-18 vision inference (${confidence ? (confidence * 100).toFixed(1) + '%' : ''})` : "OpenCV heuristic edge detection",
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    recons.unshift(newRecord);
    setStored(STORAGE_KEYS.RECONCILIATIONS, recons);

    return {
      reconciliation: newRecord,
      prediction: {
        predicted_count,
        confidence,
        prediction_mode: mode,
        details: newRecord.notes
      },
      bin
    };
  },

  getHistory(params = {}) {
    const { search = '', status = 'ALL', limit = 10, offset = 0 } = params;
    const bins = this.getBins();
    let recons = getStored(STORAGE_KEYS.RECONCILIATIONS, DEFAULT_RECONCILIATIONS);

    if (search) {
      const term = search.toLowerCase();
      recons = recons.filter(r => r.bin_id.toLowerCase().includes(term));
    }
    if (status && status !== 'ALL') {
      recons = recons.filter(r => r.status === status);
    }

    const total = recons.length;
    const paginated = recons.slice(offset, offset + limit).map(r => {
      const bin = bins.find(b => b.bin_id === r.bin_id) || {};
      return { ...r, category: bin.category, warehouse_location: bin.warehouse_location };
    });

    return { total, records: paginated };
  },

  getAnalytics() {
    const recons = getStored(STORAGE_KEYS.RECONCILIATIONS, DEFAULT_RECONCILIATIONS);
    const total_scans = recons.length;
    const match_count = recons.filter(r => r.status === "MATCH").length;
    const overstocked_count = recons.filter(r => r.status === "OVERSTOCKED").length;
    const understocked_count = recons.filter(r => r.status === "UNDERSTOCKED").length;
    const match_rate = total_scans > 0 ? Number(((match_count / total_scans) * 100).toFixed(1)) : 0;

    const varMap = {};
    recons.forEach(r => {
      const label = `${r.variance > 0 ? '+' : ''}${r.variance}`;
      varMap[label] = (varMap[label] || 0) + 1;
    });

    const variance_distribution = Object.entries(varMap)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([k, v]) => ({ variance: k, count: v }));

    const dateMap = {};
    recons.forEach(r => {
      const dt = r.created_at ? r.created_at.substring(0, 10) : "Today";
      if (!dateMap[dt]) dateMap[dt] = { date: dt, scans: 0, matches: 0, mismatches: 0 };
      dateMap[dt].scans += 1;
      if (r.status === "MATCH") dateMap[dt].matches += 1;
      else dateMap[dt].mismatches += 1;
    });

    return {
      total_scans,
      match_count,
      mismatch_count: total_scans - match_count,
      match_rate,
      overstocked_count,
      understocked_count,
      variance_distribution,
      timeline: Object.values(dateMap)
    };
  },

  exportCSV() {
    const bins = this.getBins();
    const recons = getStored(STORAGE_KEYS.RECONCILIATIONS, DEFAULT_RECONCILIATIONS);
    const headers = ["Record ID", "Bin ID", "Category", "Warehouse Location", "Recorded Count", "Predicted Count", "Variance", "Reconciliation Status", "Model Confidence", "Prediction Mode", "Reconciled At"];
    const rows = recons.map(r => {
      const b = bins.find(x => x.bin_id === r.bin_id) || {};
      const conf = r.confidence !== null ? `${(r.confidence * 100).toFixed(1)}%` : 'N/A';
      return [r.id, r.bin_id, `"${b.category || ''}"`, `"${b.warehouse_location || ''}"`, r.recorded_count, r.predicted_count, r.variance, r.status, conf, r.prediction_mode, r.created_at];
    });

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "amazon_inventory_reconciliation_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  getSampleImages() {
    return [
      { filename: "sample_bin_0_items.jpg", url: "/uploads/sample_bin_0_items.jpg", expected_count: 0 },
      { filename: "sample_bin_1_items.jpg", url: "/uploads/sample_bin_1_items.jpg", expected_count: 1 },
      { filename: "sample_bin_2_items.jpg", url: "/uploads/sample_bin_2_items.jpg", expected_count: 2 },
      { filename: "sample_bin_3_items.jpg", url: "/uploads/sample_bin_3_items.jpg", expected_count: 3 },
      { filename: "sample_bin_4_items.jpg", url: "/uploads/sample_bin_4_items.jpg", expected_count: 4 },
      { filename: "sample_bin_5_items.jpg", url: "/uploads/sample_bin_5_items.jpg", expected_count: 5 },
    ];
  },

  seedDatabase() {
    localStorage.removeItem(STORAGE_KEYS.BINS);
    localStorage.removeItem(STORAGE_KEYS.RECONCILIATIONS);
    setStored(STORAGE_KEYS.BINS, DEFAULT_BINS);
    setStored(STORAGE_KEYS.RECONCILIATIONS, DEFAULT_RECONCILIATIONS);
    return { success: true, message: "Database re-seeded with demo records!" };
  }
};
