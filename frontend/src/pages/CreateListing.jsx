import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { createListing } from '../services/listingService';
import { toast } from 'react-toastify';
import ImageUpload from '../components/ImageUpload';

const CreateListing = () => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const navigate = useNavigate();
  
  const [images, setImages] = useState({ image_1: null, image_2: null, image_3: null });
  const [previews, setPreviews] = useState({ image_1: null, image_2: null, image_3: null });

  const categories = ['Books', 'Electronics', 'Stationery', 'Tools', 'Accessories', 'Other'];
  const conditions = [
    { value: 'new', label: 'New' },
    { value: 'like_new', label: 'Like New' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' },
    { value: 'poor', label: 'Poor' },
  ];

  const onSubmit = async (data) => {
    // Validate all 3 images
    if (!images.image_1 || !images.image_2 || !images.image_3) {
      toast.error("All 3 authenticity images are required.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('category', data.category);
      formData.append('condition', data.condition);
      formData.append('price', data.price);
      if (data.location) formData.append('location', data.location);
      
      // Append images
      formData.append('image_1', images.image_1);
      formData.append('image_2', images.image_2);
      formData.append('image_3', images.image_3);

      await createListing(formData);
      toast.success("Listing created successfully!");
      navigate('/my-listings');
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to create listing. Please try again.");
    }
  };

  const allImagesUploaded = images.image_1 && images.image_2 && images.image_3;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Create New Listing
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Fill in the details below to list your item for sale.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 bg-white p-6 shadow rounded-lg">
        <div className="space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Title *
            </label>
            <input 
              type="text" 
              id="title" 
              {...register('title', { 
                required: 'Title is required',
                maxLength: { value: 200, message: 'Title must be less than 200 characters' }
              })} 
              className="mt-1 shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md" 
              placeholder="e.g., Engineering Mathematics Textbook" 
            />
            {errors.title && <span className="text-red-500 text-xs">{errors.title.message}</span>}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description *
            </label>
            <textarea 
              id="description" 
              rows={4} 
              {...register('description', { 
                required: 'Description is required',
                minLength: { value: 50, message: 'Description must be at least 50 characters' },
                maxLength: { value: 1000, message: 'Description must be less than 1000 characters' }
              })} 
              className="mt-1 shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border border-gray-300 rounded-md" 
              placeholder="Describe your item in detail... (minimum 50 characters)"
            />
            {errors.description && <span className="text-red-500 text-xs">{errors.description.message}</span>}
          </div>

          {/* Category, Condition, Price */}
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-3">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Category *
              </label>
              <select 
                id="category" 
                {...register('category', { required: 'Category is required' })} 
                className="mt-1 shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md"
              >
                <option value="">Select Category...</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {errors.category && <span className="text-red-500 text-xs">{errors.category.message}</span>}
            </div>

            <div>
              <label htmlFor="condition" className="block text-sm font-medium text-gray-700">
                Condition *
              </label>
              <select 
                id="condition" 
                {...register('condition', { required: 'Condition is required' })} 
                className="mt-1 shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md"
              >
                <option value="">Select Condition...</option>
                {conditions.map(cond => (
                  <option key={cond.value} value={cond.value}>{cond.label}</option>
                ))}
              </select>
              {errors.condition && <span className="text-red-500 text-xs">{errors.condition.message}</span>}
            </div>

            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                Price (₹) *
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">₹</span>
                </div>
                <input 
                  type="number" 
                  step="1" 
                  min="0"
                  id="price" 
                  {...register('price', { 
                    required: 'Price is required', 
                    min: { value: 0, message: 'Price must be positive' }
                  })} 
                  className="focus:ring-primary focus:border-primary block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md" 
                  placeholder="0" 
                />
              </div>
              {errors.price && <span className="text-red-500 text-xs">{errors.price.message}</span>}
            </div>
          </div>

          {/* Location (Optional) */}
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700">
              Location (Optional)
            </label>
            <input 
              type="text" 
              id="location" 
              {...register('location')} 
              className="mt-1 shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md" 
              placeholder="e.g., APSIT Campus, Library" 
            />
          </div>

          {/* Image Upload Section */}
          <div className="pt-6">
            <ImageUpload 
              images={images}
              setImages={setImages}
              previews={previews}
              setPreviews={setPreviews}
            />
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="pt-5 border-t border-gray-200">
          <div className="flex justify-end space-x-3">
            <button 
              type="button" 
              onClick={() => navigate(-1)} 
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !allImagesUploaded}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Publishing...' : 'Publish Listing'}
            </button>
          </div>
          {!allImagesUploaded && (
            <p className="mt-2 text-sm text-red-500 text-right">
              Please upload all 3 required images before publishing.
            </p>
          )}
        </div>
      </form>
    </div>
  );
};

export default CreateListing;
