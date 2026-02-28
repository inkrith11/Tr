"""
Tests for authentication endpoints: /api/auth/*
"""
import pytest
from fastapi.testclient import TestClient


class TestRegister:
    """POST /api/auth/register"""

    def test_register_with_valid_apsit_email(self, client: TestClient):
        """Register with a valid @apsit.edu.in email → 201."""
        payload = {
            "email": "newstudent@apsit.edu.in",
            "name": "New Student",
            "password": "securepass123",
        }
        response = client.post("/api/auth/register", json=payload)
        assert response.status_code == 201
        data = response.json()
        assert "access_token" in data
        assert data["user"]["email"] == "newstudent@apsit.edu.in"

    def test_register_with_non_apsit_email_rejected(self, client: TestClient):
        """Register with @gmail.com → 422 (Pydantic validation)."""
        payload = {
            "email": "someone@gmail.com",
            "name": "Bad User",
            "password": "securepass123",
        }
        response = client.post("/api/auth/register", json=payload)
        assert response.status_code == 422

    def test_register_duplicate_email(self, client: TestClient, create_test_user, db):
        """Register with an already-registered email → 400."""
        user = create_test_user(email="dup@apsit.edu.in")
        payload = {
            "email": "dup@apsit.edu.in",
            "name": "Duplicate",
            "password": "securepass123",
        }
        response = client.post("/api/auth/register", json=payload)
        assert response.status_code == 400
        assert "already registered" in response.json()["detail"].lower()

    def test_register_missing_fields(self, client: TestClient):
        """Register with missing required fields → 422."""
        response = client.post("/api/auth/register", json={"email": "a@apsit.edu.in"})
        assert response.status_code == 422

    def test_register_short_password(self, client: TestClient):
        """Register with password < 8 chars → 422."""
        payload = {
            "email": "short@apsit.edu.in",
            "name": "Short Pass",
            "password": "abc",
        }
        response = client.post("/api/auth/register", json=payload)
        assert response.status_code == 422

    def test_register_empty_name(self, client: TestClient):
        """Register with empty name → 422."""
        payload = {
            "email": "noname@apsit.edu.in",
            "name": "",
            "password": "securepass123",
        }
        response = client.post("/api/auth/register", json=payload)
        assert response.status_code == 422


class TestLogin:
    """POST /api/auth/login"""

    def test_login_correct_credentials(self, client: TestClient, create_test_user, db):
        """Login with correct email+password → 200 + token."""
        create_test_user(email="login@apsit.edu.in", password="mypassword1")
        payload = {"email": "login@apsit.edu.in", "password": "mypassword1"}
        response = client.post("/api/auth/login", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_login_wrong_password(self, client: TestClient, create_test_user, db):
        """Login with wrong password → 401."""
        create_test_user(email="wrong@apsit.edu.in", password="correct")
        payload = {"email": "wrong@apsit.edu.in", "password": "incorrect"}
        response = client.post("/api/auth/login", json=payload)
        assert response.status_code == 401

    def test_login_non_existent_email(self, client: TestClient):
        """Login with non-existent email → 401."""
        payload = {"email": "ghost@apsit.edu.in", "password": "nopassword"}
        response = client.post("/api/auth/login", json=payload)
        assert response.status_code == 401

    def test_login_banned_user(self, client: TestClient, create_test_user, db):
        """Login as banned user → 403."""
        create_test_user(email="banned@apsit.edu.in", password="password1", is_banned=True)
        payload = {"email": "banned@apsit.edu.in", "password": "password1"}
        response = client.post("/api/auth/login", json=payload)
        assert response.status_code == 403


class TestGetMe:
    """GET /api/auth/me"""

    def test_get_me_with_valid_token(self, client: TestClient, test_user, test_user_headers):
        """Valid token → returns user data."""
        response = client.get("/api/auth/me", headers=test_user_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == test_user.email
        assert data["id"] == test_user.id

    def test_get_me_without_token(self, client: TestClient):
        """No auth header → 403 (HTTPBearer returns 403 when no creds)."""
        response = client.get("/api/auth/me")
        assert response.status_code == 403

    def test_get_me_with_invalid_token(self, client: TestClient):
        """Garbage token → 401."""
        response = client.get(
            "/api/auth/me", headers={"Authorization": "Bearer invalidtoken"}
        )
        assert response.status_code == 401
