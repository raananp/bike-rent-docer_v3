import React, { useEffect, useMemo, useState } from 'react';
import './Booking.css';

// Safe fetch helper that won't crash on HTML error pages
async function safeJsonFetch(url, options = {}) {
  const res = await fetch(url, options);
  const ct = res.headers.get('content-type') || '';
  const text = await res.text(); // read once
  if (!res.ok) {
    const snippet = text.slice(0, 300);
    throw new Error(`HTTP ${res.status}: ${snippet}`);
  }
  return ct.includes('application/json') ? JSON.parse(text) : text;
}

// Price helper: compute base + insurance from rates and days
function computePrice(days, insurance, rates) {
  if (!days || !rates) return { base: 0, insurance: 0, total: 0 };
  let remaining = days;
  let base = 0;

  const monthRate = Number(rates.perMonth || 0);
  const weekRate  = Number(rates.perWeek  || 0);
  const dayRate   = Number(rates.perDay   || 0);

  const months = Math.floor(remaining / 30);
  base += months * monthRate;
  remaining -= months * 30;

  const weeks = Math.floor(remaining / 7);
  base += weeks * weekRate;
  remaining -= weeks * 7;

  base += remaining * dayRate;

  const insuranceCost = insurance ? days * 50 : 0; // your rule
  const total = base + insuranceCost;
  return { base, insurance: insuranceCost, total };
}

export default function Booking() {
  const [bookings, setBookings] = useState([]);
  const [bikesData, setBikesData] = useState([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [delivery, setDelivery] = useState('pickup'); // pickup | bangkok | nationwide

  // Dummy delivery table (฿)
  const deliveryPrices = { pickup: 0, bangkok: 800, nationwide: 1500 };

  // Map for quick bike rate lookup: "Name Year" -> {perDay, perWeek, perMonth}
  const bikeRateMap = useMemo(() => {
    const m = new Map();
    (bikesData || []).forEach((b) => {
      const key = `${b.name || ''} ${b.modelYear || ''}`.trim();
      m.set(key, { perDay: b.perDay, perWeek: b.perWeek, perMonth: b.perMonth });
    });
    return m;
  }, [bikesData]);

  // Load ONLY current user’s bookings
  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      const data = await safeJsonFetch('/api/bookings/mine', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load my bookings:', err);
      setStatusMessage('❌ Could not load your bookings. Please try again.');
      setBookings([]);
    }
  };

  const fetchBikes = async () => {
    try {
      const data = await safeJsonFetch('/api/bikes');
      setBikesData(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load bikes', err);
      setBikesData([]);
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchBikes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // Ensure each booking has a computedTotal in case backend totalPrice is 0/missing
  const bookingsWithTotals = useMemo(() => {
    return bookings.map((b) => {
      // Prefer rates already enriched onto the booking
      const ratesFromBooking = (b.perDay || b.perWeek || b.perMonth)
        ? { perDay: b.perDay, perWeek: b.perWeek, perMonth: b.perMonth }
        : null;

      // Fallback: lookup from bikes list by "Name Year"
      const ratesFromMap = bikeRateMap.get(b.bike || '') || null;

      const rates = ratesFromBooking || ratesFromMap;
      const days = Number(b.numberOfDays || 0);

      const computed = computePrice(days, !!b.insurance, rates || { perDay: 0, perWeek: 0, perMonth: 0 });

      const total = Number(b.totalPrice || 0) > 0 ? Number(b.totalPrice) : computed.total;

      return {
        ...b,
        __computed: computed,
        __finalTotal: total,
      };
    });
  }, [bookings, bikeRateMap]);

  // Cart totals
  const subtotal = useMemo(() => {
    return bookingsWithTotals.reduce((acc, b) => acc + (Number(b.__finalTotal) || 0), 0);
  }, [bookingsWithTotals]);

  const deliveryFee = deliveryPrices[delivery] ?? 0;
  const grandTotal = subtotal + deliveryFee;

  return (
    <div className="cart-page">
      <div className="cart-container">
        <div className="cart-left">
          <h1 className="cart-title">Your Rentals</h1>
          {statusMessage && <p className="status-message">{statusMessage}</p>}

          {bookingsWithTotals.length === 0 ? (
            <div className="cart-empty">
              <p>Your cart is empty.</p>
              <a className="link-btn" href="/bikes">Browse bikes</a>
            </div>
          ) : (
            <ul className="cart-items">
              {bookingsWithTotals.map((b) => (
                <li key={b._id} className="cart-item">
                  <div className="item-thumb">
                    {b.bikeImageUrl ? (
                      <img src={b.bikeImageUrl} alt={b.bike} />
                    ) : (
                      <div className="thumb-placeholder">Bike</div>
                    )}
                  </div>

                  <div className="item-main">
                    <div className="item-header">
                      <h2 className="item-name">{b.bike}</h2>
                      <div className="item-price">฿{Number(b.__finalTotal || 0).toLocaleString()}</div>
                    </div>

                    <div className="item-meta">
                      <div className="meta-row">
                        <span className="meta-label">Renter</span>
                        <span className="meta-value">{b.firstName} {b.lastName}</span>
                      </div>
                      <div className="meta-row">
                        <span className="meta-label">Dates</span>
                        <span className="meta-value">
                          {formatDateTime(b.startDateTime)} → {formatDateTime(b.endDateTime)}
                        </span>
                      </div>
                      <div className="meta-row">
                        <span className="meta-label">Duration</span>
                        <span className="meta-value">
                          {b.numberOfDays} day{Number(b.numberOfDays) > 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="meta-row">
                        <span className="meta-label">Insurance</span>
                        <span className="meta-value">{b.insurance ? 'Upgraded' : 'Standard'}</span>
                      </div>

                      {(b.perDay || b.perWeek || b.perMonth || bikeRateMap.get(b.bike || '')) && (
                        <div className="meta-row meta-rate">
                          <span className="meta-label">Rate Card</span>
                          <span className="meta-value">
                            {(() => {
                              const r = (b.perDay || b.perWeek || b.perMonth)
                                ? { perDay: b.perDay, perWeek: b.perWeek, perMonth: b.perMonth }
                                : (bikeRateMap.get(b.bike || '') || {});
                              const parts = [];
                              if (r.perDay) parts.push(`฿${r.perDay}/day`);
                              if (r.perWeek) parts.push(`฿${r.perWeek}/week`);
                              if (r.perMonth) parts.push(`฿${r.perMonth}/month`);
                              return parts.join(' • ');
                            })()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Files */}
                    <div className="item-files">
                      <div className="file-pill">
                        {b.licenseSignedUrl ? (
                          <a href={b.licenseSignedUrl} target="_blank" rel="noopener noreferrer">License</a>
                        ) : (
                          <span className="muted">License: N/A</span>
                        )}
                      </div>
                      <div className="file-pill">
                        {b.passportSignedUrl ? (
                          <a href={b.passportSignedUrl} target="_blank" rel="noopener noreferrer">Passport</a>
                        ) : (
                          <span className="muted">Passport: N/A</span>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Info sections like Apple cart */}
          <div className="info-panels">
            <div className="info-card">
              <h3>Insurance Options</h3>
              <p className="muted">
                Standard coverage is included. Upgrade adds accidental damage protection up to ฿50,000
                with a ฿3,000 excess. Roadside assistance in Pattaya included.
              </p>
              <ul className="bullets">
                <li>Standard: included</li>
                <li>Upgrade: +฿50/day per rental (already reflected if chosen)</li>
                <li>Third‑party liability included</li>
              </ul>
            </div>

            <div className="info-card">
              <h3>Delivery Across Thailand</h3>
              <p className="muted">Choose how you’d like to receive your bike(s):</p>
              <div className="delivery-options">
                <label className={`delivery-option ${delivery === 'pickup' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="delivery"
                    value="pickup"
                    checked={delivery === 'pickup'}
                    onChange={() => setDelivery('pickup')}
                  />
                  <div>
                    <div className="option-title">Pattaya pickup</div>
                    <div className="option-sub">Free — collect at our office</div>
                  </div>
                  <div className="option-price">฿0</div>
                </label>

                <label className={`delivery-option ${delivery === 'bangkok' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="delivery"
                    value="bangkok"
                    checked={delivery === 'bangkok'}
                    onChange={() => setDelivery('bangkok')}
                  />
                  <div>
                    <div className="option-title">Bangkok delivery</div>
                    <div className="option-sub">Same/next day, 10:00–18:00</div>
                  </div>
                  <div className="option-price">฿800</div>
                </label>

                <label className={`delivery-option ${delivery === 'nationwide' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="delivery"
                    value="nationwide"
                    checked={delivery === 'nationwide'}
                    onChange={() => setDelivery('nationwide')}
                  />
                  <div>
                    <div className="option-title">Nationwide courier</div>
                    <div className="option-sub">1–3 days, insured transit</div>
                  </div>
                  <div className="option-price">฿1,500</div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Order summary */}
        <aside className="cart-right">
          <div className="summary-card">
            <h2>Order Summary</h2>

            <div className="summary-row">
              <span>Subtotal</span>
              <span>฿{subtotal.toLocaleString()}</span>
            </div>

            <div className="summary-row">
              <span>Delivery</span>
              <span>฿{deliveryFee.toLocaleString()}</span>
            </div>

            <div className="summary-divider" />

            <div className="summary-row total">
              <span>Total</span>
              <span>฿{grandTotal.toLocaleString()}</span>
            </div>

            <button
              className="primary-btn"
              onClick={() => alert('Checkout flow placeholder — integrate payment/confirmation next.')}
              disabled={bookingsWithTotals.length === 0}
            >
              Continue
            </button>

            <p className="fine-print">
              By continuing, you agree to our rental terms and insurance conditions.
            </p>
          </div>

          <div className="side-card">
            <h4>Need changes?</h4>
            <p className="muted">
              To add another bike or change dates, go to the <a href="/bikes">Bikes</a> page and start a new booking.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}