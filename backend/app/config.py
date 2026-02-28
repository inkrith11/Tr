import os
import secrets
import logging
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)


def _get_secret_key() -> str:
    """Get SECRET_KEY from env or generate a random one (dev only)."""
    key = os.getenv("SECRET_KEY", "")
    if not key or key == "your-super-secret-key-change-this":
        logger.warning(
            "SECRET_KEY is not set or is using the insecure default. "
            "Generate one with: openssl rand -hex 32"
        )
        # Generate a random key for development — tokens won't survive restarts
        key = secrets.token_hex(32)
    return key


class Settings:
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/apsit_tradehub")

    # JWT
    SECRET_KEY: str = _get_secret_key()
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

    # Google OAuth
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")

    # Cloudinary
    CLOUDINARY_CLOUD_NAME: str = os.getenv("CLOUDINARY_CLOUD_NAME", "")
    CLOUDINARY_API_KEY: str = os.getenv("CLOUDINARY_API_KEY", "")
    CLOUDINARY_API_SECRET: str = os.getenv("CLOUDINARY_API_SECRET", "")

    # Email Domain
    ALLOWED_EMAIL_DOMAIN: str = os.getenv("ALLOWED_EMAIL_DOMAIN", "apsit.edu.in")

    # CORS
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")

    # Upload limits
    MAX_IMAGE_SIZE_MB: int = int(os.getenv("MAX_IMAGE_SIZE_MB", "5"))
    ALLOWED_IMAGE_TYPES: set = {"image/jpeg", "image/png", "image/webp"}

    @property
    def CORS_ORIGINS(self) -> list[str]:
        origins = {self.FRONTEND_URL, "http://localhost:5173", "http://127.0.0.1:5173"}
        extra = os.getenv("EXTRA_CORS_ORIGINS", "")
        if extra:
            origins.update(o.strip() for o in extra.split(",") if o.strip())
        # Never allow wildcard in production
        origins.discard("*")
        return list(origins)


settings = Settings()
