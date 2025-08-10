// frontend/src/context/AuthContext.js
import React, { createContext, useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import jwt_decode from 'jwt-decode';

export const AuthContext = createContext();

const decodeTokenSafe = (token) => {
  try {
    if (!token) return null;
    const decoded = jwt_decode(token);
    // Check exp (seconds -> ms)
    if (decoded?.exp && Date.now() >= decoded.exp * 1000) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
};

const saveSession = (token, decoded) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify({
    id: decoded.id,
    email: decoded.email,
    role: decoded.role,
    firstName: decoded.firstName,
    lastName: decoded.lastName,
  }));
  axios.defaults.headers.common.Authorization = `Bearer ${token}`;
};

const clearSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  delete axios.defaults.headers.common.Authorization;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser]   = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount: restore token if valid
  useEffect(() => {
    const token = localStorage.getItem('token');
    const decoded = decodeTokenSafe(token);
    if (decoded && token) {
      saveSession(token, decoded);
      setUser({
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        firstName: decoded.firstName,
        lastName: decoded.lastName,
        token,
      });
    } else {
      clearSession();
      setUser(null);
    }
    setLoading(false);
  }, []);

  // Public methods
  const login = async (email, password) => {
    const res = await axios.post('/api/auth/login', { email, password });
    const token = res.data?.token;
    const decoded = decodeTokenSafe(token);
    if (!decoded) {
      throw new Error('Invalid login token');
    }
    saveSession(token, decoded);
    setUser({
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      firstName: decoded.firstName,
      lastName: decoded.lastName,
      token,
    });
  };

  const loginWithToken = (token) => {
    const decoded = decodeTokenSafe(token);
    if (!decoded) {
      clearSession();
      setUser(null);
      throw new Error('Invalid or expired token');
    }
    saveSession(token, decoded);
    setUser({
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      firstName: decoded.firstName,
      lastName: decoded.lastName,
      token,
    });
  };

  const logout = () => {
    clearSession();
    setUser(null);
  };

  // Convenience helpers for components that need headers quickly
  const authHeader = useMemo(
    () => (user?.token ? { Authorization: `Bearer ${user.token}` } : {}),
    [user?.token]
  );

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, loginWithToken, authHeader }}>
      {children}
    </AuthContext.Provider>
  );
};