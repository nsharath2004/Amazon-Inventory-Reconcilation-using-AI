import React, { useState, useEffect, useRef } from 'react';
import { 
  ScanSearch, 
  UploadCloud, 
  Image as ImageIcon, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Cpu, 
  Sparkles, 
  RefreshCw, 
  ArrowRight,
  Info,
  Layers,
  Clock,
  Check
} from 'lucide-react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import ModeBadge from '../components/ModeBadge';

export default function AnalyzePage({ preselectedBin, onNavigateToHistory, onNavigateToBins }) {
  const [bins, setBins] = useState([]);
  const [selectedBinId, setSelectedBinId] = useState('');
  const [selectedBin, setSelectedBin] = useState(null);

  // File upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isSample, setIsSample] = useState(false);
  const [sampleFileName, setSampleFileName] = useState('');

  // Sample preloaded images
  const [sampleImages, setSampleImages] = useState([]);
  
  // Inference options
  const [forceDemo, setForceDemo] = useState(false);
  
  // Analysis running & results
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);

  // Fetch bins on mount
  useEffect(() => {
    const loadBinsAndSamples = async () => {
      try {
        const [binsRes, samplesRes] = await Promise.all([
          api.getBins(),
          api.getSampleImages()
        ]);
        if (binsRes.success) {
          setBins(binsRes.data);
          if (preselectedBin) {
            setSelectedBinId(preselectedBin.bin_id);
            setSelectedBin(preselectedBin);
          } else if (binsRes.data.length > 0) {
            setSelectedBinId(binsRes.data[0].bin_id);
            setSelectedBin(binsRes.data[0]);
          }
        }
        if (samplesRes.success) {
          setSampleImages(samplesRes.data);
        }
      } catch (err) {
        console.error('Error initializing analyze page:', err);
      }
    };
    loadBinsAndSamples();
  }, [preselectedBin]);

  // Sync selected bin details
  useEffect(() => {
    if (selectedBinId) {
      const found = bins.find(b => b.bin_id === selectedBinId);
      setSelectedBin(found || null);
    }
  }, [selectedBinId, bins]);

  // File drop/upload handlers
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setIsSample(false);
      setSampleFileName('');
      setAnalysisResult(null);
      setError(null);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSelectSample = (sample) => {
    setSelectedFile(null);
    setIsSample(true);
    setSampleFileName(sample.filename);
    setPreviewUrl(sample.url);
    setAnalysisResult(null);
    setError(null);
  };

  // Perform AI Image Analysis
  const handleAnalyze = async () => {
    if (!selectedBinId) {
      setError('Please select an inventory bin to reconcile.');
      return;
    }
    if (!selectedFile && !isSample) {
      setError('Please upload a warehouse bin photo or select one of the benchmark sample images.');
      return;
    }

    setAnalyzing(true);
    setError(null);

    const formData = new FormData();
    formData.append('bin_id', selectedBinId);
    if (forceDemo) {
      formData.append('force_demo', 'true');
    }

    if (selectedFile) {
      formData.append('image', selectedFile);
    } else if (isSample) {
      formData.append('sample_name', sampleFileName);
    }

    try {
      const res = await api.analyzeImage(formData);
      if (res.success) {
        setAnalysisResult(res.data);
      } else {
        setError(res.error || 'Failed to complete image analysis');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Server error during inference');
    } finally {
      setAnalyzing(false);
    }
  };

  const currentRecon = analysisResult?.reconciliation;
  const currentPred = analysisResult?.prediction;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">AI-Powered Bin Image Analysis</h1>
        <p className="text-sm text-slate-500">
          Upload a high-resolution photo of an Amazon Kiva storage bin to detect products, classify quantities (0–5), and automatically compute inventory reconciliation variance.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Input Form & Upload (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Step 1: Target Bin Selection */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amazon-dark text-white text-xs font-bold flex items-center justify-center">1</span>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Select Target Inventory Bin</h2>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Registered Bin</label>
              <select
                value={selectedBinId}
                onChange={(e) => setSelectedBinId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amazon-orange/50"
              >
                {bins.map(b => (
                  <option key={b.bin_id} value={b.bin_id}>
                    {b.bin_id} — {b.category} (Expected: {b.recorded_count} items)
                  </option>
                ))}
              </select>
            </div>

            {selectedBin && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Warehouse Location:</span>
                  <span className="font-medium text-slate-800 truncate max-w-[200px]">{selectedBin.warehouse_location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Category:</span>
                  <span className="font-semibold text-slate-700">{selectedBin.category}</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                  <span className="text-slate-500">Recorded ERP Inventory:</span>
                  <span className="text-sm font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {selectedBin.recorded_count} items
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Upload or Select Image */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amazon-dark text-white text-xs font-bold flex items-center justify-center">2</span>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Upload Bin Photo</h2>
            </div>

            {/* Drag & drop upload area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-amazon-orange rounded-xl p-6 text-center cursor-pointer transition bg-slate-50/50 hover:bg-amber-50/20 group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/jpg"
                onChange={handleFileChange}
                className="hidden"
              />
              <UploadCloud className="w-10 h-10 mx-auto text-slate-400 group-hover:text-amazon-orange transition mb-2" />
              <p className="text-sm font-semibold text-slate-700">Click to upload bin photo</p>
              <p className="text-xs text-slate-400 mt-1">Supports JPG, JPEG, PNG (Max 16MB)</p>
            </div>

            {/* Quick Benchmark Samples */}
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amazon-orange" />
                <span>Or select a test benchmark image:</span>
              </p>
              <div className="grid grid-cols-3 gap-2">
                {sampleImages.map((s, idx) => {
                  const isSelected = isSample && sampleFileName === s.filename;
                  return (
                    <button
                      key={s.filename}
                      type="button"
                      onClick={() => handleSelectSample(s)}
                      className={`p-2 rounded-lg border text-left transition flex flex-col items-center gap-1.5 ${
                        isSelected 
                          ? 'border-amazon-orange bg-amber-50/80 ring-2 ring-amazon-orange/30' 
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <img 
                        src={s.url} 
                        alt={s.filename} 
                        className="w-12 h-12 object-cover rounded shadow-inner"
                      />
                      <span className="text-[11px] font-bold text-slate-700">
                        {s.expected_count !== null ? `${s.expected_count} Items` : `Sample ${idx + 1}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Force demo checkbox */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                <input
                  type="checkbox"
                  checked={forceDemo}
                  onChange={(e) => setForceDemo(e.target.checked)}
                  className="rounded border-slate-300 text-amazon-orange focus:ring-amazon-orange"
                />
                <span>Force Demo Simulation Mode</span>
              </label>
              <span className="text-[11px] text-slate-400">OpenCV Heuristic</span>
            </div>

            {/* Submit Analyze Button */}
            <button
              onClick={handleAnalyze}
              disabled={analyzing || (!selectedFile && !isSample)}
              className={`w-full py-3 px-4 rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2 ${
                analyzing || (!selectedFile && !isSample)
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-amazon-orange text-amazon-dark hover:bg-amber-400'
              }`}
            >
              {analyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                  <span>Processing Computer Vision Model...</span>
                </>
              ) : (
                <>
                  <ScanSearch className="w-4 h-4" />
                  <span>Analyze Inventory & Reconcile</span>
                </>
              )}
            </button>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

          </div>

        </div>

        {/* Right Column: Image Preview & Analysis Results (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Image Preview Window */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-slate-500" />
                <span>Bin Image Preview (224 × 224 PyTorch Input)</span>
              </h2>
              {previewUrl && (
                <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                  {isSample ? sampleFileName : selectedFile?.name}
                </span>
              )}
            </div>

            <div className="relative w-full h-72 bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center border border-slate-800">
              {previewUrl ? (
                <>
                  <img
                    src={previewUrl}
                    alt="Bin Preview"
                    className="max-h-full max-w-full object-contain"
                  />
                  
                  {/* Laser Scan Animation Effect during inference */}
                  {analyzing && (
                    <div className="absolute inset-0 bg-emerald-500/10 pointer-events-none">
                      <div className="w-full h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10b981] animate-scan" />
                      <div className="absolute bottom-4 left-4 bg-slate-900/90 text-emerald-400 px-3 py-1.5 rounded-lg text-xs font-mono border border-emerald-500/40 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Running ResNet Feature Extractor...</span>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center text-slate-500 p-6">
                  <ImageIcon className="w-12 h-12 mx-auto mb-2 text-slate-600" />
                  <p className="text-sm font-medium">No bin photo selected</p>
                  <p className="text-xs text-slate-600 mt-1">Upload a photo or select a test image on the left</p>
                </div>
              )}
            </div>
          </div>

          {/* Analysis Results Display */}
          {currentRecon ? (
            <div className="bg-white p-6 rounded-xl border-2 border-slate-200 shadow-lg space-y-5 animate-in fade-in duration-300">
              
              {/* Result Title & Status */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Reconciliation Result</span>
                    <ModeBadge mode={currentRecon.prediction_mode} size="sm" />
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">
                    Bin {currentRecon.bin_id} Audit Report
                  </h3>
                </div>
                <div>
                  <StatusBadge status={currentRecon.status} size="lg" />
                </div>
              </div>

              {/* Three Metric Cards: Recorded vs Predicted vs Variance */}
              <div className="grid grid-cols-3 gap-4">
                
                {/* Recorded */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                    Recorded (ERP)
                  </span>
                  <span className="text-3xl font-black text-slate-800">
                    {currentRecon.recorded_count}
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-1">Expected count</span>
                </div>

                {/* AI Predicted */}
                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-center">
                  <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider block mb-1">
                    AI Predicted
                  </span>
                  <span className="text-3xl font-black text-amber-900">
                    {currentRecon.predicted_count}
                  </span>
                  <span className="text-[11px] text-amber-700/80 block mt-1">Vision inference</span>
                </div>

                {/* Variance */}
                <div className={`p-4 rounded-xl border text-center ${
                  currentRecon.variance === 0 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : currentRecon.variance > 0
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}>
                  <span className="text-xs font-semibold uppercase tracking-wider block mb-1">
                    Variance (Δ)
                  </span>
                  <span className="text-3xl font-black">
                    {currentRecon.variance > 0 ? `+${currentRecon.variance}` : currentRecon.variance}
                  </span>
                  <span className="text-[11px] block mt-1 font-semibold">
                    {currentRecon.variance === 0 ? 'Exact Match' : currentRecon.variance > 0 ? 'Overstocked' : 'Understocked'}
                  </span>
                </div>

              </div>

              {/* Confidence & Model Explanation */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                {currentRecon.confidence !== null ? (
                  <div>
                    <div className="flex justify-between items-center font-medium text-slate-700 mb-1">
                      <span>Model Classification Confidence:</span>
                      <strong className="text-slate-900 text-sm">{(currentRecon.confidence * 100).toFixed(1)}%</strong>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                        style={{ width: `${Math.min(100, currentRecon.confidence * 100)}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 rounded bg-amber-100/60 text-amber-900 text-xs flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Demo mode prediction generated via OpenCV contour analysis (no simulated confidence fabricated).</span>
                  </div>
                )}

                <p className="text-slate-600 leading-relaxed">
                  <strong>Reconciliation Logic:</strong> <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-[11px]">Variance = AI Predicted ({currentRecon.predicted_count}) - Recorded ({currentRecon.recorded_count}) = {currentRecon.variance}</code>.
                  {currentRecon.variance === 0 && ' Inventory matches physical reality. No manual audit necessary.'}
                  {currentRecon.variance > 0 && ` Bin contains ${currentRecon.variance} excess item(s). Flagged for stow inspection.`}
                  {currentRecon.variance < 0 && ` Bin is missing ${Math.abs(currentRecon.variance)} item(s). Flagged for pick error investigation.`}
                </p>

                <div className="flex items-center gap-2 text-slate-400 text-[11px] pt-2 border-t border-slate-200">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Logged in SQLite Database: {currentRecon.timestamp || 'Just now'}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setAnalysisResult(null);
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Clear & Scan Another Bin
                </button>
                <button
                  type="button"
                  onClick={onNavigateToHistory}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition flex items-center gap-1.5"
                >
                  <span>View All in Audit History</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          ) : (
            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                <ScanSearch className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-800">Awaiting Image Analysis</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Select an inventory bin on the left, pick a bin photograph or sample image, and click "Analyze Inventory & Reconcile" to run the PyTorch computer vision classification model.
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
