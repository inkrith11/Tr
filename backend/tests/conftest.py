"""
Shared test fixtures for APSIT TradeHub backend tests.

Uses an in-memory SQLite database so tests run without any external services.
"""
import pytest
from typing import Generator, Callable
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, StaticPool
from sqlalchemy.orm import sessionmaker, Session

from app.database import Base, get_db
from app.main import app
from app.models.models import User, Listing, Review, Message, Favorite, RoleEnum
from app.services.auth import get_password_hash, create_access_token


# ---------------------------------------------------------------------------
# Database fixtures
# ---------------------------------------------------------------------------

SQLALCHEMY_DATABASE_URL = "sqlite://"  # in-memory

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(autouse=True)
def setup_database():
    """Create tables before each test and drop them after."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def db() -> Generator[Session, None, None]:
    """Provide a transactional test database session."""
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


def _override_get_db():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


app.dependency_overrides[get_db] = _override_get_db


@pytest.fixture()
def client() -> Generator[TestClient, None, None]:
    """FastAPI TestClient that uses the test database."""
    with TestClient(app) as c:
        yield c


# ---------------------------------------------------------------------------
# Helper factories
# ---------------------------------------------------------------------------

@pytest.fixture()
def create_test_user(db: Session) -> Callable:
    """Factory fixture that creates a user in the test DB and returns it."""
    _counter = [0]

    def _create(
        email: str | None = None,
        name: str = "Test User",
        password: str = "testpass123",
        role: RoleEnum = RoleEnum.user,
        is_banned: bool = False,
    ) -> User:
        _counter[0] += 1
        if email is None:
            email = f"user{_counter[0]}@apsit.edu.in"
        user = User(
            email=email,
            name=name,
            hashed_password=get_password_hash(password),
            role=role,
            is_banned=is_banned,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    return _create


@pytest.fixture()
def get_auth_headers() -> Callable:
    """Return authorization headers for a given user."""

    def _headers(user: User) -> dict[str, str]:
        token = create_access_token(data={"sub": str(user.id)})
        return {"Authorization": f"Bearer {token}"}

    return _headers


@pytest.fixture()
def create_test_listing(db: Session) -> Callable:
    """Factory fixture that creates a listing in the test DB."""
    _counter = [0]

    def _create(
        seller: User,
        title: str | None = None,
        price: float = 100.0,
        category: str = "Books",
        condition: str = "good",
        status: str = "available",
    ) -> Listing:
        _counter[0] += 1
        if title is None:
            title = f"Test Listing {_counter[0]}"
        listing = Listing(
            seller_id=seller.id,
            title=title,
            description="A valid test description that is long enough to pass validation checks.",
            price=price,
            category=category,
            condition=condition,
            status=status,
            image_url="http://example.com/img1.jpg",
        )
        db.add(listing)
        db.commit()
        db.refresh(listing)
        return listing

    return _create


@pytest.fixture()
def test_user(create_test_user):
    """A convenience fixture for a single default user."""
    return create_test_user()


@pytest.fixture()
def test_user_headers(test_user, get_auth_headers):
    """Auth headers for the default test_user."""
    return get_auth_headers(test_user)


@pytest.fixture()
def admin_user(create_test_user):
    """An admin user."""
    return create_test_user(email="admin@apsit.edu.in", name="Admin", role=RoleEnum.admin)


@pytest.fixture()
def admin_headers(admin_user, get_auth_headers):
    return get_auth_headers(admin_user)
