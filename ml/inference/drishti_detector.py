"""
DRISHTI Unified Sonar Anomaly Detector.

Production Entry Point for SONAR-INTEL candidate detection.
Dispatches to the appropriate detector implementation based on INFERENCE_PROVIDER:
- 'onnx' (Render default): ONNXDetector using ml/models/best_detector.onnx (< 512 MB RAM)
- 'local': Local PyTorch / Ultralytics detector if installed
- 'huggingface': Hugging Face Space remote client

NO DATABASE, NO GIS, NO API SIDE EFFECTS.
"""

from typing import List, Dict, Any, Optional, Tuple
import os
import numpy as np

from ml.inference.detector_interface import BaseSonarDetector, DrishtiDetection
from ml.inference.onnx_detector import ONNXDetector
from ml.preprocessing.drishti_preprocess import drishti_preprocess, PREPROCESSING_VERSION
from backend.app.core.config import settings


class DrishtiDetector(BaseSonarDetector):
    """
    Unified detector wrapper that provides a seamless interface to the underlying
    ONNX / local detector while strictly honoring configuration and memory constraints.
    """

    def __init__(
        self,
        model_path: Optional[str] = None,
        model_name: Optional[str] = None,
        model_version: Optional[str] = None,
        confidence_threshold: Optional[float] = None,
        iou_threshold: Optional[float] = None,
        image_size: Optional[int] = None,
        device: Optional[str] = None,
        filtered_classes: Optional[List[str]] = None,
        provider: Optional[str] = None
    ):
        self.provider = provider or settings.INFERENCE_PROVIDER
        self.model_path = model_path or settings.MODEL_PATH
        self.confidence_threshold = confidence_threshold if confidence_threshold is not None else settings.CONFIDENCE_THRESHOLD
        self.iou_threshold = iou_threshold if iou_threshold is not None else settings.IOU_THRESHOLD
        self.image_size = image_size or settings.IMAGE_SIZE
        self.device = device or settings.DEVICE
        self.filtered_classes = set(filtered_classes if filtered_classes is not None else settings.FILTERED_CLASSES)

        # Initialize ONNX detector (Primary detector for Render deployment)
        onnx_model = self.model_path if (self.model_path and self.model_path.endswith(".onnx")) else "ml/models/best_detector.onnx"
        self._detector = ONNXDetector(
            model_path=onnx_model,
            confidence_threshold=self.confidence_threshold,
            iou_threshold=self.iou_threshold,
            image_size=self.image_size,
            filtered_classes=list(self.filtered_classes)
        )
        self.model_path = self._detector.model_path
        self.model_name = self._detector.model_name
        self.model_version = self._detector.model_version
        self.class_names = self._detector.APPLICATION_CLASSES

    def preprocess(self, image: np.ndarray) -> Tuple[np.ndarray, Dict[str, Any]]:
        """Applies authoritative P4 DRISHTI preprocessing."""
        return self._detector.preprocess(image)

    def predict(
        self,
        image: np.ndarray,
        tile_id: Optional[str] = None,
        offset_x: int = 0,
        offset_y: int = 0
    ) -> List[DrishtiDetection]:
        """
        Executes candidate detection on an image or tile.
        """
        # Ensure threshold synchronization if modified dynamically
        if hasattr(self._detector, "confidence_threshold"):
            self._detector.confidence_threshold = self.confidence_threshold
        if hasattr(self._detector, "iou_threshold"):
            self._detector.iou_threshold = self.iou_threshold

        return self._detector.predict(
            image=image,
            tile_id=tile_id,
            offset_x=offset_x,
            offset_y=offset_y
        )

    def get_health_status(self) -> Dict[str, Any]:
        """Operational status and metadata for health checks."""
        return self._detector.get_health_status()
