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
  
  export const addBike = async (bikeForm) => {
    return await fetch('/api/bikes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bikeForm),
    });
  };
  
  export const updateUserRole = async (id, role) => {
    await fetch(`/api/admin/users/${id}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
  };