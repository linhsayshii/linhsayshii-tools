from sqlalchemy import Column, Integer, String, DateTime
from database import Base
import datetime
import random
import string

def generate_short_code(length=6):
    return ''.join(random.choices(string.ascii_letters + string.digits, k=length))

class URL(Base):
    __tablename__ = "urls"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String, unique=True, index=True)
    original_url = Column(String, index=True)
    custom_alias = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Paste(Base):
    __tablename__ = "pastes"
    id = Column(String, primary_key=True, index=True)
    content = Column(String)
    title = Column(String, default="Untitled")
    language = Column(String, default="plaintext")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    expires_at = Column(DateTime, index=True)
