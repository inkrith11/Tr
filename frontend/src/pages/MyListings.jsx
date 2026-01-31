import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getUserListings, deleteListing, markAsSold } from '../services/listingService';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';
import { toast } from 'react-toastify';
import { FaEdit, FaTrash, FaCheck, FaEye, FaPlus } from 'react-icons/fa';
import { format } from 'date-fns';

const MyListings = () => {
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, active, sold

  useEffect(() => {
    if (user) {
      fetchListings();
    }
  }, [user]);

  const fetchListings = async () => {
    try {
      const { data } = await getUserListings(user.id);
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
      toast.success('Listing marked as sold');
    } catch (error) {
      toast.error('Failed to update listing');
    }
  };

  const filteredListings = listings.filter(listing => {
    if (filter === 'active') return listing.status !== 'sold';
    if (filter === 'sold') return listing.status === 'sold';
    return true;
  });

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

  if (loading) return <Loading />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>
          <p className="text-gray-500 mt-1">Manage your listings and track their status</p>
        </div>
        <Link
          to="/create-listing"
          className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
        >
          <FaPlus className="mr-2" /> Create New Listing
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-4 mb-6">
        {['all', 'active', 'sold'].map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium capitalize ${
              filter === tab
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab} ({listings.filter(l => {
              if (tab === 'active') return l.status !== 'sold';
              if (tab === 'sold') return l.status === 'sold';
              return true;
            }).length})
          </button>
        ))}
      </div>

      {filteredListings.length > 0 ? (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Views
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Posted
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredListings.map(listing => (
                <tr key={listing.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img
                        src={listing.image_1 || 'https://via.placeholder.com/50'}
                        alt={listing.title}
                        className="h-12 w-12 rounded object-cover"
                      />
                      <div className="ml-4">
                        <Link 
                          to={`/listings/${listing.id}`}
                          className="text-sm font-medium text-gray-900 hover:text-primary"
                        >
                          {listing.title}
                        </Link>
                        <div className="text-sm text-gray-500">{listing.category}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">₹{listing.price}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${
                      listing.status === 'sold' 
                        ? 'bg-gray-100 text-gray-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {listing.status === 'sold' ? 'Sold' : 'Active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <FaEye className="mr-1" /> {listing.views || 0}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {listing.created_at ? format(new Date(listing.created_at), 'MMM d, yyyy') : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      {listing.status !== 'sold' && (
                        <>
                          <Link
                            to={`/edit-listing/${listing.id}`}
                            className="text-primary hover:text-primary-dark p-2"
                            title="Edit"
                          >
                            <FaEdit />
                          </Link>
                          <button
                            onClick={() => handleMarkSold(listing.id)}
                            className="text-green-600 hover:text-green-800 p-2"
                            title="Mark as Sold"
                          >
                            <FaCheck />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(listing.id)}
                        className="text-red-600 hover:text-red-800 p-2"
                        title="Delete"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500 text-lg">No listings found</p>
          <p className="text-gray-400 mt-2">Start selling by creating your first listing!</p>
          <Link
            to="/create-listing"
            className="inline-block mt-4 bg-primary text-white px-6 py-2 rounded-md hover:bg-primary-dark transition-colors"
          >
            Create Listing
          </Link>
        </div>
      )}
    </div>
  );
};

export default MyListings;
