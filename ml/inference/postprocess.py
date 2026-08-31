"""
Contact Post-Processing and Spatial Deduplication across overlapping tiles.
"""

from typing import List, Dict, Any
import numpy as np


def compute_iou(box1: Dict[str, int], box2: Dict[str, int]) -> float:
    """Computes Intersection-over-Union between two bounding boxes."""
    x1 = max(box1["x1"], box2["x1"])
    y1 = max(box1["y1"], box2["y1"])
    x2 = min(box1["x2"], box2["x2"])
    y2 = min(box1["y2"], box2["y2"])

    intersection_w = max(0, x2 - x1)
    intersection_h = max(0, y2 - y1)
    intersection_area = intersection_w * intersection_h

    area1 = (box1["x2"] - box1["x1"]) * (box1["y2"] - box1["y1"])
    area2 = (box2["x2"] - box2["x1"]) * (box2["y2"] - box2["y1"])
    union_area = area1 + area2 - intersection_area

    if union_area <= 0:
        return 0.0
    return float(intersection_area) / float(union_area)


def deduplicate_detections(
    detections: List[Dict[str, Any]],
    iou_threshold: float = 0.40
) -> List[Dict[str, Any]]:
    """
    Non-Maximum Suppression (NMS) on candidates detected across multiple overlapping tiles.
    Retains candidate with highest confidence.
    """
    if not detections:
        return []

    # Sort descending by confidence
    sorted_dets = sorted(detections, key=lambda d: d.get("confidence", 0.0), reverse=True)
    kept = []

    while sorted_dets:
        best = sorted_dets.pop(0)
        kept.append(best)

        # Filter out candidates with high IoU overlap
        remaining = []
        for other in sorted_dets:
            iou = compute_iou(best["bbox"], other["bbox"])
            if iou < iou_threshold:
                remaining.append(other)
        sorted_dets = remaining

    return kept
