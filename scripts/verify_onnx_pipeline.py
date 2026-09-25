"""
Comprehensive Verification and Audit Script for DRISHTI FP32 ONNX Pipeline on Render.

Measures:
1. Startup Memory (RSS)
2. Model-loaded Memory (RSS)
3. Preprocessing, Inference, Postprocessing/NMS Latency
4. First and Second Inference Memory
5. Full Survey Pipeline (Tiling, Dedup, Verification, Georeferencing, Triage)
6. Real SSS Images Benchmark (viator_04, corsican_02, survey_001)
"""

import os
import sys
import time
import psutil
import cv2
import numpy as np

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

process = psutil.Process(os.getpid())

def get_rss_mb() -> float:
    return process.memory_info().rss / (1024 * 1024)

print("=" * 60)
print("SONAR-INTEL DRISHTI ONNX AUDIT & BENCHMARK")
print("=" * 60)

# Stage 1: Initial Process RSS
rss_startup = get_rss_mb()
print(f"1. Process Startup RSS: {rss_startup:.2f} MB")

# Stage 2: Initialize Detector
t0 = time.perf_counter()
from ml.inference.onnx_detector import ONNXDetector
detector = ONNXDetector()
t_init = (time.perf_counter() - t0) * 1000
rss_model_loaded = get_rss_mb()
delta_model = rss_model_loaded - rss_startup

print(f"2. ONNXDetector Initialized in {t_init:.2f} ms")
print(f"   Model-loaded RSS: {rss_model_loaded:.2f} MB (Delta: +{delta_model:.2f} MB)")
print(f"   Model Artifact: {detector.model_path}")
print(f"   File Size: {os.path.getsize(detector.model_path)/(1024*1024):.2f} MB")
print(f"   Input Tensor: {detector.input_name} {detector.input_shape}")
print(f"   Output Tensor: {detector.output_name} {detector.output_shape}")

# Stage 3: Benchmark on Real Sonar Swaths
test_images = [
    ("viator_04_test_wreck.png", "data/demo/sonar/viator_04_test_wreck.png"),
    ("corsican_02_test_wreck.png", "data/demo/sonar/corsican_02_test_wreck.png"),
    ("survey_001_raw.png", "data/demo/sonar/survey_001_raw.png")
]

print("\n" + "=" * 60)
print("3. REAL SSS IMAGE INFERENCE BENCHMARKS")
print("=" * 60)

for img_name, img_path in test_images:
    if not os.path.exists(img_path):
        print(f"Skipping {img_name} (not found)")
        continue

    img = cv2.imread(img_path)
    h, w = img.shape[:2]
    
    # Measure Tile-Level Latency
    sample_tile = img[:640, :640] if h >= 640 and w >= 640 else cv2.resize(img, (640, 640))
    
    # 1. Preprocessing latency
    t_p0 = time.perf_counter()
    prep_tile, meta = detector.preprocess(sample_tile)
    t_prep = (time.perf_counter() - t_p0) * 1000
    
    # 2. Tensor prep latency
    t_t0 = time.perf_counter()
    tensor, sx, sy = detector._prepare_tensor(prep_tile)
    t_tensor = (time.perf_counter() - t_t0) * 1000
    
    # 3. ONNX Inference latency
    t_i0 = time.perf_counter()
    raw_out = detector.session.run(None, {detector.input_name: tensor})[0]
    t_infer = (time.perf_counter() - t_i0) * 1000
    
    # 4. Decoding + NMS latency
    t_d0 = time.perf_counter()
    dets = detector.decode(raw_out, sx, sy, sample_tile.shape[1], sample_tile.shape[0], tile_id="T_BENCH")
    t_decode = (time.perf_counter() - t_d0) * 1000
    
    total_tile_latency = t_prep + t_tensor + t_infer + t_decode
    
    print(f"\n--- {img_name} (Swath: {w}x{h} px) ---")
    print(f"  P4 Preprocessing:       {t_prep:6.2f} ms")
    print(f"  Tensor Transformation:  {t_tensor:6.2f} ms")
    print(f"  ONNX Runtime Inference: {t_infer:6.2f} ms")
    print(f"  Decoding & NumPy NMS:   {t_decode:6.2f} ms")
    print(f"  Total Single-Tile:      {total_tile_latency:6.2f} ms ({1000.0/total_tile_latency:.1f} FPS)")
    
    # Now run full survey analysis via InferenceService
    from backend.app.services.inference_service import InferenceService
    inf_service = InferenceService()
    
    rss_pre_infer = get_rss_mb()
    t_full0 = time.perf_counter()
    contacts = inf_service.run_survey_analysis(
        survey_id=f"AUDIT_{img_name[:8]}",
        raw_image_path=img_path,
        confidence_threshold=0.10
    )
    t_full = (time.perf_counter() - t_full0) * 1000
    rss_post_infer = get_rss_mb()
    
    print(f"  Full Swath Pipeline:    {t_full:6.2f} ms")
    print(f"  Contacts Discovered:    {len(contacts)}")
    print(f"  Swath Memory Post-Run:  {rss_post_infer:6.2f} MB (Delta: +{rss_post_infer - rss_pre_infer:.2f} MB)")
    
    for c in contacts[:5]:
        loc_str = f"({c.latitude:.5f}, {c.longitude:.5f})" if c.latitude else "NO_NAV"
        print(f"    - Contact {c.contact_id}: class='{c.class_name}', conf={c.confidence:.3f}, priority={c.priority}, bbox=({c.bbox.x1}, {c.bbox.y1}, {c.bbox.x2}, {c.bbox.y2}), loc={loc_str}")

print("\n" + "=" * 60)
print(f"FINAL AUDIT SUMMARY: Process Peak RSS = {get_rss_mb():.2f} MB (Render Limit: 512 MB)")
print("=" * 60)
