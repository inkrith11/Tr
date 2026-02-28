"""
Tests for listing endpoints: /api/listings/*
"""
import pytest
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient


class TestGetListings:
    """GET /api/listings"""

    def test_get_all_listings(self, client: TestClient, create_test_user, create_test_listing, db):
        """Get listings → 200 + returns list."""
        seller = create_test_user()
        create_test_listing(seller=seller)
        create_test_listing(seller=seller)
        response = client.get("/api/listings")
        assert response.status_code == 200
        data = response.json()
        assert "listings" in data
        assert data["total"] >= 2

    def test_get_listings_empty(self, client: TestClient):
        """No listings → 200 + empty list."""
        response = client.get("/api/listings")
        assert response.status_code == 200
        data = response.json()
        assert data["listings"] == []
        assert data["total"] == 0

    def test_filter_by_category(self, client: TestClient, create_test_user, create_test_listing, db):
        """Filter by category → only matching results."""
        seller = create_test_user()
        create_test_listing(seller=seller, category="Books")
        create_test_listing(seller=seller, category="Electronics")
        response = client.get("/api/listings?category=Books")
        assert response.status_code == 200
        data = response.json()
        assert all(l["category"] == "Books" for l in data["listings"])

    def test_filter_by_search(self, client: TestClient, create_test_user, create_test_listing, db):
        """Search by title → relevant results."""
        seller = create_test_user()
        create_test_listing(seller=seller, title="Python Textbook")
        create_test_listing(seller=seller, title="Calculator")
        response = client.get("/api/listings?search=Python")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1
        assert any("Python" in l["title"] for l in data["listings"])

    def test_pagination(self, client: TestClient, create_test_user, create_test_listing, db):
        """Pagination returns correct page size."""
        seller = create_test_user()
        for i in range(5):
            create_test_listing(seller=seller)
        response = client.get("/api/listings?page=1&limit=2")
        assert response.status_code == 200
        data = response.json()
        assert len(data["listings"]) == 2
        assert data["total"] == 5
        assert data["pages"] == 3


class TestGetSingleListing:
    """GET /api/listings/{id}"""

    def test_get_listing_by_id(self, client: TestClient, create_test_user, create_test_listing, db):
        """Get single listing → 200 + correct data."""
        seller = create_test_user()
        listing = create_test_listing(seller=seller, title="Unique Title")
        response = client.get(f"/api/listings/{listing.id}")
        assert response.status_code == 200
        assert response.json()["title"] == "Unique Title"

    def test_get_nonexistent_listing(self, client: TestClient):
        """Get listing with bad ID → 404."""
        response = client.get("/api/listings/99999")
        assert response.status_code == 404


class TestCreateListing:
    """POST /api/listings"""

    @patch("app.routers.listings.upload_image", new_callable=AsyncMock)
    def test_create_listing_with_auth(
        self, mock_upload, client: TestClient, test_user, test_user_headers
    ):
        """Create listing with valid data → 201."""
        mock_upload.return_value = "http://example.com/test.jpg"
        from io import BytesIO

        fake_image = BytesIO(b"fakeimagecontent")
        response = client.post(
            "/api/listings",
            headers=test_user_headers,
            data={
                "title": "Test Book",
                "description": "A great book for testing purposes and learning",
                "price": "50",
                "category": "Books",
                "condition": "good",
            },
            files={"image1": ("test.jpg", fake_image, "image/jpeg")},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "Test Book"
        assert data["seller_id"] == test_user.id

    def test_create_listing_without_auth(self, client: TestClient):
        """Create listing without auth → 403."""
        response = client.post(
            "/api/listings",
            data={
                "title": "No Auth Book",
                "description": "desc",
                "price": "10",
                "category": "Books",
                "condition": "new",
            },
        )
        assert response.status_code == 403


class TestUpdateListing:
    """PUT /api/listings/{id}"""

    def test_update_own_listing(
        self, client: TestClient, create_test_user, create_test_listing, get_auth_headers, db
    ):
        """Update own listing → 200."""
        seller = create_test_user()
        listing = create_test_listing(seller=seller)
        headers = get_auth_headers(seller)
        response = client.put(
            f"/api/listings/{listing.id}",
            headers=headers,
            data={"title": "Updated Title"},
        )
        assert response.status_code == 200
        assert response.json()["title"] == "Updated Title"

    def test_update_someone_elses_listing(
        self, client: TestClient, create_test_user, create_test_listing, get_auth_headers, db
    ):
        """Update another's listing → 403."""
        seller = create_test_user(email="seller@apsit.edu.in")
        other = create_test_user(email="other@apsit.edu.in")
        listing = create_test_listing(seller=seller)
        headers = get_auth_headers(other)
        response = client.put(
            f"/api/listings/{listing.id}",
            headers=headers,
            data={"title": "Hacked Title"},
        )
        assert response.status_code == 403


class TestDeleteListing:
    """DELETE /api/listings/{id}"""

    def test_delete_own_listing(
        self, client: TestClient, create_test_user, create_test_listing, get_auth_headers, db
    ):
        """Delete own listing → 204."""
        seller = create_test_user()
        listing = create_test_listing(seller=seller)
        headers = get_auth_headers(seller)
        response = client.delete(f"/api/listings/{listing.id}", headers=headers)
        assert response.status_code == 204

    def test_delete_someone_elses_listing(
        self, client: TestClient, create_test_user, create_test_listing, get_auth_headers, db
    ):
        """Delete another's listing → 403."""
        seller = create_test_user(email="s1@apsit.edu.in")
        other = create_test_user(email="s2@apsit.edu.in")
        listing = create_test_listing(seller=seller)
        headers = get_auth_headers(other)
        response = client.delete(f"/api/listings/{listing.id}", headers=headers)
        assert response.status_code == 403

    def test_delete_nonexistent_listing(self, client: TestClient, test_user, test_user_headers):
        """Delete listing that doesn't exist → 404."""
        response = client.delete("/api/listings/99999", headers=test_user_headers)
        assert response.status_code == 404
