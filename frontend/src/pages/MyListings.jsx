import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyListings, deleteListing, markAsSold } from '../services/listingService';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';
import { toast } from 'react-toastify';
import { FaEdit, FaTrash, FaCheckCircle, FaEye, FaPlus, FaClock, FaTag, FaBoxOpen } from 'react-icons/fa';
import { format } from 'date-fns';

const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000';

const getImageSrc = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${BACKEND_URL}${url}`;
};

const MyListings = () => {
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (user) {
      fetchListings();
    }
  }, [user]);

  const fetchListings = async () => {
    try {
      const { data } = await getMyListings();
      setListings(data);
    } catch (error) {
      toast.error('Failed to fetch listings');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this listing?')) {
      try {
        await deleteListing(id);
        setListings(listings.filter(l => l.id !== id));
        toast.success('Listing deleted successfully');
      } catch (error) {
        toast.error('Failed to delete listing');
      }
    }
  };

  const handleMarkSold = async (id) => {
    try {
      await markAsSold(id);
      setListings(listings.map(l =>
        l.id === id ? { ...l, status: 'sold' } : l
      ));
      toast.success('Listing marked as sold!');
    } catch (error) {
      toast.error('Failed to update listing');
    }
  };

  const filteredListings = listings.filter(listing => {
    if (filter === 'active') return listing.status === 'available';
    if (filter === 'sold') return listing.status === 'sold';
    return true;
  });

  const getConditionBadge = (condition) => {
    const styles = {
      'new': 'bg-emerald-100 text-emerald-700 border-emerald-200',
      'like_new': 'bg-blue-100 text-blue-700 border-blue-200',
      'good': 'bg-amber-100 text-amber-700 border-amber-200',
      'fair': 'bg-orange-100 text-orange-700 border-orange-200',
      'poor': 'bg-red-100 text-red-700 border-red-200',
    };
    return styles[condition] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const formatCondition = (condition) => {
    return condition?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
  };

  const stats = {
    total: listings.length,
    active: listings.filter(l => l.status === 'available').length,
    sold: listings.filter(l => l.status === 'sold').length,
    views: listings.reduce((sum, l) => sum + (l.views || 0), 0)
  };

  if (loading) return <Loading />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Listings</h1>
            <p className="text-gray-500 mt-1">Manage and track your listings</p>
          </div>
          <Link
            to="/create-listing"
            className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-medium shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200 hover:-translate-y-0.5"
          >
            <FaPlus className="mr-2" /> Create Listing
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FaBoxOpen className="text-blue-600 text-lg" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-500">Total</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <FaTag className="text-green-600 text-lg" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                <p className="text-sm text-gray-500">Active</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FaCheckCircle className="text-purple-600 text-lg" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.sold}</p>
                <p className="text-sm text-gray-500">Sold</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <FaEye className="text-amber-600 text-lg" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.views}</p>
                <p className="text-sm text-gray-500">Total Views</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-xl w-fit">
        {[
          { key: 'all', label: 'All', count: stats.total },
          { key: 'active', label: 'Active', count: stats.active },
          { key: 'sold', label: 'Sold', count: stats.sold }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              filter === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
              filter === tab.key ? 'bg-primary/10 text-primary' : 'bg-gray-200 text-gray-600'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Listings Grid */}
      {filteredListings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map(listing => (
            <div
              key={listing.id}
              className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 ${
                listing.status === 'sold' ? 'opacity-75' : ''
              }`}
            >
              {/* Image */}
              <div className="relative aspect-[4/3] overflow-hidden">
                <Link to={`/listings/${listing.id}`}>
                  <img
                    src={getImageSrc(listing.image_url) || 'https://via.placeholder.com/400x300?text=No+Image'}
                    alt={listing.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </Link>

                {/* Status Badge */}
                <div className="absolute top-3 left-3">
                  <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                    listing.status === 'sold'
                      ? 'bg-gray-900 text-white'
                      : 'bg-green-500 text-white'
                  }`}>
                    {listing.status === 'sold' ? 'SOLD' : 'ACTIVE'}
                  </span>
                </div>

                {/* Condition Badge */}
                <div className="absolute top-3 right-3">
                  <span className={`px-3 py-1.5 rounded-full text-xs font-medium border ${getConditionBadge(listing.condition)}`}>
                    {formatCondition(listing.condition)}
                  </span>
                </div>

                {/* Sold Overlay */}
                {listing.status === 'sold' && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="text-white text-2xl font-bold tracking-wider">SOLD</span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-5">
                <Link to={`/listings/${listing.id}`}>
                  <h3 className="text-lg font-semibold text-gray-900 truncate hover:text-primary transition-colors">
                    {listing.title}
                  </h3>
                </Link>

                <div className="flex items-center justify-between mt-2">
                  <p className="text-2xl font-bold text-primary">₹{listing.price?.toLocaleString()}</p>
                  <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {listing.category}
                  </span>
                </div>

                {/* Meta Info */}
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <FaEye className="text-gray-400" /> {listing.views || 0} views
                  </span>
                  <span className="flex items-center gap-1">
                    <FaClock className="text-gray-400" />
                    {listing.created_at ? format(new Date(listing.created_at), 'MMM d') : '-'}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-4">
                  {listing.status !== 'sold' ? (
                    <>
                      <Link
                        to={`/edit-listing/${listing.id}`}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                      >
                        <FaEdit /> Edit
                      </Link>
                      <button
                        onClick={() => handleMarkSold(listing.id)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-100 text-green-700 rounded-xl font-medium hover:bg-green-200 transition-colors"
                      >
                        <FaCheckCircle /> Mark Sold
                      </button>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-500 rounded-xl font-medium">
                      <FaCheckCircle /> Item Sold
                    </div>
                  )}
                  <button
                    onClick={() => handleDelete(listing.id)}
                    className="px-4 py-2.5 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-colors"
                    title="Delete"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
            <FaBoxOpen className="text-3xl text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No listings found</h3>
          <p className="text-gray-500 mb-6">
            {filter === 'sold'
              ? "You haven't sold any items yet"
              : filter === 'active'
                ? "You don't have any active listings"
                : "Start selling by creating your first listing!"}
          </p>
          <Link
            to="/create-listing"
            className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors"
          >
            <FaPlus className="mr-2" /> Create Your First Listing
          </Link>
        </div>
      )}
    </div>
  );
};

export default MyListings;
