"""
SONAR-INTEL FastAPI Application Entry Point.
"""

import os
import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.app.database.connection import init_db
from backend.app.api.upload import router as upload_router
from backend.app.api.analysis import router as analysis_router
from backend.app.api.contacts import router as contacts_router
from backend.app.api.review import router as review_router
from backend.app.api.reports import router as reports_router
from backend.app.api.demo import router as demo_router
from backend.app.api.dashboard import router as dashboard_router
from backend.app.api.pipeline import router as pipeline_router
from backend.app.api.inference import router as inference_router

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(
    title="SONAR-INTEL API",
    description="AI-Powered Side-Scan Sonar Marine Debris & Anomaly Detection API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware for React Frontend
allowed_origins_env = os.environ.get("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174")
origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(upload_router)
app.include_router(analysis_router)
app.include_router(contacts_router)
app.include_router(review_router)
app.include_router(reports_router)
app.include_router(demo_router)
app.include_router(dashboard_router)
app.include_router(pipeline_router)
app.include_router(inference_router)

# Mount static demo/data directories if they exist
os.makedirs("data/raw", exist_ok=True)
os.makedirs("data/processed", exist_ok=True)
os.makedirs("data/demo", exist_ok=True)


@app.get("/health", tags=["System"])
@app.get("/api/health", tags=["System"])
def health_check():
    """Operational health and detector probe for Render / Vercel integration."""
    try:
        from ml.inference.onnx_detector import ONNXDetector
        detector = ONNXDetector()
        detector_info = detector.get_health_status()
    except Exception as e:
        detector_info = {
            "provider": "onnx",
            "status": "error",
            "error": str(e)
        }

    return {
        "status": "healthy" if detector_info.get("status") == "ready" else "degraded",
        "service": "SONAR-INTEL API",
        "provider": detector_info.get("provider", "onnx"),
        "model": detector_info.get("model", "best_detector.onnx"),
        "runtime": detector_info.get("runtime", "onnxruntime"),
        "device": detector_info.get("device", "CPU"),
        "database": "active",
        "detector": detector_info,
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }



if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
