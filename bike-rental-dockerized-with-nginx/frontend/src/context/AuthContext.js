import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import jwt_decode from 'jwt-decode';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = jwt_decode(token);
      setUser({ ...decoded, token });
    }
  }, []);

  const login = async (email, password) => {
    const res = await axios.post('/api/auth/login', { email, password });
    const decoded = jwt_decode(res.data.token);
    localStorage.setItem('token', res.data.token);
    setUser({ ...decoded, token: res.data.token });
  };

  // ✅ NEW FUNCTION to support token-based login (used after signup)
  const loginWithToken = (token) => {
    const decoded = jwt_decode(token);
    localStorage.setItem('token', token);
    setUser({ ...decoded, token });
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loginWithToken }}>
      {children}
    </AuthContext.Provider>
  );
};