// BikeModal.js
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal, Box, Fade, Typography, Stack, Button, Grid, IconButton,
  FormControl, InputLabel, Select, MenuItem, Alert
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import GppGoodOutlinedIcon from '@mui/icons-material/GppGoodOutlined';
import PrivacyTipOutlinedIcon from '@mui/icons-material/PrivacyTipOutlined';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';
import { modalStyle, UnderlineInput, SilverCard, DarkSection, YnBtn } from './styles';

const DELIVERY_OPTIONS = [
  { value: 'office_pattaya',  label: 'Pickup at office (Pattaya)', fee: 0 },
  { value: 'delivery_pattaya',label: 'Delivery in Pattaya',        fee: 300 },
  { value: 'bangkok',         label: 'Bangkok delivery',            fee: 3000 },
  { value: 'phuket',          label: 'Phuket delivery',             fee: 5000 },
  { value: 'chiang_mai',      label: 'Chiang Mai delivery',         fee: 6000 },
];

// --- Simple PromptPay EMV-QR generator (no Buffer, browser-safe) ---
function numToHex(n, width=2) {
  return n.toString().padStart(width, '0');
}
function tlv(id, value) {
  return id + numToHex(value.length) + value;
}
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
function strToBytes(str) {
  // ASCII-safe; PromptPay payload is ASCII
  return new TextEncoder().encode(str);
}
/** Build a PromptPay payload for Thai phone number ID and optional amount */
function buildPromptPayPayload({ phone, amount }) {
  // Normalize Thai phone to national format without separators (e.g., 0812345678)
  const id = (phone || '').replace(/[^\d]/g, '');
  if (!id) return '';

  // Merchant Account Information (ID "29") -> AID (00) + mobile (01)
  const aid = tlv('00', 'A000000677010111');
  const mobile = tlv('01', id);
  const mai = tlv('29', aid + mobile);

  // Amount (if provided)
  const amt = (typeof amount === 'number' && amount > 0)
    ? tlv('54', amount.toFixed(2))
    : '';

  // Country code TH, currency 764, static QR (01)
  const payloadNoCRC =
    tlv('00', '01') +              // Payload format indicator
    tlv('01', '11') +              // Point of initiation method (11 = static)
    mai +
    tlv('53', '764') +             // Currency (THB)
    amt +
    tlv('58', 'TH') +              // Country
    tlv('59', 'Rental') +          // Merchant name (short)
    tlv('60', 'Thailand') +        // Merchant city
    '6304';                        // CRC placeholder

  const crc = crc16ccitt(strToBytes(payloadNoCRC));
  return payloadNoCRC + crc;
}

export default function BikeModal({ open, onClose, bike, bookings, fetchBookings, qrPromptPayId }) {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    startDateTime: null,
    numberOfDays: '',
    bike: '',
    insurance: false,
    provideDocsInOffice: false,
    deliveryLocation: 'office_pattaya',
    consentGiven: false,
    consentTextVersion: 'v1',
    dataRetentionDays: 90,
  });

  const [licenseFile, setLicenseFile] = useState(null);
  const [passportFile, setPassportFile] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [pricePreview, setPricePreview] = useState({ base: 0, insurance: 0, total: 0 });

  const licenseInputRef = useRef(null);
  const passportInputRef = useRef(null);

  useEffect(() => {
    if (bike) {
      setForm((f) => ({ ...f, bike: `${bike.name || ''} ${bike.modelYear || ''}`.trim() }));
    }
  }, [bike]);

  // disabled dates (YYYY-MM-DD) — unchanged
  const disabledDates = useMemo(() => {
    if (!bookings || !bike) return new Set();
    const set = new Set();
    const thisId = bike._id || '';
    const thisName = `${bike.name || ''} ${bike.modelYear || ''}`.trim();

    const addRange = (start, end) => {
      const d0 = new Date(start); d0.setHours(0,0,0,0);
      const d1 = new Date(end || start); d1.setHours(0,0,0,0);
      for (let d = new Date(d0); d <= d1; d.setDate(d.getDate() + 1)) {
        set.add(format(d, 'yyyy-MM-dd'));
      }
    };

    bookings
      .filter((b) => b.bike === thisName || b.bike === thisId || b.bike?._id === thisId)
      .forEach((b) => addRange(b.startDateTime, b.endDateTime));

    return set;
  }, [bookings, bike]);

  const handleTextChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setStatusMessage('');
  };

  const toggleBool = (key, val) => {
    setForm((f) => ({ ...f, [key]: val }));
    if (key === 'provideDocsInOffice' && val) {
      setLicenseFile(null);
      setPassportFile(null);
    }
  };

  const handlePickFile = (ref) => ref?.current?.click();
  const handleFileChange = (e, type) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setStatusMessage('Only image files are allowed.');
      return;
    }
    if (type === 'license') setLicenseFile(file);
    if (type === 'passport') setPassportFile(file);
    setStatusMessage('');
  };

  // price calc — unchanged
  useEffect(() => {
    if (!bike) return;
    const d = parseInt(form.numberOfDays || 0, 10);
    let base = 0;
    if (d >= 30) {
      const months = Math.floor(d / 30);
      const remDays = d % 30;
      const weeks = Math.floor(remDays / 7);
      const days = remDays % 7;
      base = months * (bike.perMonth || 0) + weeks * (bike.perWeek || 0) + days * (bike.perDay || 0);
    } else if (d >= 7) {
      const weeks = Math.floor(d / 7);
      const days = d % 7;
      base = weeks * (bike.perWeek || 0) + days * (bike.perDay || 0);
    } else {
      base = d * (bike.perDay || 0);
    }
    const insuranceCost = form.insurance ? d * 100 : 0; // adjust if needed
    setPricePreview({ base, insurance: insuranceCost, total: base + insuranceCost });
  }, [form.numberOfDays, form.insurance, bike]);

  const today = useMemo(() => {
    const t = new Date(); t.setHours(0, 0, 0, 0); return t;
  }, []);
  const shouldDisableDate = (day) => disabledDates.has(format(day, 'yyyy-MM-dd'));

  const requireUploads = !form.provideDocsInOffice;
  const currentDeliveryFee = useMemo(
    () => DELIVERY_OPTIONS.find(o => o.value === form.deliveryLocation)?.fee ?? 0,
    [form.deliveryLocation]
  );

  const handleSubmit = async () => {
    try {
      if (!form.firstName?.trim() ||
          !form.lastName?.trim() ||
          !form.startDateTime ||
          !String(form.numberOfDays || '').trim() ||
          !form.bike?.trim()) {
        setStatusMessage('All fields are required.');
        return;
      }
      if (!form.consentGiven) {
        setStatusMessage('You must provide consent to upload/verify documents.');
        return;
      }
      if (shouldDisableDate(new Date(form.startDateTime))) {
        setStatusMessage('Selected start date is unavailable for this bike.');
        return;
      }
      if (requireUploads && (!licenseFile || !passportFile)) {
        setStatusMessage('License and Passport uploads are required unless you provide docs in office.');
        return;
      }

      const body = new FormData();
      Object.entries({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        startDateTime: new Date(form.startDateTime).toISOString(),
        numberOfDays: form.numberOfDays,
        bike: form.bike,
        insurance: form.insurance,
        provideDocsInOffice: form.provideDocsInOffice,
        consentGiven: true,
        consentTextVersion: form.consentTextVersion,
        dataRetentionDays: form.dataRetentionDays,
        deliveryLocation: form.deliveryLocation,
        deliveryFee: currentDeliveryFee,
      }).forEach(([k, v]) => body.append(k, v));

      if (licenseFile) body.append('licenseFile', licenseFile);
      if (passportFile) body.append('passportFile', passportFile);

      const token = localStorage.getItem('token');
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body,
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(txt || `HTTP ${res.status}`);
      }

      setStatusMessage('');
      if (typeof fetchBookings === 'function') await fetchBookings();
      onClose && onClose();
    } catch (e) {
      setStatusMessage(e.message || 'Error submitting booking');
    }
  };

  // Calculate QR amount (total incl. delivery)
  const qrAmount = pricePreview.total + currentDeliveryFee;
  const promptPayId = qrPromptPayId || '0812345678'; // <-- put your Thai PromptPay phone here for testing
  const ppPayload = promptPayId ? buildPromptPayPayload({ phone: promptPayId, amount: qrAmount }) : '';

  return (
    <Modal open={open} onClose={onClose} closeAfterTransition>
      <Fade in={open}>
        <Box sx={modalStyle}>
          <SilverCard>
            {!bike ? (
              <Typography>Loading…</Typography>
            ) : (
              <Box>
                <Typography variant="h5" sx={{ mb: 2, color: '#111' }}>
                  {bike.name} {bike.modelYear}
                </Typography>

                <Grid container spacing={3}>
                  {/* LEFT 70% */}
                  <Grid item xs={12} md={8}>
                    <DarkSection>
                      {/* first/last on same line */}
                      <Grid container spacing={2} sx={{ mb: 1 }}>
                        <Grid item xs={12} md={6}>
                          <UnderlineInput
                            variant="standard"
                            required fullWidth label="First Name" name="firstName"
                            value={form.firstName} onChange={handleTextChange}
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <UnderlineInput
                            variant="standard"
                            required fullWidth label="Last Name" name="lastName"
                            value={form.lastName} onChange={handleTextChange}
                          />
                        </Grid>
                      </Grid>

                      {/* date/days on same line */}
                      <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={12} md={7}>
                          <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <DateTimePicker
                              label="Start Date & Time"
                              value={form.startDateTime}
                              onChange={(val) => setForm((f) => ({ ...f, startDateTime: val }))}
                              views={['year','month','day','hours','minutes']}
                              openTo="day"
                              reduceAnimations
                              disablePast
                              minDate={today}
                              shouldDisableDate={shouldDisableDate}
                              slotProps={{
                                textField: {
                                  variant: 'standard',
                                  required: true,
                                  fullWidth: true,
                                  InputLabelProps: { shrink: true },
                                  sx: {
                                    '& .MuiInputBase-root': { color: '#fff' },
                                    '& .MuiFormLabel-root': { color: '#cfcfcf' },
                                    '& .MuiInput-underline:before': { borderBottomColor: '#bfbfbf' },
                                    '& .MuiInput-underline:after': { borderBottomColor: '#90ee90' },
                                  },
                                },
                              }}
                            />
                          </LocalizationProvider>
                        </Grid>
                        <Grid item xs={12} md={5}>
                          <UnderlineInput
                            variant="standard"
                            required fullWidth label="Number of Days" type="number" inputProps={{ min: 1 }}
                            name="numberOfDays" value={form.numberOfDays} onChange={handleTextChange}
                          />
                        </Grid>
                      </Grid>

                      {/* delivery as dropdown */}
                      <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={12}>
                          <FormControl variant="standard" fullWidth>
                            <InputLabel sx={{ color: '#cfcfcf' }}>Pickup / Delivery</InputLabel>
                            <Select
                              value={form.deliveryLocation}
                              onChange={(e) => setForm(f => ({ ...f, deliveryLocation: e.target.value }))}
                              sx={{
                                color: '#fff',
                                '& .MuiSvgIcon-root': { color: '#fff' },
                                '&:before': { borderBottomColor: '#bfbfbf' },
                                '&:after': { borderBottomColor: '#90ee90' },
                              }}
                            >
                              {DELIVERY_OPTIONS.map(opt => (
                                <MenuItem key={opt.value} value={opt.value}>
                                  {opt.label} — ฿{opt.fee.toLocaleString()}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                      </Grid>

                      {/* insurance / provide docs */}
                      <Stack spacing={2} sx={{ mb: 2 }}>
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Typography sx={{ minWidth: 200, color: '#ddd' }}>Upgrade Insurance</Typography>
                          <div>
                            <YnBtn active={form.insurance} yes onClick={() => toggleBool('insurance', true)}>Yes</YnBtn>
                            <YnBtn active={!form.insurance} onClick={() => toggleBool('insurance', false)}>No</YnBtn>
                          </div>
                        </Stack>

                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Typography sx={{ minWidth: 200, color: '#ddd' }}>Provide Docs in Office</Typography>
                          <div>
                            <YnBtn active={form.provideDocsInOffice} yes onClick={() => toggleBool('provideDocsInOffice', true)}>Yes</YnBtn>
                            <YnBtn active={!form.provideDocsInOffice} onClick={() => toggleBool('provideDocsInOffice', false)}>No</YnBtn>
                          </div>
                        </Stack>
                      </Stack>

                      {/* CONSENT — moved LEFT, under toggles */}
                      <Box sx={{ mb: 2 }}>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                          {form.consentGiven
                            ? <GppGoodOutlinedIcon sx={{ color: '#2ecc71' }} />
                            : <PrivacyTipOutlinedIcon sx={{ color: '#ff5252' }} />}
                          <Typography variant="subtitle1">Consent</Typography>
                        </Stack>

                        <Alert severity="info" sx={{ mb: 1, background: '#223', color: '#fff' }}>
                          We collect passport/license images solely to verify identity for rental in compliance
                          with Thai law. Documents are stored securely and deleted after the retention period.
                        </Alert>

                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Button
                            variant={form.consentGiven ? 'contained' : 'outlined'}
                            onClick={() => setForm(f => ({ ...f, consentGiven: !f.consentGiven }))}
                          >
                            {form.consentGiven ? 'Consent given' : 'Give consent'}
                          </Button>
                          <Typography variant="body2" sx={{ color:'#bbb' }}>
                            Retention: {form.dataRetentionDays} days · Policy v{form.consentTextVersion}
                          </Typography>
                        </Stack>
                      </Box>

                      {/* uploads (if not providing in office) */}
                      {!form.provideDocsInOffice && (
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                          <Grid item xs={12} md={6}>
                            <Stack direction="row" alignItems="center" spacing={2}>
                              <Typography sx={{ minWidth: 160, color: '#ddd' }}>
                                Upload License <span style={{ color: '#ff6b6b' }}>*</span>
                              </Typography>
                              <IconButton onClick={() => handlePickFile(licenseInputRef)}>
                                {licenseFile
                                  ? <CheckCircleOutlineIcon sx={{ color: 'limegreen' }} />
                                  : <InsertDriveFileOutlinedIcon sx={{ color: '#fff' }} />}
                              </IconButton>
                              <input
                                ref={licenseInputRef}
                                type="file" accept="image/*" hidden
                                onChange={(e) => handleFileChange(e, 'license')}
                              />
                            </Stack>
                          </Grid>

                          <Grid item xs={12} md={6}>
                            <Stack direction="row" alignItems="center" spacing={2}>
                              <Typography sx={{ minWidth: 160, color: '#ddd' }}>
                                Upload Passport <span style={{ color: '#ff6b6b' }}>*</span>
                              </Typography>
                              <IconButton onClick={() => handlePickFile(passportInputRef)}>
                                {passportFile
                                  ? <CheckCircleOutlineIcon sx={{ color: 'limegreen' }} />
                                  : <InsertDriveFileOutlinedIcon sx={{ color: '#fff' }} />}
                              </IconButton>
                              <input
                                ref={passportInputRef}
                                type="file" accept="image/*" hidden
                                onChange={(e) => handleFileChange(e, 'passport')}
                              />
                            </Stack>
                          </Grid>
                        </Grid>
                      )}
                    </DarkSection>
                  </Grid>

                  {/* RIGHT 30% */}
                  <Grid item xs={12} md={4}>
                    <DarkSection>
                      <Typography variant="subtitle1" sx={{ mb: 1 }}>Price Summary</Typography>
                      <Grid container spacing={1}>
                        <Grid item xs={7}><Typography>Base</Typography></Grid>
                        <Grid item xs={5}><Typography align="right">฿{pricePreview.base.toLocaleString()}</Typography></Grid>

                        {form.insurance && (
                          <>
                            <Grid item xs={7}><Typography>Insurance</Typography></Grid>
                            <Grid item xs={5}><Typography align="right">฿{pricePreview.insurance.toLocaleString()}</Typography></Grid>
                          </>
                        )}

                        <Grid item xs={7}><Typography>Delivery</Typography></Grid>
                        <Grid item xs={5}><Typography align="right">฿{currentDeliveryFee.toLocaleString()}</Typography></Grid>

                        <Grid item xs={12}><Box sx={{ borderBottom: '1px solid #333', my: 1 }} /></Grid>

                        <Grid item xs={7}><Typography variant="h6">Total</Typography></Grid>
                        <Grid item xs={5}>
                          <Typography variant="h6" align="right">
                            ฿{(pricePreview.total + currentDeliveryFee).toLocaleString()}
                          </Typography>
                        </Grid>
                      </Grid>
                    </DarkSection>

                    {/* PromptPay QR */}
                    {promptPayId && ppPayload && (
                      <DarkSection sx={{ mt: 2, textAlign: 'center' }}>
                        <Typography variant="subtitle1" sx={{ mb: 1 }}>
                          Pay with PromptPay
                        </Typography>
                        <QRCodeSVG value={ppPayload} size={180} />
                        <Typography variant="body2" sx={{ mt: 1, color: '#bbb' }}>
                          {promptPayId} • ฿{qrAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </Typography>
                      </DarkSection>
                    )}
                  </Grid>
                </Grid>

                {statusMessage && (
                  <Typography color="error" sx={{ mt: 2 }}>{statusMessage}</Typography>
                )}

                <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ mt: 3 }}>
                  <Button onClick={onClose}>Cancel</Button>
                  <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={!form.consentGiven}
                  >
                    Confirm Booking
                  </Button>
                </Stack>
              </Box>
            )}
          </SilverCard>
        </Box>
      </Fade>
    </Modal>
  );
}