import os
import pytest
import numpy as np
import cv2

from ml.inference.drishti_detector import DrishtiDetector, DrishtiDetection
from ml.inference.onnx_detector import ONNXDetector
from backend.app.core.config import settings


class TestDrishtiDetector:
    @pytest.fixture(scope="class")
    def detector(self):
        """Initializes detector instance."""
        return DrishtiDetector(confidence_threshold=0.10)

    def test_model_loads_successfully(self, detector):
        assert os.path.exists(detector.model_path)
        health = detector.get_health_status()
        assert health["status"] == "ready"
        assert health["provider"] == "onnx"

    def test_expected_class_mapping(self, detector):
        source_names = detector._detector.SOURCE_CLASSES
        assert source_names[0] == "crab_pot"
        assert source_names[1] == "submarine_pipeline"
        assert source_names[2] == "shipwreck"
        assert source_names[3] == "ghost_net"
        assert source_names[4] == "mine_cylinder"

        app_names = detector._detector.APPLICATION_CLASSES
        assert app_names[4] == "mine_like_contact"

    def test_inference_on_real_sonar_imagery(self, detector):
        img_path = "data/demo/sonar/viator_04_test_wreck.png"
        assert os.path.exists(img_path)
        raw_image = cv2.imread(img_path)
        assert raw_image is not None

        # Predict on crop containing shipwreck hull
        crop = raw_image[1000:1640, 400:1040]
        detections = detector.predict(crop, tile_id="TEST_VIATOR_CROP")

        assert isinstance(detections, list)
        assert len(detections) > 0

        for d in detections:
            assert isinstance(d, DrishtiDetection)
            assert 0.0 <= d.confidence <= 1.0
            x1, y1, x2, y2 = d.bbox
            assert d.tile_id == "TEST_VIATOR_CROP"

    def test_empty_detection_handling(self, detector):
        # Homogeneous black image should return empty list without crashing
        black_img = np.zeros((640, 640, 3), dtype=np.uint8)
        detections = detector.predict(black_img)
        assert isinstance(detections, list)
        assert len(detections) == 0

    def test_crab_pot_is_tagged_as_filtered(self, detector):
        # Decode synthetic raw output with crab_pot candidate
        # Output format [1, 9, 8400]: 4 box coords + 5 class scores
        dummy_out = np.zeros((1, 9, 8400), dtype=np.float32)
        # Box 0: cx=320, cy=320, w=100, h=100
        dummy_out[0, 0, 0] = 320.0
        dummy_out[0, 1, 0] = 320.0
        dummy_out[0, 2, 0] = 100.0
        dummy_out[0, 3, 0] = 100.0
        # Class 0 (crab_pot) score = 0.95
        dummy_out[0, 4, 0] = 0.95

        decoded = detector._detector.decode(
            dummy_out,
            scale_x=1.0,
            scale_y=1.0,
            orig_w=640,
            orig_h=640,
            tile_id="TEST_CRAB"
        )
        assert len(decoded) == 1
        d = decoded[0]
        assert d.class_id == 0
        assert d.class_name == "crab_pot"
        assert d.is_filtered is True
        assert "Filtered per product policy" in d.filter_reason
