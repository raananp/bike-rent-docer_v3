// frontend/src/utils/api.js
// (enhanced auth + idle logout + safe fetch)

// =============== Auth Token Manager ===============
const TOKEN_KEY = 'token';
let _token = localStorage.getItem(TOKEN_KEY) || null;

function setToken(t) {
  _token = t || null;
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
}

function getToken() {
  // keep in sync with localStorage in case another tab changed it
  const ls = localStorage.getItem(TOKEN_KEY);
  if (ls !== _token) _token = ls;
  return _token;
}

function authHeaders() {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

// Small, dependency‑free JWT exp reader (no Buffer)
function decodeJwtExp(token) {
  try {
    const [, payload] = token.split('.');
    if (!payload) return 0;
    // base64url -> base64
    const b64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = JSON.parse(atob(b64));
    return Number(json.exp || 0); // seconds since epoch
  } catch {
    return 0;
  }
}

function isTokenNearExpiry(token, skewSeconds = 60) {
  const exp = decodeJwtExp(token);
  if (!exp) return false;
  const nowSec = Math.floor(Date.now() / 1000);
  return nowSec >= (exp - skewSeconds);
}

// =============== Cross‑tab sign‑out broadcast ===============
const LOGOUT_FLAG = 'auth:logout';
function broadcastLogout() {
  localStorage.setItem(LOGOUT_FLAG, String(Date.now()));
}
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === LOGOUT_FLAG) {
      _signOutLocalOnly(); // react in this tab
      // Optional redirect:
      // window.location.href = '/login';
    }
  });
}

// =============== Idle timer (default 5 minutes) ===============
let idleTimerId = null;
let idleMsGlobal = 5 * 60 * 1000; // 5 minutes
function resetIdleTimer() {
  if (idleTimerId) clearTimeout(idleTimerId);
  idleTimerId = setTimeout(() => signOut(), idleMsGlobal);
}
function attachIdleListeners() {
  ['mousemove','keydown','wheel','touchstart','scroll','click'].forEach(evt =>
    window.addEventListener(evt, resetIdleTimer, { passive: true })
  );
}
export function startIdleLogout({ idleMs = 5 * 60 * 1000 } = {}) {
  idleMsGlobal = idleMs;
  resetIdleTimer();
  attachIdleListeners();
}
export function stopIdleLogout() {
  if (idleTimerId) clearTimeout(idleTimerId);
  idleTimerId = null;
  ['mousemove','keydown','wheel','touchstart','scroll','click'].forEach(evt =>
    window.removeEventListener(evt, resetIdleTimer)
  );
}

// =============== Sign out / Refresh ===============
async function refreshAccessToken() {
  // OPTIONAL: only works if your backend exposes /api/auth/refresh
  try {
    const res = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' });
    if (!res.ok) return null;
    const data = await res.json().catch(() => ({}));
    if (data?.token) {
      setToken(data.token);
      return data.token;
    }
    return null;
  } catch {
    return null;
  }
}

function _signOutLocalOnly() {
  setToken(null);
}

export async function signOut() {
  _signOutLocalOnly();
  broadcastLogout();
  // Optional: tell server to revoke refresh token
  try { await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }); } catch {}
  // Optional redirect
  // window.location.href = '/login';
}

// =============== Safe fetch with auto‑refresh ===============
async function fetchWithAuth(input, init = {}) {
  let token = getToken();

  // If token exists but is about to expire, try refresh before the call
  if (token && isTokenNearExpiry(token)) {
    const newTok = await refreshAccessToken();
    if (newTok) token = newTok;
  }

  const merged = {
    ...init,
    headers: {
      ...(init.headers || {}),
      ...authHeaders(),
    },
  };

  let res = await fetch(input, merged);

  // If unauthorized, try one refresh then retry once
  if (res.status === 401) {
    const newTok = await refreshAccessToken();
    if (newTok) {
      const retry = {
        ...init,
        headers: {
          ...(init.headers || {}),
          Authorization: `Bearer ${newTok}`,
        },
      };
      res = await fetch(input, retry);
    } else {
      // Cannot refresh → sign out
      await signOut();
    }
  }
  return res;
}

// =============== Response helper ===============
async function toJsonOrThrow(res) {
  const text = await res.text();
  if (!res.ok) {
    const msg = text || res.statusText || 'Request failed';
    throw new Error(`HTTP ${res.status}: ${msg}`);
  }
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text; // not JSON
  }
}

// ======== PUBLIC HELPERS YOU ALREADY USE ========

// Call once in your app bootstrap (e.g., in App.jsx useEffect)
// startIdleLogout({ idleMs: 5 * 60 * 1000 });

// --- admin stats ---
export const getStats = async () => {
  const res = await fetchWithAuth('/api/admin/bookings/stats');
  return toJsonOrThrow(res);
};

// --- admin users ---
export const getUsers = async () => {
  const res = await fetchWithAuth('/api/admin/users');
  return toJsonOrThrow(res);
};

export const updateUserRole = async (id, role) => {
  const res = await fetchWithAuth(`/api/admin/users/${id}/role`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role }),
  });
  return toJsonOrThrow(res);
};

export const deleteUser = async (id) => {
     const res = await fetch(`/api/admin/users/${id}`, {
       method: 'DELETE',
       headers: { ...authHeaders() },
     });
     return toJsonOrThrow(res);
  };

// --- bookings ---
export const getBookings = async () => {
  const res = await fetchWithAuth('/api/bookings');
  return toJsonOrThrow(res);
};

export const getMyBookings = async () => {
  const res = await fetchWithAuth('/api/bookings/mine');
  return toJsonOrThrow(res);
};

export const deleteBooking = async (id) => {
  const res = await fetchWithAuth(`/api/bookings/${id}`, { method: 'DELETE' });
  return toJsonOrThrow(res);
};

// ✅ NEW: update verification
export const updateBookingVerification = async (id, payload) => {
  const res = await fetchWithAuth(`/api/bookings/${id}/verification`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return toJsonOrThrow(res);
};

// --- bikes ---
export const getBikes = async () => {
  const res = await fetchWithAuth('/api/bikes');
  return toJsonOrThrow(res);
};

export const addBike = async (formData) => {
  const res = await fetchWithAuth('/api/bikes', {
    method: 'POST',
    // do NOT set content-type for FormData
    body: formData,
  });
  return toJsonOrThrow(res);
};

export const deleteBike = async (id) => {
  const res = await fetchWithAuth(`/api/bikes/${id}`, { method: 'DELETE' });
  return toJsonOrThrow(res);
};

// =============== Convenience export for login ===============
export function setAuthToken(token) {
  setToken(token);
  // reset idle timer after a successful login
  resetIdleTimer();
}