from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from database import get_db
from models import Paste
from pydantic import BaseModel
import datetime
import uuid
import secrets

router = APIRouter()

class PasteCreate(BaseModel):
    content: str
    title: str = "Untitled"
    language: str = "plaintext"

@router.post("/create")
def create_paste(paste_data: PasteCreate, db: Session = Depends(get_db)):
    if not paste_data.content:
        raise HTTPException(status_code=400, detail="Content cannot be empty")
        
    paste_id = secrets.token_urlsafe(6) # Short ID
    now = datetime.datetime.utcnow()
    expires = now + datetime.timedelta(days=7)
    
    db_paste = Paste(
        id=paste_id,
        content=paste_data.content,
        title=paste_data.title,
        language=paste_data.language,
        created_at=now,
        expires_at=expires
    )
    db.add(db_paste)
    db.commit()
    db.refresh(db_paste)
    
    return {"id": paste_id, "expires_at": expires}

@router.get("/{paste_id}")
def get_paste(paste_id: str, db: Session = Depends(get_db)):
    paste = db.query(Paste).filter(Paste.id == paste_id).first()
    if not paste:
        raise HTTPException(status_code=404, detail="Paste not found")
    
    # Check expiry
    if paste.expires_at < datetime.datetime.utcnow():
        db.delete(paste) # Lazy delete
        db.commit()
        raise HTTPException(status_code=404, detail="Paste expired")
        
    return {
        "content": paste.content,
        "title": paste.title or "Untitled",
        "language": paste.language or "plaintext",
        "created_at": paste.created_at,
        "expires_at": paste.expires_at
    }
