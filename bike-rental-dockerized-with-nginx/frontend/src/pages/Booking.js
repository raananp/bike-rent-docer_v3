import React, { useState, useEffect } from 'react';
import './Booking.css';

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
    <div className="booking-container">
      <h2>Create Booking</h2>
      <form onSubmit={handleSubmit} className="booking-form">
        <input
          type="text"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          type="date"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          required
        />
        <input
          type="number"
          placeholder="Duration (hours)"
          value={form.duration}
          onChange={(e) => setForm({ ...form, duration: e.target.value })}
          required
          min={1}
        />
        <button type="submit">Book</button>
      </form>

      <h3>All Bookings</h3>
      <table className="booking-table">
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
              <td>{new Date(b.date).toLocaleDateString()}</td>
              <td>{b.duration}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
