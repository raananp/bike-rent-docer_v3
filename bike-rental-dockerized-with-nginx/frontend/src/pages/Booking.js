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
      <form onSubmit={handleSubmit} className="booking-form">
        <h2>Create Booking</h2>
        <input
          type="text"
          placeholder="Full Name"
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

      <div className="booking-cards-container">
        {bookings.map((b) => (
          <div key={b._id} className="booking-card">
            <h4>{b.name}</h4>
            <p><strong>Date:</strong> {b.date}</p>
            <p><strong>Duration:</strong> {b.duration} hours</p>
            <p><strong>Bike:</strong> {b.bike}</p>
            <p><strong>Insurance:</strong> {b.insurance ? 'Yes' : 'No'}</p>
            <p><strong>License:</strong> {b.licenseUploaded ? 'Yes' : 'No'}</p>
            <p><strong>Passport:</strong> {b.passportUploaded ? 'Yes' : 'No'}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
