from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
import yt_dlp
import os
import json
import random
import hashlib
from urllib.parse import quote
from config import settings

router = APIRouter()

SECRET_KEY = "hvlsv_secure_key"

import requests

TURNSTILE_SECRET_KEY = settings.TURNSTILE_SECRET_KEY

def verify_turnstile(token: str):
    try:
        # Verify with Cloudflare Turnstile
        verify_url = "https://challenges.cloudflare.com/turnstile/v0/siteverify"
        data = {
            "secret": TURNSTILE_SECRET_KEY,
            "response": token
        }
        response = requests.post(verify_url, data=data)
        result = response.json()
        
        if not result.get("success"):
             print(f"Turnstile Failed: {result}")
             
             # DEVELOPMENT BYPASS: If using the default test key, allow even if validation fails
             if TURNSTILE_SECRET_KEY == "1x0000000000000000000000000000000AA":
                  print("dev_warning: Bypass Turnstile verification for Test Key")
                  return True
                  
             return False
        return True
    except Exception as e:
        print(f"Turnstile Error: {e}")
        return False

# @router.get("/captcha") -> DELETED

@router.get("/info")
def get_video_info(url: str):
    try:
        ydl_opts = {'quiet': True, 'no_warnings': True}
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            # Filter needed info
            return {
                "title": info.get('title'),
                "thumbnail": info.get('thumbnail'),
                "duration": info.get('duration'),
                "uploader": info.get('uploader'),
                "formats": [
                    {
                        "format_id": f.get('format_id'),
                        "ext": f.get('ext'),
                        "resolution": f.get('resolution'),
                        "note": f.get('format_note'),
                        "filesize": f.get('filesize'),
                        "filesize_approx": f.get('filesize_approx'),
                        "acodec": f.get('acodec'),
                        "vcodec": f.get('vcodec')
                    } for f in info.get('formats', []) if f.get('ext') in ['mp4', 'm4a', 'webm']
                ]
            }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/download")
def download_video(url: str, turnstile_token: str = None, format_id: str = None):
    try:
        # 1. Verify Captcha
        if not turnstile_token:
             raise HTTPException(status_code=400, detail="Vui lòng hoàn thành Captcha.")
        
        if not verify_turnstile(turnstile_token):
             raise HTTPException(status_code=400, detail="Xác thực Captcha thất bại. Vui lòng thử lại.")


        # Use a temporary filename
        import uuid
        temp_filename = f"download_{uuid.uuid4()}"
        
        ydl_opts = {
            'format': f"{format_id}+bestaudio/best" if format_id else 'best',
            'outtmpl': f"{temp_filename}.%(ext)s",
            'merge_output_format': 'mp4',  # Ensure we get mp4
            'quiet': True,
            'overwrites': True,
        }
        
        # Download (and merge) to server
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            filename = ydl.prepare_filename(info)
            # If changed extension due to merge
            if not os.path.exists(filename):
                base = os.path.splitext(filename)[0]
                filename = f"{base}.mp4"

        # Stream response
        if not os.path.exists(filename):
             raise HTTPException(status_code=404, detail="File could not be generated.")

        def iterfile():
            try:
                with open(filename, mode="rb") as file_like:
                    yield from file_like
            finally:
                # Cleanup
                if os.path.exists(filename):
                    os.remove(filename)

        # Sanitize filename
        import re
        import unicodedata

        def sanitize_filename(name):
            # Normalize unicode characters
            name = unicodedata.normalize('NFKD', name).encode('ascii', 'ignore').decode('ascii')
            # Remove invalid chars
            name = re.sub(r'[\\/*?:"<>|]', "", name)
            # Remove control chars
            name = "".join(ch for ch in name if unicodedata.category(ch)[0] != "C")
            return name.strip() or "video"

        title = info.get('title', 'video')
        # Create a safe ASCII filename for legacy browsers
        ascii_filename = f"{sanitize_filename(title)}.mp4"
        # Create a UTF-8 filename for modern browsers
        utf8_filename = quote(f"{title}.mp4")
        
        return StreamingResponse(iterfile(), media_type="video/mp4", headers={
            "Content-Disposition": f"attachment; filename=\"{ascii_filename}\"; filename*=UTF-8''{utf8_filename}"
        })

    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
