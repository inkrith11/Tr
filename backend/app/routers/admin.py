from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_
from datetime import datetime, timedelta
from typing import Optional, List

from ..database import get_db
from ..models import (
    User, Listing, Message, Review, Report, AdminActivityLog, 
    Category, PlatformSettings, Favorite, RoleEnum, ReportStatusEnum
)
from ..schemas.admin_schemas import (
    AdminLogin, AdminTokenResponse, AdminUserResponse, AdminUserDetail,
    DashboardStats, ActivityItem, BanUserRequest, UnbanUserRequest,
    ChangeRoleRequest, UserListResponse, AdminListingResponse,
    HideListingRequest, ListingListResponse, ReportResponse,
    ReportDetailResponse, ReviewReportRequest, ReportListResponse,
    UserAnalytics, ListingAnalytics, EngagementAnalytics,
    CategoryCreate, CategoryUpdate, CategoryResponse,
    SettingUpdate, SettingResponse, ActivityLogResponse, ActivityLogListResponse
)
from ..services.auth import verify_password, create_access_token, get_password_hash
from ..services.admin import (
    get_admin_user, get_super_admin_user, log_admin_activity, get_client_ip
)

router = APIRouter(prefix="/admin", tags=["Admin"])


# ============ AUTHENTICATION ============

@router.post("/login", response_model=AdminTokenResponse)
def admin_login(login_data: AdminLogin, db: Session = Depends(get_db)):
    """
    Admin login - only users with admin or super_admin role can login.
    """
    user = db.query(User).filter(User.email == login_data.email).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    if user.role not in [RoleEnum.admin, RoleEnum.super_admin]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    if not user.hashed_password or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    if user.is_banned:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been banned"
        )
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()
    
    access_token = create_access_token(data={"sub": str(user.id)})
    
    return AdminTokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=AdminUserResponse(
            id=user.id,
            email=user.email,
            name=user.name,
            phone=user.phone,
            profile_picture=user.profile_picture,
            role=user.role.value if user.role else "user",
            is_banned=user.is_banned,
            banned_reason=user.banned_reason,
            banned_at=user.banned_at,
            ban_expires_at=user.ban_expires_at,
            created_at=user.created_at,
            last_login=user.last_login
        )
    )


@router.get("/verify")
def verify_admin(admin: User = Depends(get_admin_user)):
    """Verify admin token is valid."""
    return {"valid": True, "role": admin.role.value if admin.role else "user"}


# ============ DASHBOARD ============

@router.get("/dashboard/stats", response_model=DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Get dashboard statistics."""
    today = datetime.utcnow().date()
    today_start = datetime.combine(today, datetime.min.time())
    
    total_users = db.query(User).count()
    total_listings = db.query(Listing).count()
    active_listings = db.query(Listing).filter(Listing.status == "available").count()
    total_messages = db.query(Message).count()
    pending_reports = db.query(Report).filter(Report.status == ReportStatusEnum.pending).count()
    banned_users = db.query(User).filter(User.is_banned == True).count()
    new_users_today = db.query(User).filter(User.created_at >= today_start).count()
    new_listings_today = db.query(Listing).filter(Listing.created_at >= today_start).count()
    total_trades = db.query(Listing).filter(Listing.status == "sold").count()
    
    return DashboardStats(
        total_users=total_users,
        total_listings=total_listings,
        active_listings=active_listings,
        total_messages=total_messages,
        pending_reports=pending_reports,
        banned_users=banned_users,
        new_users_today=new_users_today,
        new_listings_today=new_listings_today,
        total_trades=total_trades
    )


@router.get("/dashboard/activity", response_model=List[ActivityItem])
def get_recent_activity(
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user),
    limit: int = Query(20, ge=1, le=100)
):
    """Get recent admin activity."""
    logs = db.query(AdminActivityLog).order_by(
        desc(AdminActivityLog.created_at)
    ).limit(limit).all()
    
    result = []
    for log in logs:
        admin_user = db.query(User).filter(User.id == log.admin_id).first()
        result.append(ActivityItem(
            id=log.id,
            action=log.action,
            description=f"{log.action} on {log.target_type} #{log.target_id}" if log.target_type else log.action,
            admin_name=admin_user.name if admin_user else "Unknown",
            target_type=log.target_type,
            target_id=log.target_id,
            created_at=log.created_at
        ))
    
    return result


# ============ USER MANAGEMENT ============

@router.get("/users", response_model=UserListResponse)
def get_all_users(
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user),
    search: Optional[str] = None,
    role: Optional[str] = None,
    status: Optional[str] = None,  # "active", "banned"
    sort_by: Optional[str] = Query("newest", regex="^(newest|oldest|name|trades)$"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    """Get all users with filters."""
    query = db.query(User)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (User.email.ilike(search_term)) | (User.name.ilike(search_term))
        )
    
    if role:
        query = query.filter(User.role == role)
    
    if status == "active":
        query = query.filter(User.is_banned == False)
    elif status == "banned":
        query = query.filter(User.is_banned == True)
    
    total = query.count()
    
    if sort_by == "newest":
        query = query.order_by(desc(User.created_at))
    elif sort_by == "oldest":
        query = query.order_by(User.created_at)
    elif sort_by == "name":
        query = query.order_by(User.name)
    
    offset = (page - 1) * limit
    users = query.offset(offset).limit(limit).all()
    
    user_responses = []
    for user in users:
        listing_count = db.query(Listing).filter(Listing.seller_id == user.id).count()
        reports_count = db.query(Report).filter(Report.reported_user_id == user.id).count()
        
        user_responses.append(AdminUserResponse(
            id=user.id,
            email=user.email,
            name=user.name,
            phone=user.phone,
            profile_picture=user.profile_picture,
            role=user.role.value if user.role else "user",
            is_banned=user.is_banned,
            banned_reason=user.banned_reason,
            banned_at=user.banned_at,
            ban_expires_at=user.ban_expires_at,
            created_at=user.created_at,
            last_login=user.last_login,
            listing_count=listing_count,
            reports_count=reports_count
        ))
    
    return UserListResponse(
        users=user_responses,
        total=total,
        page=page,
        pages=(total + limit - 1) // limit
    )


@router.get("/users/{user_id}", response_model=AdminUserDetail)
def get_user_detail(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Get detailed user information."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    total_listings = db.query(Listing).filter(Listing.seller_id == user_id).count()
    active_listings = db.query(Listing).filter(
        Listing.seller_id == user_id, Listing.status == "available"
    ).count()
    sold_listings = db.query(Listing).filter(
        Listing.seller_id == user_id, Listing.status == "sold"
    ).count()
    messages_sent = db.query(Message).filter(Message.sender_id == user_id).count()
    messages_received = db.query(Message).filter(Message.receiver_id == user_id).count()
    reviews_given = db.query(Review).filter(Review.reviewer_id == user_id).count()
    reviews_received = db.query(Review).filter(Review.reviewed_user_id == user_id).count()
    
    avg_rating = db.query(func.avg(Review.rating)).filter(
        Review.reviewed_user_id == user_id
    ).scalar()
    
    reports_filed = db.query(Report).filter(Report.reporter_id == user_id).count()
    reports_against = db.query(Report).filter(Report.reported_user_id == user_id).count()
    
    return AdminUserDetail(
        id=user.id,
        email=user.email,
        name=user.name,
        phone=user.phone,
        profile_picture=user.profile_picture,
        role=user.role.value if user.role else "user",
        is_banned=user.is_banned,
        banned_reason=user.banned_reason,
        banned_at=user.banned_at,
        ban_expires_at=user.ban_expires_at,
        created_at=user.created_at,
        last_login=user.last_login,
        listing_count=total_listings,
        reports_count=reports_against,
        total_listings=total_listings,
        active_listings=active_listings,
        sold_listings=sold_listings,
        messages_sent=messages_sent,
        messages_received=messages_received,
        reviews_given=reviews_given,
        reviews_received=reviews_received,
        avg_rating=round(avg_rating, 1) if avg_rating else None,
        reports_filed=reports_filed,
        reports_against=reports_against
    )


@router.put("/users/{user_id}/ban")
def ban_user(
    user_id: int,
    ban_data: BanUserRequest,
    request: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Ban a user."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.role in [RoleEnum.admin, RoleEnum.super_admin] and admin.role != RoleEnum.super_admin:
        raise HTTPException(status_code=403, detail="Cannot ban an admin")
    
    user.is_banned = True
    user.banned_reason = ban_data.reason
    user.banned_at = datetime.utcnow()
    user.banned_by = admin.id
    
    if ban_data.duration_days:
        user.ban_expires_at = datetime.utcnow() + timedelta(days=ban_data.duration_days)
    else:
        user.ban_expires_at = None  # Permanent
    
    if ban_data.delete_listings:
        db.query(Listing).filter(Listing.seller_id == user_id).update({"status": "hidden"})
    
    db.commit()
    
    log_admin_activity(
        db, admin.id, "ban_user", "user", user_id,
        {"reason": ban_data.reason, "duration": ban_data.duration_days},
        get_client_ip(request)
    )
    
    return {"message": f"User {user.email} has been banned"}


@router.put("/users/{user_id}/unban")
def unban_user(
    user_id: int,
    unban_data: UnbanUserRequest,
    request: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Unban a user."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_banned = False
    user.banned_reason = None
    user.banned_at = None
    user.banned_by = None
    user.ban_expires_at = None
    
    db.commit()
    
    log_admin_activity(
        db, admin.id, "unban_user", "user", user_id,
        None, get_client_ip(request)
    )
    
    return {"message": f"User {user.email} has been unbanned"}


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    request: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(get_super_admin_user)
):
    """Delete a user (Super Admin only)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.role == RoleEnum.super_admin:
        raise HTTPException(status_code=403, detail="Cannot delete super admin")
    
    email = user.email
    
    # Delete related data
    db.query(Message).filter(
        (Message.sender_id == user_id) | (Message.receiver_id == user_id)
    ).delete(synchronize_session=False)
    db.query(Review).filter(
        (Review.reviewer_id == user_id) | (Review.reviewed_user_id == user_id)
    ).delete(synchronize_session=False)
    db.query(Favorite).filter(Favorite.user_id == user_id).delete()
    db.query(Report).filter(
        (Report.reporter_id == user_id) | (Report.reported_user_id == user_id)
    ).delete(synchronize_session=False)
    db.query(Listing).filter(Listing.seller_id == user_id).delete()
    db.delete(user)
    db.commit()
    
    log_admin_activity(
        db, admin.id, "delete_user", "user", user_id,
        {"email": email}, get_client_ip(request)
    )
    
    return {"message": f"User {email} has been deleted"}


@router.put("/users/{user_id}/role")
def change_user_role(
    user_id: int,
    role_data: ChangeRoleRequest,
    request: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(get_super_admin_user)
):
    """Change user role (Super Admin only)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    old_role = user.role.value if user.role else "user"
    user.role = role_data.role
    db.commit()
    
    log_admin_activity(
        db, admin.id, "change_role", "user", user_id,
        {"old_role": old_role, "new_role": role_data.role.value},
        get_client_ip(request)
    )
    
    return {"message": f"User role changed to {role_data.role.value}"}


# ============ LISTING MANAGEMENT ============

@router.get("/listings", response_model=ListingListResponse)
def get_all_listings(
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user),
    search: Optional[str] = None,
    status: Optional[str] = None,
    category: Optional[str] = None,
    has_reports: Optional[bool] = None,
    sort_by: Optional[str] = Query("newest", regex="^(newest|oldest|price_high|price_low|reports)$"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    """Get all listings with filters."""
    query = db.query(Listing)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Listing.title.ilike(search_term)) | (Listing.description.ilike(search_term))
        )
    
    if status:
        query = query.filter(Listing.status == status)
    
    if category:
        query = query.filter(Listing.category == category)
    
    total = query.count()
    
    if sort_by == "newest":
        query = query.order_by(desc(Listing.created_at))
    elif sort_by == "oldest":
        query = query.order_by(Listing.created_at)
    elif sort_by == "price_high":
        query = query.order_by(desc(Listing.price))
    elif sort_by == "price_low":
        query = query.order_by(Listing.price)
    
    offset = (page - 1) * limit
    listings = query.offset(offset).limit(limit).all()
    
    listing_responses = []
    for listing in listings:
        seller = db.query(User).filter(User.id == listing.seller_id).first()
        reports_count = db.query(Report).filter(Report.listing_id == listing.id).count()
        
        listing_responses.append(AdminListingResponse(
            id=listing.id,
            title=listing.title,
            description=listing.description,
            price=listing.price,
            category=listing.category,
            condition=listing.condition,
            status=listing.status,
            views=listing.views,
            image_url=listing.image_url,
            image_url_2=listing.image_url_2,
            image_url_3=listing.image_url_3,
            seller_id=listing.seller_id,
            seller_name=seller.name if seller else None,
            seller_email=seller.email if seller else "Unknown",
            is_featured=listing.is_featured,
            hidden_reason=listing.hidden_reason,
            reports_count=reports_count,
            created_at=listing.created_at
        ))
    
    return ListingListResponse(
        listings=listing_responses,
        total=total,
        page=page,
        pages=(total + limit - 1) // limit
    )


@router.put("/listings/{listing_id}/hide")
def hide_listing(
    listing_id: int,
    hide_data: HideListingRequest,
    request: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Hide a listing."""
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    listing.status = "hidden"
    listing.hidden_reason = hide_data.reason
    listing.hidden_by = admin.id
    listing.hidden_at = datetime.utcnow()
    
    db.commit()
    
    log_admin_activity(
        db, admin.id, "hide_listing", "listing", listing_id,
        {"reason": hide_data.reason}, get_client_ip(request)
    )
    
    return {"message": "Listing has been hidden"}


@router.put("/listings/{listing_id}/show")
def show_listing(
    listing_id: int,
    request: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Unhide a listing."""
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    listing.status = "available"
    listing.hidden_reason = None
    listing.hidden_by = None
    listing.hidden_at = None
    
    db.commit()
    
    log_admin_activity(
        db, admin.id, "show_listing", "listing", listing_id,
        None, get_client_ip(request)
    )
    
    return {"message": "Listing is now visible"}


@router.delete("/listings/{listing_id}")
def delete_listing(
    listing_id: int,
    request: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Delete a listing."""
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    title = listing.title
    
    db.query(Message).filter(Message.listing_id == listing_id).delete()
    db.query(Favorite).filter(Favorite.listing_id == listing_id).delete()
    db.query(Report).filter(Report.listing_id == listing_id).delete()
    db.delete(listing)
    db.commit()
    
    log_admin_activity(
        db, admin.id, "delete_listing", "listing", listing_id,
        {"title": title}, get_client_ip(request)
    )
    
    return {"message": "Listing has been deleted"}


@router.put("/listings/{listing_id}/feature")
def toggle_feature_listing(
    listing_id: int,
    request: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Toggle featured status of a listing."""
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    listing.is_featured = not listing.is_featured
    db.commit()
    
    action = "feature_listing" if listing.is_featured else "unfeature_listing"
    log_admin_activity(
        db, admin.id, action, "listing", listing_id,
        None, get_client_ip(request)
    )
    
    status_text = "featured" if listing.is_featured else "unfeatured"
    return {"message": f"Listing is now {status_text}"}


# ============ REPORTS MANAGEMENT ============

@router.get("/reports", response_model=ReportListResponse)
def get_all_reports(
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user),
    status: Optional[str] = None,
    report_type: Optional[str] = None,
    sort_by: Optional[str] = Query("newest", regex="^(newest|oldest)$"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    """Get all reports with filters."""
    query = db.query(Report)
    
    if status:
        query = query.filter(Report.status == status)
    
    if report_type:
        query = query.filter(Report.report_type == report_type)
    
    total = query.count()
    
    if sort_by == "newest":
        query = query.order_by(desc(Report.created_at))
    else:
        query = query.order_by(Report.created_at)
    
    offset = (page - 1) * limit
    reports = query.offset(offset).limit(limit).all()
    
    report_responses = []
    for report in reports:
        reporter = db.query(User).filter(User.id == report.reporter_id).first()
        reported_user = db.query(User).filter(User.id == report.reported_user_id).first() if report.reported_user_id else None
        listing = db.query(Listing).filter(Listing.id == report.listing_id).first() if report.listing_id else None
        reviewer = db.query(User).filter(User.id == report.reviewed_by).first() if report.reviewed_by else None
        
        report_responses.append(ReportResponse(
            id=report.id,
            reporter_id=report.reporter_id,
            reporter_name=reporter.name if reporter else None,
            reporter_email=reporter.email if reporter else "Unknown",
            report_type=report.report_type.value if report.report_type else "unknown",
            reported_user_id=report.reported_user_id,
            reported_user_name=reported_user.name if reported_user else None,
            listing_id=report.listing_id,
            listing_title=listing.title if listing else None,
            message_id=report.message_id,
            reason=report.reason.value if report.reason else "other",
            description=report.description,
            status=report.status.value if report.status else "pending",
            reviewed_by=report.reviewed_by,
            reviewer_name=reviewer.name if reviewer else None,
            admin_notes=report.admin_notes,
            action_taken=report.action_taken,
            created_at=report.created_at,
            resolved_at=report.resolved_at
        ))
    
    return ReportListResponse(
        reports=report_responses,
        total=total,
        page=page,
        pages=(total + limit - 1) // limit
    )


@router.get("/reports/{report_id}", response_model=ReportDetailResponse)
def get_report_detail(
    report_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Get detailed report information."""
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    reporter = db.query(User).filter(User.id == report.reporter_id).first()
    reported_user = db.query(User).filter(User.id == report.reported_user_id).first() if report.reported_user_id else None
    listing = db.query(Listing).filter(Listing.id == report.listing_id).first() if report.listing_id else None
    reviewer = db.query(User).filter(User.id == report.reviewed_by).first() if report.reviewed_by else None
    
    reporter_total_reports = db.query(Report).filter(Report.reporter_id == report.reporter_id).count()
    reporter_valid_reports = db.query(Report).filter(
        Report.reporter_id == report.reporter_id,
        Report.status == ReportStatusEnum.resolved
    ).count()
    reported_user_total_reports = db.query(Report).filter(
        Report.reported_user_id == report.reported_user_id
    ).count() if report.reported_user_id else 0
    
    listing_response = None
    if listing:
        seller = db.query(User).filter(User.id == listing.seller_id).first()
        listing_response = AdminListingResponse(
            id=listing.id,
            title=listing.title,
            description=listing.description,
            price=listing.price,
            category=listing.category,
            condition=listing.condition,
            status=listing.status,
            views=listing.views,
            image_url=listing.image_url,
            image_url_2=listing.image_url_2,
            image_url_3=listing.image_url_3,
            seller_id=listing.seller_id,
            seller_name=seller.name if seller else None,
            seller_email=seller.email if seller else "Unknown",
            is_featured=listing.is_featured,
            hidden_reason=listing.hidden_reason,
            reports_count=0,
            created_at=listing.created_at
        )
    
    return ReportDetailResponse(
        id=report.id,
        reporter_id=report.reporter_id,
        reporter_name=reporter.name if reporter else None,
        reporter_email=reporter.email if reporter else "Unknown",
        report_type=report.report_type.value if report.report_type else "unknown",
        reported_user_id=report.reported_user_id,
        reported_user_name=reported_user.name if reported_user else None,
        listing_id=report.listing_id,
        listing_title=listing.title if listing else None,
        message_id=report.message_id,
        reason=report.reason.value if report.reason else "other",
        description=report.description,
        status=report.status.value if report.status else "pending",
        reviewed_by=report.reviewed_by,
        reviewer_name=reviewer.name if reviewer else None,
        admin_notes=report.admin_notes,
        action_taken=report.action_taken,
        created_at=report.created_at,
        resolved_at=report.resolved_at,
        reporter_total_reports=reporter_total_reports,
        reporter_valid_reports=reporter_valid_reports,
        reported_user_total_reports=reported_user_total_reports,
        listing_details=listing_response
    )


@router.put("/reports/{report_id}/review")
def review_report(
    report_id: int,
    review_data: ReviewReportRequest,
    request: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Review and resolve a report."""
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    report.status = review_data.status
    report.reviewed_by = admin.id
    report.admin_notes = review_data.admin_notes
    report.action_taken = review_data.action_taken
    
    if review_data.status in [ReportStatusEnum.resolved, ReportStatusEnum.dismissed]:
        report.resolved_at = datetime.utcnow()
    
    db.commit()
    
    log_admin_activity(
        db, admin.id, "review_report", "report", report_id,
        {"status": review_data.status.value, "action": review_data.action_taken},
        get_client_ip(request)
    )
    
    return {"message": f"Report has been {review_data.status.value}"}


# ============ ANALYTICS ============

@router.get("/analytics/users", response_model=UserAnalytics)
def get_user_analytics(
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Get user analytics."""
    today = datetime.utcnow().date()
    today_start = datetime.combine(today, datetime.min.time())
    week_ago = today_start - timedelta(days=7)
    month_ago = today_start - timedelta(days=30)
    
    total_users = db.query(User).count()
    new_users_today = db.query(User).filter(User.created_at >= today_start).count()
    new_users_week = db.query(User).filter(User.created_at >= week_ago).count()
    new_users_month = db.query(User).filter(User.created_at >= month_ago).count()
    active_users_today = db.query(User).filter(User.last_login >= today_start).count()
    banned_users = db.query(User).filter(User.is_banned == True).count()
    
    # Users by day for last 30 days
    users_by_day = []
    for i in range(30):
        day = today - timedelta(days=i)
        day_start = datetime.combine(day, datetime.min.time())
        day_end = day_start + timedelta(days=1)
        count = db.query(User).filter(
            User.created_at >= day_start,
            User.created_at < day_end
        ).count()
        users_by_day.append({"date": day.isoformat(), "count": count})
    
    users_by_day.reverse()
    
    return UserAnalytics(
        total_users=total_users,
        new_users_today=new_users_today,
        new_users_week=new_users_week,
        new_users_month=new_users_month,
        active_users_today=active_users_today,
        banned_users=banned_users,
        users_by_day=users_by_day
    )


@router.get("/analytics/listings", response_model=ListingAnalytics)
def get_listing_analytics(
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Get listing analytics."""
    today = datetime.utcnow().date()
    today_start = datetime.combine(today, datetime.min.time())
    week_ago = today_start - timedelta(days=7)
    
    total_listings = db.query(Listing).count()
    active_listings = db.query(Listing).filter(Listing.status == "available").count()
    sold_listings = db.query(Listing).filter(Listing.status == "sold").count()
    hidden_listings = db.query(Listing).filter(Listing.status == "hidden").count()
    new_listings_today = db.query(Listing).filter(Listing.created_at >= today_start).count()
    new_listings_week = db.query(Listing).filter(Listing.created_at >= week_ago).count()
    
    # Listings by category
    categories = db.query(
        Listing.category, func.count(Listing.id).label('count')
    ).group_by(Listing.category).all()
    listings_by_category = [{"category": c[0], "count": c[1]} for c in categories]
    
    # Average price by category
    avg_prices = db.query(
        Listing.category, func.avg(Listing.price).label('avg_price')
    ).group_by(Listing.category).all()
    avg_price_by_category = [{"category": a[0], "avg_price": round(a[1], 2)} for a in avg_prices]
    
    # Listings by day
    listings_by_day = []
    for i in range(30):
        day = today - timedelta(days=i)
        day_start = datetime.combine(day, datetime.min.time())
        day_end = day_start + timedelta(days=1)
        count = db.query(Listing).filter(
            Listing.created_at >= day_start,
            Listing.created_at < day_end
        ).count()
        listings_by_day.append({"date": day.isoformat(), "count": count})
    
    listings_by_day.reverse()
    
    return ListingAnalytics(
        total_listings=total_listings,
        active_listings=active_listings,
        sold_listings=sold_listings,
        hidden_listings=hidden_listings,
        new_listings_today=new_listings_today,
        new_listings_week=new_listings_week,
        listings_by_category=listings_by_category,
        listings_by_day=listings_by_day,
        avg_price_by_category=avg_price_by_category
    )


# ============ CATEGORIES ============

@router.get("/categories", response_model=List[CategoryResponse])
def get_categories(
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Get all categories."""
    categories = db.query(Category).order_by(Category.display_order).all()
    
    result = []
    for cat in categories:
        listing_count = db.query(Listing).filter(Listing.category == cat.name).count()
        result.append(CategoryResponse(
            id=cat.id,
            name=cat.name,
            description=cat.description,
            icon=cat.icon,
            is_active=cat.is_active,
            display_order=cat.display_order,
            listing_count=listing_count,
            created_at=cat.created_at
        ))
    
    return result


@router.post("/categories", response_model=CategoryResponse)
def create_category(
    category_data: CategoryCreate,
    request: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(get_super_admin_user)
):
    """Create a new category (Super Admin only)."""
    existing = db.query(Category).filter(Category.name == category_data.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category already exists")
    
    category = Category(
        name=category_data.name,
        description=category_data.description,
        icon=category_data.icon,
        display_order=category_data.display_order
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    
    log_admin_activity(
        db, admin.id, "create_category", "category", category.id,
        {"name": category.name}, get_client_ip(request)
    )
    
    return CategoryResponse(
        id=category.id,
        name=category.name,
        description=category.description,
        icon=category.icon,
        is_active=category.is_active,
        display_order=category.display_order,
        listing_count=0,
        created_at=category.created_at
    )


@router.delete("/categories/{category_id}")
def delete_category(
    category_id: int,
    request: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(get_super_admin_user)
):
    """Delete a category (Super Admin only)."""
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    name = category.name
    db.delete(category)
    db.commit()
    
    log_admin_activity(
        db, admin.id, "delete_category", "category", category_id,
        {"name": name}, get_client_ip(request)
    )
    
    return {"message": f"Category '{name}' has been deleted"}


# ============ ACTIVITY LOG ============

@router.get("/activity-log", response_model=ActivityLogListResponse)
def get_activity_log(
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user),
    admin_id: Optional[int] = None,
    action: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100)
):
    """Get admin activity log."""
    query = db.query(AdminActivityLog)
    
    if admin_id:
        query = query.filter(AdminActivityLog.admin_id == admin_id)
    
    if action:
        query = query.filter(AdminActivityLog.action == action)
    
    total = query.count()
    
    query = query.order_by(desc(AdminActivityLog.created_at))
    offset = (page - 1) * limit
    logs = query.offset(offset).limit(limit).all()
    
    log_responses = []
    for log in logs:
        admin_user = db.query(User).filter(User.id == log.admin_id).first()
        log_responses.append(ActivityLogResponse(
            id=log.id,
            admin_id=log.admin_id,
            admin_name=admin_user.name if admin_user else None,
            admin_email=admin_user.email if admin_user else "Unknown",
            action=log.action,
            target_type=log.target_type,
            target_id=log.target_id,
            details=log.details,
            ip_address=log.ip_address,
            created_at=log.created_at
        ))
    
    return ActivityLogListResponse(
        logs=log_responses,
        total=total,
        page=page,
        pages=(total + limit - 1) // limit
    )
