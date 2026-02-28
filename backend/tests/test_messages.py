"""
Tests for message endpoints: /api/messages/*
"""
import pytest
from fastapi.testclient import TestClient
from app.models.models import Message


class TestSendMessage:
    """POST /api/messages"""

    def test_send_message_success(
        self, client: TestClient, create_test_user, create_test_listing, get_auth_headers, db
    ):
        """Send message with valid data → 201."""
        sender = create_test_user(email="sender@apsit.edu.in")
        receiver = create_test_user(email="receiver@apsit.edu.in")
        listing = create_test_listing(seller=receiver)
        headers = get_auth_headers(sender)
        payload = {
            "receiver_id": receiver.id,
            "listing_id": listing.id,
            "content": "Is this still available?",
        }
        response = client.post("/api/messages", json=payload, headers=headers)
        assert response.status_code == 201
        data = response.json()
        assert data["content"] == "Is this still available?"
        assert data["sender_id"] == sender.id
        assert data["receiver_id"] == receiver.id

    def test_send_message_without_auth(self, client: TestClient):
        """Send message without auth → 403."""
        payload = {"receiver_id": 1, "listing_id": 1, "content": "Hello"}
        response = client.post("/api/messages", json=payload)
        assert response.status_code == 403

    def test_cannot_message_yourself(
        self, client: TestClient, create_test_user, create_test_listing, get_auth_headers, db
    ):
        """Send message to self → 400."""
        user = create_test_user()
        listing = create_test_listing(seller=user)
        headers = get_auth_headers(user)
        payload = {
            "receiver_id": user.id,
            "listing_id": listing.id,
            "content": "Talking to myself",
        }
        response = client.post("/api/messages", json=payload, headers=headers)
        assert response.status_code == 400

    def test_send_message_to_nonexistent_user(
        self, client: TestClient, create_test_user, create_test_listing, get_auth_headers, db
    ):
        """Send message to non-existent user → 404."""
        sender = create_test_user()
        listing = create_test_listing(seller=sender)
        headers = get_auth_headers(sender)
        payload = {
            "receiver_id": 99999,
            "listing_id": listing.id,
            "content": "Hello ghost",
        }
        response = client.post("/api/messages", json=payload, headers=headers)
        assert response.status_code == 404


class TestGetConversations:
    """GET /api/messages/conversations"""

    def test_get_conversations(
        self, client: TestClient, create_test_user, create_test_listing, get_auth_headers, db
    ):
        """Get conversations → correct data."""
        user1 = create_test_user(email="u1@apsit.edu.in")
        user2 = create_test_user(email="u2@apsit.edu.in")
        listing = create_test_listing(seller=user2)

        # Create a message
        msg = Message(
            sender_id=user1.id,
            receiver_id=user2.id,
            listing_id=listing.id,
            content="Hey there",
        )
        db.add(msg)
        db.commit()

        headers = get_auth_headers(user1)
        response = client.get("/api/messages/conversations", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert data[0]["other_user_id"] == user2.id

    def test_get_conversations_without_auth(self, client: TestClient):
        """Get conversations without auth → 403."""
        response = client.get("/api/messages/conversations")
        assert response.status_code == 403


class TestGetConversationMessages:
    """GET /api/messages/conversation/{other_user_id}/{listing_id}"""

    def test_get_conversation_messages(
        self, client: TestClient, create_test_user, create_test_listing, get_auth_headers, db
    ):
        """Get messages for a conversation → correct messages in order."""
        user1 = create_test_user(email="a@apsit.edu.in")
        user2 = create_test_user(email="b@apsit.edu.in")
        listing = create_test_listing(seller=user2)

        msg1 = Message(sender_id=user1.id, receiver_id=user2.id, listing_id=listing.id, content="First")
        msg2 = Message(sender_id=user2.id, receiver_id=user1.id, listing_id=listing.id, content="Second")
        db.add_all([msg1, msg2])
        db.commit()

        headers = get_auth_headers(user1)
        response = client.get(
            f"/api/messages/conversation/{user2.id}/{listing.id}", headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert data[0]["content"] == "First"


class TestUnreadCount:
    """GET /api/messages/unread/count"""

    def test_unread_count(
        self, client: TestClient, create_test_user, create_test_listing, get_auth_headers, db
    ):
        """Get unread count → correct number."""
        user1 = create_test_user(email="x@apsit.edu.in")
        user2 = create_test_user(email="y@apsit.edu.in")
        listing = create_test_listing(seller=user2)

        msg = Message(
            sender_id=user2.id,
            receiver_id=user1.id,
            listing_id=listing.id,
            content="Unread",
            is_read=False,
        )
        db.add(msg)
        db.commit()

        headers = get_auth_headers(user1)
        response = client.get("/api/messages/unread/count", headers=headers)
        assert response.status_code == 200
        assert response.json()["unread_count"] >= 1


class TestMarkAsRead:
    """PUT /api/messages/{message_id}/read"""

    def test_mark_message_read(
        self, client: TestClient, create_test_user, create_test_listing, get_auth_headers, db
    ):
        """Mark message as read → success + count decreases."""
        user1 = create_test_user(email="r1@apsit.edu.in")
        user2 = create_test_user(email="r2@apsit.edu.in")
        listing = create_test_listing(seller=user2)

        msg = Message(
            sender_id=user2.id,
            receiver_id=user1.id,
            listing_id=listing.id,
            content="Read me",
            is_read=False,
        )
        db.add(msg)
        db.commit()
        db.refresh(msg)

        headers = get_auth_headers(user1)
        response = client.put(f"/api/messages/{msg.id}/read", headers=headers)
        assert response.status_code == 200

        # Verify unread count is now 0
        count_resp = client.get("/api/messages/unread/count", headers=headers)
        assert count_resp.json()["unread_count"] == 0
