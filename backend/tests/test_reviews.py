"""
Tests for review endpoints: /api/reviews/*
"""
import pytest
from fastapi.testclient import TestClient


class TestCreateReview:
    """POST /api/reviews"""

    def test_create_review_success(
        self, client: TestClient, create_test_user, create_test_listing, get_auth_headers, db
    ):
        """Create review with valid data → 201."""
        reviewer = create_test_user(email="rev@apsit.edu.in")
        seller = create_test_user(email="sell@apsit.edu.in")
        listing = create_test_listing(seller=seller)
        headers = get_auth_headers(reviewer)
        payload = {
            "reviewed_user_id": seller.id,
            "listing_id": listing.id,
            "rating": 4,
            "comment": "Great seller!",
        }
        response = client.post("/api/reviews", json=payload, headers=headers)
        assert response.status_code == 201
        data = response.json()
        assert data["rating"] == 4
        assert data["reviewer_id"] == reviewer.id

    def test_create_review_invalid_rating_zero(
        self, client: TestClient, create_test_user, create_test_listing, get_auth_headers, db
    ):
        """Rating 0 → 422."""
        reviewer = create_test_user(email="rev0@apsit.edu.in")
        seller = create_test_user(email="sell0@apsit.edu.in")
        listing = create_test_listing(seller=seller)
        headers = get_auth_headers(reviewer)
        payload = {
            "reviewed_user_id": seller.id,
            "listing_id": listing.id,
            "rating": 0,
        }
        response = client.post("/api/reviews", json=payload, headers=headers)
        assert response.status_code == 422

    def test_create_review_invalid_rating_six(
        self, client: TestClient, create_test_user, create_test_listing, get_auth_headers, db
    ):
        """Rating 6 → 422."""
        reviewer = create_test_user(email="rev6@apsit.edu.in")
        seller = create_test_user(email="sell6@apsit.edu.in")
        listing = create_test_listing(seller=seller)
        headers = get_auth_headers(reviewer)
        payload = {
            "reviewed_user_id": seller.id,
            "listing_id": listing.id,
            "rating": 6,
        }
        response = client.post("/api/reviews", json=payload, headers=headers)
        assert response.status_code == 422

    def test_create_review_without_auth(self, client: TestClient):
        """Create review without auth → 403."""
        payload = {
            "reviewed_user_id": 1,
            "listing_id": 1,
            "rating": 3,
        }
        response = client.post("/api/reviews", json=payload)
        assert response.status_code == 403

    def test_cannot_review_yourself(
        self, client: TestClient, create_test_user, create_test_listing, get_auth_headers, db
    ):
        """Review yourself → 400."""
        user = create_test_user()
        listing = create_test_listing(seller=user)
        headers = get_auth_headers(user)
        payload = {
            "reviewed_user_id": user.id,
            "listing_id": listing.id,
            "rating": 5,
        }
        response = client.post("/api/reviews", json=payload, headers=headers)
        assert response.status_code == 400

    def test_prevent_duplicate_review(
        self, client: TestClient, create_test_user, create_test_listing, get_auth_headers, db
    ):
        """Duplicate review for same listing by same user → 400."""
        reviewer = create_test_user(email="dup_rev@apsit.edu.in")
        seller = create_test_user(email="dup_sell@apsit.edu.in")
        listing = create_test_listing(seller=seller)
        headers = get_auth_headers(reviewer)
        payload = {
            "reviewed_user_id": seller.id,
            "listing_id": listing.id,
            "rating": 5,
        }
        # First review
        resp1 = client.post("/api/reviews", json=payload, headers=headers)
        assert resp1.status_code == 201
        # Second review → should fail
        resp2 = client.post("/api/reviews", json=payload, headers=headers)
        assert resp2.status_code == 400


class TestGetReviews:
    """GET /api/reviews/listing/{id} and /api/reviews/my-reviews"""

    def test_get_reviews_for_listing(
        self, client: TestClient, create_test_user, create_test_listing, get_auth_headers, db
    ):
        """Get reviews for a listing → correct reviews."""
        reviewer = create_test_user(email="getrev@apsit.edu.in")
        seller = create_test_user(email="getsell@apsit.edu.in")
        listing = create_test_listing(seller=seller)
        headers = get_auth_headers(reviewer)
        # Create a review first
        client.post(
            "/api/reviews",
            json={
                "reviewed_user_id": seller.id,
                "listing_id": listing.id,
                "rating": 3,
                "comment": "Decent",
            },
            headers=headers,
        )
        response = client.get(f"/api/reviews/listing/{listing.id}")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["rating"] == 3

    def test_get_reviews_nonexistent_listing(self, client: TestClient):
        """Get reviews for non-existent listing → 404."""
        response = client.get("/api/reviews/listing/99999")
        assert response.status_code == 404


class TestDeleteReview:
    """DELETE /api/reviews/{id}"""

    def test_delete_own_review(
        self, client: TestClient, create_test_user, create_test_listing, get_auth_headers, db
    ):
        """Delete own review → 204."""
        reviewer = create_test_user(email="delrev@apsit.edu.in")
        seller = create_test_user(email="delsell@apsit.edu.in")
        listing = create_test_listing(seller=seller)
        headers = get_auth_headers(reviewer)
        resp = client.post(
            "/api/reviews",
            json={
                "reviewed_user_id": seller.id,
                "listing_id": listing.id,
                "rating": 2,
            },
            headers=headers,
        )
        review_id = resp.json()["id"]
        delete_resp = client.delete(f"/api/reviews/{review_id}", headers=headers)
        assert delete_resp.status_code == 204

    def test_delete_someone_elses_review(
        self, client: TestClient, create_test_user, create_test_listing, get_auth_headers, db
    ):
        """Delete another's review → 403."""
        reviewer = create_test_user(email="own@apsit.edu.in")
        other = create_test_user(email="oth@apsit.edu.in")
        seller = create_test_user(email="sel@apsit.edu.in")
        listing = create_test_listing(seller=seller)
        headers_reviewer = get_auth_headers(reviewer)
        headers_other = get_auth_headers(other)
        resp = client.post(
            "/api/reviews",
            json={
                "reviewed_user_id": seller.id,
                "listing_id": listing.id,
                "rating": 1,
            },
            headers=headers_reviewer,
        )
        review_id = resp.json()["id"]
        delete_resp = client.delete(f"/api/reviews/{review_id}", headers=headers_other)
        assert delete_resp.status_code == 403
