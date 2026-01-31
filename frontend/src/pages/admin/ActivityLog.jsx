import { useState, useEffect } from 'react';
import { getActivityLog } from '../../services/adminService';

const ActivityLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({ action: '' });

  const actions = [
    { value: '', label: 'All Actions' },
    { value: 'ban_user', label: 'Ban User' },
    { value: 'unban_user', label: 'Unban User' },
    { value: 'delete_user', label: 'Delete User' },
    { value: 'change_role', label: 'Change Role' },
    { value: 'hide_listing', label: 'Hide Listing' },
    { value: 'show_listing', label: 'Show Listing' },
    { value: 'delete_listing', label: 'Delete Listing' },
    { value: 'feature_listing', label: 'Feature Listing' },
    { value: 'review_report', label: 'Review Report' },
    { value: 'create_category', label: 'Create Category' },
    { value: 'delete_category', label: 'Delete Category' },
  ];

  useEffect(() => {
    loadLogs();
  }, [filters, pagination.page]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await getActivityLog({
        ...filters,
        page: pagination.page,
        limit: 50
      });
      setLogs(data.logs);
      setPagination({ page: data.page, pages: data.pages, total: data.total });
    } catch (err) {
      console.error('Failed to load activity log:', err);
    } finally {
      setLoading(false);
    }
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
      'unfeature_listing': '☆',
      'review_report': '📋',
      'create_category': '➕',
      'delete_category': '➖',
    };
    return icons[action] || '📝';
  };

  const getActionColor = (action) => {
    const colors = {
      'ban_user': 'bg-red-100 text-red-700 border-red-200',
      'unban_user': 'bg-green-100 text-green-700 border-green-200',
      'delete_user': 'bg-red-100 text-red-700 border-red-200',
      'delete_listing': 'bg-red-100 text-red-700 border-red-200',
      'change_role': 'bg-purple-100 text-purple-700 border-purple-200',
      'hide_listing': 'bg-orange-100 text-orange-700 border-orange-200',
      'show_listing': 'bg-green-100 text-green-700 border-green-200',
      'feature_listing': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'review_report': 'bg-blue-100 text-blue-700 border-blue-200',
    };
    return colors[action] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const formatAction = (action) => {
    return action
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatDetails = (details) => {
    if (!details) return null;
    try {
      const parsed = typeof details === 'string' ? JSON.parse(details) : details;
      return Object.entries(parsed)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
    } catch {
      return String(details);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Admin Activity Log</h2>
        <p className="text-gray-500">{pagination.total} total actions</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center space-x-4">
          <select
            value={filters.action}
            onChange={(e) => setFilters({ ...filters, action: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            {actions.map((action) => (
              <option key={action.value} value={action.value}>
                {action.label}
              </option>
            ))}
          </select>
          <button
            onClick={loadLogs}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Activity Log */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No activity logs found</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {logs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start space-x-4">
                  {/* Icon */}
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg ${getActionColor(log.action)}`}>
                    {getActionIcon(log.action)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900">
                        {log.admin_name || 'Unknown Admin'}
                        <span className="text-gray-400 font-normal mx-2">•</span>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${getActionColor(log.action)}`}>
                          {formatAction(log.action)}
                        </span>
                      </p>
                      <span className="text-sm text-gray-500 flex-shrink-0">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 mt-1">
                      {log.target_type && (
                        <>
                          Target: <span className="font-medium">{log.target_type}</span>
                          {log.target_id && <span className="text-gray-400"> #{log.target_id}</span>}
                        </>
                      )}
                    </p>

                    {log.details && (
                      <p className="text-xs text-gray-500 mt-1 bg-gray-100 px-2 py-1 rounded inline-block">
                        {formatDetails(log.details)}
                      </p>
                    )}

                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                      <span>Email: {log.admin_email}</span>
                      {log.ip_address && <span>IP: {log.ip_address}</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t flex items-center justify-between">
            <button
              onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
              disabled={pagination.page === 1}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-500">
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
              disabled={pagination.page === pagination.pages}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLog;
