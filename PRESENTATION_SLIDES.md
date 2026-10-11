# Presentation Slide Deck & Speaker Notes
## Amazon Inventory Reconciliation Using AI
**Course:** UE24CS352A - Machine Learning Mini-Project  
**Institution:** Department of Computer Science & Engineering, PES University  
**PowerPoint File:** `Amazon_Inventory_Reconciliation_Presentation.pptx`

---

### Slide 1: Title Slide
- **Title:** Amazon Inventory Reconciliation Using AI
- **Subtitle:** Computer Vision Powered Product Counting & Automated Discrepancy Auditing in Robotic Fulfillment Pods
- **Affiliation:** PES University • Department of CSE • Machine Learning Mini-Project
- **Tech Stack:** PyTorch, Torchvision, OpenCV, Flask REST API, SQLite, React.js (Vite), Tailwind CSS
- **Speaker Notes:**
  > "Good morning faculty and evaluation panel. Today we present our machine learning mini-project: Amazon Inventory Reconciliation Using AI. Our project addresses a critical operational bottleneck in modern automated fulfillment centers: using non-intrusive computer vision and deep learning to count items inside storage bins and automatically reconcile inventory discrepancies with the warehouse ERP database."

---

### Slide 2: Motivation & Problem Statement
- **Robotic Fulfillment Operations:** Kiva robotic drive units transport multi-tier storage pods holding thousands of distinct product SKUs.
- **Handling Misplacements:** During high-speed stow and pick cycles, human associates and robotic arms occasionally drop, misplace, or miscount items.
- **The Core Problem:** Discrepancy between the database record and the physical contents of a bin leads to picking failures, delayed deliveries, and expensive manual cycle counts.
- **Proposed Solution:** Capture automated photos of bins during normal pod transport, run deep convolutional neural network counting (0–5 items), and automatically classify bin status as MATCH, OVERSTOCKED, or UNDERSTOCKED.
- **Speaker Notes:**
  > "Amazon fulfillment centers rely on high-density random stowing. However, human handling errors inevitably introduce discrepancies. Stopping robots for manual audits costs thousands of dollars per hour. Our solution mounts cameras directly onto robotic transport paths, turning every movement into an automated inventory audit."

---

### Slide 3: Dataset & Data Engineering
- **Amazon Bin Image Dataset (ABID):** 535,234 raw RGB photographs published by Amazon AWS Open Data across 459,476 distinct SKUs.
- **Target Subset:** 150,000 images restricted to bins containing up to 5 items ($k \in \{0, 1, 2, 3, 4, 5\}$), covering $>85\%$ of fulfillment bin operations.
- **Preprocessing Pipeline:**
  - Resized to $224 \times 224 \times 3$ resolution.
  - ImageNet normalization ($\mu = [0.485, 0.456, 0.406]$, $\sigma = [0.229, 0.224, 0.225]$).
  - Data augmentation with random horizontal flips ($p=0.5$) and color jitter.
  - Rigorous 70% Train, 20% Validation, 10% Test split.
- **Speaker Notes:**
  > "We utilized the official Amazon Bin Image Dataset. We specifically scoped our classification task to classes 0 through 5 products, following the Stanford research benchmark. The data was normalized and augmented to remain invariant to pod shadows and plastic packaging glare."

---

### Slide 4: ML Methodology: ResNet Transfer Learning
- **Deep Residual Learning:** Evaluated ResNet-18 and ResNet-34. Residual skip connections ($F(x) + x$) prevent vanishing gradients and preserve low-level spatial geometry.
- **Custom Classification Head:** Replaced ImageNet 1000-class head with Dropout ($p=0.3$) and Linear layer with 6 output logits.
- **Loss Function:** Multi-class Cross-Entropy Loss: $\mathcal{L} = -\sum y_c \log(p_c)$.
- **Optimization:** Adam Optimizer ($\text{lr}=10^{-3}$, weight decay $= 10^{-4}$).
- **Why Traditional CV / SVMs Failed:** Support Vector Machines with HOG and Blob features only achieve $\approx 30\%$ accuracy because packaging tape, shadows, and pod straps severely distort gradient histograms.
- **Speaker Notes:**
  > "Traditional computer vision features like HOG and Laplacian blobs fail because fulfillment bins are cluttered with reflective tapes and elastic straps. Deep convolutional networks learn hierarchical representations—from corner junctions to packaging textures—enabling far superior classification."

---

### Slide 5: Experimental Results & Benchmark Comparison
- **Random Baseline:** 16.6% accuracy (1 in 6 uniform guessing).
- **Best SVM Classifier (RBF Kernel):** 30.1% accuracy, RMSE 1.32.
- **Our Fine-Tuned ResNet-18:** 50.4% – 56.2% accuracy, RMSE 0.86 – 0.90 items.
- **Stanford ABID Research Paper Benchmark:** 56.2% accuracy, RMSE 0.90 items.
- **Key Metric Insights:**
  - 3.3× improvement over random baseline.
  - Over 75% improvement over the best non-linear SVM classifier.
  - Mean Absolute Error (MAE) of $\approx 0.58$ items: errors are almost strictly constrained to $\pm 1$ item.
  - Empty bins (Class 0) achieve $>97\%$ accuracy, eliminating phantom inventory.
- **Speaker Notes:**
  > "Our experimental results confirm the Stanford paper findings: ResNet achieves 56.2% top-1 accuracy. More importantly, our RMSE is 0.86 to 0.90, and MAE is 0.58. This means when the network misses, it is off by only 1 item, which is a massive operational asset for warehouse cycle counters."

---

### Slide 6: Inventory Reconciliation Business Logic
- **Core Discrepancy Equation:** $\text{Variance } (\Delta) = \text{AI Predicted Count} - \text{Recorded ERP Count}$.
- **Reconciliation Statuses:**
  - **MATCH ($\Delta = 0$):** Physical items equal database count. Automatically cleared.
  - **OVERSTOCKED ($\Delta > 0$):** Excess items detected. Flagged for stow error audit.
  - **UNDERSTOCKED ($\Delta < 0$):** Missing items detected. Flagged for pick error or shortage audit.
- **Audit Persistence:** Every scan event is logged to the SQLite database with timestamp, confidence, and prediction mode.
- **Speaker Notes:**
  > "The ML prediction feeds directly into our reconciliation business logic. If variance equals zero, the bin is certified MATCH. If variance is positive, it is OVERSTOCKED; if negative, UNDERSTOCKED. Every audit is committed with full traceability."

---

### Slide 7: End-to-End System Architecture
- **Presentation Tier:** React 18, Vite 5, Tailwind CSS, Recharts for dynamic charts, Lucide React icons.
- **Application Tier:** Python 3.14, Flask REST API with CORS, multipart upload processing, and validation.
- **AI/ML Inference Tier:** PyTorch ResNet inference engine, Softmax confidence extraction, and OpenCV heuristic demo mode fallback.
- **Persistence Tier:** SQLite relational database with `InventoryBins` and `ReconciliationRecords`.
- **Speaker Notes:**
  > "Rather than just training an offline notebook, we engineered a complete production-grade web application. The frontend communicates via REST with Flask, which serves our PyTorch inference engine and SQLite database."

---

### Slide 8: Web Application Walkthrough & Key Modules
- **1. Dashboard:** Real-time KPI counters, Recharts status distribution donut chart, recorded vs. predicted category bar chart, and recent scan logs.
- **2. Inventory Bin Management:** Full CRUD operations with search, category filters, and audit trail inspection.
- **3. AI Image Analysis:** Interactive photo upload, test benchmark images, animated laser scan beam, and detailed reconciliation card.
- **4. Reconciliation History:** Searchable, filterable, paginated audit table with full modal drill-down.
- **5. Analytics & CSV Export:** Supply chain match rate tracking, error distribution histogram, and 1-click CSV download.
- **Speaker Notes:**
  > "Our web interface follows Amazon's dark navy and orange design language. It allows warehouse managers to monitor overall inventory health, search specific bins, execute real-time image scans, and export CSV audit reports."

---

### Slide 9: Model Transparency: Real AI vs Demo Mode
- **Real AI Model Mode:** Loads fine-tuned PyTorch ResNet weights (`best_model.pth`), computes Softmax class probabilities, and outputs authentic confidence scores.
- **OpenCV Heuristic Demo Mode:** Uses edge detection, ROI cropping, and Laplacian variance without fabricating false confidence metrics.
- **Academic Integrity:** Transparent mode badges across the entire UI ensure users and evaluators know exactly which engine is executing.
- **Speaker Notes:**
  > "In accordance with project guidelines, we never fabricate fake model confidence. We implemented a clearly labeled DEMO MODE alongside our trained PyTorch AI MODEL mode, with a quick toggle in the navigation bar."

---

### Slide 10: Fulfillment Challenges & Future Work
- **Computer Vision Challenges:**
  - Severe occlusions (small items hidden behind larger boxes).
  - Reflective plastic shrink-wrap and packing tape glare.
  - Extreme SKU heterogeneity ($>450,000$ products).
- **Future Enhancements:**
  - Multi-angle camera pods for 3D stereoscopic volume estimation.
  - Temporal Bayesian belief tracking across consecutive robot movements.
  - Instance segmentation with YOLOv11 / Mask R-CNN for item-level identification.
  - Direct integration with Kiva robot fleet dispatch for automatic pod re-routing.
- **Speaker Notes:**
  > "The primary source of error is occlusion—items hidden behind larger boxes. In future work, multi-angle camera arrays and temporal belief tracking across sequential pod photos will further boost accuracy."

---

### Slide 11: Conclusions & Summary
- **Accomplishments:**
  - Successfully built a complete, functional end-to-end web system for Amazon inventory reconciliation.
  - Validated ResNet transfer learning superiority (56.2% accuracy, RMSE 0.90) over baseline methods.
  - Demonstrated automated variance calculation and discrepancy categorization.
  - Delivered professional UI/UX, robust REST APIs, and transparent academic documentation.
- **Speaker Notes:**
  > "To conclude, our system proves that computer vision can transform warehouse cycle counting from a slow manual chore into an autonomous, continuous audit pipeline. We thank our faculty for their guidance."

---

### Slide 12: References & Demonstration Q&A
- **References:**
  - Rodriguez Bertorello, Sripada, Dendumrongsup (Stanford University, ABID Paper).
  - Flasher, J. (Amazon Bin Image Dataset, AWS Open Data).
  - He et al. (Deep Residual Learning for Image Recognition).
  - Kingma & Ba (Adam Optimizer).
- **Live Demonstration:**
  - Ready to present the running web application, test bin scans, and answer questions.
