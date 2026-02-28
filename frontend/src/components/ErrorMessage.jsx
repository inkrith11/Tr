import React from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';

const ErrorMessage = ({ message, onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] text-center p-4" role="alert">
      <FaExclamationTriangle className="text-red-500 text-4xl mb-4" aria-hidden="true" />
      <p className="text-gray-700 mb-4">{message || 'Something went wrong. Please try again.'}</p>
      {onRetry && (
        <button 
          onClick={onRetry}
          className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
