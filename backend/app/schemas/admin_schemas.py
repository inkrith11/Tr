from pydantic import BaseModel, ConfigDict, field_validator
from typing import Optional, List
from datetime import datetime
from enum import Enum


# ============ ENUMS ============

class RoleEnum(str, Enum):
    user = "user"
    admin = "admin"
    super_admin = "super_admin"


class ReportTypeEnum(str, Enum):
    user = "user"
    listing = "listing"
    message = "message"


class ReportStatusEnum(str, Enum):
    pending = "pending"
    reviewed = "reviewed"
    resolved = "resolved"
    dismissed = "dismissed"


class ReportReasonEnum(str, Enum):
    spam = "spam"
    fake = "fake"
    inappropriate = "inappropriate"
    scam = "scam"
    harassment = "harassment"
    other = "other"


# ============ ADMIN AUTH ============

class AdminLogin(BaseModel):
    email: str
    password: str


class AdminTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "AdminUserResponse"


# ============ DASHBOARD ============

class DashboardStats(BaseModel):
    total_users: int
    total_listings: int
    active_listings: int
    total_messages: int
    pending_reports: int
    banned_users: int
    new_users_today: int
    new_listings_today: int
    total_trades: int


class ActivityItem(BaseModel):
    id: int
    action: str
    description: str
    admin_name: Optional[str] = None
    target_type: Optional[str] = None
    target_id: Optional[int] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============ USER MANAGEMENT ============

class AdminUserResponse(BaseModel):
    id: int
    email: str
    name: Optional[str] = None
    phone: Optional[str] = None
    profile_picture: Optional[str] = None
    role: str
    is_banned: bool
    banned_reason: Optional[str] = None
    banned_at: Optional[datetime] = None
    ban_expires_at: Optional[datetime] = None
    created_at: datetime
    last_login: Optional[datetime] = None
    listing_count: int = 0
    reports_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class AdminUserDetail(AdminUserResponse):
    total_listings: int = 0
    active_listings: int = 0
    sold_listings: int = 0
    messages_sent: int = 0
    messages_received: int = 0
    reviews_given: int = 0
    reviews_received: int = 0
    avg_rating: Optional[float] = None
    reports_filed: int = 0
    reports_against: int = 0


class BanUserRequest(BaseModel):
    reason: str
    duration_days: Optional[int] = None  # None = permanent
    delete_listings: bool = False
    notify_user: bool = True


class UnbanUserRequest(BaseModel):
    notify_user: bool = True


class ChangeRoleRequest(BaseModel):
    role: RoleEnum


class UserListResponse(BaseModel):
    users: List[AdminUserResponse]
    total: int
    page: int
    pages: int


# ============ LISTING MANAGEMENT ============

class AdminListingResponse(BaseModel):
    id: int
    title: str
    description: str
    price: float
    category: str
    condition: str
    status: str
    views: int
    image_url: Optional[str] = None
    image_url_2: Optional[str] = None
    image_url_3: Optional[str] = None
    seller_id: int
    seller_name: Optional[str] = None
    seller_email: str
    is_featured: bool = False
    hidden_reason: Optional[str] = None
    reports_count: int = 0
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class HideListingRequest(BaseModel):
    reason: str
    notify_seller: bool = True
    warn_user: bool = False


class ListingListResponse(BaseModel):
    listings: List[AdminListingResponse]
    total: int
    page: int
    pages: int


# ============ REPORTS ============

class ReportResponse(BaseModel):
    id: int
    reporter_id: int
    reporter_name: Optional[str] = None
    reporter_email: str
    report_type: str
    reported_user_id: Optional[int] = None
    reported_user_name: Optional[str] = None
    listing_id: Optional[int] = None
    listing_title: Optional[str] = None
    message_id: Optional[int] = None
    reason: str
    description: Optional[str] = None
    status: str
    reviewed_by: Optional[int] = None
    reviewer_name: Optional[str] = None
    admin_notes: Optional[str] = None
    action_taken: Optional[str] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class ReportDetailResponse(ReportResponse):
    reporter_total_reports: int = 0
    reporter_valid_reports: int = 0
    reported_user_total_reports: int = 0
    listing_details: Optional[AdminListingResponse] = None


class CreateReportRequest(BaseModel):
    report_type: ReportTypeEnum
    reported_user_id: Optional[int] = None
    listing_id: Optional[int] = None
    message_id: Optional[int] = None
    reason: ReportReasonEnum
    description: Optional[str] = None


class ReviewReportRequest(BaseModel):
    status: ReportStatusEnum
    admin_notes: Optional[str] = None
    action_taken: Optional[str] = None  # "user_banned", "listing_hidden", "warning_sent", "no_action"


class ReportListResponse(BaseModel):
    reports: List[ReportResponse]
    total: int
    page: int
    pages: int


# ============ ANALYTICS ============

class UserAnalytics(BaseModel):
    total_users: int
    new_users_today: int
    new_users_week: int
    new_users_month: int
    active_users_today: int
    banned_users: int
    users_by_day: List[dict]  # [{date: "2024-01-01", count: 10}, ...]


class ListingAnalytics(BaseModel):
    total_listings: int
    active_listings: int
    sold_listings: int
    hidden_listings: int
    new_listings_today: int
    new_listings_week: int
    listings_by_category: List[dict]  # [{category: "Books", count: 50}, ...]
    listings_by_day: List[dict]
    avg_price_by_category: List[dict]


class EngagementAnalytics(BaseModel):
    total_messages: int
    messages_today: int
    total_reviews: int
    total_favorites: int
    avg_response_time: Optional[float] = None


# ============ CATEGORIES ============

class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    display_order: int = 0


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    is_active: Optional[bool] = None
    display_order: Optional[int] = None


class CategoryResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    is_active: bool
    display_order: int
    listing_count: int = 0
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============ SETTINGS ============

class SettingUpdate(BaseModel):
    value: str


class SettingResponse(BaseModel):
    id: int
    key: str
    value: Optional[str] = None
    description: Optional[str] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ============ ACTIVITY LOG ============

class ActivityLogResponse(BaseModel):
    id: int
    admin_id: int
    admin_name: Optional[str] = None
    admin_email: str
    action: str
    target_type: Optional[str] = None
    target_id: Optional[int] = None
    details: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ActivityLogListResponse(BaseModel):
    logs: List[ActivityLogResponse]
    total: int
    page: int
    pages: int


# Forward reference update
AdminTokenResponse.model_rebuild()
