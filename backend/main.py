from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from routers import shortener, downloader, qrcode, ip, paste
import os
import models
from database import engine

# Initialize database tables
models.Base.metadata.create_all(bind=engine)

from utils.cleanup import start_cleanup_daemon
from config import settings

app = FastAPI(title=settings.PROJECT_NAME, version=settings.VERSION)

# Start background cleanup for temp download files
start_cleanup_daemon(directory=".", pattern="download_*", interval_seconds=1800, max_age_seconds=1800)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

# Include routers
app.include_router(shortener.router, prefix="/api/shortener", tags=["Shortener"])
app.include_router(downloader.router, prefix="/api/downloader", tags=["Downloader"])
app.include_router(qrcode.router, prefix="/api/qrcode", tags=["QR Code"])
app.include_router(ip.router, prefix="/api/ip", tags=["IP Checker"])
app.include_router(paste.router, prefix="/api/paste", tags=["Paste"])

@app.get("/")
def read_root():
    return {"message": "Welcome to Personal Tools API"}

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": f"An unexpected error occurred: {str(exc)}"},
    )
