from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, or_, and_
from typing import List, Optional

from ..database import get_db
from ..models import User, Message, Listing
from ..schemas import MessageCreate, MessageResponse, ConversationResponse
from ..services.auth import get_current_user

router = APIRouter(prefix="/messages", tags=["Messages"])


@router.get("/conversations", response_model=List[ConversationResponse])
def get_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all conversations for the current user.
    A conversation is a unique pairing of sender/receiver for a specific listing.
    """
    # Get all messages where user is sender or receiver
    messages = db.query(Message).filter(
        or_(
            Message.sender_id == current_user.id,
            Message.receiver_id == current_user.id
        )
    ).options(
        joinedload(Message.listing),
        joinedload(Message.sender),
        joinedload(Message.receiver)
    ).order_by(desc(Message.created_at)).all()
    
    # Group by conversation (unique combo of other_user and listing)
    conversations_dict = {}
    
    for msg in messages:
        # Determine the other user in the conversation
        other_user = msg.receiver if msg.sender_id == current_user.id else msg.sender
        other_user_id = other_user.id
        listing_id = msg.listing_id
        
        key = (other_user_id, listing_id)
        
        if key not in conversations_dict:
            # Count unread messages in this conversation
            unread_count = db.query(Message).filter(
                Message.listing_id == listing_id,
                Message.receiver_id == current_user.id,
                Message.sender_id == other_user_id,
                Message.is_read == False
            ).count()
            
            conversations_dict[key] = ConversationResponse(
                other_user_id=other_user_id,
                other_user_name=other_user.name or other_user.email.split('@')[0],
                other_user_profile_picture=other_user.profile_picture,
                listing_id=listing_id,
                listing_title=msg.listing.title if msg.listing else "Deleted Listing",
                listing_image=msg.listing.image_url if msg.listing else None,
                last_message=msg.content,
                last_message_time=msg.created_at,
                unread_count=unread_count
            )
    
    # Return conversations sorted by last message time (most recent first)
    return sorted(
        conversations_dict.values(),
        key=lambda x: x.last_message_time,
        reverse=True
    )


@router.get("/conversation/{other_user_id}/{listing_id}", response_model=List[MessageResponse])
def get_conversation_messages(
    other_user_id: int,
    listing_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100)
):
    """
    Get all messages in a specific conversation.
    """
    # Verify users and listing exist
    other_user = db.query(User).filter(User.id == other_user_id).first()
    if not other_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Get messages in this conversation
    messages = db.query(Message).filter(
        Message.listing_id == listing_id,
        or_(
            and_(Message.sender_id == current_user.id, Message.receiver_id == other_user_id),
            and_(Message.sender_id == other_user_id, Message.receiver_id == current_user.id)
        )
    ).options(
        joinedload(Message.sender),
        joinedload(Message.receiver)
    ).order_by(Message.created_at).all()
    
    # Mark messages as read
    unread_messages = [m for m in messages if m.receiver_id == current_user.id and not m.is_read]
    for msg in unread_messages:
        msg.is_read = True
    
    if unread_messages:
        db.commit()
    
    return [MessageResponse.model_validate(m) for m in messages]


@router.post("", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def send_message(
    message_data: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Send a message to another user about a listing.
    """
    # Verify receiver exists
    receiver = db.query(User).filter(User.id == message_data.receiver_id).first()
    if not receiver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Receiver not found"
        )
    
    # Verify listing exists
    listing = db.query(Listing).filter(Listing.id == message_data.listing_id).first()
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found"
        )
    
    # Can't message yourself
    if message_data.receiver_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot send message to yourself"
        )
    
    # Create message
    message = Message(
        content=message_data.content,
        sender_id=current_user.id,
        receiver_id=message_data.receiver_id,
        listing_id=message_data.listing_id
    )
    
    db.add(message)
    db.commit()
    db.refresh(message)
    
    # Load relationships
    message = db.query(Message).options(
        joinedload(Message.sender),
        joinedload(Message.receiver)
    ).filter(Message.id == message.id).first()
    
    return MessageResponse.model_validate(message)


@router.get("/unread/count")
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get count of unread messages for the current user.
    """
    count = db.query(Message).filter(
        Message.receiver_id == current_user.id,
        Message.is_read == False
    ).count()
    
    return {"unread_count": count}


@router.put("/{message_id}/read")
def mark_message_read(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Mark a message as read.
    """
    message = db.query(Message).filter(Message.id == message_id).first()
    
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    
    if message.receiver_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to mark this message as read"
        )
    
    message.is_read = True
    db.commit()
    
    return {"message": "Message marked as read"}
