import { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  getAdminUser,
  getAdminToken,
  adminLogout,
  verifyAdmin
} from '../../services/adminService';
import { FaChartBar, FaUsers, FaBoxes, FaExclamationTriangle, FaChartLine, FaHistory, FaSignOutAlt, FaBars, FaTimes, FaArrowLeft, FaShieldAlt } from 'react-icons/fa';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [adminUser, setAdminUser] = useState(null);
  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      const token = getAdminToken();
      const user = getAdminUser();

      if (!token || !user) {
        navigate('/admin/login');
        return;
      }

      try {
        // Verify the token is still valid
        await verifyAdmin();
        setAdminUser(user);
      } catch (err) {
        console.error('Admin verification failed:', err);
        setError('Session expired. Please login again.');
        adminLogout();
      } finally {
        setIsVerifying(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const menuItems = [
    { path: '/admin', label: 'Dashboard', icon: FaChartBar },
    { path: '/admin/users', label: 'Users', icon: FaUsers },
    { path: '/admin/listings', label: 'Listings', icon: FaBoxes },
    { path: '/admin/reports', label: 'Reports', icon: FaExclamationTriangle },
    { path: '/admin/analytics', label: 'Analytics', icon: FaChartLine },
    { path: '/admin/activity', label: 'Activity Log', icon: FaHistory },
  ];

  const isActive = (path) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md">
          <FaShieldAlt className="text-5xl text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            to="/admin/login"
            className="inline-block px-6 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  if (!adminUser) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="flex items-center justify-center h-16 bg-gray-800">
          <span className="text-white text-lg font-bold tracking-wide">
            TradeHub Admin
          </span>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-3 mt-1 rounded-lg transition-all ${
                  isActive(item.path)
                    ? 'bg-white/10 text-white'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="mr-3 text-lg" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Admin Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gray-800/50">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold">
              {adminUser.name?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {adminUser.name}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {adminUser.role === 'super_admin' ? 'Super Admin' : 'Admin'}
              </p>
            </div>
            <button
              onClick={adminLogout}
              className="ml-2 p-2 text-gray-400 hover:text-white transition-colors"
              title="Logout"
            >
              <FaSignOutAlt />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`${sidebarOpen ? 'lg:ml-64' : ''}`}>
        {/* Top Bar */}
        <header className="bg-white shadow-sm h-16 flex items-center px-4 lg:px-6 sticky top-0 z-40">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
          >
            {sidebarOpen ? <FaTimes className="w-5 h-5" /> : <FaBars className="w-5 h-5" />}
          </button>

          <div className="flex-1 flex items-center justify-between">
            <h1 className="text-lg font-semibold text-gray-900 ml-4 lg:ml-0">
              {menuItems.find(item => isActive(item.path))?.label || 'Admin Panel'}
            </h1>

            <Link
              to="/"
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <FaArrowLeft className="text-xs" />
              Back to Site
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminLayout;
