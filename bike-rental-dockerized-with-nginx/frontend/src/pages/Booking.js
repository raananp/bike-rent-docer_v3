// Booking.js
import React, { useState, useEffect } from 'react';
import './Booking.css';

export default function Booking() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    startDateTime: '',
    numberOfDays: '',
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

  const calculateEndDate = (start, days) => {
    const startDate = new Date(start);
    startDate.setDate(startDate.getDate() + parseInt(days));
    return startDate.toISOString();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const endDateTime = calculateEndDate(form.startDateTime, form.numberOfDays);

    const newBooking = {
      ...form,
      endDateTime,
      licenseUploaded: true,
      passportUploaded: true,
    };

    await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newBooking),
    });

    setForm({
      firstName: '',
      lastName: '',
      startDateTime: '',
      numberOfDays: '',
      bike: '',
      insurance: false,
      licenseUploaded: false,
      passportUploaded: false,
    });
    fetchBookings();
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="booking-page">
      <div className="booking-form-container">
        <h2>Create Booking</h2>
        <form onSubmit={handleSubmit} className="booking-form">
          <div className="name-fields">
            <input
              type="text"
              placeholder="First Name"
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              required
            />
            <input
              type="text"
              placeholder="Last Name"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              required
            />
          </div>
          <input
            type="datetime-local"
            value={form.startDateTime}
            onChange={(e) => setForm({ ...form, startDateTime: e.target.value })}
            required
          />
          <input
            type="number"
            placeholder="Number of Days"
            value={form.numberOfDays}
            onChange={(e) => setForm({ ...form, numberOfDays: e.target.value })}
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
              Upload License
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
      </div>

      <div className="booking-cards-container">
        <h3>All Bookings</h3>
        <div className="cards-wrapper">
          {bookings.map((b) => (
            <div key={b._id} className="booking-card">
              <p><strong>Name:</strong> {b.firstName} {b.lastName}</p>
              <p><strong>Start Date:</strong> {formatDateTime(b.startDateTime)}</p>
              <p><strong>End Date:</strong> {formatDateTime(b.endDateTime)}</p>
              <p><strong>Days:</strong> {b.numberOfDays}</p>
              <p><strong>Bike:</strong> {b.bike}</p>
              <p><strong>Insurance:</strong> {b.insurance ? 'Yes' : 'No'}</p>
              <p><strong>License:</strong> {b.licenseUploaded ? 'Yes' : 'No'}</p>
              <p><strong>Passport:</strong> {b.passportUploaded ? 'Yes' : 'No'}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
