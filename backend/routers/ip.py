from fastapi import APIRouter, Request
import requests
import ipaddress

router = APIRouter()


def get_client_ip(request: Request) -> str:
    # Cloudflare Tunnel injects the real client IP here (most reliable)
    cf_ip = request.headers.get("CF-Connecting-IP")
    if cf_ip:
        return cf_ip.strip()

    # Standard proxy header (nginx X-Forwarded-For)
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


def is_private_ip(ip: str) -> bool:
    try:
        return ipaddress.ip_address(ip).is_private
    except ValueError:
        return False


def is_valid_ip(ip: str) -> bool:
    try:
        ipaddress.ip_address(ip)
        return True
    except ValueError:
        return False


@router.get("/")
def get_ip_details(request: Request, ip: str = None):
    client_ip = ip.strip() if ip else None

    if client_ip and not is_valid_ip(client_ip):
        client_ip = None

    if not client_ip:
        client_ip = get_client_ip(request)

    if not is_valid_ip(client_ip):
        client_ip = "unknown"

    ipv4 = None
    ipv6 = None

    if client_ip and client_ip != "unknown":
        if is_ipv6(client_ip):
            ipv6 = client_ip
        else:
            ipv4 = client_ip

    # Skip geo lookup for private/loopback IPs (LAN access via DNS rewrite)
    lookup_ip = ipv4 or ipv6
    if lookup_ip and is_private_ip(lookup_ip):
        return {
            "ipv4": ipv4,
            "ipv6": ipv6,
            "location": "Local Network",
            "isp": "Private Network",
            "geo_details": {},
        }

    # Geo lookup for public IPs only
    geo = {}
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
