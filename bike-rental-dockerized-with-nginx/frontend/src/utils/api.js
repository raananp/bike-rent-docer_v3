// --- helpers ---
function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

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

// --- admin stats ---
export const getStats = async () => {
  const res = await fetch('/api/admin/bookings/stats', {
    headers: { ...authHeaders() },
  });
  return toJsonOrThrow(res);
};

// --- admin users ---
export const getUsers = async () => {
  const res = await fetch('/api/admin/users', {
    headers: { ...authHeaders() },
  });
  return toJsonOrThrow(res);
};

export const updateUserRole = async (id, role) => {
  const res = await fetch(`/api/admin/users/${id}/role`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify({ role }),
  });
  return toJsonOrThrow(res);
};

export const deleteUser = async (id) => {
  const res = await fetch(`/api/auth/users/${id}`, {
    method: 'DELETE',
    headers: { ...authHeaders() },
  });
  return toJsonOrThrow(res);
};

// --- bookings ---
export const getBookings = async () => {
  const res = await fetch('/api/bookings', {
    headers: { ...authHeaders() },
  });
  return toJsonOrThrow(res);
};

export const getMyBookings = async () => {
  const res = await fetch('/api/bookings/mine', {
    headers: { ...authHeaders() },
  });
  return toJsonOrThrow(res);
};

export const deleteBooking = async (id) => {
  const res = await fetch(`/api/bookings/${id}`, {
    method: 'DELETE',
    headers: { ...authHeaders() },
  });
  return toJsonOrThrow(res);
};

// ✅ NEW: update verification
export const updateBookingVerification = async (id, payload) => {
  const res = await fetch(`/api/bookings/${id}/verification`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  });
  return toJsonOrThrow(res);
};

// --- bikes ---
export const getBikes = async () => {
  const res = await fetch('/api/bikes', {
    headers: { ...authHeaders() },
  });
  return toJsonOrThrow(res);
};

export const addBike = async (formData) => {
  const res = await fetch('/api/bikes', {
    method: 'POST',
    headers: { ...authHeaders() }, // do NOT set content-type for FormData
    body: formData,
  });
  return toJsonOrThrow(res);
};

export const deleteBike = async (id) => {
  const res = await fetch(`/api/bikes/${id}`, {
    method: 'DELETE',
    headers: { ...authHeaders() },
  });
  return toJsonOrThrow(res);
};