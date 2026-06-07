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
    
    # Short URL Base Configuration
    SHORT_URL_BASE: str = os.environ.get("SHORT_URL_BASE", "https://hnglinh.io.vn")
    
    # CORS Origins Configuration
    CORS_ORIGINS_RAW: str = os.environ.get("CORS_ORIGINS", "")
    
    @property
    def cors_origins(self):
        if self.CORS_ORIGINS_RAW:
            return [origin.strip() for origin in self.CORS_ORIGINS_RAW.split(",")]
        return [
            "http://localhost:5173",
            "http://localhost:3000",
            "https://hnglinh.io.vn",
            "https://www.hnglinh.io.vn",
        ]

settings = Settings()
