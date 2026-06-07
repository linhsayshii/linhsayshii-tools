from fastapi import APIRouter
import requests

router = APIRouter()

# Helper to check public IP from backend (still useful for single probe or confirming)
# But for PCC detection, the frontend should trigger multiple requests to us, 
# and WE should probe external services.
# 
# Wait, if frontend calls backend, backend is running on localhost.
# Backend makes request to "api.ipify.org".
# If outgoing connection is balanced, backend will see different returns? 
# YES.
# So backend just needs to return what IT sees as the public IP.

@router.get("/")
def get_ip_details():
    # 1. Get IPv4
    try:
        # We use a service that strictly returns the IP of the caller.
        # "api.ipify.org" is good.
        v4 = requests.get("https://api.ipify.org?format=json", timeout=2).json().get('ip')
    except:
        v4 = None
        
    # 2. Get IPv6 (optional, often fails if no connectivity)
    v6 = None
    try:
        # Use a v6 only or dual stack endpoint
        # if fail, assumption is no v6
        v6 = requests.get("https://api64.ipify.org?format=json", timeout=1).json().get('ip')
        if v6 == v4:
            v6 = None # It fell back to v4
    except:
        pass

    # 3. Get Geo Info for the detected v4 (most reliable for ISP info)
    geo = {}
    if v4:
        try:
            # Using ip-api.com
            data = requests.get(f"http://ip-api.com/json/{v4}", timeout=2).json()
            if data.get('status') == 'success':
                 geo = {
                    "country": data.get('country'),
                    "region": data.get('regionName'),
                    "city": data.get('city'),
                    "isp": data.get('isp'),
                    "lat": data.get('lat'),
                    "lon": data.get('lon'),
                    # "as": data.get('as') # User asked to remove AS
                 }
        except:
            pass

    return {
        "ipv4": v4,
        "ipv6": v6,
        "location": f"{geo.get('city', '')}, {geo.get('region', '')}, {geo.get('country', '')}".strip(', '),
        "isp": geo.get('isp', 'Unknown'),
        "geo_details": geo
    }
