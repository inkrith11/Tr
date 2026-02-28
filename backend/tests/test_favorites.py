"""
Tests for favorite endpoints: /api/listings/{id}/favorite, /api/listings/favorites/me
"""
import pytest
from fastapi.testclient import TestClient


class TestAddFavorite:
    """POST /api/listings/{listing_id}/favorite"""

    def test_add_favorite_success(
        self, client: TestClient, create_test_user, create_test_listing, get_auth_headers, db
    ):
        """Add listing to favorites → 200 (returns existing or creates new)."""
        user = create_test_user(email="fav@apsit.edu.in")
        seller = create_test_user(email="seller_fav@apsit.edu.in")
        listing = create_test_listing(seller=seller)
        headers = get_auth_headers(user)

        response = client.post(f"/api/listings/{listing.id}/favorite", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["listing_id"] == listing.id
        assert data["user_id"] == user.id

    def test_add_same_favorite_again_no_duplicate(
        self, client: TestClient, create_test_user, create_test_listing, get_auth_headers, db
    ):
        """Adding same listing again → returns existing favorite (no duplicate)."""
        user = create_test_user(email="dupfav@apsit.edu.in")
        seller = create_test_user(email="sellfav2@apsit.edu.in")
        listing = create_test_listing(seller=seller)
        headers = get_auth_headers(user)

        resp1 = client.post(f"/api/listings/{listing.id}/favorite", headers=headers)
        resp2 = client.post(f"/api/listings/{listing.id}/favorite", headers=headers)
        # The endpoint returns the existing favorite if already favorited
        assert resp1.status_code == 200
        assert resp2.status_code == 200
        assert resp1.json()["id"] == resp2.json()["id"]

    def test_add_favorite_nonexistent_listing(
        self, client: TestClient, test_user, test_user_headers
    ):
        """Add non-existent listing to favorites → 404."""
        response = client.post("/api/listings/99999/favorite", headers=test_user_headers)
        assert response.status_code == 404

    def test_add_favorite_without_auth(self, client: TestClient):
        """Add favorite without auth → 403."""
        response = client.post("/api/listings/1/favorite")
        assert response.status_code == 403


class TestRemoveFavorite:
    """DELETE /api/listings/{listing_id}/favorite"""

    def test_remove_favorite_success(
        self, client: TestClient, create_test_user, create_test_listing, get_auth_headers, db
    ):
        """Remove listing from favorites → 204."""
        user = create_test_user(email="rmfav@apsit.edu.in")
        seller = create_test_user(email="sellrm@apsit.edu.in")
        listing = create_test_listing(seller=seller)
        headers = get_auth_headers(user)

        # Add first
        client.post(f"/api/listings/{listing.id}/favorite", headers=headers)
        # Then remove
        response = client.delete(f"/api/listings/{listing.id}/favorite", headers=headers)
        assert response.status_code == 204

    def test_remove_favorite_not_favorited(
        self, client: TestClient, create_test_user, create_test_listing, get_auth_headers, db
    ):
        """Remove a listing that wasn't favorited → 204 (idempotent)."""
        user = create_test_user(email="nofav@apsit.edu.in")
        seller = create_test_user(email="sellno@apsit.edu.in")
        listing = create_test_listing(seller=seller)
        headers = get_auth_headers(user)

        response = client.delete(f"/api/listings/{listing.id}/favorite", headers=headers)
        assert response.status_code == 204

    def test_remove_favorite_without_auth(self, client: TestClient):
        """Remove favorite without auth → 403."""
        response = client.delete("/api/listings/1/favorite")
        assert response.status_code == 403


class TestGetFavorites:
    """GET /api/listings/favorites/me"""

    def test_get_favorites(
        self, client: TestClient, create_test_user, create_test_listing, get_auth_headers, db
    ):
        """Get all favorites → correct list."""
        user = create_test_user(email="getfav@apsit.edu.in")
        seller = create_test_user(email="sellget@apsit.edu.in")
        listing1 = create_test_listing(seller=seller, title="Fav Book 1")
        listing2 = create_test_listing(seller=seller, title="Fav Book 2")
        headers = get_auth_headers(user)

        client.post(f"/api/listings/{listing1.id}/favorite", headers=headers)
        client.post(f"/api/listings/{listing2.id}/favorite", headers=headers)

        response = client.get("/api/listings/favorites/me", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2

    def test_get_favorites_empty(
        self, client: TestClient, test_user, test_user_headers
    ):
        """No favorites → empty list."""
        response = client.get("/api/listings/favorites/me", headers=test_user_headers)
        assert response.status_code == 200
        assert response.json() == []

    def test_get_favorites_without_auth(self, client: TestClient):
        """Get favorites without auth → 403."""
        response = client.get("/api/listings/favorites/me")
        assert response.status_code == 403
