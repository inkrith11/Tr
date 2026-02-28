import React from 'react';
import { Link } from 'react-router-dom';
import { FaUserCircle, FaHeart, FaRegHeart } from 'react-icons/fa';

const ListingCard = ({ listing, onFavoriteToggle, isFavorited }) => {
  const imageUrl = listing.image_1 || 'https://via.placeholder.com/300x200?text=No+Image';

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

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 group">
      <Link to={`/listings/${listing.id}`}>
        <div className="relative overflow-hidden">
          <img
            src={imageUrl}
            alt={listing.title}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
          />
          <span className={`absolute top-2 right-2 px-2 py-1 text-xs font-semibold rounded ${getConditionColor(listing.condition)}`}>
            {formatCondition(listing.condition)}
          </span>
        </div>
      </Link>
      
      <div className="p-4">
        <Link to={`/listings/${listing.id}`}>
          <h3 className="text-lg font-semibold text-gray-900 truncate hover:text-primary">
            {listing.title}
          </h3>
        </Link>
        
        <p className="text-xl font-bold text-primary mt-1">₹{listing.price}</p>
        
        <p className="text-sm text-gray-500 mt-1 truncate">{listing.category}</p>
        
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center text-sm text-gray-500">
            {listing.owner?.profile_picture ? (
              <img 
                src={listing.owner.profile_picture} 
                className="h-6 w-6 rounded-full mr-2 object-cover" 
                alt={listing.owner.name} 
              />
            ) : (
              <FaUserCircle className="h-6 w-6 mr-2 text-gray-400" />
            )}
            <span className="truncate max-w-[100px]">{listing.owner?.name || 'User'}</span>
          </div>
          
          {onFavoriteToggle && (
            <button 
              onClick={(e) => { e.preventDefault(); onFavoriteToggle(listing.id); }}
              className="text-red-500 hover:text-red-600 transition-colors"
              aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
            >
              {isFavorited ? <FaHeart className="h-5 w-5" aria-hidden="true" /> : <FaRegHeart className="h-5 w-5" aria-hidden="true" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ListingCard;
