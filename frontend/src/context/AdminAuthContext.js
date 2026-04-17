import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/api';

const AdminAuthContext = createContext(null);

export const AdminAuthProvider = ({ children }) => {
  const [adminUser, setAdminUser] = useState(null);
  const [adminToken, setAdminToken] = useState(
    localStorage.getItem('super_admin_token') || localStorage.getItem('admin_token')
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (adminToken) {
      const savedAdmin = localStorage.getItem('admin_user');
      if (savedAdmin) {
        setAdminUser(JSON.parse(savedAdmin));
      }
    }
    setLoading(false);
  }, [adminToken]);

  const login = async (email, password) => {
    try {
      // Corrected API endpoint base URL should be consistent with proxy or full URL
      // Using relative URL to work with the frontend proxy defined in package.json
      const response = await api.post('/api/superadmin/login/', { email, password });
      const { token, user } = response.data;
      
      setAdminToken(token);
      setAdminUser(user);
      localStorage.setItem('super_admin_token', token);
      localStorage.setItem('admin_token', token);
      localStorage.setItem('admin_user', JSON.stringify(user));
      
      return { success: true };
    } catch (error) {
      console.error('Admin Login failed:', error);
      return { success: false, error: error.response?.data?.error || 'Login failed' };
    }
  };

  const logout = () => {
    setAdminToken(null);
    setAdminUser(null);
    localStorage.removeItem('super_admin_token');
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
  };

  const value = {
    adminUser,
    adminToken,
    loading,
    login,
    logout,
    isAdminAuthenticated: !!adminToken
  };

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
