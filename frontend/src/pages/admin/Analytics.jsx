import { useState, useEffect } from 'react';
import { getUserAnalytics, getListingAnalytics } from '../../services/adminService';

const Analytics = () => {
  const [userAnalytics, setUserAnalytics] = useState(null);
  const [listingAnalytics, setListingAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [users, listings] = await Promise.all([
        getUserAnalytics(),
        getListingAnalytics()
      ]);
      setUserAnalytics(users);
      setListingAnalytics(listings);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: '📊 Overview' },
    { id: 'users', label: '👥 Users' },
    { id: 'listings', label: '📦 Listings' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
        <button
          onClick={loadAnalytics}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <OverviewTab userAnalytics={userAnalytics} listingAnalytics={listingAnalytics} />
          )}
          {activeTab === 'users' && (
            <UsersTab analytics={userAnalytics} />
          )}
          {activeTab === 'listings' && (
            <ListingsTab analytics={listingAnalytics} />
          )}
        </div>
      </div>
    </div>
  );
};

const OverviewTab = ({ userAnalytics, listingAnalytics }) => {
  const stats = [
    { label: 'Total Users', value: userAnalytics?.total_users || 0, icon: '👥', color: 'bg-blue-500' },
    { label: 'Total Listings', value: listingAnalytics?.total_listings || 0, icon: '📦', color: 'bg-green-500' },
    { label: 'Active Listings', value: listingAnalytics?.active_listings || 0, icon: '✅', color: 'bg-emerald-500' },
    { label: 'Sold Items', value: listingAnalytics?.sold_listings || 0, icon: '🤝', color: 'bg-purple-500' },
    { label: 'New Users (Week)', value: userAnalytics?.new_users_week || 0, icon: '📈', color: 'bg-indigo-500' },
    { label: 'New Listings (Week)', value: listingAnalytics?.new_listings_week || 0, icon: '🆕', color: 'bg-pink-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="bg-gray-50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {stat.value.toLocaleString()}
                </p>
              </div>
              <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center text-2xl`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Categories Distribution */}
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-4">📊 Listings by Category</h3>
          <div className="space-y-3">
            {listingAnalytics?.listings_by_category?.slice(0, 5).map((cat, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-gray-600">{cat.category}</span>
                <div className="flex items-center">
                  <div className="w-32 h-2 bg-gray-200 rounded-full mr-3">
                    <div 
                      className="h-full bg-indigo-600 rounded-full" 
                      style={{ 
                        width: `${Math.min((cat.count / (listingAnalytics?.total_listings || 1)) * 100, 100)}%` 
                      }}
                    />
                  </div>
                  <span className="font-medium text-gray-900">{cat.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Average Prices */}
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-4">💰 Average Price by Category</h3>
          <div className="space-y-3">
            {listingAnalytics?.avg_price_by_category?.slice(0, 5).map((cat, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-gray-600">{cat.category}</span>
                <span className="font-semibold text-gray-900">
                  ₹{cat.avg_price?.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const UsersTab = ({ analytics }) => {
  return (
    <div className="space-y-6">
      {/* User Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={analytics?.total_users} color="bg-blue-100 text-blue-700" />
        <StatCard label="New Today" value={analytics?.new_users_today} color="bg-green-100 text-green-700" />
        <StatCard label="New This Week" value={analytics?.new_users_week} color="bg-indigo-100 text-indigo-700" />
        <StatCard label="Banned Users" value={analytics?.banned_users} color="bg-red-100 text-red-700" />
      </div>

      {/* User Growth Chart */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="font-semibold text-gray-900 mb-4">📈 User Registrations (Last 30 Days)</h3>
        <div className="h-64 flex items-end space-x-1">
          {analytics?.users_by_day?.slice(-30).map((day, index) => {
            const maxCount = Math.max(...(analytics.users_by_day?.map(d => d.count) || [1]));
            const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
            return (
              <div
                key={index}
                className="flex-1 bg-indigo-500 rounded-t hover:bg-indigo-600 transition-colors cursor-pointer group relative"
                style={{ height: `${Math.max(height, 2)}%` }}
                title={`${day.date}: ${day.count} users`}
              >
                <div className="hidden group-hover:block absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  {day.count} users
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>30 days ago</span>
          <span>Today</span>
        </div>
      </div>
    </div>
  );
};

const ListingsTab = ({ analytics }) => {
  return (
    <div className="space-y-6">
      {/* Listing Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Listings" value={analytics?.total_listings} color="bg-blue-100 text-blue-700" />
        <StatCard label="Active" value={analytics?.active_listings} color="bg-green-100 text-green-700" />
        <StatCard label="Sold" value={analytics?.sold_listings} color="bg-purple-100 text-purple-700" />
        <StatCard label="Hidden" value={analytics?.hidden_listings} color="bg-red-100 text-red-700" />
      </div>

      {/* Listing Growth Chart */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="font-semibold text-gray-900 mb-4">📦 New Listings (Last 30 Days)</h3>
        <div className="h-64 flex items-end space-x-1">
          {analytics?.listings_by_day?.slice(-30).map((day, index) => {
            const maxCount = Math.max(...(analytics.listings_by_day?.map(d => d.count) || [1]));
            const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
            return (
              <div
                key={index}
                className="flex-1 bg-green-500 rounded-t hover:bg-green-600 transition-colors cursor-pointer group relative"
                style={{ height: `${Math.max(height, 2)}%` }}
                title={`${day.date}: ${day.count} listings`}
              >
                <div className="hidden group-hover:block absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  {day.count} listings
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>30 days ago</span>
          <span>Today</span>
        </div>
      </div>

      {/* Category Distribution */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="font-semibold text-gray-900 mb-4">📊 Listings by Category</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {analytics?.listings_by_category?.map((cat, index) => {
            const percentage = analytics.total_listings > 0 
              ? ((cat.count / analytics.total_listings) * 100).toFixed(1)
              : 0;
            return (
              <div key={index} className="flex items-center">
                <div className="w-full">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600">{cat.category}</span>
                    <span className="text-sm font-medium text-gray-900">{cat.count} ({percentage}%)</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full">
                    <div 
                      className="h-full bg-indigo-600 rounded-full" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, color }) => (
  <div className={`${color} rounded-xl p-4`}>
    <p className="text-sm opacity-80">{label}</p>
    <p className="text-2xl font-bold mt-1">{value?.toLocaleString() || 0}</p>
  </div>
);

export default Analytics;
