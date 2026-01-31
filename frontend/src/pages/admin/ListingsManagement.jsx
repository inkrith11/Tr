import { useState, useEffect } from 'react';
import { 
  getListings, 
  hideListing, 
  showListing, 
  deleteListing,
  toggleFeatureListing 
} from '../../services/adminService';

const ListingsManagement = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({ search: '', status: '', category: '', sort_by: 'newest' });
  const [selectedListing, setSelectedListing] = useState(null);
  const [showHideModal, setShowHideModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [hideReason, setHideReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const categories = ['Electronics', 'Books', 'Furniture', 'Clothing', 'Sports', 'Vehicles', 'Services', 'Other'];

  useEffect(() => {
    loadListings();
  }, [filters, pagination.page]);

  const loadListings = async () => {
    try {
      setLoading(true);
      const data = await getListings({
        ...filters,
        page: pagination.page,
        limit: 20
      });
      setListings(data.listings);
      setPagination({ page: data.page, pages: data.pages, total: data.total });
    } catch (err) {
      console.error('Failed to load listings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleHide = async () => {
    if (!selectedListing || !hideReason) return;
    
    try {
      setActionLoading(true);
      await hideListing(selectedListing.id, hideReason);
      setShowHideModal(false);
      setHideReason('');
      loadListings();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to hide listing');
    } finally {
      setActionLoading(false);
    }
  };

  const handleShow = async (listing) => {
    if (!confirm(`Make "${listing.title}" visible again?`)) return;
    
    try {
      await showListing(listing.id);
      loadListings();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to show listing');
    }
  };

  const handleDelete = async () => {
    if (!selectedListing) return;
    
    try {
      setActionLoading(true);
      await deleteListing(selectedListing.id);
      setShowDeleteModal(false);
      loadListings();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete listing');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFeature = async (listing) => {
    try {
      await toggleFeatureListing(listing.id);
      loadListings();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to toggle feature');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      available: { text: '✅ Available', class: 'bg-green-100 text-green-700' },
      sold: { text: '🤝 Sold', class: 'bg-blue-100 text-blue-700' },
      hidden: { text: '🙈 Hidden', class: 'bg-red-100 text-red-700' },
      reserved: { text: '⏳ Reserved', class: 'bg-yellow-100 text-yellow-700' }
    };
    return badges[status] || { text: status, class: 'bg-gray-100 text-gray-700' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Listing Management</h2>
        <p className="text-gray-500">{pagination.total} total listings</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Search listings..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Status</option>
            <option value="available">Available</option>
            <option value="sold">Sold</option>
            <option value="hidden">Hidden</option>
            <option value="reserved">Reserved</option>
          </select>
          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            value={filters.sort_by}
            onChange={(e) => setFilters({ ...filters, sort_by: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="price_high">Price: High to Low</option>
            <option value="price_low">Price: Low to High</option>
          </select>
        </div>
      </div>

      {/* Listings Grid */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No listings found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Listing</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Seller</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Views</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Reports</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {listings.map((listing) => {
                  const badge = getStatusBadge(listing.status);
                  return (
                    <tr key={listing.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                            {listing.image_url ? (
                              <img 
                                src={listing.image_url} 
                                alt={listing.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                📦
                              </div>
                            )}
                          </div>
                          <div className="ml-3 max-w-xs">
                            <p className="font-medium text-gray-900 truncate flex items-center">
                              {listing.is_featured && <span className="mr-1">⭐</span>}
                              {listing.title}
                            </p>
                            <p className="text-sm text-gray-500 truncate">{listing.condition}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        ₹{listing.price?.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{listing.category}</td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900">{listing.seller_name || 'Unknown'}</p>
                        <p className="text-xs text-gray-500">{listing.seller_email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${badge.class}`}>
                          {badge.text}
                        </span>
                        {listing.hidden_reason && (
                          <p className="text-xs text-red-500 mt-1 truncate max-w-[120px]" title={listing.hidden_reason}>
                            {listing.hidden_reason}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{listing.views || 0}</td>
                      <td className="px-6 py-4">
                        {listing.reports_count > 0 ? (
                          <span className="text-red-600 font-medium">{listing.reports_count} ⚠️</span>
                        ) : (
                          <span className="text-gray-400">0</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleFeature(listing)}
                            className={`px-3 py-1 text-sm rounded-lg ${
                              listing.is_featured 
                                ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                            title={listing.is_featured ? 'Remove Feature' : 'Feature Listing'}
                          >
                            ⭐
                          </button>
                          
                          {listing.status === 'hidden' ? (
                            <button
                              onClick={() => handleShow(listing)}
                              className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                            >
                              Show
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedListing(listing);
                                setShowHideModal(true);
                              }}
                              className="px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200"
                            >
                              Hide
                            </button>
                          )}
                          
                          <button
                            onClick={() => {
                              setSelectedListing(listing);
                              setShowDeleteModal(true);
                            }}
                            className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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

      {/* Hide Modal */}
      {showHideModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              🙈 Hide Listing: {selectedListing?.title}
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for hiding *
              </label>
              <textarea
                value={hideReason}
                onChange={(e) => setHideReason(e.target.value)}
                placeholder="Enter reason (e.g., Violates guidelines, Inappropriate content...)"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowHideModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleHide}
                disabled={!hideReason || actionLoading}
                className="px-4 py-2 text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50"
              >
                {actionLoading ? 'Hiding...' : 'Hide Listing'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              🗑️ Delete Listing: {selectedListing?.title}
            </h3>
            <p className="text-gray-600 mb-4">
              This will permanently delete the listing and all associated messages and reports.
              This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={actionLoading}
                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? 'Deleting...' : 'Delete Listing'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListingsManagement;
