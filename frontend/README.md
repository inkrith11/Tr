# APSIT TradeHub - Frontend

React frontend for APSIT TradeHub marketplace.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Create environment file
cp .env.local.example .env.local

# Start development server
npm run dev
```

## 📁 Structure

```
src/
├── components/        # Reusable UI components
│   ├── Navbar.jsx        # Navigation bar
│   ├── Footer.jsx        # Site footer
│   ├── ListingCard.jsx   # Listing display card
│   ├── ImageUpload.jsx   # Multi-image uploader
│   ├── Loading.jsx       # Loading spinner
│   ├── ErrorMessage.jsx  # Error display
│   └── ProtectedRoute.jsx # Auth route guard
├── pages/            # Page components
│   ├── Home.jsx          # Browse listings
│   ├── Login.jsx         # Login page
│   ├── Register.jsx      # Registration page
│   ├── CreateListing.jsx # Create new listing
│   ├── ListingDetails.jsx # Single listing view
│   ├── Profile.jsx       # User profile
│   ├── MyListings.jsx    # Manage own listings
│   └── Messages.jsx      # Chat interface
├── services/         # API communication
│   ├── api.js            # Axios instance
│   ├── authService.js    # Auth API calls
│   ├── listingService.js # Listing operations
│   ├── messageService.js # Messaging
│   ├── userService.js    # User profile
│   └── reviewService.js  # Reviews
├── context/
│   └── AuthContext.jsx   # Global auth state
├── App.jsx           # Main app with routing
├── main.jsx          # Entry point
└── index.css         # Global styles + Tailwind
```

## 🔧 Configuration

Edit `.env.local`:
```
VITE_API_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

## 📦 Dependencies

- **react**: UI library
- **react-router-dom**: Client-side routing
- **axios**: HTTP client
- **react-hook-form**: Form handling
- **react-icons**: Icon library
- **react-toastify**: Toast notifications
- **@react-oauth/google**: Google Sign-In
- **date-fns**: Date formatting
- **clsx + tailwind-merge**: Utility classes

## 🎨 Styling

Using Tailwind CSS with custom configuration:
- Custom primary/secondary colors
- Responsive design
- Dark-mode ready structure

## 🔐 Authentication

The app uses JWT tokens stored in localStorage:
- Token is automatically attached to API requests
- Auth state is managed globally via React Context
- Protected routes redirect to login if unauthorized
