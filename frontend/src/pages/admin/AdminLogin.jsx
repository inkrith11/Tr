import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { setAdminToken, setAdminUser, getAdminToken } from '../../services/adminService';

const AdminLogin = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Redirect if already logged in
  if (getAdminToken()) {
    navigate('/admin');
    return null;
  }

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setError('');

      try {
        // Exchange the access token for user info and authenticate
        const authResponse = await api.post('/auth/google-token', {
          access_token: tokenResponse.access_token
        });

        // Now verify if this user is an admin
        const token = authResponse.data.access_token;
        
        // Check admin status using the token
        const verifyResponse = await api.get('/admin/verify', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (verifyResponse.data.valid) {
          // User is an admin, store the token
          setAdminToken(token);
          setAdminUser({
            ...authResponse.data.user,
            role: verifyResponse.data.role
          });
          toast.success('Welcome to Admin Panel!');
          navigate('/admin');
        }
      } catch (err) {
        const message = err.response?.data?.detail || 'Access denied. Admin privileges required.';
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      setError('Google Sign In failed. Please try again.');
      toast.error('Google Sign In failed');
    },
    // Force account selection and restrict to apsit.edu.in domain
    prompt: 'select_account',
    hosted_domain: 'apsit.edu.in',
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-10 text-center">
          <div className="text-5xl mb-4">🛡️</div>
          <h1 className="text-2xl font-bold text-white">Admin Portal</h1>
          <p className="text-indigo-200 mt-2">APSIT TradeHub Administration</p>
        </div>

        {/* Login Section */}
        <div className="px-8 py-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm text-center">{error}</p>
            </div>
          )}

          <div className="text-center mb-6">
            <p className="text-gray-600 text-sm">
              Sign in with your <strong>@apsit.edu.in</strong> admin account
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <div className="flex justify-center">
              <button
                onClick={() => handleGoogleLogin()}
                className="flex items-center gap-3 px-6 py-3 bg-white border-2 border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-gray-300 transition-all"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="font-medium text-gray-700">Sign in with Google</span>
              </button>
            </div>
          )}

          <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-amber-800 text-xs text-center">
              ⚠️ Only users with <strong>Admin</strong> or <strong>Super Admin</strong> role can access this panel.
              Contact a Super Admin if you need access.
            </p>
          </div>

          <div className="mt-6 text-center">
            <a 
              href="/" 
              className="text-sm text-gray-600 hover:text-indigo-600 transition-colors"
            >
              ← Back to TradeHub
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
