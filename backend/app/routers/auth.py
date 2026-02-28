from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User
from ..schemas import (
    UserCreate, 
    UserLogin, 
    UserResponse, 
    TokenResponse, 
    GoogleAuthRequest
)
from ..services.auth import (
    verify_password,
    get_password_hash,
    create_access_token,
    validate_email_domain,
    verify_google_token,
    get_current_user
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user.
    Only @apsit.edu.in emails are allowed.
    """
    # Check if email domain is valid
    if not validate_email_domain(user_data.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only APSIT email addresses (@apsit.edu.in) are allowed"
        )
    
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        name=user_data.name,
        phone=user_data.phone
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create access token
    access_token = create_access_token(data={"sub": str(new_user.id)})
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(new_user)
    )


@router.post("/login", response_model=TokenResponse)
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """
    Login with email and password.
    """
    # Find user
    user = db.query(User).filter(User.email == user_data.email).first()
    
    if not user or not user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Verify password
    if not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Check if user is banned
    if user.is_banned:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been banned"
        )
    
    # Create access token
    access_token = create_access_token(data={"sub": str(user.id)})
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


@router.post("/google", response_model=TokenResponse)
def google_login(auth_data: GoogleAuthRequest, db: Session = Depends(get_db)):
    """
    Login or register with Google OAuth.
    Only @apsit.edu.in emails are allowed.
    """
    # Verify Google token
    google_user = verify_google_token(auth_data.token)
    
    if not google_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google token or email domain not allowed. Only @apsit.edu.in emails are permitted."
        )
    
    # Check if user exists
    user = db.query(User).filter(User.email == google_user['email']).first()
    
    if not user:
        # Create new user from Google data
        user = User(
            email=google_user['email'],
            name=google_user['name'],
            google_id=google_user['google_id'],
            profile_picture=google_user['profile_picture']
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Update Google ID and profile picture if not set
        if not user.google_id:
            user.google_id = google_user['google_id']
        if not user.profile_picture and google_user['profile_picture']:
            user.profile_picture = google_user['profile_picture']
        db.commit()
        db.refresh(user)
    
    # Create access token
    access_token = create_access_token(data={"sub": str(user.id)})
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


@router.post("/google-token", response_model=TokenResponse)
def google_token_login(request: dict, db: Session = Depends(get_db)):
    """
    Login or register with Google OAuth access token.
    Only @apsit.edu.in emails are allowed.
    This endpoint is used by useGoogleLogin hook which returns access_token.
    """
    import httpx
    
    access_token = request.get('access_token')
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Access token is required"
        )
    
    # Get user info from Google using the access token
    try:
        response = httpx.get(
            'https://www.googleapis.com/oauth2/v3/userinfo',
            headers={'Authorization': f'Bearer {access_token}'}
        )
        response.raise_for_status()
        google_data = response.json()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid access token"
        )
    
    email = google_data.get('email')
    
    # Validate email domain
    if not email or not email.endswith('@apsit.edu.in'):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only @apsit.edu.in email addresses are allowed"
        )
    
    # Check if user exists
    user = db.query(User).filter(User.email == email).first()
    
    if not user:
        # Create new user from Google data
        user = User(
            email=email,
            name=google_data.get('name', ''),
            google_id=google_data.get('sub'),
            profile_picture=google_data.get('picture')
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Update Google ID and profile picture if not set
        if not user.google_id:
            user.google_id = google_data.get('sub')
        if not user.profile_picture and google_data.get('picture'):
            user.profile_picture = google_data.get('picture')
        db.commit()
        db.refresh(user)
    
    # Create access token
    jwt_token = create_access_token(data={"sub": str(user.id)})
    
    return TokenResponse(
        access_token=jwt_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """
    Get current authenticated user's information.
    """
    return UserResponse.model_validate(current_user)
