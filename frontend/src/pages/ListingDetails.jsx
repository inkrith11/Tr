import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getListingById, deleteListing } from '../services/listingService';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';
import { toast } from 'react-toastify';
import { FaUserCircle, FaMapMarkerAlt, FaEye, FaHeart, FaRegHeart, FaShare, FaFlag, FaTrash, FaEdit } from 'react-icons/fa';
import { format } from 'date-fns';

const ListingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);

  const images = listing ? [listing.image_1, listing.image_2, listing.image_3].filter(Boolean) : [];

  useEffect(() => {
    fetchListing();
  }, [id]);

  const fetchListing = async () => {
    try {
      const { data } = await getListingById(id);
      setListing(data);
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

  const getConditionColor = (condition) => {
    const colors = {
      'new': 'bg-green-100 text-green-800',
      'like_new': 'bg-blue-100 text-blue-800',
      'good': 'bg-yellow-100 text-yellow-800',
      'fair': 'bg-orange-100 text-orange-800',
      'poor': 'bg-red-100 text-red-800',
    };
    return colors[condition] || 'bg-gray-100 text-gray-800';
  };

  const formatCondition = (condition) => {
    return condition?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
  };

  if (loading) return <Loading />;
  if (!listing) return <div className="text-center py-12">Listing not found</div>;

  const isOwner = user && listing.owner?.id === user.id;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="lg:grid lg:grid-cols-2 lg:gap-8">
        {/* Image Gallery */}
        <div className="mb-8 lg:mb-0">
          <div className="bg-gray-100 rounded-lg overflow-hidden mb-4">
            <img
              src={images[selectedImage] || 'https://via.placeholder.com/600x400?text=No+Image'}
              alt={listing.title}
              className="w-full h-96 object-contain"
            />
          </div>
          
          {/* Thumbnails */}
          <div className="flex gap-2">
            {images.map((img, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`w-20 h-20 rounded-md overflow-hidden border-2 ${
                  selectedImage === index ? 'border-primary' : 'border-transparent'
                }`}
              >
                <img src={img} alt={`View ${index + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Details */}
        <div>
          <div className="flex items-start justify-between">
            <div>
              <span className={`inline-block px-3 py-1 text-sm font-semibold rounded ${getConditionColor(listing.condition)}`}>
                {formatCondition(listing.condition)}
              </span>
              <h1 className="mt-2 text-3xl font-bold text-gray-900">{listing.title}</h1>
              <p className="text-sm text-gray-500 mt-1">{listing.category}</p>
            </div>
          </div>

          <p className="text-4xl font-bold text-primary mt-4">₹{listing.price}</p>

          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
            <p className="text-gray-600 whitespace-pre-line">{listing.description}</p>
          </div>

          {/* Details Grid */}
          <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
            {listing.location && (
              <div className="flex items-center text-gray-600">
                <FaMapMarkerAlt className="mr-2" />
                {listing.location}
              </div>
            )}
            <div className="flex items-center text-gray-600">
              <FaEye className="mr-2" />
              {listing.views || 0} views
            </div>
            <div className="col-span-2 text-gray-500">
              Posted: {listing.created_at ? format(new Date(listing.created_at), 'MMM d, yyyy') : 'Unknown'}
            </div>
          </div>

          {/* Seller Card */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Seller Information</h3>
            <div className="flex items-center">
              {listing.owner?.profile_picture ? (
                <img 
                  src={listing.owner.profile_picture} 
                  alt={listing.owner.name} 
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : (
                <FaUserCircle className="h-12 w-12 text-gray-400" />
              )}
              <div className="ml-3">
                <p className="font-medium text-gray-900">{listing.owner?.name || 'Unknown User'}</p>
                <div className="flex items-center text-sm text-gray-500">
                  <span>⭐ {listing.owner?.rating?.toFixed(1) || '0.0'}</span>
                  <span className="mx-2">•</span>
                  <span>{listing.owner?.total_trades || 0} trades</span>
                </div>
              </div>
            </div>
            {!isOwner && (
              <Link 
                to={`/profile/${listing.owner?.id}`}
                className="mt-3 block text-center text-primary hover:text-primary-dark text-sm font-medium"
              >
                View Profile
              </Link>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-6 space-y-3">
            {isOwner ? (
              <>
                <Link
                  to={`/edit-listing/${listing.id}`}
                  className="w-full flex items-center justify-center px-6 py-3 border border-primary text-primary rounded-md hover:bg-primary hover:text-white transition-colors"
                >
                  <FaEdit className="mr-2" /> Edit Listing
                </Link>
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center justify-center px-6 py-3 border border-red-500 text-red-500 rounded-md hover:bg-red-500 hover:text-white transition-colors"
                >
                  <FaTrash className="mr-2" /> Delete Listing
                </button>
              </>
            ) : (
              <>
                {isAuthenticated ? (
                  <Link
                    to={`/messages/${listing.owner?.id}?listing=${listing.id}`}
                    className="w-full flex items-center justify-center px-6 py-3 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
                  >
                    Contact Seller
                  </Link>
                ) : (
                  <Link
                    to="/login"
                    className="w-full flex items-center justify-center px-6 py-3 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
                  >
                    Login to Contact Seller
                  </Link>
                )}
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsFavorited(!isFavorited)}
                    className="flex-1 flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    {isFavorited ? <FaHeart className="mr-2 text-red-500" /> : <FaRegHeart className="mr-2" />}
                    {isFavorited ? 'Saved' : 'Save'}
                  </button>
                  <button
                    onClick={handleShare}
                    className="flex-1 flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    <FaShare className="mr-2" /> Share
                  </button>
                  <button
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
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
    </div>
  );
};

export default ListingDetails;
