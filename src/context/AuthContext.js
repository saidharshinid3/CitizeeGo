import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token);

        // Check token expiry
        if (decoded.exp * 1000 < Date.now()) {
          logout();
        } else {
          const savedUser = localStorage.getItem('user');

          if (savedUser) {
            setUser(JSON.parse(savedUser));
          }
        }
      } catch (error) {
        logout();
      }
    }

    setLoading(false);
  }, [token]);

  // LOGIN
  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', {
        email,
        password
      });

      const { token, role } = response.data;

      const userData = { role };

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));

      setToken(token);
      setUser(userData);

      return { success: true, role };

    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message
      };
    }
  };

  // REGISTER
  const register = async (name, email, password, role = 'citizen') => {
    try {
      const response = await api.post('/auth/register', {
        name,
        email,
        password,
        role
      });

      const { token, role: userRole } = response.data;

      const userData = { role: userRole };

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));

      setToken(token);
      setUser(userData);

      return { success: true };

    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed'
      };
    }
  };

  // LOGOUT
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};