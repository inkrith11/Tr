import { useState, useEffect } from 'react';
import { getReports, reviewReport } from '../../services/adminService';

const ReportsManagement = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({ status: '', report_type: '', sort_by: 'newest' });
  const [selectedReport, setSelectedReport] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewData, setReviewData] = useState({ status: 'resolved', admin_notes: '', action_taken: '' });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadReports();
  }, [filters, pagination.page]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const data = await getReports({
        ...filters,
        page: pagination.page,
        limit: 20
      });
      setReports(data.reports);
      setPagination({ page: data.page, pages: data.pages, total: data.total });
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async () => {
    if (!selectedReport) return;
    
    try {
      setActionLoading(true);
      await reviewReport(selectedReport.id, reviewData);
      setShowReviewModal(false);
      setReviewData({ status: 'resolved', admin_notes: '', action_taken: '' });
      loadReports();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to review report');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { text: '⏳ Pending', class: 'bg-yellow-100 text-yellow-700' },
      reviewing: { text: '🔍 Reviewing', class: 'bg-blue-100 text-blue-700' },
      resolved: { text: '✅ Resolved', class: 'bg-green-100 text-green-700' },
      dismissed: { text: '❌ Dismissed', class: 'bg-gray-100 text-gray-700' }
    };
    return badges[status] || { text: status, class: 'bg-gray-100 text-gray-700' };
  };

  const getTypeBadge = (type) => {
    const badges = {
      user: { text: '👤 User', class: 'bg-purple-100 text-purple-700' },
      listing: { text: '📦 Listing', class: 'bg-indigo-100 text-indigo-700' },
      message: { text: '💬 Message', class: 'bg-pink-100 text-pink-700' }
    };
    return badges[type] || { text: type, class: 'bg-gray-100 text-gray-700' };
  };

  const getReasonText = (reason) => {
    const reasons = {
      spam: '🚫 Spam',
      fraud: '⚠️ Fraud/Scam',
      inappropriate: '🔞 Inappropriate',
      harassment: '😤 Harassment',
      fake: '🎭 Fake/Misleading',
      prohibited: '⛔ Prohibited Item',
      other: '❓ Other'
    };
    return reasons[reason] || reason;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Reports Queue</h2>
        <div className="flex items-center space-x-3">
          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
            {reports.filter(r => r.status === 'pending').length} Pending
          </span>
          <p className="text-gray-500">{pagination.total} total reports</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="reviewing">Reviewing</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>
          <select
            value={filters.report_type}
            onChange={(e) => setFilters({ ...filters, report_type: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Types</option>
            <option value="user">User Reports</option>
            <option value="listing">Listing Reports</option>
            <option value="message">Message Reports</option>
          </select>
          <select
            value={filters.sort_by}
            onChange={(e) => setFilters({ ...filters, sort_by: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm text-center py-12 text-gray-500">
            No reports found 🎉
          </div>
        ) : (
          reports.map((report) => {
            const statusBadge = getStatusBadge(report.status);
            const typeBadge = getTypeBadge(report.report_type);
            
            return (
              <div key={report.id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-center space-x-3 mb-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${typeBadge.class}`}>
                        {typeBadge.text}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${statusBadge.class}`}>
                        {statusBadge.text}
                      </span>
                      <span className="text-sm text-gray-500">
                        #{report.id}
                      </span>
                    </div>

                    {/* Report Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Reporter</p>
                        <p className="font-medium text-gray-900">
                          {report.reporter_name || 'Unknown'}
                        </p>
                        <p className="text-sm text-gray-500">{report.reporter_email}</p>
                      </div>

                      {report.report_type === 'user' && report.reported_user_name && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Reported User</p>
                          <p className="font-medium text-gray-900">{report.reported_user_name}</p>
                        </div>
                      )}

                      {report.report_type === 'listing' && report.listing_title && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Reported Listing</p>
                          <p className="font-medium text-gray-900">{report.listing_title}</p>
                        </div>
                      )}
                    </div>

                    {/* Reason & Description */}
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        Reason: {getReasonText(report.reason)}
                      </p>
                      {report.description && (
                        <p className="text-gray-600 mt-2">{report.description}</p>
                      )}
                    </div>

                    {/* Admin Notes (if reviewed) */}
                    {report.admin_notes && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-700">
                          <span className="font-medium">Admin Notes:</span> {report.admin_notes}
                        </p>
                        {report.action_taken && (
                          <p className="text-sm text-blue-600 mt-1">
                            <span className="font-medium">Action Taken:</span> {report.action_taken}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                      <span>Reported: {new Date(report.created_at).toLocaleString()}</span>
                      {report.reviewer_name && (
                        <span>Reviewed by: {report.reviewer_name}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="ml-4">
                    {report.status === 'pending' || report.status === 'reviewing' ? (
                      <button
                        onClick={() => {
                          setSelectedReport(report);
                          setShowReviewModal(true);
                        }}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        Review
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedReport(report);
                          setShowReviewModal(true);
                        }}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        View
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="bg-white rounded-xl shadow-sm px-6 py-4 flex items-center justify-between">
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

      {/* Review Modal */}
      {showReviewModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              📋 Review Report #{selectedReport.id}
            </h3>
            
            {/* Report Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p><strong>Type:</strong> {selectedReport.report_type}</p>
              <p><strong>Reason:</strong> {getReasonText(selectedReport.reason)}</p>
              <p><strong>Reporter:</strong> {selectedReport.reporter_name}</p>
              {selectedReport.description && (
                <p className="mt-2"><strong>Description:</strong> {selectedReport.description}</p>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={reviewData.status}
                  onChange={(e) => setReviewData({ ...reviewData, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="reviewing">Mark as Reviewing</option>
                  <option value="resolved">Resolve (Action Taken)</option>
                  <option value="dismissed">Dismiss (No Action Needed)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Admin Notes
                </label>
                <textarea
                  value={reviewData.admin_notes}
                  onChange={(e) => setReviewData({ ...reviewData, admin_notes: e.target.value })}
                  placeholder="Add notes about your review..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {reviewData.status === 'resolved' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Action Taken
                  </label>
                  <select
                    value={reviewData.action_taken}
                    onChange={(e) => setReviewData({ ...reviewData, action_taken: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select action...</option>
                    <option value="warning_issued">Warning Issued</option>
                    <option value="content_removed">Content Removed</option>
                    <option value="user_banned">User Banned</option>
                    <option value="listing_hidden">Listing Hidden</option>
                    <option value="no_violation">No Violation Found</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowReviewModal(false);
                  setReviewData({ status: 'resolved', admin_notes: '', action_taken: '' });
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleReview}
                disabled={actionLoading}
                className="px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {actionLoading ? 'Saving...' : 'Save Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsManagement;
