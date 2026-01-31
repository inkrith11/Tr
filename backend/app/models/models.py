from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from ..database import Base


# ============ ENUMS ============

class RoleEnum(str, enum.Enum):
    user = "user"
    admin = "admin"
    super_admin = "super_admin"


class ConditionEnum(str, enum.Enum):
    new = "new"
    like_new = "like_new"
    good = "good"
    fair = "fair"
    poor = "poor"


class ListingStatusEnum(str, enum.Enum):
    available = "available"
    sold = "sold"
    hidden = "hidden"
    deleted = "deleted"


class ReportTypeEnum(str, enum.Enum):
    user = "user"
    listing = "listing"
    message = "message"


class ReportStatusEnum(str, enum.Enum):
    pending = "pending"
    reviewed = "reviewed"
    resolved = "resolved"
    dismissed = "dismissed"


class ReportReasonEnum(str, enum.Enum):
    spam = "spam"
    fake = "fake"
    inappropriate = "inappropriate"
    scam = "scam"
    harassment = "harassment"
    other = "other"


# ============ MODELS ============

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=True)
    hashed_password = Column(String(255), nullable=True)  # Nullable for Google OAuth users
    google_id = Column(String(255), unique=True, nullable=True)
    phone = Column(String(20), nullable=True)
    profile_picture = Column(String(500), nullable=True)
    
    # Admin & Status fields
    role = Column(Enum(RoleEnum), default=RoleEnum.user)
    is_banned = Column(Boolean, default=False)
    banned_reason = Column(String(500), nullable=True)
    banned_at = Column(DateTime(timezone=True), nullable=True)
    banned_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    ban_expires_at = Column(DateTime(timezone=True), nullable=True)  # NULL = permanent
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    listings = relationship("Listing", back_populates="seller", foreign_keys="Listing.seller_id")
    sent_messages = relationship("Message", back_populates="sender", foreign_keys="Message.sender_id")
    received_messages = relationship("Message", back_populates="receiver", foreign_keys="Message.receiver_id")
    reviews_given = relationship("Review", back_populates="reviewer", foreign_keys="Review.reviewer_id")
    reviews_received = relationship("Review", back_populates="reviewed_user", foreign_keys="Review.reviewed_user_id")
    favorites = relationship("Favorite", back_populates="user")
    reports_filed = relationship("Report", back_populates="reporter", foreign_keys="Report.reporter_id")


class Listing(Base):
    __tablename__ = "listings"

    id = Column(Integer, primary_key=True, index=True)
    seller_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(50), nullable=False)
    condition = Column(String(20), nullable=False)
    price = Column(Float, nullable=False)
    
    # Images (at least 1 required)
    image_url = Column(String(500), nullable=True)
    image_url_2 = Column(String(500), nullable=True)
    image_url_3 = Column(String(500), nullable=True)
    
    status = Column(String(20), default="available")
    views = Column(Integer, default=0)
    
    # Admin fields
    is_featured = Column(Boolean, default=False)
    hidden_reason = Column(String(500), nullable=True)
    hidden_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    hidden_at = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    seller = relationship("User", back_populates="listings", foreign_keys=[seller_id])
    messages = relationship("Message", back_populates="listing")
    favorites = relationship("Favorite", back_populates="listing")
    reviews = relationship("Review", back_populates="listing")
    reports = relationship("Report", back_populates="listing", foreign_keys="Report.listing_id")


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    listing_id = Column(Integer, ForeignKey("listings.id"), nullable=True)
    content = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    
    # Admin moderation
    is_flagged = Column(Boolean, default=False)
    flagged_reason = Column(String(200), nullable=True)
    is_deleted = Column(Boolean, default=False)
    deleted_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
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
    listing = relationship("Listing", back_populates="reviews")


class Favorite(Base):
    __tablename__ = "favorites"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    listing_id = Column(Integer, ForeignKey("listings.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="favorites")
    listing = relationship("Listing", back_populates="favorites")


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    reporter_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # What is being reported
    report_type = Column(Enum(ReportTypeEnum), nullable=False)  # user, listing, message
    reported_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    listing_id = Column(Integer, ForeignKey("listings.id"), nullable=True)
    message_id = Column(Integer, ForeignKey("messages.id"), nullable=True)
    
    # Report details
    reason = Column(Enum(ReportReasonEnum), nullable=False)
    description = Column(Text, nullable=True)
    
    # Status tracking
    status = Column(Enum(ReportStatusEnum), default=ReportStatusEnum.pending)
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    admin_notes = Column(Text, nullable=True)
    action_taken = Column(String(100), nullable=True)  # e.g., "user_banned", "listing_hidden"
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    reporter = relationship("User", back_populates="reports_filed", foreign_keys=[reporter_id])
    reported_user = relationship("User", foreign_keys=[reported_user_id])
    listing = relationship("Listing", back_populates="reports", foreign_keys=[listing_id])


class AdminActivityLog(Base):
    __tablename__ = "admin_activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    action = Column(String(100), nullable=False)  # e.g., "ban_user", "delete_listing"
    target_type = Column(String(50), nullable=True)  # user, listing, report
    target_id = Column(Integer, nullable=True)
    
    details = Column(Text, nullable=True)  # JSON string with additional details
    ip_address = Column(String(50), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    admin = relationship("User", foreign_keys=[admin_id])


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(String(500), nullable=True)
    icon = Column(String(50), nullable=True)  # Icon name for frontend
    is_active = Column(Boolean, default=True)
    display_order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class PlatformSettings(Base):
    __tablename__ = "platform_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, nullable=False)
    value = Column(Text, nullable=True)
    description = Column(String(500), nullable=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    updated_by = Column(Integer, ForeignKey("users.id"), nullable=True)
