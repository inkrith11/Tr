from pydantic import BaseModel, EmailStr, field_validator
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
    
    @field_validator('email')
    @classmethod
    def validate_email_domain(cls, v):
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

    class Config:
        from_attributes = True


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


class ListingCreate(ListingBase):
    pass  # Images handled separately via multipart form


class SellerInfo(BaseModel):
    id: int
    name: Optional[str] = None
    email: str
    profile_picture: Optional[str] = None
    
    class Config:
        from_attributes = True


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

    class Config:
        from_attributes = True


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


class SenderInfo(BaseModel):
    id: int
    name: Optional[str] = None
    email: str
    profile_picture: Optional[str] = None
    
    class Config:
        from_attributes = True


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

    class Config:
        from_attributes = True


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
    
    class Config:
        from_attributes = True


class ReviewListingInfo(BaseModel):
    id: int
    title: str
    image_url: Optional[str] = None
    
    class Config:
        from_attributes = True


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

    class Config:
        from_attributes = True


# ============ Favorite Schemas ============

class FavoriteCreate(BaseModel):
    listing_id: int


class FavoriteResponse(BaseModel):
    id: int
    user_id: int
    listing_id: int
    created_at: datetime

    class Config:
        from_attributes = True
