import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardStats, getRecentActivity } from '../../services/adminService';
import { FaUsers, FaBoxes, FaCheckCircle, FaExclamationTriangle, FaComments, FaBan, FaUserPlus, FaHandshake, FaChartLine } from 'react-icons/fa';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [statsData, activityData] = await Promise.all([
        getDashboardStats(),
        getRecentActivity(10)
      ]);
      setStats(statsData);
      setActivity(activityData);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600">
        {error}
      </div>
    );
  }

  const statCards = [
    { label: 'Total Users', value: stats?.total_users || 0, icon: FaUsers, color: 'bg-sky-500', link: '/admin/users' },
    { label: 'Total Listings', value: stats?.total_listings || 0, icon: FaBoxes, color: 'bg-emerald-500', link: '/admin/listings' },
    { label: 'Active Listings', value: stats?.active_listings || 0, icon: FaCheckCircle, color: 'bg-teal-500', link: '/admin/listings' },
    { label: 'Pending Reports', value: stats?.pending_reports || 0, icon: FaExclamationTriangle, color: 'bg-red-500', link: '/admin/reports' },
    { label: 'Total Messages', value: stats?.total_messages || 0, icon: FaComments, color: 'bg-cyan-500' },
    { label: 'Banned Users', value: stats?.banned_users || 0, icon: FaBan, color: 'bg-gray-500', link: '/admin/users?status=banned' },
    { label: 'New Users Today', value: stats?.new_users_today || 0, icon: FaUserPlus, color: 'bg-blue-500' },
    { label: 'Trades Completed', value: stats?.total_trades || 0, icon: FaHandshake, color: 'bg-amber-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gray-900 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold">Welcome to Admin Dashboard</h2>
        <p className="mt-2 text-gray-400">
          Manage users, listings, and monitor platform activity
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Link
              key={index}
              to={stat.link || '#'}
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {stat.value.toLocaleString()}
                  </p>
                </div>
                <div className={`${stat.color} w-12 h-12 rounded-xl flex items-center justify-center`}>
                  <Icon className="text-white text-xl" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/admin/users"
              className="flex items-center p-4 bg-sky-50 rounded-xl hover:bg-sky-100 transition-colors"
            >
              <FaUsers className="text-sky-600 text-xl mr-3" />
              <span className="font-medium text-sky-700">Manage Users</span>
            </Link>
            <Link
              to="/admin/listings"
              className="flex items-center p-4 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors"
            >
              <FaBoxes className="text-emerald-600 text-xl mr-3" />
              <span className="font-medium text-emerald-700">Manage Listings</span>
            </Link>
            <Link
              to="/admin/reports"
              className="flex items-center p-4 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
            >
              <FaExclamationTriangle className="text-red-600 text-xl mr-3" />
              <span className="font-medium text-red-700">Review Reports</span>
            </Link>
            <Link
              to="/admin/analytics"
              className="flex items-center p-4 bg-cyan-50 rounded-xl hover:bg-cyan-100 transition-colors"
            >
              <FaChartLine className="text-cyan-600 text-xl mr-3" />
              <span className="font-medium text-cyan-700">View Analytics</span>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <Link to="/admin/activity" className="text-sm text-gray-600 hover:text-gray-900">
              View All →
            </Link>
          </div>

          {activity.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No recent activity</p>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {activity.map((item) => (
                <div key={item.id} className="flex items-start p-3 bg-gray-50 rounded-xl">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm">
                    {getActionIcon(item.action)}
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.admin_name || 'Admin'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {item.description || item.action}
                    </p>
                  </div>
                  <div className="text-xs text-gray-400">
                    {formatTime(item.created_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const getActionIcon = (action) => {
  const icons = {
    'ban_user': '🚫',
    'unban_user': '✅',
    'delete_user': '🗑️',
    'change_role': '👑',
    'hide_listing': '🙈',
    'show_listing': '👁️',
    'delete_listing': '🗑️',
    'feature_listing': '⭐',
    'review_report': '📋',
  };
  return icons[action] || '📝';
};

const formatTime = (dateStr) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = (now - date) / 1000;

  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleDateString();
};

export default Dashboard;
