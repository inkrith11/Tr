import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../services/userService';
import { toast } from 'react-toastify';
import { FaUserCircle, FaArrowLeft } from 'react-icons/fa';
import Loading from '../components/Loading';

const EditProfile = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [profilePicture, setProfilePicture] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      setPreviewUrl(user.profile_picture);
    }
  }, [user]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate password fields
    if (formData.new_password && formData.new_password !== formData.confirm_password) {
      toast.error('New passwords do not match');
      return;
    }

    if (formData.new_password && !formData.current_password) {
      toast.error('Current password is required to set a new password');
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();

      if (formData.name) data.append('name', formData.name);
      if (formData.phone) data.append('phone', formData.phone);
      if (formData.current_password) data.append('current_password', formData.current_password);
      if (formData.new_password) data.append('new_password', formData.new_password);
      if (profilePicture) data.append('profile_picture', profilePicture);

      const response = await updateProfile(data);
      updateUser(response.data);
      toast.success('Profile updated successfully');
      navigate(`/profile/${user.id}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <Loading />;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => navigate(`/profile/${user.id}`)}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <FaArrowLeft className="mr-2" /> Back to Profile
      </button>

      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Profile</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Picture */}
          <div className="flex flex-col items-center">
            <div className="relative">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Profile preview"
                  className="h-32 w-32 rounded-full object-cover"
                />
              ) : (
                <FaUserCircle className="h-32 w-32 text-gray-400" />
              )}
              <label
                htmlFor="profile-picture"
                className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-2 cursor-pointer hover:bg-primary-dark"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </label>
              <input
                id="profile-picture"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">Click the + button to change profile picture</p>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
            />
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="+91 1234567890"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
            />
          </div>

          {/* Change Password Section */}
          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  name="current_password"
                  value={formData.current_password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  name="new_password"
                  value={formData.new_password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  name="confirm_password"
                  value={formData.confirm_password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate(`/profile/${user.id}`)}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-primary text-white rounded-md hover:bg-primary-dark disabled:opacity-50 transition-colors"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;
