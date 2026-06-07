from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from database import get_db, engine
import models
import re
from config import settings

# Database initialization moved to main.py

router = APIRouter()

from typing import Optional

class URLCreate(BaseModel):
    url: str
    custom_alias: Optional[str] = None

class URLResponse(BaseModel):
    short_url: str
    original_url: str

@router.post("/shorten", response_model=URLResponse)
def shorten_url(item: URLCreate, db: Session = Depends(get_db)):
    code = None
    
    if item.custom_alias:
        # Validate alias (alphanumeric, max len)
        if not re.match("^[a-zA-Z0-9-_]+$", item.custom_alias):
             raise HTTPException(status_code=400, detail="Alias can only contain letters, numbers, hyphens, and underscores.")
        
        # Check availability
        if db.query(models.URL).filter(models.URL.slug == item.custom_alias).first():
             raise HTTPException(status_code=400, detail="Alias already exists.")
        
        code = item.custom_alias
    else:
        # Generate unique code
        code = models.generate_short_code()
        while db.query(models.URL).filter(models.URL.slug == code).first():
            code = models.generate_short_code()
        
    db_url = models.URL(original_url=item.url, slug=code, custom_alias=item.custom_alias if item.custom_alias else None)
    db.add(db_url)
    db.commit()
    db.refresh(db_url)
    
    # Return formatted URL
    return URLResponse(original_url=item.url, short_url=f"{settings.SHORT_URL_BASE}/{code}")

@router.get("/{short_code}")
def redirect_to_url(short_code: str, db: Session = Depends(get_db)):
    db_url = db.query(models.URL).filter(models.URL.slug == short_code).first()
    if db_url:
        return RedirectResponse(url=db_url.original_url)
    else:
        raise HTTPException(status_code=404, detail="URL not found")
