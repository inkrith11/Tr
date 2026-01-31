import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getUserProfile } from '../services/userService';
import { getUserListings } from '../services/listingService';
import { getUserReviews } from '../services/reviewService';
import { useAuth } from '../context/AuthContext';
import ListingCard from '../components/ListingCard';
import Loading from '../components/Loading';
import { FaUserCircle, FaStar, FaMapMarkerAlt, FaCalendar, FaEdit } from 'react-icons/fa';
import { format } from 'date-fns';

const Profile = () => {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  
  const [profile, setProfile] = useState(null);
  const [listings, setListings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('listings');

  const isOwnProfile = currentUser && currentUser.id === parseInt(id);

  useEffect(() => {
    fetchProfileData();
  }, [id]);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      const [profileRes, listingsRes, reviewsRes] = await Promise.all([
        getUserProfile(id),
        getUserListings(id),
        getUserReviews(id)
      ]);
      setProfile(profileRes.data);
      setListings(listingsRes.data);
      setReviews(reviewsRes.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;
  if (!profile) return <div className="text-center py-12">User not found</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Profile Header */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex items-center">
            {profile.profile_picture ? (
              <img 
                src={profile.profile_picture} 
                alt={profile.name}
                className="h-24 w-24 rounded-full object-cover"
              />
            ) : (
              <div className="h-24 w-24 rounded-full bg-primary flex items-center justify-center text-white text-3xl font-bold">
                {profile.name?.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="ml-6">
              <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
              <p className="text-gray-500">{profile.email}</p>
              <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500">
                {profile.location && (
                  <span className="flex items-center">
                    <FaMapMarkerAlt className="mr-1" /> {profile.location}
                  </span>
                )}
                <span className="flex items-center">
                  <FaCalendar className="mr-1" /> 
                  Joined {profile.created_at ? format(new Date(profile.created_at), 'MMM yyyy') : 'Unknown'}
                </span>
              </div>
            </div>
          </div>
          
          {isOwnProfile && (
            <button className="mt-4 md:mt-0 flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
              <FaEdit className="mr-2" /> Edit Profile
            </button>
          )}
        </div>

        {profile.bio && (
          <p className="mt-4 text-gray-600">{profile.bio}</p>
        )}

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-primary">{listings.length}</p>
            <p className="text-sm text-gray-500">Active Listings</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-primary">{profile.total_trades || 0}</p>
            <p className="text-sm text-gray-500">Completed Trades</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center text-2xl font-bold text-primary">
              <FaStar className="text-yellow-400 mr-1" />
              {profile.rating?.toFixed(1) || '0.0'}
            </div>
            <p className="text-sm text-gray-500">Average Rating</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-primary">{reviews.length}</p>
            <p className="text-sm text-gray-500">Reviews</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('listings')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'listings'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Listings ({listings.length})
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'reviews'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Reviews ({reviews.length})
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'listings' && (
        <div>
          {listings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {listings.map(listing => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No listings yet
            </div>
          )}
        </div>
      )}

      {activeTab === 'reviews' && (
        <div className="space-y-4">
          {reviews.length > 0 ? (
            reviews.map(review => (
              <div key={review.id} className="bg-white shadow rounded-lg p-4">
                <div className="flex items-start">
                  {review.reviewer?.profile_picture ? (
                    <img 
                      src={review.reviewer.profile_picture} 
                      alt={review.reviewer.name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <FaUserCircle className="h-10 w-10 text-gray-400" />
                  )}
                  <div className="ml-3 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900">{review.reviewer?.name}</p>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <FaStar 
                            key={i} 
                            className={i < review.rating ? 'text-yellow-400' : 'text-gray-300'} 
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-600 mt-1">{review.comment}</p>
                    <p className="text-sm text-gray-400 mt-2">
                      {review.created_at ? format(new Date(review.created_at), 'MMM d, yyyy') : ''}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-gray-500">
              No reviews yet
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Profile;
