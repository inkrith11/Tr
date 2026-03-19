import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyFavorites, removeFavorite } from '../services/listingService';
import { useAuth } from '../context/AuthContext';
import ListingCard from '../components/ListingCard';
import Loading from '../components/Loading';
import { toast } from 'react-toastify';
import { FaHeart } from 'react-icons/fa';

const Favorites = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchFavorites();
  }, [isAuthenticated, navigate]);

  const fetchFavorites = async () => {
    try {
      const { data } = await getMyFavorites();
      setFavorites(data);
    } catch (error) {
      toast.error('Failed to load favorites');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (listingId) => {
    try {
      await removeFavorite(listingId);
      setFavorites(favorites.filter(f => f.id !== listingId));
      toast.success('Removed from favorites');
    } catch (error) {
      toast.error('Failed to remove from favorites');
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center mb-8">
        <FaHeart className="text-red-500 text-2xl mr-3" />
        <h1 className="text-2xl font-bold text-gray-900">My Favorites</h1>
      </div>

      {favorites.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {favorites.map(listing => (
            <ListingCard
              key={listing.id}
              listing={listing}
              onFavoriteToggle={handleRemoveFavorite}
              isFavorited={true}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <FaHeart className="mx-auto text-gray-300 text-6xl mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No favorites yet</h2>
          <p className="text-gray-500 mb-6">
            Start exploring and save items you like!
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
          >
            Browse Listings
          </button>
        </div>
      )}
    </div>
  );
};

export default Favorites;
