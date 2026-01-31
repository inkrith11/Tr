# APSIT TradeHub 🛒

A marketplace platform exclusively for APSIT students to buy and sell items within the campus community.

## 🚀 Features

- **APSIT-Only Access**: Only @apsit.edu.in email addresses can register
- **Google OAuth**: Quick sign-in with your APSIT Google account
- **Listings**: Create, browse, and manage listings with up to 3 images
- **Categories**: Books, Electronics, Clothing, Furniture, and more
- **Messaging**: Real-time chat with sellers/buyers
- **Reviews**: Rate and review other users after transactions
- **Favorites**: Save listings for later

## 📁 Project Structure

```
TradeOlds/
├── frontend/          # React + Vite frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API service layer
│   │   └── context/       # React context (Auth)
│   └── ...
└── backend/           # FastAPI backend
    └── app/
        ├── models/        # SQLAlchemy models
        ├── schemas/       # Pydantic schemas
        ├── routers/       # API endpoints
        ├── services/      # Business logic
        └── main.py        # FastAPI app
```

## 🛠️ Tech Stack

### Frontend
- **React 19** with Vite
- **Tailwind CSS** for styling
- **React Router v7** for navigation
- **Axios** for API calls
- **React Hook Form** for forms
- **React Toastify** for notifications

### Backend
- **FastAPI** framework
- **PostgreSQL** database
- **SQLAlchemy** ORM
- **JWT** authentication
- **Google OAuth2** integration
- **Cloudinary** for image storage (optional)

## 🏃 Getting Started

### Prerequisites
- Node.js 20+
- Python 3.10+
- PostgreSQL

### Frontend Setup

```bash
cd frontend
npm install
cp .env.local.example .env.local
# Edit .env.local with your API URL and Google Client ID
npm run dev
```

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your database and API keys
uvicorn app.main:app --reload
```

### Environment Variables

#### Frontend (.env.local)
```
VITE_API_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

#### Backend (.env)
```
DATABASE_URL=postgresql://user:password@localhost/tradehub
SECRET_KEY=your-secret-key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name (optional)
CLOUDINARY_API_KEY=your_api_key (optional)
CLOUDINARY_API_SECRET=your_api_secret (optional)
```

## 📚 API Documentation

Once the backend is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 🔐 Authentication Flow

1. User signs up with @apsit.edu.in email or uses Google OAuth
2. Server validates email domain
3. JWT token is issued and stored in localStorage
4. Token is sent with each API request in Authorization header

## 📝 License

This project is for educational purposes at APSIT.

---

Built with ❤️ for APSIT students
