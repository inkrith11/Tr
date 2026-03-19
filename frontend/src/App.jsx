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
import EditProfile from './pages/EditProfile';
import MyListings from './pages/MyListings';
import Messages from './pages/Messages';
import Favorites from './pages/Favorites';

// Admin Pages
import {
  AdminLayout,
  AdminLogin,
  Dashboard,
  UsersManagement,
  ListingsManagement,
  ReportsManagement,
  Analytics,
  ActivityLog
} from './pages/admin';

// Layout wrapper for main app pages
const MainLayout = ({ children }) => (
  <>
    <Navbar />
    <main className="flex-grow">
      {children}
    </main>
    <Footer />
  </>
);

function App() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      <Routes>
        {/* Admin Routes - No Navbar/Footer - MUST be before other routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/*" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="users" element={<UsersManagement />} />
          <Route path="listings" element={<ListingsManagement />} />
          <Route path="reports" element={<ReportsManagement />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="activity" element={<ActivityLog />} />
        </Route>

        {/* Public Routes */}
        <Route path="/" element={<MainLayout><Home /></MainLayout>} />
        <Route path="/login" element={<MainLayout><Login /></MainLayout>} />
        <Route path="/register" element={<MainLayout><Register /></MainLayout>} />
        <Route path="/listings/:id" element={<MainLayout><ListingDetails /></MainLayout>} />
        <Route path="/profile/:id" element={<MainLayout><Profile /></MainLayout>} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/create-listing" element={<MainLayout><CreateListing /></MainLayout>} />
          <Route path="/edit-listing/:id" element={<MainLayout><CreateListing /></MainLayout>} />
          <Route path="/edit-profile" element={<MainLayout><EditProfile /></MainLayout>} />
          <Route path="/my-listings" element={<MainLayout><MyListings /></MainLayout>} />
          <Route path="/messages" element={<MainLayout><Messages /></MainLayout>} />
          <Route path="/messages/:userId" element={<MainLayout><Messages /></MainLayout>} />
          <Route path="/favorites" element={<MainLayout><Favorites /></MainLayout>} />
        </Route>

        {/* 404 */}
        <Route path="*" element={
          <MainLayout>
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
              <p className="text-gray-500 mb-8">Page not found</p>
              <a href="/" className="text-primary hover:text-primary-dark">
                Go back home
              </a>
            </div>
          </MainLayout>
        } />
      </Routes>
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
