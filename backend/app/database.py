from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from .config import settings

# Create database engine
db_url = settings.DATABASE_URL
if not db_url:
    # Use SQLite for development if no DATABASE_URL is set
    db_url = "sqlite:///./tradehub.db"
    engine = create_engine(db_url, connect_args={"check_same_thread": False})
elif db_url.startswith("sqlite"):
    engine = create_engine(db_url, connect_args={"check_same_thread": False})
else:
    engine = create_engine(db_url)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
