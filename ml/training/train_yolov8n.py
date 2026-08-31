"""
train_yolov8n.py: Controlled YOLOv8n Baseline Training for Side-Scan Sonar Artificial Anomaly Detection.

STRICT CONSTRAINTS:
- Single class: 0 = artificial_anomaly
- Pretrained COCO weights (yolov8n.pt) initialization
- Hardware check: Automatically detect CUDA availability
- If CUDA is unavailable, STOP and report it (DO NOT silently train on CPU)
- Fits within 4 GB VRAM (RTX 3050)
- Preserves test set integrity (TEST set used only for final evaluation, not model selection)
- Outputs to outputs/training/yolov8n_baseline/

Usage:
    python ml/training/train_yolov8n.py
"""

import os
import sys
import json
import subprocess
import shutil
from pathlib import Path
import torch

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


# ==============================================================================
# CONFIGURATION & REPRODUCIBILITY
# ==============================================================================
CONFIG = {
    "model": "yolov8n.pt",
    "dataset_yaml": "ml/training/dataset.yaml",
    "output_dir": "outputs/training/yolov8n_baseline",
    "project": "outputs/training",
    "name": "yolov8n_baseline",
    "imgsz": 640,
    "epochs": 50,
    "patience": 10,
    "batch": 16,            # Safe for 4 GB VRAM with 640x640 single-class
    "workers": 2,          # Conservative for Windows multiprocessing
    "device": 0,           # CUDA device 0
    "seed": 42,
    "deterministic": True,
    "single_cls": True,
    "save": True,
    "save_period": -1,
    "val": True,
    "plots": True,
    "optimizer": "auto",
    "classes": [0],
    "class_name": "artificial_anomaly"
}


def check_hardware_and_cuda():
    """
    Verifies CUDA availability and physical GPU presence.
    Enforces strict safeguard: If CUDA is unavailable, STOP and report.
    Do NOT silently train on CPU.
    """
    print("==================================================")
    print("SONAR-INTEL: YOLOv8n Baseline Training Experiment")
    print("==================================================")
    print(f"PyTorch Version: {torch.__version__}")
    cuda_available = torch.cuda.is_available()
    print(f"CUDA Available:  {cuda_available}")

    # Check physical GPU via nvidia-smi
    gpu_name = "Unknown"
    driver_version = "Unknown"
    vram_mb = 0
    try:
        smi_out = subprocess.check_output(
            ["nvidia-smi", "--query-gpu=name,driver_version,memory.total", "--format=csv,noheader,nounits"],
            text=True
        ).strip()
        parts = [p.strip() for p in smi_out.split(",")]
        if len(parts) >= 3:
            gpu_name = parts[0]
            driver_version = parts[1]
            vram_mb = int(parts[2])
            print(f"Physical GPU:    {gpu_name} ({vram_mb} MiB VRAM, Driver {driver_version})")
    except Exception:
        print("Physical GPU:    Could not query nvidia-smi")

    if not cuda_available:
        print("\n" + "!" * 50)
        print("CRITICAL HARDWARE ERROR: CUDA IS UNAVAILABLE!")
        print("!" * 50)
        print(f"The active Python environment has a CPU-only PyTorch build ({torch.__version__}).")
        if gpu_name != "Unknown":
            print(f"Detected physical hardware: {gpu_name} with {vram_mb} MiB VRAM.")
            print("However, PyTorch cannot access CUDA acceleration without CUDA-enabled wheels.")
        print("\nSTRICT POLICY ENFORCEMENT:")
        print("Do NOT silently train on CPU.")
        print("STOPPING training execution as required by project specifications.")
        print("\nTo enable GPU training on RTX 3050, reinstall PyTorch with CUDA 12.6:")
        print("  pip install --force-reinstall torch torchvision --index-url https://download.pytorch.org/whl/cu126\n")
        sys.exit(1)

    device_name = torch.cuda.get_device_name(0)
    total_vram_gb = torch.cuda.get_device_properties(0).total_memory / (1024 ** 3)
    print(f"CUDA Device Name: {device_name}")
    print(f"Available VRAM:   {total_vram_gb:.2f} GB")

    # Safe batch size determination for 4 GB VRAM
    if total_vram_gb < 5.0:
        CONFIG["batch"] = 16
        print(f"4 GB VRAM detected: Setting conservative batch size = {CONFIG['batch']}")
    elif total_vram_gb < 9.0:
        CONFIG["batch"] = 32
        print(f"8 GB VRAM detected: Setting batch size = {CONFIG['batch']}")
    else:
        CONFIG["batch"] = 64
        print(f">8 GB VRAM detected: Setting batch size = {CONFIG['batch']}")

    return device_name, total_vram_gb


def run_training():
    device_name, total_vram_gb = check_hardware_and_cuda()

    from ultralytics import YOLO

    # Load pretrained model
    print(f"\n[train_yolov8n] Loading pretrained model: {CONFIG['model']}...")
    model = YOLO(CONFIG["model"])

    # Ensure output directories exist
    os.makedirs(CONFIG["output_dir"], exist_ok=True)

    # Save training configuration
    config_save_path = os.path.join(CONFIG["output_dir"], "training_config.json")
    with open(config_save_path, "w", encoding="utf-8") as f:
        json.dump({
            **CONFIG,
            "device_name": device_name,
            "total_vram_gb": total_vram_gb,
            "pytorch_version": torch.__version__
        }, f, indent=2)
    print(f"[train_yolov8n] Configuration saved to {config_save_path}")

    # Launch Training
    print("\n" + "=" * 50)
    print("STARTING TRAINING (YOLOv8n Baseline)")
    print(f"Epochs: {CONFIG['epochs']} | Batch: {CONFIG['batch']} | Imgsz: {CONFIG['imgsz']} | Workers: {CONFIG['workers']}")
    print("=" * 50 + "\n")

    results = model.train(
        data=CONFIG["dataset_yaml"],
        epochs=CONFIG["epochs"],
        patience=CONFIG["patience"],
        batch=CONFIG["batch"],
        imgsz=CONFIG["imgsz"],
        device=CONFIG["device"],
        workers=CONFIG["workers"],
        seed=CONFIG["seed"],
        deterministic=CONFIG["deterministic"],
        project=CONFIG["project"],
        name=CONFIG["name"],
        exist_ok=True,
        save=CONFIG["save"],
        plots=CONFIG["plots"],
        verbose=True
    )

    print("\n[train_yolov8n] Training run completed.")
    best_weight = os.path.join(CONFIG["output_dir"], "weights", "best.pt")
    last_weight = os.path.join(CONFIG["output_dir"], "weights", "last.pt")

    if not os.path.exists(best_weight):
        # In case Ultralytics saved to default runs/detect/
        alt_best = Path(results.save_dir) / "weights" / "best.pt"
        if alt_best.exists():
            best_weight = str(alt_best)

    print(f"[train_yolov8n] Best model weights: {best_weight}")

    # -----------------------------------------------------------------
    # Evaluate on VALIDATION SET
    # -----------------------------------------------------------------
    print("\n" + "=" * 50)
    print("EVALUATING ON VALIDATION SET")
    print("=" * 50)
    best_model = YOLO(best_weight)
    val_metrics = best_model.val(data=CONFIG["dataset_yaml"], split="val", imgsz=CONFIG["imgsz"], batch=CONFIG["batch"])

    val_p = float(val_metrics.box.p[0]) if len(val_metrics.box.p) > 0 else float(val_metrics.box.mp)
    val_r = float(val_metrics.box.r[0]) if len(val_metrics.box.r) > 0 else float(val_metrics.box.mr)
    val_map50 = float(val_metrics.box.map50)
    val_map = float(val_metrics.box.map)

    val_summary = {
        "precision": round(val_p, 4),
        "recall": round(val_r, 4),
        "mAP50": round(val_map50, 4),
        "mAP50_95": round(val_map, 4)
    }

    with open(os.path.join(CONFIG["output_dir"], "validation_report.json"), "w", encoding="utf-8") as f:
        json.dump(val_summary, f, indent=2)

    # -----------------------------------------------------------------
    # Evaluate on TEST SET (Frozen Model, Final Evaluation Only)
    # -----------------------------------------------------------------
    print("\n" + "=" * 50)
    print("EVALUATING ON TEST SET (FROZEN BASELINE - NO TUNING)")
    print("=" * 50)
    test_metrics = best_model.val(data=CONFIG["dataset_yaml"], split="test", imgsz=CONFIG["imgsz"], batch=CONFIG["batch"])

    test_p = float(test_metrics.box.p[0]) if len(test_metrics.box.p) > 0 else float(test_metrics.box.mp)
    test_r = float(test_metrics.box.r[0]) if len(test_metrics.box.r) > 0 else float(test_metrics.box.mr)
    test_map50 = float(test_metrics.box.map50)
    test_map = float(test_metrics.box.map)

    test_summary = {
        "precision": round(test_p, 4),
        "recall": round(test_r, 4),
        "mAP50": round(test_map50, 4),
        "mAP50_95": round(test_map, 4)
    }

    with open(os.path.join(CONFIG["output_dir"], "test_report.json"), "w", encoding="utf-8") as f:
        json.dump(test_summary, f, indent=2)

    # -----------------------------------------------------------------
    # Final Output Report
    # -----------------------------------------------------------------
    print("\n" + "=" * 50)
    print("BASELINE TRAINING COMPLETE")
    print("=" * 50 + "\n")
    print(f"GPU:       {device_name} ({total_vram_gb:.2f} GB)")
    print(f"Model:     YOLOv8n")
    print(f"Epochs:    {CONFIG['epochs']}")
    print(f"Best epoch: (Saved to {best_weight})\n")
    print("Validation:")
    print(f"Precision: {val_p:.4f}")
    print(f"Recall:    {val_r:.4f}")
    print(f"mAP50:     {val_map50:.4f}")
    print(f"mAP50-95:  {val_map:.4f}\n")
    print("Test:")
    print(f"Precision: {test_p:.4f}")
    print(f"Recall:    {test_r:.4f}")
    print(f"mAP50:     {test_map50:.4f}")
    print(f"mAP50-95:  {test_map:.4f}\n")
    print("=" * 50)


if __name__ == "__main__":
    run_training()
