export const getStats = async () => {
    const res = await fetch('/api/admin/bookings/stats');
    return await res.json();
  };
  
  export const getUsers = async () => {
    const res = await fetch('/api/admin/users');
    return await res.json();
  };
  
  export const getBookings = async () => {
    const res = await fetch('/api/bookings');
    return await res.json();
  };
  
  export const getBikes = async () => {
    const res = await fetch('/api/bikes');
    return await res.json();
  };
  
  export const addBike = async (formData) => {
    return await fetch('/api/bikes', {
      method: 'POST',
      body: formData, // Don't set Content-Type manually – browser will do it automatically
    });
  };
  
  export const updateUserRole = async (id, role) => {
    await fetch(`/api/admin/users/${id}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
  };

  export const deleteUser = async (id) => {
    const res = await fetch(`/api/auth/users/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete user');
  };

  export const deleteBike = async (id) => {
    return await fetch(`/api/bikes/${id}`, { method: 'DELETE' });
  };