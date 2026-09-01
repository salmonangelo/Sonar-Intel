"""
Canonical Contact Data Model.

This is the single authoritative contract shared between:
- ML inference
- FastAPI backend
- PostGIS database
- React frontend

DO NOT ALLOW EVERY MODULE TO INVENT ITS OWN DATA STRUCTURE.
"""

from typing import Optional, Literal
from pydantic import BaseModel, Field


class BoundingBox(BaseModel):
    x1: int = Field(..., description="Top-left X coordinate in parent image")
    y1: int = Field(..., description="Top-left Y coordinate in parent image")
    x2: int = Field(..., description="Bottom-right X coordinate in parent image")
    y2: int = Field(..., description="Bottom-right Y coordinate in parent image")


class Contact(BaseModel):
    contact_id: str = Field(..., description="Unique contact identifier, e.g. C001")
    survey_id: str = Field(..., description="Foreign key reference to parent survey")
    class_name: str = Field(default="artificial_anomaly", description="Target classification")
    confidence: float = Field(..., ge=0.0, le=1.0, description="YOLO detector confidence")
    
    bbox: BoundingBox = Field(..., description="Pixel bounding box coordinates")
    
    data_quality: float = Field(default=1.0, ge=0.0, le=1.0, description="Acoustic swath signal quality")
    shadow_evidence: float = Field(default=0.0, ge=0.0, le=1.0, description="Acoustic shadow deficit ratio")
    context_score: float = Field(default=0.0, ge=0.0, le=1.0, description="Composite acoustic physics score")
    
    priority: Literal["HIGH", "MEDIUM", "LOW"] = Field(default="MEDIUM", description="Operational triage priority")
    
    latitude: Optional[float] = Field(default=None, description="WGS84 estimated latitude")
    longitude: Optional[float] = Field(default=None, description="WGS84 estimated longitude")
    
    localization_status: Literal["ESTIMATED", "VERIFIED", "UNCERTAIN", "UNAVAILABLE"] = Field(
        default="UNAVAILABLE",
        description="Reliability status of geospatial coordinates"
    )
    
    review_status: Literal["AI_CANDIDATE", "CONFIRMED", "FALSE_POSITIVE", "UNCERTAIN"] = Field(
        default="AI_CANDIDATE",
        description="Human-in-the-loop triage decision"
    )
    review_note: Optional[str] = Field(default=None, description="Human reviewer notes")
    model_version: str = Field(default="yolov8n-sonar-baseline", description="Model version provenance")

    model_config = {
        "from_attributes": True,
        "populate_by_name": True
    }

