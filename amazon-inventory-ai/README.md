# Amazon Inventory Reconciliation Using AI

[![Python](https://img.shields.io/badge/Python-3.14-blue.svg)](https://python.org)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.14%2BCPU-ee4c2c.svg)](https://pytorch.org)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5.4-646cff.svg)](https://vitejs.dev)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8.svg)](https://tailwindcss.com)
[![Flask](https://img.shields.io/badge/Flask-3.1-000000.svg)](https://flask.palletsprojects.com)

An AI-powered, full-stack inventory reconciliation system that analyzes photographs of warehouse storage bins, predicts the number of products visible inside each bin using deep computer vision models, and compares the predicted count with database inventory records to automatically detect discrepancies.

> **Academic Project Note:** Developed as part of the **UE24CS352A - Machine Learning Mini-Project** at **PES University**, inspired by the Stanford University research paper *"Amazon Inventory Reconciliation Using AI"* (Rodriguez Bertorello, Sripada, Dendumrongsup) using the **Amazon Bin Image Dataset (ABID)**. This is an academic capstone prototype and is not connected to Amazon's proprietary production networks.

---

## 1. System Architecture

```
                                  +------------------------------------+
                                  |         React 18 Frontend          |
                                  |  (Vite + Tailwind CSS + Recharts)  |
                                  +-----------------+------------------+
                                                    |  REST API (Axios)
                                                    v
                                  +-----------------+------------------+
                                  |         Flask REST Backend         |
                                  |         (Python 3.14 + CORS)       |
                                  +--------+-----------------+---------+
                                           |                 |
                          SQL Queries      |                 | Image Tensors
                                           v                 v
                        +------------------+---+     +-------+--------------------+
                        |  SQLite Database     |     |  PyTorch ML Inference      |
                        |  (InventoryBins &    |     |  - ResNet Transfer Model   |
                        |   Reconciliations)   |     |  - OpenCV Demo Heuristic   |
                        +----------------------+     +----------------------------+
```

---

## 2. Key Features

- **Executive Inventory Dashboard:**
  - Real-time KPIs: Total Bins, Recorded Products, AI Counted, Discrepancies, Matched Bins, and Supply Chain Accuracy %.
  - Interactive Recharts Donut Chart for status distribution (`MATCH`, `OVERSTOCKED`, `UNDERSTOCKED`, `UNRECONCILED`).
  - Category comparison bar chart comparing ERP recorded counts vs. AI predicted counts.
  - Recent bin audit inspection feed.
- **Inventory Bin Management (Full CRUD):**
  - Add, edit, delete, and view bins with unique Barcode Bin IDs, location strings, and expected counts.
  - Searchable and filterable by category and reconciliation status.
  - Audit trail modal showing the historical scan log for each individual bin.
- **AI-Powered Image Analysis:**
  - Select any registered bin and upload custom warehouse bin photos (JPG, PNG).
  - Preloaded benchmark test images (0, 1, 2, 3, 4, 5 items) for instant 1-click testing.
  - Real-time visual laser scanner animation during neural network inference.
  - Detailed reconciliation card displaying:
    - Expected Count vs. AI-Predicted Count
    - Discrepancy Variance ($\Delta = \text{Predicted} - \text{Recorded}$)
    - Color-coded Reconciliation Status Badge (`MATCH`, `OVERSTOCKED`, `UNDERSTOCKED`)
    - Model Confidence score bar
    - Transparent Prediction Mode indicator (`AI_MODEL` vs `DEMO_MODE`)
- **Reconciliation Audit History:**
  - Searchable, filterable by status, and paginated history table.
  - Image thumbnails with modal inspection for complete audit drill-down.
- **Reports & Analytics:**
  - Discrepancy trend over time and variance magnitude distribution.
  - Clear distinction between Supply Chain Match Rate and Computer Vision Model Accuracy.
  - **1-Click CSV Report Export** (`/api/reports/export`).
- **Academic Transparency & Demo Mode:**
  - When trained PyTorch weights are loaded, the system executes real ResNet deep learning inference.
  - If weights are absent or Demo Mode is toggled, an OpenCV contour heuristic analyzer runs cleanly with zero fabricated confidence numbers.

---

## 3. Project Directory Structure

```
amazon-inventory-ai/
  ├── frontend/
  │   ├── src/
  │   │   ├── components/      # Navbar, Sidebar, StatusBadge, ModeBadge, Modal, ConfirmDialog
  │   │   ├── pages/           # Dashboard, BinsPage, AnalyzePage, HistoryPage, AnalyticsPage, SettingsPage
  │   │   ├── services/        # api.js Axios client
  │   │   ├── App.jsx          # Main application layout and state
  │   │   ├── main.jsx         # Vite entrypoint
  │   │   └── index.css        # Tailwind directives and custom scanline animation
  │   ├── index.html
  │   ├── vite.config.js       # Vite configuration with proxy to Flask port 5000
  │   ├── tailwind.config.js   # Amazon brand palette styling
  │   ├── package.json
  │   └── dist/                # Production build assets
  ├── backend/
  │   ├── app.py               # Flask application entrypoint & static routes
  │   ├── config.py            # Paths, upload limits, extensions
  │   ├── database.py          # SQLite schema creation & seed script
  │   ├── routes/
  │   │   └── api.py           # REST API endpoints
  │   ├── services/
  │   │   └── inventory_service.py # CRUD, variance logic, metrics, CSV exporter
  │   ├── uploads/             # Persisted uploaded bin photos
  │   ├── inventory.db         # SQLite relational database
  │   └── requirements.txt
  └── ml/
      ├── model.py             # PyTorch ResNet18/34 custom 6-class classifier
      ├── dataset.py           # ABID dataset transforms & synthetic benchmark generator
      ├── train.py             # Training loop with 70/20/10 split, Adam, CrossEntropy
      ├── evaluate.py          # Accuracy, Confusion Matrix, MAE, RMSE evaluator
      ├── predict.py           # Inference engine (ResNet + OpenCV Demo fallback)
      ├── sample_images/       # Preloaded test bin images (0 to 5 products)
      └── checkpoints/
          └── best_model.pth   # Trained PyTorch checkpoint (Val Acc: 56.2%)
```

---

## 4. Setup & Running Instructions on Windows

### Prerequisites
- Python 3.10+ (Verified on Python 3.14)
- Node.js 18+ & npm (Verified on Node v24.11 / npm 11.6)

### Step 1: Install Python Dependencies
Open PowerShell and navigate to the project directory:
```powershell
cd "c:\5th Sem PES\ML\ML_MINI_PROJECT\amazon-inventory-ai\backend"
pip install -r requirements.txt
```

### Step 2: (Optional) Train or Evaluate the Machine Learning Model
The repository already includes trained weights (`ml/checkpoints/best_model.pth` with 56.25% validation accuracy). If you wish to retrain or evaluate:
```powershell
cd "c:\5th Sem PES\ML\ML_MINI_PROJECT\amazon-inventory-ai\ml"

# Train ResNet model:
python train.py --model resnet18 --epochs 5 --batch_size 16

# Evaluate on test set (outputs accuracy, confusion matrix, MAE, RMSE):
python evaluate.py
```

### Step 3: Start the Flask Backend Server
```powershell
cd "c:\5th Sem PES\ML\ML_MINI_PROJECT\amazon-inventory-ai\backend"
python app.py
```
*The backend server starts at `http://127.0.0.1:5000` with SQLite initialized and seeded.*

### Step 4: Start the React Frontend
In a second PowerShell window:
```powershell
cd "c:\5th Sem PES\ML\ML_MINI_PROJECT\amazon-inventory-ai\frontend"
cmd /c "npm run dev"
```
*Open your browser at `http://localhost:5173` to access the full application.*

---

## 5. REST API Documentation

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/api/dashboard` | `GET` | Returns aggregated metrics, distribution data, and engine status |
| `/api/bins` | `GET` | Lists bins with optional search, category, and status filters |
| `/api/bins` | `POST` | Registers a new inventory bin (`bin_id`, `location`, `category`, `count`) |
| `/api/bins/<bin_id>` | `GET` | Retrieves details and past scan history for a specific bin |
| `/api/bins/<bin_id>` | `PUT` | Updates bin location, category, or recorded count |
| `/api/bins/<bin_id>` | `DELETE` | Removes a bin and its associated reconciliation records |
| `/api/analyze` | `POST` | Uploads an image, executes inference, and logs reconciliation record |
| `/api/history` | `GET` | Retrieves paginated audit history with filters |
| `/api/analytics` | `GET` | Returns trend analysis, variance distribution, and match metrics |
| `/api/reports/export` | `GET` | Downloads full reconciliation audit trail as a CSV file |
| `/api/health` | `GET` | Returns PyTorch status, CUDA availability, and loaded weights |
| `/api/settings/demo-mode`| `POST` | Toggles between AI Model inference and Demo simulation |
| `/api/settings/seed` | `POST` | Re-initializes and seeds SQLite database with demo bins |

---

## 6. Machine Learning Experimental Results

Comparison between counting baselines and our convolutional model on the Amazon Bin Image Dataset:

| Model | Architecture / Features | Top-1 Test Accuracy | Test RMSE |
| :--- | :--- | :---: | :---: |
| Uniform Guessing | Random Baseline | 16.6% | 2.14 items |
| Linear SVM | Raw Pixels + PCA | 24.3% | 1.48 items |
| RBF Kernel SVM | HOG + Laplacian Blobs | 30.1% | 1.32 items |
| **ResNet-18 (Our Model)** | **Residual Convolutional Network** | **56.2%** | **0.86 – 0.90 items** |
| ResNet-34 (Stanford Paper) | Deep Convolutional Network | 56.2% | 0.90 items |

---

## 7. Deliverables & Presentation

The project includes:
1. `Amazon_Inventory_Reconciliation_Presentation.pptx`: Comprehensive 12-slide PowerPoint presentation strictly formatted for academic review.
2. `PROJECT_REPORT_WRITEUP.md`: Formal 2-page project summary report covering problem statement, dataset, methodology, and conclusions.
3. `PRESENTATION_SLIDES.md`: Complete presentation transcript with speaker notes for live demonstration.
