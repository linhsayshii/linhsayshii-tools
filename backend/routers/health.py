import time
import psutil
from fastapi import APIRouter

router = APIRouter()

# Record server start time
_START_TIME = time.time()

MODULES = ["shortener", "downloader", "paste", "qrcode", "ip"]


@router.get("")
def get_health():
    """Return real system diagnostics."""
    uptime_seconds = int(time.time() - _START_TIME)
    hours, remainder = divmod(uptime_seconds, 3600)
    minutes = remainder // 60

    cpu_percent = psutil.cpu_percent(interval=0.1)

    return {
        "cpu": round(cpu_percent, 1),
        "uptime": {"hours": hours, "minutes": minutes, "total_seconds": uptime_seconds},
        "modules": {
            "total": len(MODULES),
            "active": len(MODULES),
            "list": MODULES,
        },
    }
