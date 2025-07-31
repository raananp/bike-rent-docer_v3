import React, { useState, useEffect } from 'react';
import './Booking.css';

export default function Booking() {
  const [form, setForm] = useState({
    name: '',
    date: '',
    duration: '',
    bike: '',
    insurance: false,
    licenseUploaded: false,
    passportUploaded: false,
  });
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

    // Simulate upload with boolean values (in real case, use FormData and backend handling)
    const newBooking = {
      ...form,
      licenseUploaded: true,
      passportUploaded: true,
    };

    await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newBooking),
    });

    setForm({
      name: '',
      date: '',
      duration: '',
      bike: '',
      insurance: false,
      licenseUploaded: false,
      passportUploaded: false,
    });
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
        <select
          value={form.bike}
          onChange={(e) => setForm({ ...form, bike: e.target.value })}
          required
        >
          <option value="">Select Bike</option>
          <option value="Honda CBF 650cc">Honda CBF 650cc</option>
          <option value="Yamaha NMax 155">Yamaha NMax 155</option>
          <option value="Honda PCX 160">Honda PCX 160</option>
          <option value="Yamaha Aerox 155">Yamaha Aerox 155</option>
        </select>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={form.insurance}
            onChange={(e) => setForm({ ...form, insurance: e.target.checked })}
          />
          Upgrade Insurance
        </label>
        <div className="file-uploads">
          <label>
            Upload Driver's License
            <input
              type="file"
              onChange={() => setForm({ ...form, licenseUploaded: true })}
              required
            />
          </label>
          <label>
            Upload Passport
            <input
              type="file"
              onChange={() => setForm({ ...form, passportUploaded: true })}
              required
            />
          </label>
        </div>
        <button type="submit">Book</button>
      </form>

      <h3>All Bookings</h3>
      <table className="booking-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Date</th>
            <th>Duration</th>
            <th>Bike</th>
            <th>Insurance</th>
            <th>License</th>
            <th>Passport</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b._id}>
              <td>{b.name}</td>
              <td>{b.date}</td>
              <td>{b.duration}</td>
              <td>{b.bike || '—'}</td>
              <td>{b.insurance ? 'Yes' : 'No'}</td>
              <td>{b.licenseUploaded ? 'Yes' : 'No'}</td>
              <td>{b.passportUploaded ? 'Yes' : 'No'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
