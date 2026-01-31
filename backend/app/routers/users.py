from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import Optional, List

from ..database import get_db
from ..models import User, Listing, Review
from ..schemas import UserUpdate, UserResponse, UserProfileResponse, ReviewResponse
from ..services.auth import get_current_user, get_password_hash, verify_password
from ..services.upload import upload_image, delete_image

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserProfileResponse)
def get_my_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get current user's full profile with stats.
    """
    # Get listing count
    listing_count = db.query(Listing).filter(
        Listing.seller_id == current_user.id
    ).count()
    
    # Get total listings sold
    sold_count = db.query(Listing).filter(
        Listing.seller_id == current_user.id,
        Listing.status == "sold"
    ).count()
    
    # Get reviews received
    reviews = db.query(Review).filter(
        Review.reviewed_user_id == current_user.id
    ).all()
    
    avg_rating = None
    if reviews:
        avg_rating = sum(r.rating for r in reviews) / len(reviews)
    
    return UserProfileResponse(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        phone=current_user.phone,
        profile_picture=current_user.profile_picture,
        created_at=current_user.created_at,
        listing_count=listing_count,
        sold_count=sold_count,
        avg_rating=round(avg_rating, 1) if avg_rating else None,
        review_count=len(reviews)
    )


@router.get("/{user_id}", response_model=UserProfileResponse)
def get_user_profile(
    user_id: int,
    db: Session = Depends(get_db)
):
    """
    Get a user's public profile.
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Get listing count
    listing_count = db.query(Listing).filter(
        Listing.seller_id == user_id,
        Listing.status == "available"
    ).count()
    
    # Get total listings sold
    sold_count = db.query(Listing).filter(
        Listing.seller_id == user_id,
        Listing.status == "sold"
    ).count()
    
    # Get reviews received
    reviews = db.query(Review).filter(
        Review.reviewed_user_id == user_id
    ).all()
    
    avg_rating = None
    if reviews:
        avg_rating = sum(r.rating for r in reviews) / len(reviews)
    
    return UserProfileResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        phone=user.phone,
        profile_picture=user.profile_picture,
        created_at=user.created_at,
        listing_count=listing_count,
        sold_count=sold_count,
        avg_rating=round(avg_rating, 1) if avg_rating else None,
        review_count=len(reviews)
    )


@router.put("/me", response_model=UserResponse)
async def update_profile(
    name: Optional[str] = Form(None),
    phone: Optional[str] = Form(None),
    current_password: Optional[str] = Form(None),
    new_password: Optional[str] = Form(None),
    profile_picture: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update current user's profile.
    """
    # Update name if provided
    if name is not None:
        current_user.name = name
    
    # Update phone if provided
    if phone is not None:
        current_user.phone = phone
    
    # Update password if provided
    if new_password:
        if not current_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is required to set new password"
            )
        
        if not current_user.hashed_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot set password for Google-only account"
            )
        
        if not verify_password(current_password, current_user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect"
            )
        
        current_user.hashed_password = get_password_hash(new_password)
    
    # Update profile picture if provided
    if profile_picture:
        # Delete old picture if it's not a Google profile picture
        if current_user.profile_picture and 'googleusercontent' not in current_user.profile_picture:
            delete_image(current_user.profile_picture)
        
        new_picture_url = await upload_image(profile_picture, folder="profiles")
        if new_picture_url:
            current_user.profile_picture = new_picture_url
    
    db.commit()
    db.refresh(current_user)
    
    return UserResponse.model_validate(current_user)


@router.get("/{user_id}/listings")
def get_user_listings(
    user_id: int,
    db: Session = Depends(get_db)
):
    """
    Get all available listings for a specific user.
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    listings = db.query(Listing).options(
        joinedload(Listing.seller)
    ).filter(
        Listing.seller_id == user_id,
        Listing.status == "available"
    ).all()
    
    from ..schemas import ListingResponse
    return [ListingResponse.model_validate(l) for l in listings]


@router.get("/{user_id}/reviews", response_model=List[ReviewResponse])
def get_user_reviews(
    user_id: int,
    db: Session = Depends(get_db)
):
    """
    Get all reviews for a specific user.
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    reviews = db.query(Review).options(
        joinedload(Review.reviewer),
        joinedload(Review.listing)
    ).filter(
        Review.reviewed_user_id == user_id
    ).all()
    
    return [ReviewResponse.model_validate(r) for r in reviews]
