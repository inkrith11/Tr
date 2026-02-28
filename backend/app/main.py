import logging
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from pathlib import Path
from collections import defaultdict
import time

from .config import settings
from .database import engine, Base
from .routers import (
    auth_router,
    listings_router,
    messages_router,
    users_router,
    reviews_router,
    admin_router
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="APSIT TradeHub API",
    description="Backend API for APSIT TradeHub - A marketplace for APSIT students",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)


# ---------- Simple in-memory rate limiter ----------
_rate_store: dict[str, list[float]] = defaultdict(list)
RATE_LIMIT_PATHS = {"/api/auth/login", "/api/auth/register", "/api/auth/google", "/api/auth/google-token"}
RATE_LIMIT_MAX = 10  # requests
RATE_LIMIT_WINDOW = 60  # seconds


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    if request.url.path in RATE_LIMIT_PATHS and request.method == "POST":
        client_ip = request.client.host if request.client else "unknown"
        key = f"{client_ip}:{request.url.path}"
        now = time.time()
        # Prune old entries
        _rate_store[key] = [t for t in _rate_store[key] if now - t < RATE_LIMIT_WINDOW]
        if len(_rate_store[key]) >= RATE_LIMIT_MAX:
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={"detail": "Too many requests. Please try again later."},
            )
        _rate_store[key].append(now)
    return await call_next(request)


# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
)

# Mount uploads directory for local file storage
uploads_dir = Path("uploads")
uploads_dir.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include routers with /api prefix
app.include_router(auth_router, prefix="/api")
app.include_router(listings_router, prefix="/api")
app.include_router(messages_router, prefix="/api")
app.include_router(users_router, prefix="/api")
app.include_router(reviews_router, prefix="/api")
app.include_router(admin_router, prefix="/api")


@app.get("/")
def root():
    """Root endpoint - API health check"""
    return {
        "message": "Welcome to APSIT TradeHub API",
        "status": "healthy",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
def health_check():
    """Health check endpoint for monitoring"""
    return {"status": "healthy"}
