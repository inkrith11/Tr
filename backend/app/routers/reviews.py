from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List

from ..database import get_db
from ..models import User, Listing, Review
from ..schemas import ReviewCreate, ReviewResponse
from ..services.auth import get_current_user

router = APIRouter(prefix="/reviews", tags=["Reviews"])


@router.post("", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
def create_review(
    review_data: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a review for a user after a transaction.
    """
    # Verify listing exists
    listing = db.query(Listing).filter(Listing.id == review_data.listing_id).first()
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found"
        )
    
    # Verify reviewed user exists
    reviewed_user = db.query(User).filter(User.id == review_data.reviewed_user_id).first()
    if not reviewed_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Can't review yourself
    if review_data.reviewed_user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot review yourself"
        )
    
    # Check if already reviewed this user for this listing
    existing_review = db.query(Review).filter(
        Review.reviewer_id == current_user.id,
        Review.reviewed_user_id == review_data.reviewed_user_id,
        Review.listing_id == review_data.listing_id
    ).first()
    
    if existing_review:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already reviewed this user for this listing"
        )
    
    # Create review
    review = Review(
        rating=review_data.rating,
        comment=review_data.comment,
        reviewer_id=current_user.id,
        reviewed_user_id=review_data.reviewed_user_id,
        listing_id=review_data.listing_id
    )
    
    db.add(review)
    db.commit()
    db.refresh(review)
    
    # Load relationships
    review = db.query(Review).options(
        joinedload(Review.reviewer),
        joinedload(Review.reviewed_user),
        joinedload(Review.listing)
    ).filter(Review.id == review.id).first()
    
    return ReviewResponse.model_validate(review)


@router.get("/listing/{listing_id}", response_model=List[ReviewResponse])
def get_listing_reviews(
    listing_id: int,
    db: Session = Depends(get_db)
):
    """
    Get all reviews associated with a listing.
    """
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found"
        )
    
    reviews = db.query(Review).options(
        joinedload(Review.reviewer),
        joinedload(Review.reviewed_user)
    ).filter(
        Review.listing_id == listing_id
    ).all()
    
    return [ReviewResponse.model_validate(r) for r in reviews]


@router.get("/my-reviews", response_model=List[ReviewResponse])
def get_my_reviews(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all reviews the current user has received.
    """
    reviews = db.query(Review).options(
        joinedload(Review.reviewer),
        joinedload(Review.listing)
    ).filter(
        Review.reviewed_user_id == current_user.id
    ).all()
    
    return [ReviewResponse.model_validate(r) for r in reviews]


@router.get("/given", response_model=List[ReviewResponse])
def get_given_reviews(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all reviews the current user has given.
    """
    reviews = db.query(Review).options(
        joinedload(Review.reviewed_user),
        joinedload(Review.listing)
    ).filter(
        Review.reviewer_id == current_user.id
    ).all()
    
    return [ReviewResponse.model_validate(r) for r in reviews]


@router.delete("/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_review(
    review_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a review. Only the reviewer can delete their review.
    """
    review = db.query(Review).filter(Review.id == review_id).first()
    
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )
    
    if review.reviewer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this review"
        )
    
    db.delete(review)
    db.commit()
