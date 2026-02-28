# APSIT TradeHub 🛒

A marketplace platform exclusively for APSIT students to buy and sell items within the campus community.

[![CI](https://github.com/inkrith11/Tr/actions/workflows/ci.yml/badge.svg)](https://github.com/inkrith11/Tr/actions/workflows/ci.yml)

## 🚀 Features

- **APSIT-Only Access**: Only @apsit.edu.in email addresses can register
- **Google OAuth**: Quick sign-in with your APSIT Google account
- **Listings**: Create, browse, and manage listings with 3 authenticity images
- **Categories**: Books, Electronics, Stationery, Tools, Accessories, and more
- **Messaging**: Real-time chat with sellers/buyers (3-second polling)
- **Reviews**: Rate and review other users after transactions
- **Favorites**: Save listings for later
- **Admin Panel**: Dashboard, user/listing management, reports, analytics, activity log
- **Security**: Rate limiting, input validation, upload sanitization, banned-user enforcement

## 📁 Project Structure

```
TradeOlds/
├── .github/workflows/     # CI/CD pipeline
│   └── ci.yml
├── frontend/              # React + Vite frontend
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # Page components
│   │   │   └── admin/         # Admin panel pages
│   │   ├── services/          # API service layer
│   │   ├── context/           # React context (Auth)
│   │   └── __tests__/         # Vitest test suite (121 tests)
│   │       ├── components/
│   │       ├── pages/
│   │       ├── services/
│   │       └── admin/
│   └── ...
└── backend/               # FastAPI backend
    ├── app/
    │   ├── models/            # SQLAlchemy models
    │   ├── schemas/           # Pydantic schemas
    │   ├── routers/           # API endpoints
    │   ├── services/          # Business logic
    │   └── main.py            # FastAPI app
    └── tests/                 # Pytest test suite (68 tests)
        ├── conftest.py        # Fixtures & factories
        ├── test_auth.py
        ├── test_listings.py
        ├── test_messages.py
        ├── test_reviews.py
        ├── test_users.py
        └── test_favorites.py
```

## 🛠️ Tech Stack

### Frontend
- **React 19** with Vite 7
- **Tailwind CSS v4** for styling
- **React Router v7** for navigation
- **Axios** for API calls (15s timeout, 401/429 interceptors)
- **React Hook Form** for forms
- **React Toastify** for notifications
- **Vitest** + **React Testing Library** for tests

### Backend
- **FastAPI 0.109** framework
- **PostgreSQL** database (SQLite for tests)
- **SQLAlchemy 2.0** ORM
- **Pydantic 2.5** for validation
- **JWT** authentication (python-jose + bcrypt)
- **Google OAuth2** integration
- **Cloudinary** for image storage (optional, local fallback)
- **Pytest** for tests

## 🏃 Getting Started

### Prerequisites
- Node.js 20+
- Python 3.12+
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
SECRET_KEY=your-secret-key          # Auto-generated if not set
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name   # optional
CLOUDINARY_API_KEY=your_api_key         # optional
CLOUDINARY_API_SECRET=your_api_secret   # optional
```

## 🧪 Testing

### Backend Tests (68 tests)

```bash
cd backend
source venv/bin/activate
pip install -r requirements-test.txt   # first time only
python -m pytest tests/ -v
```

Tests use an **in-memory SQLite** database — no PostgreSQL needed.

### Frontend Tests (121 tests)

```bash
cd frontend
npm test              # single run
npm run test:watch    # watch mode
npm run test:coverage # with coverage report
```

### CI/CD

GitHub Actions runs automatically on every push/PR to `main`:

| Job | What it does |
|-----|-------------|
| **backend-lint** | Ruff linter on Python code |
| **backend-test** | Pytest with Python 3.13 |
| **frontend-lint** | ESLint on React code |
| **frontend-test** | Vitest with Node 20 |
| **frontend-build** | Vite production build check |

Check results at: **[Actions tab](https://github.com/inkrith11/Tr/actions)**

## 📚 API Documentation

Once the backend is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 🔐 Authentication Flow

1. User signs up with @apsit.edu.in email or uses Google OAuth
2. Server validates email domain
3. JWT token is issued and stored in localStorage
4. Token is sent with each API request via Authorization header
5. Banned users receive 403 and cannot log in

## 🔒 Security

- **Rate Limiting**: 10 requests/60 seconds on auth endpoints
- **Input Validation**: Password 8–128 chars, title 3–200, price 0–1M, etc.
- **Upload Protection**: MIME type validation, 5MB size limit, UUID filenames, path traversal prevention
- **Secret Key**: Auto-generates a cryptographically random key if `SECRET_KEY` is not set
- **CORS**: Rejects wildcard (`*`) origins in production
- **Error Handling**: Global error boundary on frontend, structured error responses on backend

## 📝 License

This project is for educational purposes at APSIT.

---

Built with ❤️ for APSIT students
