import os
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

_last_cgroup_time = None
_last_cgroup_usage = None

def get_cgroup_cpu_percent():
    global _last_cgroup_time, _last_cgroup_usage
    
    # Check if we have host cgroup mounted (e.g. inside Docker to read LXC host stats)
    cgroup_base = "/host/sys/fs/cgroup" if os.path.exists("/host/sys/fs/cgroup") else "/sys/fs/cgroup"
    
    # Try cgroup v2 first
    cpu_stat_path = os.path.join(cgroup_base, "cpu.stat")
    if os.path.exists(cpu_stat_path):
        try:
            with open(cpu_stat_path, "r") as f:
                content = f.read()
            usage_usec = None
            for line in content.splitlines():
                if line.startswith("usage_usec"):
                    usage_usec = int(line.split()[1])
                    break
            if usage_usec is not None:
                now = time.time()
                if _last_cgroup_time is not None and now > _last_cgroup_time:
                    delta_time = now - _last_cgroup_time
                    delta_usage = usage_usec - _last_cgroup_usage
                    
                    # Number of cores allocated
                    try:
                        cores = len(os.sched_getaffinity(0)) if hasattr(os, "sched_getaffinity") else (psutil.cpu_count() or 1)
                    except Exception:
                        cores = psutil.cpu_count() or 1
                    
                    percent = (delta_usage / (delta_time * 1000000.0)) * 100.0
                    percent = percent / cores
                    
                    _last_cgroup_time = now
                    _last_cgroup_usage = usage_usec
                    return min(max(percent, 0.0), 100.0)
                else:
                    _last_cgroup_time = now
                    _last_cgroup_usage = usage_usec
                    return None
        except Exception as e:
            print(f"Error reading cgroup v2: {e}")

    # Try cgroup v1
    cgroup_v1_path = None
    possible_v1_paths = [
        os.path.join(cgroup_base, "cpuacct/cpuacct.usage"),
        "/sys/fs/cgroup/cpuacct/cpuacct.usage"
    ]
    for p in possible_v1_paths:
        if os.path.exists(p):
            cgroup_v1_path = p
            break
            
    if cgroup_v1_path:
        try:
            with open(cgroup_v1_path, "r") as f:
                usage_ns = int(f.read().strip())
            now = time.time()
            if _last_cgroup_time is not None and now > _last_cgroup_time:
                delta_time = now - _last_cgroup_time
                delta_usage = usage_ns - _last_cgroup_usage
                
                try:
                    cores = len(os.sched_getaffinity(0)) if hasattr(os, "sched_getaffinity") else (psutil.cpu_count() or 1)
                except Exception:
                    cores = psutil.cpu_count() or 1
                    
                percent = (delta_usage / (delta_time * 1e9)) * 100.0
                percent = percent / cores
                
                _last_cgroup_time = now
                _last_cgroup_usage = usage_ns
                return min(max(percent, 0.0), 100.0)
            else:
                _last_cgroup_time = now
                _last_cgroup_usage = usage_ns
                return None
        except Exception as e:
            print(f"Error reading cgroup v1: {e}")
            
    return None

def _cpu_sampler():
    """Sample CPU in background non-blocking, sleeping between samples."""
    # Pre-initialize measurements
    get_cgroup_cpu_percent()
    psutil.cpu_percent(interval=None)
    
    while True:
        time.sleep(5)
        # Try cgroup (which reads LXC stats if mounted to /host/sys/fs/cgroup)
        cgroup_val = get_cgroup_cpu_percent()
        if cgroup_val is not None:
            _cpu_cache["value"] = cgroup_val
        else:
            # Fallback to psutil (e.g. on macOS local dev environment)
            _cpu_cache["value"] = psutil.cpu_percent(interval=None)

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
