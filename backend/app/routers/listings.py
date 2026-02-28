from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Form
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, asc, or_
from typing import List, Optional
import json

from ..database import get_db
from ..models import User, Listing, Favorite
from ..schemas import (
    ListingCreate,
    ListingUpdate,
    ListingResponse,
    ListingListResponse,
    FavoriteResponse
)
from ..services.auth import get_current_user, get_optional_user
from ..services.upload import upload_image, delete_image

router = APIRouter(prefix="/listings", tags=["Listings"])


@router.get("", response_model=ListingListResponse)
def get_listings(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
    category: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    condition: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: Optional[str] = Query("newest", pattern="^(newest|oldest|price_low|price_high)$"),
    page: int = Query(1, ge=1),
    limit: int = Query(12, ge=1, le=50)
):
    """
    Get all listings with optional filters and pagination.
    """
    query = db.query(Listing).filter(
        Listing.status == "available"
    ).options(joinedload(Listing.seller))
    
    # Apply filters
    if category:
        query = query.filter(Listing.category == category)
    
    if min_price is not None:
        query = query.filter(Listing.price >= min_price)
    
    if max_price is not None:
        query = query.filter(Listing.price <= max_price)
    
    if condition:
        query = query.filter(Listing.condition == condition)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Listing.title.ilike(search_term),
                Listing.description.ilike(search_term)
            )
        )
    
    # Get total count before pagination
    total = query.count()
    
    # Apply sorting
    if sort_by == "newest":
        query = query.order_by(desc(Listing.created_at))
    elif sort_by == "oldest":
        query = query.order_by(asc(Listing.created_at))
    elif sort_by == "price_low":
        query = query.order_by(asc(Listing.price))
    elif sort_by == "price_high":
        query = query.order_by(desc(Listing.price))
    
    # Apply pagination
    offset = (page - 1) * limit
    listings = query.offset(offset).limit(limit).all()
    
    # Check if listings are favorited by current user
    favorite_listing_ids = set()
    if current_user:
        favorites = db.query(Favorite).filter(
            Favorite.user_id == current_user.id,
            Favorite.listing_id.in_([l.id for l in listings])
        ).all()
        favorite_listing_ids = {f.listing_id for f in favorites}
    
    # Build response
    listing_responses = []
    for listing in listings:
        response = ListingResponse.model_validate(listing)
        response.is_favorited = listing.id in favorite_listing_ids
        listing_responses.append(response)
    
    return ListingListResponse(
        listings=listing_responses,
        total=total,
        page=page,
        pages=(total + limit - 1) // limit
    )


@router.get("/{listing_id}", response_model=ListingResponse)
def get_listing(
    listing_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """
    Get a single listing by ID.
    """
    listing = db.query(Listing).options(
        joinedload(Listing.seller)
    ).filter(Listing.id == listing_id).first()
    
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found"
        )
    
    # Increment view count
    listing.views += 1
    db.commit()
    
    response = ListingResponse.model_validate(listing)
    
    # Check if favorited
    if current_user:
        favorite = db.query(Favorite).filter(
            Favorite.user_id == current_user.id,
            Favorite.listing_id == listing_id
        ).first()
        response.is_favorited = favorite is not None
    
    return response


@router.post("", response_model=ListingResponse, status_code=status.HTTP_201_CREATED)
async def create_listing(
    title: str = Form(...),
    description: str = Form(...),
    price: float = Form(...),
    category: str = Form(...),
    condition: str = Form(...),
    image1: Optional[UploadFile] = File(None),
    image2: Optional[UploadFile] = File(None),
    image3: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new listing with up to 3 images.
    """
    # Validate at least one image
    if not image1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one image is required"
        )
    
    # Upload images
    images = []
    for img in [image1, image2, image3]:
        if img:
            url = await upload_image(img, folder="listings")
            if url:
                images.append(url)
    
    if not images:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload images"
        )
    
    # Create listing
    listing = Listing(
        title=title,
        description=description,
        price=price,
        category=category,
        condition=condition,
        seller_id=current_user.id,
        image_url=images[0],
        image_url_2=images[1] if len(images) > 1 else None,
        image_url_3=images[2] if len(images) > 2 else None
    )
    
    db.add(listing)
    db.commit()
    db.refresh(listing)
    
    # Load seller relationship
    listing = db.query(Listing).options(
        joinedload(Listing.seller)
    ).filter(Listing.id == listing.id).first()
    
    return ListingResponse.model_validate(listing)


@router.put("/{listing_id}", response_model=ListingResponse)
async def update_listing(
    listing_id: int,
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    price: Optional[float] = Form(None),
    category: Optional[str] = Form(None),
    condition: Optional[str] = Form(None),
    listing_status: Optional[str] = Form(None, alias="status"),
    image1: Optional[UploadFile] = File(None),
    image2: Optional[UploadFile] = File(None),
    image3: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update a listing. Only the seller can update their listing.
    """
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found"
        )
    
    if listing.seller_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this listing"
        )
    
    # Update fields if provided
    if title:
        listing.title = title
    if description:
        listing.description = description
    if price is not None:
        listing.price = price
    if category:
        listing.category = category
    if condition:
        listing.condition = condition
    if listing_status:
        listing.status = listing_status
    
    # Handle image updates
    if image1:
        # Delete old image
        if listing.image_url:
            delete_image(listing.image_url)
        listing.image_url = await upload_image(image1, folder="listings")
    
    if image2:
        if listing.image_url_2:
            delete_image(listing.image_url_2)
        listing.image_url_2 = await upload_image(image2, folder="listings")
    
    if image3:
        if listing.image_url_3:
            delete_image(listing.image_url_3)
        listing.image_url_3 = await upload_image(image3, folder="listings")
    
    db.commit()
    db.refresh(listing)
    
    # Load seller relationship
    listing = db.query(Listing).options(
        joinedload(Listing.seller)
    ).filter(Listing.id == listing.id).first()
    
    return ListingResponse.model_validate(listing)


@router.delete("/{listing_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_listing(
    listing_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a listing. Only the seller can delete their listing.
    """
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found"
        )
    
    if listing.seller_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this listing"
        )
    
    # Delete images
    for img_url in [listing.image_url, listing.image_url_2, listing.image_url_3]:
        if img_url:
            delete_image(img_url)
    
    db.delete(listing)
    db.commit()


@router.get("/user/me", response_model=List[ListingResponse])
def get_my_listings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all listings created by the current user.
    """
    listings = db.query(Listing).options(
        joinedload(Listing.seller)
    ).filter(
        Listing.seller_id == current_user.id
    ).order_by(desc(Listing.created_at)).all()
    
    return [ListingResponse.model_validate(l) for l in listings]


@router.post("/{listing_id}/favorite", response_model=FavoriteResponse)
def add_favorite(
    listing_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Add a listing to favorites.
    """
    # Check if listing exists
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found"
        )
    
    # Check if already favorited
    existing = db.query(Favorite).filter(
        Favorite.user_id == current_user.id,
        Favorite.listing_id == listing_id
    ).first()
    
    if existing:
        return FavoriteResponse.model_validate(existing)
    
    # Create favorite
    favorite = Favorite(
        user_id=current_user.id,
        listing_id=listing_id
    )
    db.add(favorite)
    db.commit()
    db.refresh(favorite)
    
    return FavoriteResponse.model_validate(favorite)


@router.delete("/{listing_id}/favorite", status_code=status.HTTP_204_NO_CONTENT)
def remove_favorite(
    listing_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Remove a listing from favorites.
    """
    favorite = db.query(Favorite).filter(
        Favorite.user_id == current_user.id,
        Favorite.listing_id == listing_id
    ).first()
    
    if favorite:
        db.delete(favorite)
        db.commit()


@router.get("/favorites/me", response_model=List[ListingResponse])
def get_my_favorites(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all favorited listings for the current user.
    """
    favorites = db.query(Favorite).filter(
        Favorite.user_id == current_user.id
    ).all()
    
    listing_ids = [f.listing_id for f in favorites]
    
    listings = db.query(Listing).options(
        joinedload(Listing.seller)
    ).filter(
        Listing.id.in_(listing_ids)
    ).all()
    
    responses = []
    for listing in listings:
        response = ListingResponse.model_validate(listing)
        response.is_favorited = True
        responses.append(response)
    
    return responses
