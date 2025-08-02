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
  });

  const [licenseFile, setLicenseFile] = useState(null);
  const [passportFile, setPassportFile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [showFiles, setShowFiles] = useState({});

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
    const formData = new FormData();

    for (const key in form) {
      formData.append(key, form[key]);
    }

    if (licenseFile) formData.append('licenseFile', licenseFile);
    if (passportFile) formData.append('passportFile', passportFile);

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();
      if (res.ok) {
        setStatusMessage('✅ Booking created successfully!');
        fetchBookings();
        setForm({
          firstName: '',
          lastName: '',
          startDateTime: '',
          numberOfDays: '',
          bike: '',
          insurance: false,
        });
        setLicenseFile(null);
        setPassportFile(null);
      } else {
        setStatusMessage(`❌ Error: ${result.error}`);
      }
    } catch (err) {
      console.error(err);
      setStatusMessage('❌ Error submitting form.');
    }
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

  const toggleViewFiles = async (id) => {
    const updated = { ...showFiles };
    updated[id] = !updated[id];
    setShowFiles(updated);
  };

  return (
    <div className="booking-page">
      <div className="booking-form-container">
        <h2>Create Booking</h2>
        {statusMessage && <p className="status-message">{statusMessage}</p>}
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
            <option value="Honda CB650R E-Clutch">Honda CB650R E-Clutch</option>
            <option value="Harley Davidson Fat Boy 2021">Harley Davidson Fat Boy 2021</option>
            <option value="Harley Davidson Fat Boy 1990">Harley Davidson Fat Boy 1990</option>
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
              <input type="file" onChange={(e) => setLicenseFile(e.target.files[0])} required />
            </label>
            <label>
              Upload Passport
              <input type="file" onChange={(e) => setPassportFile(e.target.files[0])} required />
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
              <button onClick={() => toggleViewFiles(b._id)}>View Files</button>
              {showFiles[b._id] && (
                <div>
                  <p><strong>License:</strong></p>
                  {b.licenseSignedUrl ? (
                    <img src={b.licenseSignedUrl} alt="License" width="200" />
                  ) : <p>No license uploaded.</p>}
                  <p><strong>Passport:</strong></p>
                  {b.passportSignedUrl ? (
                    <img src={b.passportSignedUrl} alt="Passport" width="200" />
                  ) : <p>No passport uploaded.</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}