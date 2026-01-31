import React from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const Register = () => {
  const { register: registerField, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();
  const { register: authRegister, handleGoogleLogin } = useAuth();
  const navigate = useNavigate();
  const password = watch('password');

  const onSubmit = async (data) => {
    try {
      await authRegister(data);
      navigate('/');
    } catch (error) {
      // Error handled in Context
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      await handleGoogleLogin(credentialResponse);
      navigate('/');
    } catch (error) {
      // Error handled in Context
    }
  };

  const handleGoogleError = () => {
    toast.error("Google Sign In was unsuccessful. Try again later.");
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-sm border border-gray-200">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-primary-dark">
            APSIT TradeHub
          </h2>
          <h2 className="mt-2 text-center text-xl font-bold text-gray-900">
            Create Account
          </h2>
        </div>

        <div className="mt-8">
          {/* Google Login */}
          <div className="flex justify-center w-full">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              theme="filled_blue"
              shape="rectangular"
              text="signup_with"
              width="100%"
            />
          </div>

          <div className="mt-6 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or register with email</span>
            </div>
          </div>

          <form className="mt-6 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  {...registerField('name', {
                    required: 'Name is required',
                    minLength: { value: 2, message: 'Name must be at least 2 characters' }
                  })}
                  className={`appearance-none block w-full px-3 py-2 border ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm`}
                />
                {errors.name && (
                  <p className="mt-2 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                APSIT Email
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  type="email"
                  placeholder="your.name@apsit.edu.in"
                  {...registerField('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@apsit\.edu\.in$/i,
                      message: 'Only @apsit.edu.in emails are allowed',
                    },
                  })}
                  className={`appearance-none block w-full px-3 py-2 border ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm`}
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  type="password"
                  placeholder="Minimum 8 characters"
                  {...registerField('password', { 
                    required: 'Password is required',
                    minLength: { value: 8, message: 'Password must be at least 8 characters' }
                  })}
                  className={`appearance-none block w-full px-3 py-2 border ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm`}
                />
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  {...registerField('confirmPassword', { 
                    required: 'Please confirm your password',
                    validate: value => value === password || 'Passwords do not match'
                  })}
                  className={`appearance-none block w-full px-3 py-2 border ${
                    errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm`}
                />
                {errors.confirmPassword && (
                  <p className="mt-2 text-sm text-red-600">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone (Optional)
              </label>
              <div className="mt-1">
                <input
                  id="phone"
                  type="tel"
                  placeholder="+91 XXXXX XXXXX"
                  {...registerField('phone')}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                />
              </div>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    Note: Only <span className="font-bold">@apsit.edu.in</span> email addresses 
                    are allowed for registration.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
              >
                {isSubmitting ? 'Creating account...' : 'Create Account'}
              </button>
            </div>
          </form>

          <div className="mt-4 text-center text-sm">
            <span className="text-gray-600">Already have an account? </span>
            <Link to="/login" className="font-medium text-primary hover:text-primary-dark">
              Sign in here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
