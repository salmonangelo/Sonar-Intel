"""
Contacts Query API Endpoints.

GET /api/surveys/{survey_id}/contacts
GET /api/contacts/{contact_id}
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database.connection import get_db
from backend.app.database.repository import ContactRepository, SurveyRepository
from backend.app.schemas.contact import Contact

router = APIRouter(tags=["Contacts"])


@router.get("/api/surveys/{survey_id}/contacts", response_model=List[Contact])
async def get_survey_contacts(survey_id: str, db: Session = Depends(get_db)):
    """Retrieves all detected canonical contacts for a specific survey."""
    survey = SurveyRepository(db).get_survey(survey_id)
    if not survey:
        raise HTTPException(status_code=404, detail=f"Survey '{survey_id}' not found.")

    repo = ContactRepository(db)
    return repo.get_contacts_by_survey(survey_id)


@router.get("/api/contacts/{contact_id}", response_model=Contact)
async def get_contact(contact_id: str, db: Session = Depends(get_db)):
    """Retrieves a single canonical contact by its ID."""
    repo = ContactRepository(db)
    contact = repo.get_contact_by_id(contact_id)
    if not contact:
        raise HTTPException(status_code=404, detail=f"Contact '{contact_id}' not found.")
    return contact
