"""
ONNX Runtime Side-Scan Sonar Candidate Anomaly Detector.

Production lightweight detector for Render deployment (< 512 MB RAM).
Executes FP32 ONNX inference with pure NumPy + OpenCV and onnxruntime.

Architecture:
Raw SSS / Tile
    ↓
P4 Preprocessing (Lee MMSE 5x5 + CLAHE 2.0 (8,8) + 1-99% stretch)
    ↓
ONNX Tensor Transformation (640x640, RGB, [0, 1] float32, NCHW)
    ↓
ONNX Runtime CPU Inference (best_detector.onnx, [1, 9, 8400])
    ↓
Pure NumPy YOLO Output Decoding & Coordinate Translation
    ↓
Pure NumPy Per-Class NMS
    ↓
Canonical DrishtiDetection Internal Representation

Class Mapping:
SOURCE MODEL:
  0 = crab_pot (filtered by policy)
  1 = submarine_pipeline
  2 = shipwreck
  3 = ghost_net
  4 = mine_cylinder

SONAR-INTEL APPLICATION MAPPING:
  0 = crab_pot
  1 = submarine_pipeline
  2 = shipwreck
  3 = ghost_net
  4 = mine_like_contact (explicit mapping from source 'mine_cylinder')
"""

from typing import List, Dict, Any, Optional, Tuple
import os
import cv2
import numpy as np
import onnxruntime as ort

from ml.inference.detector_interface import BaseSonarDetector, DrishtiDetection
from ml.preprocessing.drishti_preprocess import drishti_preprocess, PREPROCESSING_VERSION
from backend.app.core.config import settings


class ONNXDetector(BaseSonarDetector):
    """
    Dedicated ONNX Runtime detector service for DRISHTI FP32 YOLOv8s.
    Singleton session caching per application process to minimize RAM overhead.
    """
    _session_cache: Dict[str, ort.InferenceSession] = {}

    # Source model class labels
    SOURCE_CLASSES: Dict[int, str] = {
        0: "crab_pot",
        1: "submarine_pipeline",
        2: "shipwreck",
        3: "ghost_net",
        4: "mine_cylinder"
    }

    # Canonical SONAR-INTEL application class labels
    # Explicit mapping: source 'mine_cylinder' -> application 'mine_like_contact'
    APPLICATION_CLASSES: Dict[int, str] = {
        0: "crab_pot",
        1: "submarine_pipeline",
        2: "shipwreck",
        3: "ghost_net",
        4: "mine_like_contact"
    }

    def __init__(
        self,
        model_path: Optional[str] = None,
        confidence_threshold: Optional[float] = None,
        iou_threshold: Optional[float] = None,
        image_size: Optional[int] = None,
        filtered_classes: Optional[List[str]] = None
    ):
        self.model_path = self._resolve_model_path(model_path or settings.MODEL_PATH)
        self.confidence_threshold = confidence_threshold if confidence_threshold is not None else settings.CONFIDENCE_THRESHOLD
        self.iou_threshold = iou_threshold if iou_threshold is not None else settings.IOU_THRESHOLD
        self.image_size = image_size or settings.IMAGE_SIZE
        self.filtered_classes = set(filtered_classes if filtered_classes is not None else settings.FILTERED_CLASSES)
        self.model_name = "DRISHTI-YOLOv8s-ONNX"
        self.model_version = "onnx-fp32-v1"

        # Initialize ONNX session once
        self.session = self._get_or_create_session()
        self.input_name = self.session.get_inputs()[0].name
        self.input_shape = self.session.get_inputs()[0].shape
        self.output_name = self.session.get_outputs()[0].name
        self.output_shape = self.session.get_outputs()[0].shape

    def _resolve_model_path(self, raw_path: str) -> str:
        """Resolves model path relative to project root."""
        if os.path.isabs(raw_path) and os.path.exists(raw_path):
            return raw_path

        # Resolve relative to project root
        candidates = [
            raw_path,
            os.path.join("ml", "models", "best_detector.onnx"),
            os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "ml", "models", "best_detector.onnx")),
            os.path.abspath(raw_path)
        ]
        for candidate in candidates:
            if os.path.exists(candidate) and candidate.endswith(".onnx"):
                return os.path.abspath(candidate)

        raise FileNotFoundError(
            f"ONNX model checkpoint not found at '{raw_path}'. "
            f"Expected FP32 ONNX model at 'ml/models/best_detector.onnx'."
        )

    def _get_or_create_session(self) -> ort.InferenceSession:
        """Creates or retrieves a cached ONNX Runtime CPU session."""
        cache_key = self.model_path
        if cache_key in ONNXDetector._session_cache:
            return ONNXDetector._session_cache[cache_key]

        if not os.path.exists(self.model_path):
            raise FileNotFoundError(f"ONNX model file not found: {self.model_path}")

        # Conservative CPU configuration for 512 MB Render environment
        sess_options = ort.SessionOptions()
        sess_options.intra_op_num_threads = 2
        sess_options.inter_op_num_threads = 1
        sess_options.execution_mode = ort.ExecutionMode.ORT_SEQUENTIAL
        sess_options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL

        session = ort.InferenceSession(
            self.model_path,
            sess_options=sess_options,
            providers=["CPUExecutionProvider"]
        )
        ONNXDetector._session_cache[cache_key] = session
        return session

    def preprocess(self, image: np.ndarray) -> Tuple[np.ndarray, Dict[str, Any]]:
        """
        Applies authoritative P4 DRISHTI preprocessing:
        1-99% Dynamic range stretch -> 5x5 Lee MMSE filter -> CLAHE (2.0, (8,8)) -> 3-channel BGR.
        """
        return drishti_preprocess(
            image=image,
            speckle_filter=settings.PREPROCESSING_SPECKLE_FILTER.lower() == "lee",
            window_size=settings.LEE_WINDOW_SIZE,
            noise_var=settings.LEE_NOISE_VAR,
            apply_clahe_enhancement=settings.PREPROCESSING_CLAHE,
            clahe_clip_limit=settings.CLAHE_CLIP_LIMIT,
            clahe_tile_grid=settings.CLAHE_TILE_GRID_SIZE
        )

    def _prepare_tensor(self, preprocessed_bgr: np.ndarray) -> Tuple[np.ndarray, float, float]:
        """
        Converts preprocessed BGR image into ONNX model input tensor:
        Resize to (640, 640) -> BGR to RGB -> [0, 1] float32 -> NCHW -> Contiguous.

        Returns:
            tensor: [1, 3, 640, 640] float32 array
            scale_x: width scaling factor from original to 640
            scale_y: height scaling factor from original to 640
        """
        orig_h, orig_w = preprocessed_bgr.shape[:2]
        target_size = self.image_size

        if (orig_w, orig_h) != (target_size, target_size):
            resized = cv2.resize(preprocessed_bgr, (target_size, target_size), interpolation=cv2.INTER_LINEAR)
        else:
            resized = preprocessed_bgr

        scale_x = orig_w / float(target_size)
        scale_y = orig_h / float(target_size)

        # BGR -> RGB
        rgb = resized[:, :, ::-1]
        # Normalization [0.0, 1.0] and NCHW format
        tensor = (rgb / 255.0).astype(np.float32).transpose(2, 0, 1)[None]
        tensor = np.ascontiguousarray(tensor)
        return tensor, scale_x, scale_y

    @staticmethod
    def _apply_nms(
        boxes: np.ndarray,
        scores: np.ndarray,
        classes: np.ndarray,
        iou_thresh: float
    ) -> np.ndarray:
        """
        Pure NumPy per-class Non-Maximum Suppression.
        Eliminates dependencies on torchvision or ultralytics.
        """
        if len(boxes) == 0:
            return np.array([], dtype=int)

        keep = []
        unique_classes = np.unique(classes)

        for cls in unique_classes:
            cls_indices = np.where(classes == cls)[0]
            cls_boxes = boxes[cls_indices]
            cls_scores = scores[cls_indices]

            order = cls_scores.argsort()[::-1]
            x1 = cls_boxes[:, 0]
            y1 = cls_boxes[:, 1]
            x2 = cls_boxes[:, 2]
            y2 = cls_boxes[:, 3]
            areas = (x2 - x1) * (y2 - y1)

            while order.size > 0:
                i = order[0]
                keep.append(cls_indices[i])

                xx1 = np.maximum(x1[i], x1[order[1:]])
                yy1 = np.maximum(y1[i], y1[order[1:]])
                xx2 = np.minimum(x2[i], x2[order[1:]])
                yy2 = np.minimum(y2[i], y2[order[1:]])

                w = np.maximum(0.0, xx2 - xx1)
                h = np.maximum(0.0, yy2 - yy1)
                inter = w * h

                ovr = inter / (areas[i] + areas[order[1:]] - inter + 1e-6)
                inds = np.where(ovr <= iou_thresh)[0]
                order = order[inds + 1]

        return np.array(sorted(keep), dtype=int)

    def decode(
        self,
        raw_output: np.ndarray,
        scale_x: float,
        scale_y: float,
        orig_w: int,
        orig_h: int,
        tile_id: Optional[str] = None,
        offset_x: int = 0,
        offset_y: int = 0
    ) -> List[DrishtiDetection]:
        """
        Decodes raw ONNX YOLO output tensor [1, 9, 8400] into DrishtiDetection objects.
        """
        # Shape: [1, 9, 8400] -> [8400, 9]
        preds = raw_output[0].T
        raw_boxes = preds[:, :4]  # cx, cy, w, h in 640x640 space
        raw_scores = preds[:, 4:]  # class probabilities for 5 classes

        max_scores = np.max(raw_scores, axis=1)
        max_classes = np.argmax(raw_scores, axis=1)

        # 1. Confidence threshold filtering
        valid_mask = max_scores >= self.confidence_threshold
        if not np.any(valid_mask):
            return []

        cand_boxes = raw_boxes[valid_mask]
        cand_scores = max_scores[valid_mask]
        cand_classes = max_classes[valid_mask]

        # 2. Convert [cx, cy, w, h] -> [x1, y1, x2, y2] in 640 space
        cx = cand_boxes[:, 0]
        cy = cand_boxes[:, 1]
        bw = cand_boxes[:, 2]
        bh = cand_boxes[:, 3]

        x1_640 = cx - (bw / 2.0)
        y1_640 = cy - (bh / 2.0)
        x2_640 = cx + (bw / 2.0)
        y2_640 = cy + (bh / 2.0)

        boxes_640 = np.column_stack([x1_640, y1_640, x2_640, y2_640])

        # 3. Apply pure NumPy NMS per class
        keep_indices = self._apply_nms(boxes_640, cand_scores, cand_classes, self.iou_threshold)
        if len(keep_indices) == 0:
            return []

        nms_boxes = boxes_640[keep_indices]
        nms_scores = cand_scores[keep_indices]
        nms_classes = cand_classes[keep_indices]

        detections: List[DrishtiDetection] = []

        for box, score, cls_idx in zip(nms_boxes, nms_scores, nms_classes):
            cls_id = int(cls_idx)
            # Source class label
            source_label = self.SOURCE_CLASSES.get(cls_id, f"class_{cls_id}")
            # Application class label (maps mine_cylinder -> mine_like_contact)
            app_label = self.APPLICATION_CLASSES.get(cls_id, source_label)

            # Rescale box back to original tile/image dimensions
            bx1 = int(round(box[0] * scale_x))
            by1 = int(round(box[1] * scale_y))
            bx2 = int(round(box[2] * scale_x))
            by2 = int(round(box[3] * scale_y))

            # Clamp to tile boundary
            bx1 = max(0, min(orig_w, bx1))
            by1 = max(0, min(orig_h, by1))
            bx2 = max(0, min(orig_w, bx2))
            by2 = max(0, min(orig_h, by2))

            # Translate to parent swath global coordinates
            global_x1 = bx1 + offset_x
            global_y1 = by1 + offset_y
            global_x2 = bx2 + offset_x
            global_y2 = by2 + offset_y

            # Apply product-level class policy: crab_pot is filtered downstream
            is_filtered = (source_label in self.filtered_classes) or (app_label in self.filtered_classes)
            filter_reason = (
                f"Filtered per product policy: '{source_label}' performance not suitable for production triage"
                if is_filtered else None
            )

            detections.append(DrishtiDetection(
                class_id=cls_id,
                class_name=app_label,
                confidence=round(float(score), 4),
                bbox=[global_x1, global_y1, global_x2, global_y2],
                image_width=orig_w,
                image_height=orig_h,
                tile_id=tile_id,
                model_name=self.model_name,
                model_version=self.model_version,
                is_filtered=is_filtered,
                filter_reason=filter_reason
            ))

        return detections

    def predict(
        self,
        image: np.ndarray,
        tile_id: Optional[str] = None,
        offset_x: int = 0,
        offset_y: int = 0
    ) -> List[DrishtiDetection]:
        """
        Executes end-to-end ONNX inference on an image or tile.
        """
        if image is None or image.size == 0:
            return []

        orig_h, orig_w = image.shape[:2]

        # 1. Authoritative P4 Preprocessing (Lee + CLAHE)
        preprocessed_bgr, _ = self.preprocess(image)

        # 2. Tensor transformation
        tensor, scale_x, scale_y = self._prepare_tensor(preprocessed_bgr)

        # 3. ONNX Runtime Execution
        output = self.session.run(None, {self.input_name: tensor})[0]

        # 4. YOLO output decoding + NMS + coordinate translation
        return self.decode(
            raw_output=output,
            scale_x=scale_x,
            scale_y=scale_y,
            orig_w=orig_w,
            orig_h=orig_h,
            tile_id=tile_id,
            offset_x=offset_x,
            offset_y=offset_y
        )

    def get_health_status(self) -> Dict[str, Any]:
        """Operational status and metadata for /health probes."""
        return {
            "provider": "onnx",
            "model": os.path.basename(self.model_path),
            "model_path": self.model_path,
            "runtime": "onnxruntime",
            "runtime_version": ort.__version__,
            "device": "CPU",
            "status": "ready",
            "input_name": self.input_name,
            "input_shape": list(self.input_shape),
            "output_name": self.output_name,
            "output_shape": list(self.output_shape),
            "confidence_threshold": self.confidence_threshold,
            "iou_threshold": self.iou_threshold,
            "source_classes": self.SOURCE_CLASSES,
            "application_class_mapping": self.APPLICATION_CLASSES,
            "filtered_classes": list(self.filtered_classes)
        }
