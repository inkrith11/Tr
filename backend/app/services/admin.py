from fastapi import Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import Optional
import json

from ..database import get_db
from ..models import User, AdminActivityLog, RoleEnum
from .auth import get_current_user


async def get_admin_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Dependency that ensures the current user is an admin.
    Returns the admin user or raises 403.
    """
    if current_user.role not in [RoleEnum.admin, RoleEnum.super_admin]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    if current_user.is_banned:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been banned"
        )
    
    return current_user


async def get_super_admin_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Dependency that ensures the current user is a super admin.
    Returns the super admin user or raises 403.
    """
    if current_user.role != RoleEnum.super_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin access required"
        )
    
    if current_user.is_banned:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been banned"
        )
    
    return current_user


def log_admin_activity(
    db: Session,
    admin_id: int,
    action: str,
    target_type: Optional[str] = None,
    target_id: Optional[int] = None,
    details: Optional[dict] = None,
    ip_address: Optional[str] = None
):
    """
    Log an admin action to the activity log.
    """
    log_entry = AdminActivityLog(
        admin_id=admin_id,
        action=action,
        target_type=target_type,
        target_id=target_id,
        details=json.dumps(details) if details else None,
        ip_address=ip_address
    )
    db.add(log_entry)
    db.commit()
    return log_entry


def get_client_ip(request: Request) -> Optional[str]:
    """
    Get the client's IP address from the request.
    """
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else None


# Auto-flagging keywords for content moderation
SUSPICIOUS_KEYWORDS = [
    "free iphone",
    "guaranteed money",
    "easy cash",
    "quick money",
    "whatsapp",
    "telegram",
    "pay first",
    "advance payment",
    "western union",
    "bitcoin",
    "crypto",
]

SPAM_PATTERNS = [
    r"https?://[^\s]+",  # External URLs
    r"\b\d{10}\b",  # Phone numbers (10 digits)
]


def check_content_for_flags(content: str) -> Optional[str]:
    """
    Check content for suspicious keywords/patterns.
    Returns the reason if flagged, None otherwise.
    """
    content_lower = content.lower()
    
    for keyword in SUSPICIOUS_KEYWORDS:
        if keyword in content_lower:
            return f"Contains suspicious keyword: {keyword}"
    
    import re
    for pattern in SPAM_PATTERNS:
        if re.search(pattern, content):
            return f"Contains suspicious pattern"
    
    return None


def should_auto_flag_listing(title: str, description: str, price: float) -> Optional[str]:
    """
    Check if a listing should be auto-flagged.
    Returns the reason if should be flagged, None otherwise.
    """
    # Check for ₹0 or extremely low prices
    if price <= 0:
        return "Price is zero or negative"
    
    if price < 10:
        return "Suspiciously low price"
    
    # Check title and description for suspicious content
    combined_content = f"{title} {description}"
    keyword_flag = check_content_for_flags(combined_content)
    if keyword_flag:
        return keyword_flag
    
    return None


def should_auto_flag_message(content: str) -> Optional[str]:
    """
    Check if a message should be auto-flagged.
    """
    return check_content_for_flags(content)
