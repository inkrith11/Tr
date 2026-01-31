# APSIT TradeHub - Backend

FastAPI backend for APSIT TradeHub marketplace.

## 🚀 Quick Start

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env
# Edit .env with your configuration

# Run development server
uvicorn app.main:app --reload --port 8000
```

## 📁 Structure

```
app/
├── main.py           # FastAPI application entry point
├── config.py         # Settings from environment
├── database.py       # SQLAlchemy engine setup
├── models/
│   ├── __init__.py
│   └── models.py     # Database models (User, Listing, etc.)
├── schemas/
│   ├── __init__.py
│   └── schemas.py    # Pydantic validation schemas
├── routers/
│   ├── __init__.py
│   ├── auth.py       # Authentication endpoints
│   ├── listings.py   # Listing CRUD + favorites
│   ├── messages.py   # Messaging system
│   ├── users.py      # User profiles
│   └── reviews.py    # Review system
└── services/
    ├── __init__.py
    ├── auth.py       # JWT & password handling
    └── upload.py     # Image upload (Cloudinary/local)
```

## 🔧 Configuration

Create `.env` file:
```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/tradehub

# Security
SECRET_KEY=your-super-secret-key-change-this
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# CORS
FRONTEND_URL=http://localhost:5173

# Email domain restriction
ALLOWED_EMAIL_DOMAIN=apsit.edu.in

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Cloudinary (optional - for image storage)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

## 📚 API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login with email/password
- `POST /auth/google` - Login with Google OAuth
- `GET /auth/me` - Get current user

### Listings
- `GET /listings` - Get all listings (with filters)
- `GET /listings/{id}` - Get single listing
- `POST /listings` - Create listing (multipart form)
- `PUT /listings/{id}` - Update listing
- `DELETE /listings/{id}` - Delete listing
- `GET /listings/user/me` - Get current user's listings
- `POST /listings/{id}/favorite` - Add to favorites
- `DELETE /listings/{id}/favorite` - Remove from favorites
- `GET /listings/favorites/me` - Get favorited listings

### Messages
- `GET /messages/conversations` - Get all conversations
- `GET /messages/conversation/{user_id}/{listing_id}` - Get messages
- `POST /messages` - Send message
- `GET /messages/unread/count` - Get unread count

### Users
- `GET /users/me` - Get current user profile
- `GET /users/{id}` - Get user public profile
- `PUT /users/me` - Update profile
- `GET /users/{id}/listings` - Get user's listings
- `GET /users/{id}/reviews` - Get user's reviews

### Reviews
- `POST /reviews` - Create review
- `GET /reviews/listing/{id}` - Get reviews for listing
- `GET /reviews/my-reviews` - Get reviews received
- `GET /reviews/given` - Get reviews given
- `DELETE /reviews/{id}` - Delete review

## 🗄️ Database Models

### User
- id, email, name, phone, hashed_password
- google_id, profile_picture
- created_at, updated_at

### Listing
- id, title, description, price, category, condition
- image_url, image_url_2, image_url_3
- status (available/sold/reserved)
- seller_id, views, created_at, updated_at

### Message
- id, content, sender_id, receiver_id, listing_id
- is_read, created_at

### Review
- id, rating (1-5), comment
- reviewer_id, reviewed_user_id, listing_id
- created_at

### Favorite
- id, user_id, listing_id, created_at

## 🔐 Security

- Passwords hashed with bcrypt
- JWT tokens for authentication
- Email domain validation (@apsit.edu.in only)
- CORS configured for frontend origin

## 📝 API Documentation

Visit after starting server:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
