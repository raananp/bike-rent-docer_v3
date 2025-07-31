import React, { useState, useEffect } from 'react';

export default function Booking() {
  const [form, setForm] = useState({ name: '', date: '', duration: '' });
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    const res = await fetch('/api/bookings');
    const data = await res.json();
    setBookings(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setForm({ name: '', date: '', duration: '' });
    fetchBookings();
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Create Booking</h2>
      <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
          style={{ marginRight: '10px' }}
        />
        <input
          type="date"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          required
          style={{ marginRight: '10px' }}
        />
        <input
          type="number"
          placeholder="Duration (hours)"
          value={form.duration}
          onChange={(e) => setForm({ ...form, duration: e.target.value })}
          required
          min={1}
          style={{ marginRight: '10px' }}
        />
        <button type="submit">Book</button>
      </form>

      <h3>All Bookings</h3>
      <table border="1" cellPadding="10" cellSpacing="0" width="100%">
        <thead>
          <tr>
            <th>Name</th>
            <th>Date</th>
            <th>Duration (hours)</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b._id}>
              <td>{b.name}</td>
              <td>{b.date}</td>
              <td>{b.duration}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
