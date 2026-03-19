from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
from enum import Enum

from ..database import get_db
from ..models import User, Listing, Report, ReportTypeEnum, ReportReasonEnum, ReportStatusEnum
from ..services.auth import get_current_user

router = APIRouter(prefix="/reports", tags=["Reports"])


class ReportReasonInput(str, Enum):
    spam = "spam"
    fake = "fake"
    inappropriate = "inappropriate"
    scam = "scam"
    harassment = "harassment"
    other = "other"


class ReportCreate(BaseModel):
    listing_id: Optional[int] = None
    reported_user_id: Optional[int] = None
    reason: ReportReasonInput
    description: Optional[str] = None


class ReportResponse(BaseModel):
    id: int
    message: str


@router.post("", response_model=ReportResponse)
def create_report(
    report_data: ReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Submit a report for a listing or user.
    """
    # Must report either a listing or a user
    if not report_data.listing_id and not report_data.reported_user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Must specify either listing_id or reported_user_id"
        )

    # Determine report type
    report_type = ReportTypeEnum.listing if report_data.listing_id else ReportTypeEnum.user

    # Validate listing exists
    if report_data.listing_id:
        listing = db.query(Listing).filter(Listing.id == report_data.listing_id).first()
        if not listing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Listing not found"
            )
        # Can't report own listing
        if listing.seller_id == current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot report your own listing"
            )
        # Set reported user to the listing owner
        reported_user_id = listing.seller_id
    else:
        reported_user_id = report_data.reported_user_id
        # Validate user exists
        user = db.query(User).filter(User.id == reported_user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        # Can't report yourself
        if reported_user_id == current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot report yourself"
            )

    # Check for duplicate reports
    existing = db.query(Report).filter(
        Report.reporter_id == current_user.id,
        Report.listing_id == report_data.listing_id if report_data.listing_id else True,
        Report.reported_user_id == reported_user_id if not report_data.listing_id else True,
        Report.status == ReportStatusEnum.pending
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already reported this. Our team will review it soon."
        )

    # Create report
    report = Report(
        reporter_id=current_user.id,
        report_type=report_type,
        reported_user_id=reported_user_id,
        listing_id=report_data.listing_id,
        reason=ReportReasonEnum(report_data.reason.value),
        description=report_data.description,
        status=ReportStatusEnum.pending
    )

    db.add(report)
    db.commit()
    db.refresh(report)

    return ReportResponse(
        id=report.id,
        message="Report submitted successfully. Our team will review it shortly."
    )
