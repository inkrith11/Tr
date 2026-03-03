"""
End-to-end smoke tests against a running backend.
These test the full request cycle through FastAPI → PostgreSQL.

Run with:
    cd backend
    source venv/bin/activate
    pytest tests/test_e2e_smoke.py -v
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


class TestHealthSmoke:
    """Basic connectivity tests."""

    def test_docs_endpoint_reachable(self):
        r = client.get("/docs")
        assert r.status_code == 200

    def test_openapi_json_reachable(self):
        r = client.get("/openapi.json")
        assert r.status_code == 200
        assert "paths" in r.json()

    def test_unknown_route_returns_404(self):
        r = client.get("/api/nonexistent-endpoint")
        assert r.status_code in (404, 405)


class TestAuthSmoke:
    """Auth endpoints respond correctly."""

    def test_login_with_invalid_creds_returns_401(self):
        r = client.post("/api/auth/login", json={
            "email": "nobody@apsit.edu.in",
            "password": "wrongpassword"
        })
        assert r.status_code == 401

    def test_login_with_non_apsit_email_rejected(self):
        r = client.post("/api/auth/register", json={
            "email": "user@gmail.com",
            "password": "Test@12345",
            "name": "Bad User"
        })
        assert r.status_code in (400, 422)

    def test_get_me_without_token_returns_401_or_403(self):
        r = client.get("/api/auth/me")
        assert r.status_code in (401, 403)

    def test_register_and_login_flow(self):
        # Register
        r = client.post("/api/auth/register", json={
            "email": "e2etest@apsit.edu.in",
            "password": "E2eTest@123",
            "name": "E2E Tester"
        })
        # Might be 200/201 on first run, 400 if already exists
        if r.status_code in (200, 201):
            data = r.json()
            assert "access_token" in data

        # Login with same creds
        r = client.post("/api/auth/login", json={
            "email": "e2etest@apsit.edu.in",
            "password": "E2eTest@123"
        })
        assert r.status_code == 200
        token = r.json()["access_token"]

        # Get profile
        r = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 200
        assert r.json()["email"] == "e2etest@apsit.edu.in"


class TestListingsSmoke:
    """Listing endpoints respond correctly."""

    def test_get_listings_returns_paginated(self):
        r = client.get("/api/listings")
        assert r.status_code == 200
        data = r.json()
        assert "listings" in data
        assert isinstance(data["listings"], list)

    def test_get_nonexistent_listing_returns_404(self):
        r = client.get("/api/listings/99999")
        assert r.status_code == 404

    def test_create_listing_without_auth_returns_401_or_403(self):
        r = client.post("/api/listings/", data={
            "title": "Test", "description": "x" * 50,
            "price": "100", "category": "Books", "condition": "new"
        })
        assert r.status_code in (401, 403)


class TestMessagesSmoke:
    """Message endpoints respond correctly."""

    def test_get_conversations_without_auth(self):
        r = client.get("/api/messages/conversations")
        assert r.status_code in (401, 403)


class TestAdminSmoke:
    """Admin endpoints respond correctly."""

    def test_admin_verify_without_token(self):
        r = client.get("/api/admin/verify")
        assert r.status_code in (401, 403)

    def test_admin_dashboard_without_token(self):
        r = client.get("/api/admin/dashboard/stats")
        assert r.status_code in (401, 403)
