"""
Inference Orchestration Service.

Connects:
Preprocessing -> YOLOv8n Candidate Detector -> Tile Deduplication ->
Acoustic Context Analysis -> Geolocation -> Priority Scoring ->
Canonical Contact Generation.
"""

from typing import List, Optional
import os
import cv2
from backend.app.schemas.contact import Contact, BoundingBox
from ml.preprocessing.pipeline import SonarPreprocessingPipeline
from ml.inference.detector import SonarDetector
from ml.inference.postprocess import deduplicate_detections
from ml.inference.context import extract_acoustic_context
from backend.app.services.scoring_service import calculate_contact_priority
from backend.app.services.geolocation_service import GeolocationService


class InferenceService:
    def __init__(
        self,
        model_path: str = "ml/models/yolov8n.pt",
        confidence_threshold: float = 0.25,
        device: str = "cpu"
    ):
        self.detector = SonarDetector(
            model_path=model_path,
            confidence_threshold=confidence_threshold,
            device=device
        )
        self.pipeline = SonarPreprocessingPipeline()

    def run_survey_analysis(
        self,
        survey_id: str,
        raw_image_path: str,
        nav_file_path: Optional[str] = None,
        confidence_threshold: Optional[float] = None
    ) -> List[Contact]:
        """
        Executes full 8-stage anomaly detection on a survey swath.
        Returns a list of Canonical Contact objects.
        """
        if confidence_threshold is not None:
            self.detector.confidence_threshold = confidence_threshold

        # 1. Preprocess & Tile
        prep_results = self.pipeline.run(raw_image_path)
        processed_img = prep_results["processed_image"]
        quality_score = prep_results["quality_metrics"]["quality_score"]
        tiles = prep_results["tiles"]
        img_h, img_w = prep_results["image_shape"]

        # 2. Run Candidate Detection on all tiles
        raw_candidates = self.detector.detect_all_tiles(tiles)

        # 3. Deduplicate detections across overlapping tiles
        filtered_candidates = deduplicate_detections(raw_candidates, iou_threshold=0.35)

        # 4. Geolocation service initialization
        geo_service = GeolocationService(nav_file_path=nav_file_path)

        contacts: List[Contact] = []
        for idx, cand in enumerate(filtered_candidates):
            contact_id = f"C{idx+1:03d}"
            bbox_dict = cand["bbox"]

            # Acoustic Context Extraction
            context = extract_acoustic_context(
                image=processed_img,
                bbox=bbox_dict,
                nadir_x=img_w // 2
            )

            # Geolocation Estimation
            center_x = (bbox_dict["x1"] + bbox_dict["x2"]) // 2
            center_y = (bbox_dict["y1"] + bbox_dict["y2"]) // 2
            lat, lon, loc_status = geo_service.estimate_contact_location(
                bbox_center_x=center_x,
                bbox_center_y=center_y,
                image_width=img_w,
                image_height=img_h
            )

            # Priority Decision Scoring
            priority_label, _ = calculate_contact_priority(
                confidence=cand["confidence"],
                context_score=context["context_score"],
                data_quality=quality_score,
                localization_status=loc_status
            )

            contacts.append(Contact(
                contact_id=contact_id,
                survey_id=survey_id,
                class_name=cand.get("class_name", "artificial_anomaly"),
                confidence=cand["confidence"],
                bbox=BoundingBox(
                    x1=bbox_dict["x1"],
                    y1=bbox_dict["y1"],
                    x2=bbox_dict["x2"],
                    y2=bbox_dict["y2"]
                ),
                data_quality=quality_score,
                shadow_evidence=context["shadow_evidence"],
                context_score=context["context_score"],
                priority=priority_label,
                latitude=lat,
                longitude=lon,
                localization_status=loc_status,
                review_status="AI_CANDIDATE",
                review_note=None,
                model_version=self.detector.model_version
            ))

        return contacts
