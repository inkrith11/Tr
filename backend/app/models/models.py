from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from ..database import Base


class ConditionEnum(str, enum.Enum):
    new = "new"
    like_new = "like_new"
    good = "good"
    fair = "fair"
    poor = "poor"


class ListingStatusEnum(str, enum.Enum):
    active = "active"
    sold = "sold"
    deleted = "deleted"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=True)  # Nullable for Google OAuth users
    google_id = Column(String(255), unique=True, nullable=True)
    phone = Column(String(20), nullable=True)
    location = Column(String(100), nullable=True)
    profile_picture = Column(String(500), nullable=True)
    bio = Column(Text, nullable=True)
    rating = Column(Float, default=0.0)
    total_trades = Column(Integer, default=0)
    verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    listings = relationship("Listing", back_populates="owner", foreign_keys="Listing.user_id")
    sent_messages = relationship("Message", back_populates="sender", foreign_keys="Message.sender_id")
    received_messages = relationship("Message", back_populates="receiver", foreign_keys="Message.receiver_id")
    reviews_given = relationship("Review", back_populates="reviewer", foreign_keys="Review.reviewer_id")
    reviews_received = relationship("Review", back_populates="reviewed_user", foreign_keys="Review.reviewed_user_id")
    favorites = relationship("Favorite", back_populates="user")


class Listing(Base):
    __tablename__ = "listings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(50), nullable=False)
    condition = Column(Enum(ConditionEnum), nullable=False)
    price = Column(Float, nullable=False)
    location = Column(String(100), nullable=True)
    image_1 = Column(String(500), nullable=False)
    image_2 = Column(String(500), nullable=False)
    image_3 = Column(String(500), nullable=False)
    status = Column(Enum(ListingStatusEnum), default=ListingStatusEnum.active)
    views = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    owner = relationship("User", back_populates="listings")
    messages = relationship("Message", back_populates="listing")
    favorites = relationship("Favorite", back_populates="listing")


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    listing_id = Column(Integer, ForeignKey("listings.id"), nullable=True)
    content = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    sender = relationship("User", back_populates="sent_messages", foreign_keys=[sender_id])
    receiver = relationship("User", back_populates="received_messages", foreign_keys=[receiver_id])
    listing = relationship("Listing", back_populates="messages")


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    reviewed_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    listing_id = Column(Integer, ForeignKey("listings.id"), nullable=True)
    rating = Column(Integer, nullable=False)  # 1-5 stars
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    reviewer = relationship("User", back_populates="reviews_given", foreign_keys=[reviewer_id])
    reviewed_user = relationship("User", back_populates="reviews_received", foreign_keys=[reviewed_user_id])


class Favorite(Base):
    __tablename__ = "favorites"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    listing_id = Column(Integer, ForeignKey("listings.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="favorites")
    listing = relationship("Listing", back_populates="favorites")
