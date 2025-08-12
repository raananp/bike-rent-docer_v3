// frontend/src/context/AuthContext.js
import React, { createContext, useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import jwt_decode from 'jwt-decode';

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
  // Store exactly what we’ll read later (don’t rely on JWT having names)
  localStorage.setItem('user', JSON.stringify(userObj || {}));
  axios.defaults.headers.common.Authorization = `Bearer ${token}`;
};

/** Clear session */
const clearSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  delete axios.defaults.headers.common.Authorization;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser]     = useState(null);
  const [loading, setLoading] = useState(true);

  // Try to restore session on mount: prefer stored user; if token expired, try refresh
  useEffect(() => {
    (async () => {
      const token = localStorage.getItem('token');
      const storedUser = (() => {
        try { return JSON.parse(localStorage.getItem('user') || 'null'); }
        catch { return null; }
      })();

      const decoded = decodeTokenSafe(token);

      if (token && decoded && storedUser?.id) {
        // Happy path: token valid and user present
        saveSession(token, storedUser);
        setUser({ ...storedUser, token });
        setLoading(false);
        return;
      }

      // Fallback: try refresh endpoint (httpOnly cookie ‘rt’)
      try {
        const res = await axios.post('/api/auth/refresh', {}, { withCredentials: true });
        const newToken = res.data?.token;
        const apiUser  = res.data?.user; // {id,email,role,firstName,lastName}
        if (newToken && apiUser) {
          saveSession(newToken, apiUser);
          setUser({ ...apiUser, token: newToken });
          setLoading(false);
          return;
        }
      } catch {
        // ignore
      }

      // No valid session
      clearSession();
      setUser(null);
      setLoading(false);
    })();
  }, []);

  /** LOGIN: use backend user object (names aren’t guaranteed in JWT) */
  const login = async (email, password) => {
    const res = await axios.post('/api/auth/login', { email, password });
    const token  = res.data?.token;
    const apiUser = res.data?.user; // ✅ backend now returns this

    if (!token) throw new Error('Invalid login token');

    // If backend didn’t send user for some reason, derive minimal from JWT
    const decoded = decodeTokenSafe(token) || {};
    const safeUser = apiUser || {
      id: decoded.id || decoded.sub || '',
      email: decoded.email || email,
      role: decoded.role || 'user',
      firstName: '', // names won’t be in JWT unless you added them
      lastName : '',
    };

    saveSession(token, safeUser);
    setUser({ ...safeUser, token });
  };

  /**
   * Optionally accept a user object (e.g., from /verify-email or custom flows).
   * If omitted, we’ll derive minimal fields from the token.
   */
  const loginWithToken = (token, userOverride) => {
    if (!token) throw new Error('Missing token');

    const decoded = decodeTokenSafe(token) || {};
    const safeUser = userOverride || {
      id: decoded.id || decoded.sub || '',
      email: decoded.email || '',
      role: decoded.role || 'user',
      firstName: userOverride?.firstName || '',
      lastName : userOverride?.lastName  || '',
    };

    if (!safeUser.id) {
      clearSession();
      setUser(null);
      throw new Error('Invalid or expired token');
    }

    saveSession(token, safeUser);
    setUser({ ...safeUser, token });
  };

  const logout = async () => {
    try {
      await axios.post('/api/auth/logout', {}, { withCredentials: true });
    } catch { /* ignore */ }
    clearSession();
    setUser(null);
  };

  // Handy header for fetch/axios in components
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