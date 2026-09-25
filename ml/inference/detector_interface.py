"""
Sonar Anomaly Detector Abstract Interface.

Defines the contract for all candidate anomaly detectors (ONNX, PyTorch/Local, Hugging Face).
Isolates runtime-specific tensors and dependencies from the rest of SONAR-INTEL.
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
import numpy as np
from dataclasses import dataclass, asdict


@dataclass
class DrishtiDetection:
    """Model-independent internal detection representation."""
    class_id: int
    class_name: str
    confidence: float
    bbox: List[int]  # [x1, y1, x2, y2]
    image_width: int
    image_height: int
    tile_id: Optional[str] = None
    model_name: str = "DRISHTI-YOLOv8s"
    model_version: str = "baseline-v1"
    is_filtered: bool = False
    filter_reason: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class BaseSonarDetector(ABC):
    """Abstract base class for all side-scan sonar candidate detectors."""

    @abstractmethod
    def predict(
        self,
        image: np.ndarray,
        tile_id: Optional[str] = None,
        offset_x: int = 0,
        offset_y: int = 0
    ) -> List[DrishtiDetection]:
        """
        Executes candidate anomaly detection on a single image or tile.

        Args:
            image: 2D or 3D numpy image array.
            tile_id: Optional identifier if running on swath tiles.
            offset_x: Horizontal coordinate offset in parent swath.
            offset_y: Vertical coordinate offset in parent swath.

        Returns:
            List of DrishtiDetection objects with global bounding boxes.
        """
        pass

    @abstractmethod
    def get_health_status(self) -> Dict[str, Any]:
        """Returns the operational status and metadata of the detector."""
        pass
