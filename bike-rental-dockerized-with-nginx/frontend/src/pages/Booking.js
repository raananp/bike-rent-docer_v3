import React, { useEffect, useMemo, useState } from 'react';
import './Booking.css';

// Safe fetch helper that won't crash on HTML error pages
async function safeJsonFetch(url, options = {}) {
  const res = await fetch(url, options);
  const ct = res.headers.get('content-type') || '';
  const text = await res.text();
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

// --- verification badge helpers ---
function statusClass(s) {
  switch ((s || '').toLowerCase()) {
    case 'passed':  return 'badge badge-success';
    case 'failed':  return 'badge badge-error';
    case 'skipped': return 'badge badge-warn';
    case 'pending':
    default:        return 'badge badge-default';
  }
}

// Map saved delivery codes → labels
function deliveryLabel(code) {
  switch (code) {
    case 'office_pattaya':   return 'Pickup at office (Pattaya)';
    case 'delivery_pattaya': return 'Delivery in Pattaya';
    case 'bangkok':          return 'Bangkok delivery';
    case 'phuket':           return 'Phuket delivery';
    case 'chiang_mai':       return 'Chiang Mai delivery';
    default:                 return code || '—';
  }
}

export default function Booking() {
  const [bookings, setBookings] = useState([]);
  const [bikesData, setBikesData] = useState([]);
  const [statusMessage, setStatusMessage] = useState('');

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

  // Auto-refresh while any booking is pending verification
  useEffect(() => {
    const anyPending = bookings.some(
      (b) =>
        (b?.verification?.status || '').toLowerCase() === 'pending' ||
        (b?.verification?.license?.status || '').toLowerCase() === 'pending' ||
        (b?.verification?.passport?.status || '').toLowerCase() === 'pending'
    );
    if (!anyPending) return;

    const id = setInterval(() => {
      fetchBookings().catch(() => {});
    }, 8000);
    return () => clearInterval(id);
  }, [bookings]);

  const formatDateTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleString('en-GB', {
      year: 'numeric', month: 'short', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  };

  // Ensure each booking has a computedTotal in case backend totalPrice is 0/missing
  const bookingsWithTotals = useMemo(() => {
    return bookings.map((b) => {
      const ratesFromBooking = (b.perDay || b.perWeek || b.perMonth)
        ? { perDay: b.perDay, perWeek: b.perWeek, perMonth: b.perMonth }
        : null;
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

  // Totals (delivery is now per-booking, coming from backend)
  const subtotal = useMemo(() => {
    return bookingsWithTotals.reduce((acc, b) => acc + (Number(b.__finalTotal) || 0), 0);
  }, [bookingsWithTotals]);

  const deliveryTotal = useMemo(() => {
    return bookingsWithTotals.reduce((acc, b) => acc + (Number(b.deliveryFee) || 0), 0);
  }, [bookingsWithTotals]);

  const grandTotal = subtotal + deliveryTotal;

  // small offset so the summary card lines up with the first booking card (under the page title)
  const SUMMARY_TOP_OFFSET_PX = 24; // adjust if you want tighter/looser alignment

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
              {bookingsWithTotals.map((b, idx) => {
                // verification status for display
                const licStatus  = b?.verification?.license?.status  ?? (b.licenseSignedUrl  ? 'pending' : 'skipped');
                const licReason  = b?.verification?.license?.reason  ?? '';
                const passStatus = b?.verification?.passport?.status ?? (b.passportSignedUrl ? 'pending' : 'skipped');
                const passReason = b?.verification?.passport?.reason ?? '';
                const overall    = b?.verification?.status || (
                  (licStatus === 'failed' || passStatus === 'failed') ? 'failed'
                  : (licStatus === 'pending' || passStatus === 'pending') ? 'pending'
                  : (licStatus === 'skipped' && passStatus === 'skipped') ? 'skipped'
                  : 'passed'
                );

                const imgSrc = b.bikeImageSignedUrl || b.bikeImageUrl || '';

                return (
                  <li key={b._id} className="cart-item">
                    <div className="item-thumb">
                      {imgSrc ? (
                        <img
                          src={imgSrc}
                          alt={b.bike}
                          onError={(e) => {
                            if (e?.target) e.target.onerror = null;
                            fetchBookings(); // refresh signed URL if it expired
                          }}
                        />
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

                        {/* Delivery per booking */}
                        <div className="meta-row">
                          <span className="meta-label">Pickup / Delivery</span>
                          <span className="meta-value">
                            {deliveryLabel(b.deliveryLocation)}{typeof b.deliveryFee === 'number' ? ` — ฿${Number(b.deliveryFee).toLocaleString()}` : ''}
                          </span>
                        </div>
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

                      {/* Verification badges */}
                      <div className="verification-status">
                        <div className="ver-row-title">🪪 Document Verification</div>
                        <div className="ver-badges">
                          <span className={statusClass(passStatus)} title={passReason || ''}>
                            Passport: {passStatus}
                          </span>
                          <span className={statusClass(licStatus)} title={licReason || ''}>
                            License: {licStatus}
                          </span>
                          <span className={`${statusClass(overall)} badge-outline`}>
                            Overall: {overall}
                          </span>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Info panels (Delivery section removed as requested) */}
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
          </div>
        </div>

        {/* Order summary (aligned with first booking card) */}
        <aside className="cart-right" style={{ alignSelf: 'flex-start', marginTop: SUMMARY_TOP_OFFSET_PX }}>
          <div className="summary-card">
            <h2>Order Summary</h2>

            <div className="summary-row">
              <span>Subtotal</span>
              <span>฿{subtotal.toLocaleString()}</span>
            </div>

            <div className="summary-row">
              <span>Delivery</span>
              <span>฿{deliveryTotal.toLocaleString()}</span>
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