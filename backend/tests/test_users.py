"""
Tests for user profile endpoints: /api/users/*
"""
import pytest
from fastapi.testclient import TestClient


class TestGetMyProfile:
    """GET /api/users/me"""

    def test_get_own_profile(self, client: TestClient, test_user, test_user_headers):
        """Get own profile → 200 + correct data."""
        response = client.get("/api/users/me", headers=test_user_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_user.id
        assert data["email"] == test_user.email
        assert "listing_count" in data

    def test_get_profile_without_auth(self, client: TestClient):
        """Get profile without auth → 403."""
        response = client.get("/api/users/me")
        assert response.status_code == 403


class TestGetPublicProfile:
    """GET /api/users/{user_id}"""

    def test_get_another_users_profile(
        self, client: TestClient, create_test_user, db
    ):
        """Get public profile → 200 + correct data."""
        other = create_test_user(email="public@apsit.edu.in", name="Public User")
        response = client.get(f"/api/users/{other.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Public User"
        assert data["email"] == "public@apsit.edu.in"

    def test_get_nonexistent_user(self, client: TestClient):
        """Get user that doesn't exist → 404."""
        response = client.get("/api/users/99999")
        assert response.status_code == 404


class TestUpdateProfile:
    """PUT /api/users/me"""

    def test_update_own_profile_name(self, client: TestClient, test_user, test_user_headers):
        """Update own profile name → 200."""
        response = client.put(
            "/api/users/me",
            headers=test_user_headers,
            data={"name": "Updated Name"},
        )
        assert response.status_code == 200
        assert response.json()["name"] == "Updated Name"

    def test_update_own_profile_phone(self, client: TestClient, test_user, test_user_headers):
        """Update phone → 200."""
        response = client.put(
            "/api/users/me",
            headers=test_user_headers,
            data={"phone": "9876543210"},
        )
        assert response.status_code == 200
        assert response.json()["phone"] == "9876543210"

    def test_update_profile_without_auth(self, client: TestClient):
        """Update profile without auth → 403."""
        response = client.put("/api/users/me", data={"name": "Hacker"})
        assert response.status_code == 403

    def test_update_password_requires_current(self, client: TestClient, test_user, test_user_headers):
        """Changing password without current password → 400."""
        response = client.put(
            "/api/users/me",
            headers=test_user_headers,
            data={"new_password": "newpass123"},
        )
        assert response.status_code == 400

    def test_update_password_wrong_current(
        self, client: TestClient, create_test_user, get_auth_headers, db
    ):
        """Changing password with wrong current → 400."""
        user = create_test_user(email="pw@apsit.edu.in", password="oldpass12")
        headers = get_auth_headers(user)
        response = client.put(
            "/api/users/me",
            headers=headers,
            data={"current_password": "wrongpass", "new_password": "newpass12"},
        )
        assert response.status_code == 400


class TestGetUserListings:
    """GET /api/users/{user_id}/listings"""

    def test_get_user_listings(
        self, client: TestClient, create_test_user, create_test_listing, db
    ):
        """Get a user's listings → correct listings."""
        seller = create_test_user(email="lists@apsit.edu.in")
        create_test_listing(seller=seller, title="Seller's Book")
        response = client.get(f"/api/users/{seller.id}/listings")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert data[0]["seller_id"] == seller.id

    def test_get_user_listings_nonexistent(self, client: TestClient):
        """Get listings for non-existent user → 404."""
        response = client.get("/api/users/99999/listings")
        assert response.status_code == 404


class TestGetUserReviews:
    """GET /api/users/{user_id}/reviews"""

    def test_get_user_reviews(
        self, client: TestClient, create_test_user, create_test_listing, get_auth_headers, db
    ):
        """Get reviews for a user → correct reviews."""
        reviewer = create_test_user(email="urev@apsit.edu.in")
        seller = create_test_user(email="usell@apsit.edu.in")
        listing = create_test_listing(seller=seller)
        headers = get_auth_headers(reviewer)
        client.post(
            "/api/reviews",
            json={
                "reviewed_user_id": seller.id,
                "listing_id": listing.id,
                "rating": 5,
                "comment": "Awesome!",
            },
            headers=headers,
        )
        response = client.get(f"/api/users/{seller.id}/reviews")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert data[0]["rating"] == 5
