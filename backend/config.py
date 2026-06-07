import os

class Settings:
    PROJECT_NAME: str = "linhsayshii-tools API"
    VERSION: str = "1.0.0"
    
    # Cloudflare Turnstile Configuration
    TURNSTILE_SECRET_KEY: str = os.environ.get(
        "TURNSTILE_SECRET_KEY", "1x0000000000000000000000000000000AA"
    )
    
    # Database Configuration
    DATABASE_URL: str = os.environ.get(
        "DATABASE_URL", "sqlite:///./data/shortener.db"
    )
    
    # Base domain used for generating share/short links
    BASE_DOMAIN: str = os.environ.get("BASE_DOMAIN", "https://hnglinh.io.vn")

    # Short URL Base Configuration (defaults to BASE_DOMAIN if not set)
    SHORT_URL_BASE: str = os.environ.get("SHORT_URL_BASE") or os.environ.get("BASE_DOMAIN", "https://hnglinh.io.vn")

    # Paste share URL Base Configuration (defaults to BASE_DOMAIN if not set)
    PASTE_URL_BASE: str = os.environ.get("PASTE_URL_BASE") or os.environ.get("BASE_DOMAIN", "https://hnglinh.io.vn")
    
    # CORS Origins Configuration
    CORS_ORIGINS_RAW: str = os.environ.get("CORS_ORIGINS", "")
    
    @property
    def cors_origins(self):
        if self.CORS_ORIGINS_RAW:
            return [origin.strip() for origin in self.CORS_ORIGINS_RAW.split(",")]
        base = self.BASE_DOMAIN.rstrip("/")
        origins = ["http://localhost:5173", "http://localhost:3000", base]
        # Also include www variant if not already present
        if base.startswith("https://") and not base.startswith("https://www."):
            origins.append("https://www." + base.removeprefix("https://"))
        return origins

settings = Settings()
