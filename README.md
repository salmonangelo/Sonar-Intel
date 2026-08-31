# SONAR-INTEL 🌊🎯
### AI-Powered Side-Scan Sonar Marine Debris & Anomaly Detection

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?style=flat&logo=FastAPI)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg?style=flat&logo=React)](https://react.dev)
[![MapLibre](https://img.shields.io/badge/MapLibre_GL-3.6+-blue.svg?style=flat)](https://maplibre.org)
[![PostGIS](https://img.shields.io/badge/PostGIS-15--3.3-336791.svg?style=flat&logo=PostgreSQL)](https://postgis.net)
[![YOLOv8](https://img.shields.io/badge/Ultralytics-YOLOv8n-FF6F00.svg?style=flat)](https://github.com/ultralytics/ultralytics)

> **Domain Disclaimer**: SONAR-INTEL is an AI-powered side-scan sonar artificial-anomaly triage and geospatial decision-support prototype. It detects candidate anomalies and calculates multi-factor acoustic priority; it does **not** claim to provide 100% automated confirmation of ghost nets nor survey-grade geodetic positioning without calibrated USBL/DVL acoustic sensors.

---

## 1. Problem & Operational Context
Marine debris, abandoned, lost or discarded fishing gear (ALDFG / "ghost nets"), and submerged navigational hazards inflict severe ecological and economic damage. 

Side-scan sonar (SSS) provides high-resolution acoustic acoustic imagery of the seabed over wide swaths. However, manual inspection of gigabytes of acoustic waterfall records is fatiguing, error-prone, and slow. 

**SONAR-INTEL** solves this operational bottleneck by:
1. Running rapid candidate anomaly detection using YOLOv8n.
2. Evaluating acoustic physics plausibility (acoustic shadow evidence, local backscatter contrast, and aspect ratio).
3. Associating towfish navigation logs to estimate WGS84 coordinates.
4. Providing a human-in-the-loop triage console where marine surveyors confirm, reject, or mark candidates uncertain with 1-click workflows and export results to GeoJSON/CSV.

---

## 2. System Architecture

The system operates across an 8-stage pipeline:
```
[INPUT] ──────► [INGESTION] ───► [NORMALIZATION] ───► [FAST PROCESSING]
Raw SSS + Nav   FastAPI Upload   CLAHE + Tiling       YOLOv8n Candidate
                                                              │
                                                              ▼
[STORAGE+FEEDBACK] ◄── [EXPLANATION/ACTION] ◄── [DECISION] ◄── [INTELLIGENCE]
PostGIS + Exports      Sonar & Map Console     Priority Score  Acoustic Context & Shadow
```

For complete technical descriptions, see [docs/architecture.md](docs/architecture.md).

---

## 3. Quick Start & Setup

### Prerequisites
- **Python**: 3.11 or higher
- **Node.js**: v18 or higher (v20+ recommended)
- **Docker** (Optional, for PostgreSQL/PostGIS container)

---

### Step A: Database Setup (Optional Docker Container)
If Docker is installed:
```bash
docker-compose up -d
```
*Note: If PostgreSQL/Docker is not running, the backend automatically activates a local fallback database mode so you can test immediately without setup blockers!*

---

### Step B: Backend Setup
1. Navigate to `backend/`:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   # On Windows PowerShell:
   python -m venv venv
   .\venv\Scripts\Activate.ps1

   # On Linux / macOS:
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
5. Start the FastAPI server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   API interactive documentation will be available at: [http://localhost:8000/docs](http://localhost:8000/docs)

---

### Step C: Frontend Setup
1. Open a new terminal in `frontend/`:
   ```bash
   cd frontend
   npm install
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   ```
3. Open your browser at: [http://localhost:5173](http://localhost:5173)

---

## 4. Demo Workflow (Instant 2-Minute Walkthrough)

1. Open the dashboard at `http://localhost:5173`.
2. Click **Load Demo Survey** (or upload `data/demo/sonar/survey_001_raw.png` and `data/demo/navigation/survey_001_nav.csv`).
3. Observe the raw acoustic swath and computed **Data Quality (0.94)**.
4. Click **Run Analysis Pipeline**.
5. View detected acoustic candidates on the **Sonar Waterfall Viewer** and synchronized **MapLibre Geospatial Map**.
6. Select candidate **C001** to inspect the **Evidence Panel**:
   - Object-like acoustic return
   - Strong local contrast (+82%)
   - Supporting down-range acoustic shadow (+78%)
   - Priority: **HIGH**
7. Perform human triage by clicking **CONFIRM**, **FALSE POSITIVE**, or **UNCERTAIN**.
8. Click **Export GeoJSON** or **Export CSV** to download validated mission reports.

---

## 5. Model Training (For ML Engineers)

To train or fine-tune YOLOv8n on your own annotated sonar dataset:
```bash
python ml/training/train.py --data ml/training/dataset.yaml --epochs 50 --batch 2 --device cuda
```
- Optimized for low VRAM (NVIDIA RTX 3050 4GB).
- Strict site-separated spatial split (train sites vs. val sites) prevents spatial leakage between contiguous sonar swaths.

---

## 6. Canonical Contact JSON Schema
```json
{
  "contact_id": "C001",
  "survey_id": "SURVEY_001",
  "class_name": "artificial_anomaly",
  "confidence": 0.91,
  "bbox": { "x1": 412, "y1": 188, "x2": 531, "y2": 302 },
  "data_quality": 0.96,
  "shadow_evidence": 0.82,
  "context_score": 0.87,
  "priority": "HIGH",
  "latitude": 11.23451,
  "longitude": 76.54321,
  "localization_status": "ESTIMATED",
  "review_status": "AI_CANDIDATE",
  "review_note": null,
  "model_version": "yolov8n-v1"
}
```

---

## 7. Known Limitations & Roadmap
- **Geolocation**: Coordinates are linearly estimated from towfish trajectory and slant range. Without USBL tracking, position accuracy is advisory.
- **Low-Profile Targets**: Flat debris or buried cables may yield subtle or no acoustic shadows.
- **Real-Time Waterfall**: Currently renders static high-res swaths with canvas overlays; continuous streaming WebGL waterfall planned for Phase 2.
