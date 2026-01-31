import React, { createContext, useState, useContext, useEffect } from 'react';
import { login as apiLogin, register as apiRegister, googleLogin as apiGoogleLogin, googleLoginWithToken as apiGoogleLoginWithToken, getMe } from '../services/authService';
import { toast } from 'react-toastify';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkLoggedIn = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const { data } = await getMe();
          setUser(data);
          localStorage.setItem('user', JSON.stringify(data));
        } catch (error) {
          console.error("Session expired", error);
          logout();
        }
      }
      setLoading(false);
    };
    checkLoggedIn();
  }, []);

  const login = async (credentials) => {
    try {
      const { data } = await apiLogin(credentials);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      toast.success("Logged in successfully!");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.detail || "Login failed");
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const { data } = await apiRegister(userData);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      toast.success("Registration successful!");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.detail || "Registration failed");
      throw error;
    }
  };

  const handleGoogleLogin = async (credentialResponse) => {
    try {
      const { data } = await apiGoogleLogin(credentialResponse.credential);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      toast.success("Google login successful!");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.detail || "Google login failed");
      throw error;
    }
  };

  const handleGoogleLoginWithToken = async (accessToken) => {
    try {
      const { data } = await apiGoogleLoginWithToken(accessToken);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      toast.success("Google login successful!");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.detail || "Google login failed. Only @apsit.edu.in emails allowed.");
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    toast.info("Logged out");
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      register, 
      handleGoogleLogin,
      handleGoogleLoginWithToken, 
      logout, 
      loading, 
      isAuthenticated: !!user 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
