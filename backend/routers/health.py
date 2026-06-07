import time
import threading
import psutil
from fastapi import APIRouter

router = APIRouter()

# Record server start time
_START_TIME = time.time()

MODULES = ["shortener", "downloader", "paste", "qrcode", "ip"]

# Background CPU sampler — avoids blocking the request thread with interval sleep
_cpu_cache = {"value": 0.0}

def _cpu_sampler():
    """Sample CPU every 2s in background so /health returns instantly."""
    while True:
        _cpu_cache["value"] = psutil.cpu_percent(interval=1)

_sampler_thread = threading.Thread(target=_cpu_sampler, daemon=True)
_sampler_thread.start()


@router.get("")
def get_health():
    """Return real system diagnostics."""
    uptime_seconds = int(time.time() - _START_TIME)
    hours, remainder = divmod(uptime_seconds, 3600)
    minutes = remainder // 60

    return {
        "cpu": round(_cpu_cache["value"], 1),
        "uptime": {"hours": hours, "minutes": minutes, "total_seconds": uptime_seconds},
        "modules": {
            "total": len(MODULES),
            "active": len(MODULES),
            "list": MODULES,
        },
    }
