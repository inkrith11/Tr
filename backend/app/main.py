from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

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

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads directory for local file storage
uploads_dir = Path("uploads")
uploads_dir.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include routers
app.include_router(auth_router)
app.include_router(listings_router)
app.include_router(messages_router)
app.include_router(users_router)
app.include_router(reviews_router)
app.include_router(admin_router)


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
