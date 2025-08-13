// frontend/src/context/AuthContext.js
import React, { createContext, useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import jwt_decode from 'jwt-decode';

axios.defaults.withCredentials = true; // ✅ send/receive cookies (rt) with axios

export const AuthContext = createContext();

/** Decode JWT safely and check exp */
const decodeTokenSafe = (token) => {
  try {
    if (!token) return null;
    const decoded = jwt_decode(token);
    if (decoded?.exp && Date.now() >= decoded.exp * 1000) return null;
    return decoded;
  } catch {
    return null;
  }
};

/** Persist session to localStorage + axios header */
const saveSession = (token, userObj) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(userObj || {})); // we read this later
  axios.defaults.headers.common.Authorization = `Bearer ${token}`;
};

/** Clear session */
const clearSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  delete axios.defaults.headers.common.Authorization;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser]   = useState(null);
  const [loading, setLoading] = useState(true);

  // OPTION A (recommended): don't refresh on mount — just restore local session
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = (() => {
      try { return JSON.parse(localStorage.getItem('user') || 'null'); }
      catch { return null; }
    })();

    const decoded = decodeTokenSafe(token);
    if (token && decoded && storedUser?.id) {
      saveSession(token, storedUser);
      setUser({ ...storedUser, token });
    } else {
      clearSession();
      setUser(null);
    }
    setLoading(false);
  }, []);

  // If you REALLY want refresh-on-mount, replace the effect above with your previous one,
  // but ensure the backend returns: { token, user } from /api/auth/refresh.

  /** LOGIN: prefer backend user object so names show in navbar */
  const login = async (email, password) => {
    const res = await axios.post('/api/auth/login', { email, password });
    const token   = res.data?.token;
    const apiUser = res.data?.user; // 👈 make sure backend sends {id,email,role,firstName,lastName}

    if (!token) throw new Error('Invalid login token');

    const decoded = decodeTokenSafe(token) || {};
    const safeUser = apiUser || {
      id: decoded.id || decoded.sub || '',
      email: decoded.email || email,
      role: decoded.role || 'user',
      firstName: '',
      lastName : '',
    };

    saveSession(token, safeUser);
    setUser({ ...safeUser, token });
  };

  /** Accept token (e.g., from /verify-email) + optional user override */
  const loginWithToken = (token, userOverride) => {
    if (!token) throw new Error('Missing token');
    const decoded = decodeTokenSafe(token) || {};
    const stored = (() => {
      try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
    })();
    const safeUser = userOverride || stored || {
      id: decoded.id || decoded.sub || '',
      email: decoded.email || '',
      role: decoded.role || 'user',
      firstName: '',
      lastName : '',
    };
    if (!safeUser.id) {
      clearSession(); setUser(null);
      throw new Error('Invalid or expired token');
    }
    saveSession(token, safeUser);
    setUser({ ...safeUser, token });
  };

  const logout = async () => {
    try { await axios.post('/api/auth/logout', {}, { withCredentials: true }); } catch {}
    clearSession();
    setUser(null);
  };

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