from pydantic import BaseModel, ConfigDict, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime
from enum import Enum


class ConditionEnum(str, Enum):
    new = "new"
    like_new = "like_new"
    good = "good"
    fair = "fair"
    poor = "poor"


class StatusEnum(str, Enum):
    available = "available"
    sold = "sold"
    reserved = "reserved"


# ============ User Schemas ============

class UserBase(BaseModel):
    email: EmailStr


class UserCreate(UserBase):
    name: str
    password: str
    phone: Optional[str] = None

    @field_validator('name')
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2 or len(v) > 100:
            raise ValueError('Name must be between 2 and 100 characters')
        return v

    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if len(v) > 128:
            raise ValueError('Password must be at most 128 characters')
        return v

    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and len(v) > 20:
            raise ValueError('Phone number too long')
        return v

    @field_validator('email')
    @classmethod
    def validate_email_domain(cls, v: str) -> str:
        if not v.endswith('@apsit.edu.in'):
            raise ValueError('Only @apsit.edu.in emails are allowed')
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class GoogleAuthRequest(BaseModel):
    token: str


class UserResponse(BaseModel):
    id: int
    email: str
    name: Optional[str] = None
    phone: Optional[str] = None
    profile_picture: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserProfileResponse(UserResponse):
    listing_count: int = 0
    sold_count: int = 0
    avg_rating: Optional[float] = None
    review_count: int = 0


class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ============ Listing Schemas ============

class ListingBase(BaseModel):
    title: str
    description: str
    category: str
    condition: str
    price: float

    @field_validator('title')
    @classmethod
    def validate_title(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 3 or len(v) > 200:
            raise ValueError('Title must be between 3 and 200 characters')
        return v

    @field_validator('description')
    @classmethod
    def validate_description(cls, v: str) -> str:
        if len(v) > 5000:
            raise ValueError('Description must be at most 5000 characters')
        return v

    @field_validator('price')
    @classmethod
    def validate_price(cls, v: float) -> float:
        if v < 0:
            raise ValueError('Price cannot be negative')
        if v > 1_000_000:
            raise ValueError('Price exceeds maximum allowed')
        return v


class ListingCreate(ListingBase):
    pass  # Images handled separately via multipart form


class SellerInfo(BaseModel):
    id: int
    name: Optional[str] = None
    email: str
    profile_picture: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


class ListingResponse(BaseModel):
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
    seller: Optional[SellerInfo] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    is_favorited: bool = False

    model_config = ConfigDict(from_attributes=True)


class ListingListResponse(BaseModel):
    listings: List[ListingResponse]
    total: int
    page: int
    pages: int


class ListingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    condition: Optional[str] = None
    price: Optional[float] = None
    status: Optional[str] = None


# ============ Message Schemas ============

class MessageCreate(BaseModel):
    receiver_id: int
    listing_id: int
    content: str

    @field_validator('content')
    @classmethod
    def validate_content(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError('Message content cannot be empty')
        if len(v) > 2000:
            raise ValueError('Message must be at most 2000 characters')
        return v


class SenderInfo(BaseModel):
    id: int
    name: Optional[str] = None
    email: str
    profile_picture: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


class MessageResponse(BaseModel):
    id: int
    content: str
    sender_id: int
    receiver_id: int
    listing_id: int
    is_read: bool
    created_at: datetime
    sender: Optional[SenderInfo] = None
    receiver: Optional[SenderInfo] = None

    model_config = ConfigDict(from_attributes=True)


class ConversationResponse(BaseModel):
    other_user_id: int
    other_user_name: str
    other_user_profile_picture: Optional[str] = None
    listing_id: int
    listing_title: str
    listing_image: Optional[str] = None
    last_message: str
    last_message_time: datetime
    unread_count: int = 0


# ============ Review Schemas ============

class ReviewCreate(BaseModel):
    reviewed_user_id: int
    listing_id: int
    rating: int
    comment: Optional[str] = None

    @field_validator('rating')
    @classmethod
    def validate_rating(cls, v):
        if v < 1 or v > 5:
            raise ValueError('Rating must be between 1 and 5')
        return v


class ReviewerInfo(BaseModel):
    id: int
    name: Optional[str] = None
    email: str
    profile_picture: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


class ReviewListingInfo(BaseModel):
    id: int
    title: str
    image_url: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


class ReviewResponse(BaseModel):
    id: int
    rating: int
    comment: Optional[str] = None
    reviewer_id: int
    reviewed_user_id: int
    listing_id: int
    created_at: datetime
    reviewer: Optional[ReviewerInfo] = None
    reviewed_user: Optional[ReviewerInfo] = None
    listing: Optional[ReviewListingInfo] = None

    model_config = ConfigDict(from_attributes=True)


# ============ Favorite Schemas ============

class FavoriteCreate(BaseModel):
    listing_id: int


class FavoriteResponse(BaseModel):
    id: int
    user_id: int
    listing_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
