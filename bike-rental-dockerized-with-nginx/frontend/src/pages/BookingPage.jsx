import React, { useState, useEffect } from 'react';

export default function BookingPage() {
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
    <div className="p-4">
      <h2 className="text-xl mb-2">Create Booking</h2>
      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          type="text"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="border p-1"
        />
        <input
          type="date"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          className="border p-1"
        />
        <input
          type="number"
          placeholder="Duration (hrs)"
          value={form.duration}
          onChange={(e) => setForm({ ...form, duration: e.target.value })}
          className="border p-1"
        />
        <button type="submit" className="bg-blue-500 text-white px-3 py-1">Book</button>
      </form>

      <h2 className="text-xl mt-6 mb-2">All Bookings</h2>
      <table className="border w-full">
        <thead>
          <tr>
            <th className="border p-2">Name</th>
            <th className="border p-2">Date</th>
            <th className="border p-2">Duration</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b._id}>
              <td className="border p-2">{b.name}</td>
              <td className="border p-2">{b.date}</td>
              <td className="border p-2">{b.duration}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
