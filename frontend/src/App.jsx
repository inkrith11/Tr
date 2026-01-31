import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import CreateListing from './pages/CreateListing';
import ListingDetails from './pages/ListingDetails';
import Profile from './pages/Profile';
import MyListings from './pages/MyListings';
import Messages from './pages/Messages';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/listings/:id" element={<ListingDetails />} />
          <Route path="/profile/:id" element={<Profile />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/create-listing" element={<CreateListing />} />
            <Route path="/edit-listing/:id" element={<CreateListing />} />
            <Route path="/my-listings" element={<MyListings />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/messages/:userId" element={<Messages />} />
            <Route path="/favorites" element={<Home />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
              <p className="text-gray-500 mb-8">Page not found</p>
              <a href="/" className="text-primary hover:text-primary-dark">
                Go back home
              </a>
            </div>
          } />
        </Routes>
      </main>
      <Footer />
      <ToastContainer 
        position="bottom-right" 
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
}

export default App;
