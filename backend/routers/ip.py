from fastapi import APIRouter, Request
import requests
import ipaddress

router = APIRouter()


def get_client_ip(request: Request) -> str:
    # Respect proxy headers (nginx sets X-Forwarded-For)
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        # May be a comma-separated list; first entry is the original client
        return forwarded_for.split(",")[0].strip()

    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip.strip()

    # Direct connection (local dev without proxy)
    return request.client.host if request.client else "unknown"


def is_ipv6(ip: str) -> bool:
    try:
        return isinstance(ipaddress.ip_address(ip), ipaddress.IPv6Address)
    except ValueError:
        return False


@router.get("/")
def get_ip_details(request: Request):
    client_ip = get_client_ip(request)

    ipv4 = None
    ipv6 = None

    if client_ip and client_ip != "unknown":
        if is_ipv6(client_ip):
            ipv6 = client_ip
        else:
            ipv4 = client_ip

    # Geo lookup using the detected IP (prefer ipv4 for reliability)
    geo = {}
    lookup_ip = ipv4 or ipv6
    if lookup_ip:
        try:
            data = requests.get(f"http://ip-api.com/json/{lookup_ip}", timeout=2).json()
            if data.get("status") == "success":
                geo = {
                    "country": data.get("country"),
                    "region": data.get("regionName"),
                    "city": data.get("city"),
                    "isp": data.get("isp"),
                    "lat": data.get("lat"),
                    "lon": data.get("lon"),
                }
        except Exception:
            pass

    location_parts = [geo.get("city"), geo.get("region"), geo.get("country")]
    location = ", ".join(p for p in location_parts if p)

    return {
        "ipv4": ipv4,
        "ipv6": ipv6,
        "location": location or "Unknown",
        "isp": geo.get("isp", "Unknown"),
        "geo_details": geo,
    }
