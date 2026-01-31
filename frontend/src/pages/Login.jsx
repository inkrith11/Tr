import React from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const Login = () => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const { login, handleGoogleLogin } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      await login(data);
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
            Sign In
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
              text="signin_with"
              width="100%"
            />
          </div>

          <div className="mt-6 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or sign in with email</span>
            </div>
          </div>

          <form className="mt-6 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  type="email"
                  placeholder="your.name@apsit.edu.in"
                  {...register('email', {
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
                  placeholder="Password"
                  {...register('password', { required: 'Password is required' })}
                  className={`appearance-none block w-full px-3 py-2 border ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm`}
                />
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    Note: Only <span className="font-bold">@apsit.edu.in</span> email addresses 
                    are allowed for registration and login.
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
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </button>
            </div>
          </form>

          <div className="mt-4 text-center text-sm">
            <span className="text-gray-600">Don't have an account? </span>
            <Link to="/register" className="font-medium text-primary hover:text-primary-dark">
              Register here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
