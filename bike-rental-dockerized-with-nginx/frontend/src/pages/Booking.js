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
    provideDocsInOffice: false,
  });

  const [licenseFile, setLicenseFile] = useState(null);
  const [passportFile, setPassportFile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [showFiles, setShowFiles] = useState({});
  const [pricePreview, setPricePreview] = useState({ base: 0, insurance: 0, surcharge: 0, total: 0 });

  const bikePricing = {
    'Honda CB650R E-Clutch': { perDay: 500, perWeek: 3200, perMonth: 9800 },
    'Harley Davidson Fat Boy 2021': { perDay: 600, perWeek: 3900, perMonth: 10500 },
    'Harley Davidson Fat Boy 1990': { perDay: 450, perWeek: 3000, perMonth: 9000 },
  };

  const calculatePrice = (days, insurance, bike) => {
    const pricing = bikePricing[bike];
    if (!pricing || !days) return { base: 0, surcharge: 0, insurance: 0, total: 0 };

    let base = 0;
    let remaining = days;

    const months = Math.floor(remaining / 30);
    base += months * pricing.perMonth;
    remaining -= months * 30;

    const weeks = Math.floor(remaining / 7);
    base += weeks * pricing.perWeek;
    remaining -= weeks * 7;

    base += remaining * pricing.perDay;

    const surcharge = days * 50;
    const insuranceCost = insurance ? days * 50 : 0;
    const total = base + surcharge + insuranceCost;

    return { base, surcharge, insurance: insuranceCost, total };
  };

  const getPriceBreakdown = (days, insurance, bike) => {
    return calculatePrice(parseInt(days), insurance, bike);
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    const days = parseInt(form.numberOfDays);
    const price = calculatePrice(days, form.insurance, form.bike);
    setPricePreview(price);
  }, [form.numberOfDays, form.bike, form.insurance]);

  const fetchBookings = async () => {
    const res = await fetch('/api/bookings');
    const data = await res.json();
    setBookings(data);
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const maxSizeMB = 10;

    if (!allowedTypes.includes(file.type)) {
      setStatusMessage(`❌ ${type === 'license' ? 'License' : 'Passport'} must be an image file (jpg, png, gif, webp).`);
      return;
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      setStatusMessage(`❌ ${type === 'license' ? 'License' : 'Passport'} must be smaller than ${maxSizeMB}MB.`);
      return;
    }

    if (type === 'license') {
      setLicenseFile(file);
    } else {
      setPassportFile(file);
    }

    setStatusMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.provideDocsInOffice && !licenseFile) {
      setStatusMessage('❌ Please upload your license or select office option.');
      return;
    }
    if (!form.provideDocsInOffice && !passportFile) {
      setStatusMessage('❌ Please upload your passport or select office option.');
      return;
    }

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
          provideDocsInOffice: false,
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

  const toggleViewFiles = (id) => {
    setShowFiles((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="booking-page">
      <div className="booking-form-container">
        <h2>Create Booking</h2>
        {statusMessage && <p className="status-message">{statusMessage}</p>}
        <form onSubmit={handleSubmit} className="booking-form">
          <div className="name-fields">
            <input type="text" placeholder="First Name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
            <input type="text" placeholder="Last Name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
          </div>
          <input type="datetime-local" value={form.startDateTime} onChange={(e) => setForm({ ...form, startDateTime: e.target.value })} required />
          <input type="number" placeholder="Number of Days" value={form.numberOfDays} onChange={(e) => setForm({ ...form, numberOfDays: e.target.value })} required min={1} />
          <select value={form.bike} onChange={(e) => setForm({ ...form, bike: e.target.value })} required>
            <option value="">Select Bike</option>
            {Object.keys(bikePricing).map((bikeName) => (
              <option key={bikeName} value={bikeName}>{bikeName}</option>
            ))}
          </select>
          <label className="checkbox">
            <input type="checkbox" checked={form.insurance} onChange={(e) => setForm({ ...form, insurance: e.target.checked })} />
            Upgrade Insurance
          </label>
          <label className="checkbox">
            <input type="checkbox" checked={form.provideDocsInOffice} onChange={(e) => setForm({ ...form, provideDocsInOffice: e.target.checked })} />
            I’ll provide documents in office
          </label>
          <div className="file-uploads">
            <label className="upload-label">
              <span>
                Upload License{licenseFile && <span className="checkmark"> ✅</span>}
              </span>
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFileChange(e, 'license')} required={!form.provideDocsInOffice} />
            </label>
            <label className="upload-label">
              <span>
                Upload Passport{passportFile && <span className="checkmark"> ✅</span>}
              </span>
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFileChange(e, 'passport')} required={!form.provideDocsInOffice} />
            </label>
          </div>

          <div className="price-preview">
            <p><strong>Base Price:</strong> ฿{pricePreview.base.toLocaleString()}</p>
            <p><strong>Surcharge (฿50/day):</strong> ฿{pricePreview.surcharge.toLocaleString()}</p>
            {form.insurance && <p><strong>Insurance (฿50/day):</strong> ฿{pricePreview.insurance.toLocaleString()}</p>}
            <p><strong>Total Price:</strong> ฿{pricePreview.total.toLocaleString()}</p>
          </div>

          <button type="submit">Book</button>
        </form>
      </div>

      <div className="booking-cards-container">
        <h3>All Bookings</h3>
        <div className="cards-wrapper">
          {bookings.map((b) => {
            const breakdown = getPriceBreakdown(b.numberOfDays, b.insurance, b.bike);
            return (
              <div key={b._id} className="booking-card">
                <p><strong>Name:</strong> {b.firstName} {b.lastName}</p>
                <p><strong>Start Date:</strong> {formatDateTime(b.startDateTime)}</p>
                <p><strong>End Date:</strong> {formatDateTime(b.endDateTime)}</p>
                <p><strong>Days:</strong> {b.numberOfDays}</p>
                <p><strong>Bike:</strong> {b.bike}</p>
                <p><strong>Insurance:</strong> {b.insurance ? 'Yes' : 'No'}</p>
                <p><strong>Total Price:</strong> ฿{b.totalPrice?.toLocaleString()}</p>

                <div className="price-breakdown">
                  <p style={{ fontWeight: 600, marginTop: '0.5rem' }}>💰 Price Breakdown:</p>
                  <p>- Base Price: ฿{breakdown.base.toLocaleString()}</p>
                  <p>- Surcharge (฿50/day): ฿{breakdown.surcharge.toLocaleString()}</p>
                  {b.insurance && <p>- Insurance (฿50/day): ฿{breakdown.insurance.toLocaleString()}</p>}
                  <p>= <strong>Total: ฿{breakdown.total.toLocaleString()}</strong></p>
                </div>

                <button onClick={() => toggleViewFiles(b._id)}>View Files</button>
                {showFiles[b._id] && (
                  <div className="file-links">
                    {b.licenseSignedUrl ? (
                      <p><strong>License:</strong> <a href={b.licenseSignedUrl} target="_blank" rel="noopener noreferrer">View License</a></p>
                    ) : <p>No license uploaded.</p>}

                    {b.passportSignedUrl ? (
                      <p><strong>Passport:</strong> <a href={b.passportSignedUrl} target="_blank" rel="noopener noreferrer">View Passport</a></p>
                    ) : <p>No passport uploaded.</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}