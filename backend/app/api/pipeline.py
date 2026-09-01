"""
AI Pipeline Monitoring API.

Exposes real model performance, training configurations, and pipeline stages for Screen 5.
"""

from typing import Dict, Any
from fastapi import APIRouter

router = APIRouter(prefix="/api/pipeline", tags=["Pipeline"])


@router.get("/info")
def get_pipeline_info() -> Dict[str, Any]:
    """Returns verified model specifications, baseline metrics, and pipeline architecture."""
    return {
        "model": {
            "name": "yolov8n-sonar-baseline",
            "architecture": "YOLOv8n (Ultralytics)",
            "parameters": 3011043,
            "gflops": 8.2,
            "input_resolution": "640x640",
            "task": "Single-class object detection",
            "classes": ["artificial_anomaly"],
            "precision": "FP16 (AMP Enabled)",
            "frozen_checkpoint": "outputs/models/yolov8n_sonar_baseline/best.pt"
        },
        "dataset": {
            "name": "AI4Shipwrecks (Side-Scan Sonar)",
            "total_tiles": 8356,
            "train_tiles": 5844,
            "val_tiles": 1256,
            "test_tiles": 1256,
            "split_policy": "Site-aware geographic separation (Zero cross-talk)"
        },
        "metrics": {
            "validation": {
                "map50": 0.0645,
                "precision": 0.1518,
                "recall": 0.1026,
                "map50_95": 0.0197,
                "gt_boxes": 195
            },
            "frozen_test": {
                "map50": 0.1048,
                "precision": 0.1894,
                "recall": 0.1292,
                "map50_95": 0.0406,
                "gt_boxes": 271
            }
        },
        "performance": {
            "median_tile_latency_ms": 18.7,
            "fps": 52.3,
            "hardware": "NVIDIA GeForce RTX 3050 Laptop GPU (CUDA 12.6)",
            "swath_inference_latency_s": 4.5
        },
        "stages": [
            {
                "id": "ingest",
                "name": "Swath Ingestion",
                "description": "Validates bit-depth, channels, and extracts raw waterfall matrix.",
                "status": "OPERATIONAL"
            },
            {
                "id": "quality",
                "name": "Quality SNR Check",
                "description": "Calculates intensity dynamic range and signal-to-noise ratio.",
                "status": "OPERATIONAL"
            },
            {
                "id": "normalization",
                "name": "1-99% Percentile Stretch",
                "description": "Swath-level intensity normalization (CLAHE & FFT strictly disabled).",
                "status": "OPERATIONAL"
            },
            {
                "id": "tiling",
                "name": "640x640 Overlapping Tiling",
                "description": "Deterministic spatial tiling with 20% stride overlap (512px stride).",
                "status": "OPERATIONAL"
            },
            {
                "id": "yolo_inference",
                "name": "YOLOv8n Batch Inference",
                "description": "Batched CUDA inference generating raw acoustic candidate proposals.",
                "status": "OPERATIONAL"
            },
            {
                "id": "dedup_ranking",
                "name": "NMS & Candidate Ranking",
                "description": "Boundary sliver filtering, overlap suppression, and composite acoustic ranking.",
                "status": "OPERATIONAL"
            },
            {
                "id": "human_triage",
                "name": "Operator Triage Workflow",
                "description": "Human-in-the-loop review interface: Confirm, False Positive, Needs Review.",
                "status": "OPERATIONAL"
            },
            {
                "id": "export",
                "name": "GIS & Report Export",
                "description": "Generates standard GeoJSON Point features and tabular CSV exports.",
                "status": "OPERATIONAL"
            }
        ],
        "disclaimer": "Current model is an experimental baseline intended for candidate generation and workflow validation. All AI candidate proposals require hydrographic operator verification."
    }
