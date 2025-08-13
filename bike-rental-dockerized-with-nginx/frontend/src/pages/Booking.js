// 📁 frontend/src/pages/Booking.js
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Booking.css';
import { getMyBookings, getBikes } from '../utils/api';
import { QRCodeSVG } from 'qrcode.react';

// --- Stripe (card) ---
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || '');

// ===== helpers =====

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

// Dummy delivery ETA data
const DELIVERY_ETAS = [
  { location: 'Pickup at office (Pattaya)', window: 'Same day', typical: '1–2 hours', cutoff: 'Order before 5pm' },
  { location: 'Delivery in Pattaya',        window: 'Same day', typical: '2–3 hours', cutoff: 'Order before 4pm' },
  { location: 'Bangkok delivery',           window: 'Next day', typical: '10am–2pm',  cutoff: 'Order before 3pm' },
  { location: 'Phuket delivery',            window: '+2 days',  typical: '12pm–4pm',  cutoff: 'Order before 12pm' },
  { location: 'Chiang Mai delivery',        window: '+2 days',  typical: '1pm–5pm',   cutoff: 'Order before 12pm' },
];

// ---------- PromptPay QR builder (browser-safe) ----------
function numToHex(n, width=2) { return n.toString().padStart(width, '0'); }
function tlv(id, value) { return id + numToHex(value.length) + value; }
function crc16ccitt(bytes) {
  let crc = 0xFFFF;
  for (let b of bytes) {
    crc ^= (b << 8);
    for (let i = 0; i < 8; i++) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) & 0xFFFF : (crc << 1) & 0xFFFF;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}
function strToBytes(str) { return new TextEncoder().encode(str); }
function buildPromptPayPayload({ phone, amount }) {
  const id = (phone || '').replace(/[^\d]/g, '');
  if (!id) return '';
  const aid = tlv('00', 'A000000677010111');
  const mobile = tlv('01', id);
  const mai = tlv('29', aid + mobile);
  const amt = (typeof amount === 'number' && amount > 0) ? tlv('54', amount.toFixed(2)) : '';
  const payloadNoCRC =
    tlv('00', '01') +             // Payload format
    tlv('01', '11') +             // Static
    mai +                         // Merchant account info (PromptPay mobile)
    tlv('53', '764') +            // Currency THB (764)
    amt +                         // Optional amount
    tlv('58', 'TH') +             // Country
    tlv('59', 'Rental') +         // Merchant name
    tlv('60', 'Thailand') +       // City
    '6304';                       // CRC placeholder
  const crc = crc16ccitt(strToBytes(payloadNoCRC));
  return payloadNoCRC + crc;
}

// Minor units THB → satang
const toMinor = (thb) => Math.max(0, Math.round((Number(thb) || 0) * 100));

/** Card payment component (Stripe Elements) */
function CardPayBox({ amountTHB, onPaid }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const handlePay = async () => {
    try {
      setErr('');
      setLoading(true);
      if (!stripe || !elements) return;

      // Create PaymentIntent on backend
      const token = localStorage.getItem('token');
      const res = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ amount: toMinor(amountTHB), currency: 'thb' }),
      });
      if (!res.ok) throw new Error(await res.text());

      const { clientSecret, paymentIntentId } = await res.json();

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: elements.getElement(CardElement) },
      });

      if (result.error) {
        setErr(result.error.message || 'Payment failed.');
        setLoading(false);
        return;
      }

      if (result.paymentIntent?.status === 'succeeded') {
        onPaid?.(paymentIntentId);
      } else {
        setErr('Payment did not complete.');
        setLoading(false);
      }
    } catch (e) {
      setErr(e.message || 'Payment error');
      setLoading(false);
    }
  };

  return (
    <div className="side-card">
      <h4>Card Details</h4>
      <div className="card-input">
        <CardElement options={{
          hidePostalCode: true,
          style: {
            base: { fontSize: '16px', color: '#fff', '::placeholder': { color: '#bbb' } },
            invalid: { color: '#ff6b6b' },
          },
        }} />
      </div>
      <button className="primary-btn" onClick={handlePay} disabled={loading || !stripe || !elements}>
        {loading ? 'Processing…' : `Pay ฿${amountTHB.toLocaleString(undefined,{minimumFractionDigits:2})}`}
      </button>
      {err && <div className="status-message" style={{ marginTop: 8 }}>{err}</div>}
    </div>
  );
}

export default function Booking() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [bikesData, setBikesData] = useState([]);
  const [statusMessage, setStatusMessage] = useState('');

  // Payment option (removed "office")
  const [payMethod, setPayMethod] = useState('card'); // 'card' | 'qr'

  // If there’s no token at all, nudge to sign in
  useEffect(() => {
    const t = localStorage.getItem('token');
    if (!t) {
      setStatusMessage('Please sign in to view your bookings.');
    }
  }, [navigate]);

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
      const data = await getMyBookings();
      setBookings(Array.isArray(data) ? data : []);
      setStatusMessage('');
    } catch (err) {
      console.error('Failed to load my bookings:', err);
      setStatusMessage('❌ Could not load your bookings. Please try again.');
      setBookings([]);
    }
  };

  const fetchBikesData = async () => {
    try {
      const data = await getBikes();
      setBikesData(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load bikes', err);
      setBikesData([]);
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchBikesData();
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

  // Ensure each booking has a computedTotal
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

  // Grand total (include delivery fee if present)
  const grandTotalTHB = useMemo(() => {
    return bookingsWithTotals.reduce((sum, b) => {
      const del = Number(b.deliveryFee || 0);
      return sum + Number(b.__finalTotal || 0) + del;
    }, 0);
  }, [bookingsWithTotals]);

  // QR payload (grand total across cart)
  const promptPayId =
    (process.env.REACT_APP_PROMPTPAY_ID && String(process.env.REACT_APP_PROMPTPAY_ID)) ||
    '0812345678';
  const qrPayload = useMemo(() => {
    if (!grandTotalTHB || grandTotalTHB <= 0) return '';
    return buildPromptPayPayload({ phone: promptPayId, amount: grandTotalTHB });
  }, [promptPayId, grandTotalTHB]);

  // Complete card payment → mark as paid (optional: call /api/bookings/:id/pay etc.)
  const handleCardPaid = async (paymentIntentId) => {
    alert('Payment successful! Ref: ' + paymentIntentId);
    await fetchBookings();
  };

  // Delete a booking
  const deleteBooking = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(txt || `Failed to delete booking`);
      }
      await fetchBookings();
    } catch (e) {
      alert(e.message || 'Delete failed');
    }
  };

  // “I’ve paid by QR” → send a claim to backend (optional endpoint)
  const claimQrPaid = async () => {
    try {
      const token = localStorage.getItem('token');

      // You can include specific booking IDs you want to mark as paid.
      const bookingIds = bookingsWithTotals.map(b => b._id);
      const res = await fetch('/api/payments/qr-paid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          bookingIds,
          amountTHB: grandTotalTHB,
        }),
      });

      // Even if endpoint isn’t there yet, we still show a friendly message
      if (!res.ok) {
        console.warn('qr-paid endpoint not available yet:', await res.text().catch(()=> ''));
      }

      alert('Thanks! We’ve recorded your QR payment claim. We’ll verify shortly.');
      await fetchBookings();
    } catch (e) {
      alert('Recorded your QR payment claim. We’ll verify shortly.');
    }
  };

  return (
    <div className="cart-page">
      <div className="cart-container">
        {/* LEFT: bookings list */}
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
              {bookingsWithTotals.map((b) => {
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
                  <li
                    key={b._id}
                    className="cart-item"
                    style={{
                      width: '100%',
                      background: '#000',
                      border: '1px solid #222',
                      borderRadius: 12,
                      padding: 16,
                      color: '#fff',
                      boxShadow: '0 12px 28px rgba(0,0,0,0.35)',
                      position: 'relative',
                    }}
                  >
                    {/* delete button */}
                    <button
                      className="delete-btn"
                      title="Delete booking"
                      onClick={() => {
                        if (window.confirm('Delete this booking?')) deleteBooking(b._id);
                      }}
                    >
                      ×
                    </button>

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

                    <div className="item-main" style={{ color: '#fff' }}>
                      <div className="item-header">
                        <h2 className="item-name" style={{ color: '#fff' }}>{b.bike}</h2>
                        <div className="item-price" style={{ color: '#90ee90' }}>
                          ฿{Number(b.__finalTotal || 0).toLocaleString()}
                          {Number(b.deliveryFee || 0) > 0 ? (
                            <span style={{ color:'#ccc', marginLeft: 8, fontWeight: 400 }}>
                              (+฿{Number(b.deliveryFee).toLocaleString()} delivery)
                            </span>
                          ) : null}
                        </div>
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

          {/* === 2‑column section: Insurance + Delivery === */}
          <div className="insurance-delivery-grid">
            <div className="insurance-card">
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

            <div className="delivery-card">
              <h3>Delivery Times (estimates)</h3>
              <p className="muted">Typical delivery windows by area. Subject to traffic and availability.</p>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #1f1f1f' }}>Location</th>
                      <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #1f1f1f' }}>Window</th>
                      <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #1f1f1f' }}>Typical Time</th>
                      <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #1f1f1f' }}>Cut‑off</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DELIVERY_ETAS.map((row) => (
                      <tr key={row.location}>
                        <td style={{ padding: '8px', borderBottom: '1px solid #151515', color: '#eee' }}>{row.location}</td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #151515', color: '#ddd' }}>{row.window}</td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #151515', color: '#ddd' }}>{row.typical}</td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #151515', color: '#ddd' }}>{row.cutoff}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="muted" style={{ marginTop: 8 }}>
                Need a specific time? We’ll do our best—reply to your confirmation email after booking.
              </p>
            </div>
          </div>
          {/* === /2‑column section === */}
        </div>

        {/* RIGHT: payment summary */}
        <div className="cart-right">
          <div className="summary-card">
            <h2>Payment Summary</h2>

            <div className="summary-row">
              <span>Items</span>
              <span>{bookingsWithTotals.length}</span>
            </div>

            <div className="summary-row">
              <span>Grand Total</span>
              <span>฿{grandTotalTHB.toLocaleString()}</span>
            </div>

            <div className="summary-divider" />

            {/* Payment method chooser (no office) */}
            <div className="side-card">
              <h4>Choose how to pay</h4>
              <div className="delivery-options" style={{ marginTop: 8 }}>
                <label className={`delivery-option ${payMethod==='card' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="pay"
                    checked={payMethod==='card'}
                    onChange={() => setPayMethod('card')}
                  />
                  <div className="option-title">Credit / Debit Card</div>
                  <div className="option-price">฿{grandTotalTHB.toLocaleString()}</div>
                </label>

                <label className={`delivery-option ${payMethod==='qr' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="pay"
                    checked={payMethod==='qr'}
                    onChange={() => setPayMethod('qr')}
                  />
                  <div className="option-title">PromptPay QR</div>
                  <div className="option-price">฿{grandTotalTHB.toLocaleString()}</div>
                </label>
              </div>
            </div>

            {/* Reveal panels */}
            {payMethod === 'qr' && (
              <div className="side-card" style={{ textAlign: 'center' }}>
                <h4>Scan to pay (PromptPay)</h4>
                {qrPayload ? (
                  <>
                    <QRCodeSVG value={qrPayload} size={180} />
                    <div className="fine-print" style={{ marginTop: 8 }}>
                      {promptPayId} • ฿{grandTotalTHB.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                    <button
                      className="primary-btn"
                      style={{ marginTop: 12 }}
                      onClick={claimQrPaid}
                    >
                      I’ve paid by QR
                    </button>
                  </>
                ) : (
                  <div className="fine-print">QR unavailable (check PromptPay ID or total)</div>
                )}
              </div>
            )}

            {payMethod === 'card' && process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY && (
              <Elements stripe={stripePromise} options={{ appearance: { theme: 'night' } }}>
                <CardPayBox amountTHB={grandTotalTHB} onPaid={handleCardPaid} />
              </Elements>
            )}

            {!process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY && payMethod === 'card' && (
              <div className="status-message" style={{ marginTop: 10 }}>
                Stripe publishable key not set. Add <code>REACT_APP_STRIPE_PUBLISHABLE_KEY</code> to enable card payments.
              </div>
            )}
          </div>

          <div className="side-card">
            <h4>Need help?</h4>
            <p className="fine-print">
              Questions about payment or delivery? Reply to your confirmation email or contact support.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}