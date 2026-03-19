import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getListingById, deleteListing, addFavorite, removeFavorite } from '../services/listingService';
import { submitReport } from '../services/reportService';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';
import { toast } from 'react-toastify';
import { FaUserCircle, FaMapMarkerAlt, FaEye, FaHeart, FaRegHeart, FaShare, FaFlag, FaTrash, FaEdit, FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import { format } from 'date-fns';

const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000';

const getImageSrc = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${BACKEND_URL}${url}`;
};

const REPORT_REASONS = [
  { value: 'spam', label: 'Spam or misleading' },
  { value: 'fake', label: 'Fake or counterfeit item' },
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'scam', label: 'Suspected scam' },
  { value: 'other', label: 'Other' }
];

const ListingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);

  // Report modal state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  const images = listing ? [listing.image_url, listing.image_url_2, listing.image_url_3].filter(Boolean).map(getImageSrc) : [];

  useEffect(() => {
    fetchListing();
  }, [id]);

  const fetchListing = async () => {
    try {
      const { data } = await getListingById(id);
      setListing(data);
      setIsFavorited(data.is_favorited || false);
    } catch (error) {
      toast.error("Failed to load listing");
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this listing?')) {
      try {
        await deleteListing(id);
        toast.success('Listing deleted successfully');
        navigate('/my-listings');
      } catch (error) {
        toast.error('Failed to delete listing');
      }
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard!');
  };

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to save favorites');
      navigate('/login');
      return;
    }

    try {
      if (isFavorited) {
        await removeFavorite(id);
        setIsFavorited(false);
        toast.success('Removed from favorites');
      } else {
        await addFavorite(id);
        setIsFavorited(true);
        toast.success('Added to favorites');
      }
    } catch (error) {
      toast.error('Failed to update favorite');
    }
  };

  const handleReport = () => {
    if (!isAuthenticated) {
      toast.error('Please login to report listings');
      navigate('/login');
      return;
    }
    setShowReportModal(true);
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!reportReason) {
      toast.error('Please select a reason');
      return;
    }

    setSubmittingReport(true);
    try {
      await submitReport({
        listing_id: parseInt(id),
        reason: reportReason,
        description: reportDescription || null
      });
      toast.success('Report submitted. Our team will review it shortly.');
      setShowReportModal(false);
      setReportReason('');
      setReportDescription('');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit report');
    } finally {
      setSubmittingReport(false);
    }
  };

  const getConditionBadge = (condition) => {
    const styles = {
      'new': 'bg-emerald-100 text-emerald-700',
      'like_new': 'bg-sky-100 text-sky-700',
      'good': 'bg-amber-100 text-amber-700',
      'fair': 'bg-orange-100 text-orange-700',
      'poor': 'bg-red-100 text-red-700',
    };
    return styles[condition] || 'bg-gray-100 text-gray-700';
  };

  const formatCondition = (condition) => {
    return condition?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
  };

  if (loading) return <Loading />;
  if (!listing) return <div className="text-center py-12">Listing not found</div>;

  const isOwner = user && listing.seller?.id === user.id;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="lg:grid lg:grid-cols-2 lg:gap-12">
        {/* Image Gallery */}
        <div className="mb-8 lg:mb-0">
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
            <div className="aspect-square bg-gray-50">
              <img
                src={images[selectedImage] || 'https://via.placeholder.com/600x600?text=No+Image'}
                alt={listing.title}
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-3 mt-4">
              {images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                    selectedImage === index
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img src={img} alt={`View ${index + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${getConditionBadge(listing.condition)}`}>
                  {formatCondition(listing.condition)}
                </span>
                <span className="px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-600">
                  {listing.category}
                </span>
              </div>
              <h1 className="mt-4 text-3xl font-bold text-gray-900">{listing.title}</h1>
            </div>
          </div>

          <div className="mt-6 flex items-baseline gap-2">
            <span className="text-4xl font-bold text-gray-900">₹{listing.price?.toLocaleString()}</span>
          </div>

          {/* Stats */}
          <div className="mt-6 flex items-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-1.5">
              <FaEye className="text-gray-400" />
              <span>{listing.views || 0} views</span>
            </div>
            <div>
              Posted {listing.created_at ? format(new Date(listing.created_at), 'MMM d, yyyy') : 'Unknown'}
            </div>
          </div>

          {/* Description */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
            <p className="text-gray-600 whitespace-pre-line leading-relaxed">{listing.description}</p>
          </div>

          {/* Seller Card */}
          <div className="mt-8 p-5 bg-gray-50 rounded-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {listing.seller?.profile_picture ? (
                  <img
                    src={getImageSrc(listing.seller.profile_picture)}
                    alt={listing.seller.name}
                    className="h-14 w-14 rounded-full object-cover ring-2 ring-white"
                  />
                ) : (
                  <div className="h-14 w-14 rounded-full bg-primary flex items-center justify-center text-white text-xl font-bold">
                    {listing.seller?.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                )}
                <div className="ml-4">
                  <p className="font-semibold text-gray-900">{listing.seller?.name || 'Unknown User'}</p>
                  <div className="flex items-center gap-3 text-sm text-gray-500 mt-0.5">
                    <span className="flex items-center gap-1">
                      ★ {listing.seller?.rating?.toFixed(1) || '0.0'}
                    </span>
                    <span>{listing.seller?.total_trades || 0} trades</span>
                  </div>
                </div>
              </div>
              {!isOwner && (
                <Link
                  to={`/profile/${listing.seller?.id}`}
                  className="text-sm font-medium text-primary hover:text-primary-dark"
                >
                  View Profile
                </Link>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 space-y-3">
            {isOwner ? (
              <div className="flex gap-3">
                <Link
                  to={`/edit-listing/${listing.id}`}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
                >
                  <FaEdit /> Edit Listing
                </Link>
                <button
                  onClick={handleDelete}
                  className="px-6 py-3.5 border-2 border-red-200 text-red-600 rounded-xl font-medium hover:bg-red-50 transition-colors"
                >
                  <FaTrash />
                </button>
              </div>
            ) : (
              <>
                {isAuthenticated ? (
                  <Link
                    to={`/messages/${listing.seller?.id}?listing=${listing.id}`}
                    className="w-full flex items-center justify-center px-6 py-4 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors"
                  >
                    Contact Seller
                  </Link>
                ) : (
                  <Link
                    to="/login"
                    className="w-full flex items-center justify-center px-6 py-4 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors"
                  >
                    Login to Contact Seller
                  </Link>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={handleToggleFavorite}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-colors ${
                      isFavorited
                        ? 'bg-red-50 text-red-600 border-2 border-red-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {isFavorited ? <FaHeart /> : <FaRegHeart />}
                    {isFavorited ? 'Saved' : 'Save'}
                  </button>
                  <button
                    onClick={handleShare}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                  >
                    <FaShare /> Share
                  </button>
                  <button
                    onClick={handleReport}
                    className="px-4 py-3 bg-gray-100 text-gray-500 rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors"
                    title="Report listing"
                  >
                    <FaFlag />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <FaExclamationTriangle className="text-red-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Report Listing</h3>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>

            <form onSubmit={handleSubmitReport} className="p-5 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Why are you reporting this listing?
                </label>
                <div className="space-y-2">
                  {REPORT_REASONS.map(reason => (
                    <label
                      key={reason.value}
                      className={`flex items-center p-3 rounded-xl cursor-pointer transition-colors ${
                        reportReason === reason.value
                          ? 'bg-red-50 border-2 border-red-200'
                          : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                      }`}
                    >
                      <input
                        type="radio"
                        name="reason"
                        value={reason.value}
                        checked={reportReason === reason.value}
                        onChange={(e) => setReportReason(e.target.value)}
                        className="sr-only"
                      />
                      <span className={`text-sm ${reportReason === reason.value ? 'text-red-700 font-medium' : 'text-gray-700'}`}>
                        {reason.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional details (optional)
                </label>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Provide more context about this issue..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReport || !reportReason}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {submittingReport ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListingDetails;
