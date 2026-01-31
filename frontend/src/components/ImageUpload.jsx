import React, { useState } from 'react';
import { FaCamera, FaTimes } from 'react-icons/fa';

const ImageUpload = ({ images, setImages, previews, setPreviews }) => {
  const handleImageChange = (e, key) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      
      // Validate file type
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        alert('Only JPG, PNG, and WEBP images are allowed');
        return;
      }

      setImages(prev => ({ ...prev, [key]: file }));
      setPreviews(prev => ({ ...prev, [key]: URL.createObjectURL(file) }));
    }
  };

  const removeImage = (key) => {
    setImages(prev => ({ ...prev, [key]: null }));
    setPreviews(prev => ({ ...prev, [key]: null }));
  };

  const ImageUploadBox = ({ label, id, imageKey }) => (
    <div className="flex-1">
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 ${
        !images[imageKey] ? 'border-red-300 border-dashed' : 'border-green-300 border-solid'
      } rounded-md bg-gray-50 relative h-48`}>
        {previews[imageKey] ? (
          <div className="relative w-full h-full">
            <img 
              src={previews[imageKey]} 
              alt="Preview" 
              className="h-full w-full object-contain" 
            />
            <button
              type="button"
              onClick={() => removeImage(imageKey)}
              className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
            >
              <FaTimes className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-1 text-center my-auto">
            <FaCamera className="mx-auto h-12 w-12 text-gray-400" />
            <div className="flex text-sm text-gray-600">
              <label 
                htmlFor={id} 
                className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary-dark focus-within:outline-none px-2 py-1"
              >
                <span>Upload Image</span>
                <input 
                  id={id} 
                  type="file" 
                  accept="image/jpeg,image/png,image/webp" 
                  className="sr-only" 
                  onChange={(e) => handleImageChange(e, imageKey)} 
                />
              </label>
            </div>
            <p className="text-xs text-gray-500">PNG, JPG, WEBP up to 5MB</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <fieldset className="border border-red-200 rounded-md p-4 bg-red-50">
      <legend className="text-lg font-medium text-red-700 px-2">
        Authenticity Images (All 3 Required)
      </legend>
      <p className="text-sm text-red-500 mb-4">
        To ensure quality and authenticity, you must upload these three distinct views.
      </p>

      <div className="flex flex-col md:flex-row gap-4">
        <ImageUploadBox 
          label="1. Front View (Main)" 
          id="image_1" 
          imageKey="image_1" 
        />
        <ImageUploadBox 
          label="2. Side/Detail View" 
          id="image_2" 
          imageKey="image_2" 
        />
        <ImageUploadBox 
          label="3. Back/Alternate View" 
          id="image_3" 
          imageKey="image_3" 
        />
      </div>
    </fieldset>
  );
};

export default ImageUpload;
