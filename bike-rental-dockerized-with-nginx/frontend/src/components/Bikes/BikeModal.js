// BikeModal.js
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal, Box, Fade, Typography, Stack, Button, Grid, IconButton,
  FormControl, InputLabel, Select, MenuItem, Alert, CircularProgress
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import GppGoodOutlinedIcon from '@mui/icons-material/GppGoodOutlined';
import PrivacyTipOutlinedIcon from '@mui/icons-material/PrivacyTipOutlined';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';
import { modalStyle, UnderlineInput, SilverCard, DarkSection, YnBtn } from './styles';

const DELIVERY_OPTIONS = [
  { value: 'office_pattaya',  label: 'Pickup at office (Pattaya)', fee: 0 },
  { value: 'delivery_pattaya',label: 'Delivery in Pattaya',        fee: 300 },
  { value: 'bangkok',         label: 'Bangkok delivery',            fee: 3000 },
  { value: 'phuket',          label: 'Phuket delivery',             fee: 5000 },
  { value: 'chiang_mai',      label: 'Chiang Mai delivery',         fee: 6000 },
];

// --- Helpers to prettify server errors ---
function parseReturnWindowError(txt) {
  // Matches: Return must be at least 2 hours before the next booking starts (2025-08-19T21:00:00.000Z).
  if (!txt) return null;
  const m = String(txt).match(/\((\d{4}-\d{2}-\d{2}T[^)]+)\)/);
  if (!m) return null;
  const nextStart = new Date(m[1]);
  if (isNaN(nextStart.getTime())) return null;
  const latestReturn = new Date(nextStart.getTime() - 2 * 60 * 60 * 1000);
  return { nextStart, latestReturn };
}
const fmt = (d) => format(d, 'EEE, dd MMM yyyy • HH:mm');

export default function BikeModal({ open, onClose, bike, bookings, fetchBookings }) {
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

  // raw server/message text (still kept for generic errors)
  const [statusMessage, setStatusMessage] = useState('');
  // structured error if it’s the “2 hours before next booking” case
  const [returnWindowError, setReturnWindowError] = useState(null);

  const [pricePreview, setPricePreview] = useState({ base: 0, insurance: 0, total: 0 });
  const [isSaving, setIsSaving] = useState(false);

  const licenseInputRef = useRef(null);
  const passportInputRef = useRef(null);

  useEffect(() => {
    if (bike) {
      setForm((f) => ({ ...f, bike: `${bike.name || ''} ${bike.modelYear || ''}`.trim() }));
    }
  }, [bike]);

  // Build disabled ranges + earliest future start for this bike
  const { disabledDates, nextBookingStart } = useMemo(() => {
    const set = new Set();
    let nextStart = null;

    if (!bookings || !bike) return { disabledDates: set, nextBookingStart: null };

    const thisId = bike._id || '';
    const thisName = `${bike.name || ''} ${bike.modelYear || ''}`.trim();

    const normalize = (d) => { const x = new Date(d); x.setSeconds(0,0); return x; };
    const addRange = (start, end) => {
      const d0 = new Date(start); d0.setHours(0,0,0,0);
      const d1 = new Date(end || start); d1.setHours(0,0,0,0);
      for (let d = new Date(d0); d <= d1; d.setDate(d.getDate() + 1)) {
        set.add(format(d, 'yyyy-MM-dd'));
      }
    };

    const now = new Date();

    bookings
      .filter((b) => b.bike === thisName || b.bike === thisId || b.bike?._id === thisId)
      .forEach((b) => {
        addRange(b.startDateTime, b.endDateTime);
        const s = normalize(b.startDateTime);
        if (s > now && (!nextStart || s < nextStart)) nextStart = s;
      });

    return { disabledDates: set, nextBookingStart: nextStart };
  }, [bookings, bike]);

  // keep for calendar minDate
  const today = useMemo(() => { const t = new Date(); t.setHours(0, 0, 0, 0); return t; }, []);
  const shouldDisableDate = (day) => disabledDates.has(format(day, 'yyyy-MM-dd'));

  const handleTextChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setStatusMessage('');
    setReturnWindowError(null);
  };

  const toggleBool = (key, val) => {
    setForm((f) => ({ ...f, [key]: val }));
    if (key === 'provideDocsInOffice' && val) {
      // If providing docs in office, clear uploads and consent not needed
      setLicenseFile(null);
      setPassportFile(null);
    }
    setStatusMessage('');
    setReturnWindowError(null);
  };

  const handlePickFile = (ref) => ref?.current?.click();
  const handleFileChange = (e, type) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setStatusMessage('Only image files are allowed.');
      setReturnWindowError(null);
      return;
    }
    if (type === 'license') setLicenseFile(file);
    if (type === 'passport') setPassportFile(file);
    setStatusMessage('');
    setReturnWindowError(null);
  };

  // Price calc
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
    const insuranceCost = form.insurance ? d * 100 : 0;
    setPricePreview({ base, insurance: insuranceCost, total: base + insuranceCost });
  }, [form.numberOfDays, form.insurance, bike]);

  // If user picks a disabled start day, bump forward to next available day (but DON'T clamp duration)
  useEffect(() => {
    if (!form.startDateTime) return;
    const start = new Date(form.startDateTime);
    const startKey = format(new Date(start.getFullYear(), start.getMonth(), start.getDate()), 'yyyy-MM-dd');
    if (disabledDates.has(startKey)) {
      let d = new Date(start);
      for (let i = 0; i < 180; i++) {
        d.setDate(d.getDate() + 1);
        const key = format(new Date(d.getFullYear(), d.getMonth(), d.getDate()), 'yyyy-MM-dd');
        if (!disabledDates.has(key)) {
          setForm((f) => ({ ...f, startDateTime: d }));
          setStatusMessage('Adjusted start to the next available day.');
          setReturnWindowError(null);
          break;
        }
      }
    }
  }, [form.startDateTime, disabledDates]);

  const requireUploads = !form.provideDocsInOffice;
  const consentRequired = !form.provideDocsInOffice; // consent only needed if uploading images

  const currentDeliveryFee = useMemo(
    () => DELIVERY_OPTIONS.find(o => o.value === form.deliveryLocation)?.fee ?? 0,
    [form.deliveryLocation]
  );

  // Submit booking (payments happen on bookings page now)
  const submitBooking = async () => {
    const body = new FormData();
    Object.entries({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      startDateTime: new Date(form.startDateTime).toISOString(),
      numberOfDays: form.numberOfDays,
      bike: form.bike,
      insurance: form.insurance,
      provideDocsInOffice: form.provideDocsInOffice,
      consentGiven: consentRequired ? true : false,
      consentTextVersion: form.consentTextVersion,
      dataRetentionDays: form.dataRetentionDays,
      deliveryLocation: form.deliveryLocation,
      deliveryFee: currentDeliveryFee,
    }).forEach(([k, v]) => body.append(k, v));

    if (requireUploads) {
      if (licenseFile) body.append('licenseFile', licenseFile);
      if (passportFile) body.append('passportFile', passportFile);
    }

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
  };

  const handleSubmit = async () => {
    try {
      // Basic validations
      if (!form.firstName?.trim() ||
          !form.lastName?.trim() ||
          !form.startDateTime ||
          !String(form.numberOfDays || '').trim() ||
          !form.bike?.trim()) {
        setStatusMessage('All fields are required.');
        setReturnWindowError(null);
        return;
      }

      if (consentRequired && !form.consentGiven) {
        setStatusMessage('You must provide consent to upload/verify documents.');
        setReturnWindowError(null);
        return;
      }

      // Front-end start date validity
      const start = new Date(form.startDateTime);
      const startKey = format(new Date(start.getFullYear(), start.getMonth(), start.getDate()), 'yyyy-MM-dd');
      if (disabledDates.has(startKey)) {
        setStatusMessage('Selected start date is unavailable for this bike.');
        setReturnWindowError(null);
        return;
      }

      if (requireUploads && (!licenseFile || !passportFile)) {
        setStatusMessage('License and Passport uploads are required unless you provide docs in office.');
        setReturnWindowError(null);
        return;
      }

      setIsSaving(true);
      await submitBooking();

      if (typeof fetchBookings === 'function') await fetchBookings();
      window.location.assign('/bookings'); // redirect after success
    } catch (e) {
      const raw = e?.message || 'Error submitting booking';
      setStatusMessage(raw);

      // Try to parse the special “2 hours before next booking” error
      const parsed = parseReturnWindowError(raw);
      setReturnWindowError(parsed);

      setIsSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={isSaving ? undefined : onClose} closeAfterTransition>
      <Fade in={open}>
        <Box sx={modalStyle}>
          <SilverCard>
            {!bike ? (
              <Typography>Loading…</Typography>
            ) : (
              <Box sx={{ position: 'relative', opacity: isSaving ? 0.6 : 1 }}>
                <Typography variant="h5" sx={{ mb: 2, color: '#111' }}>
                  {bike.name} {bike.modelYear}
                </Typography>

                <Grid container spacing={3}>
                  {/* LEFT 70% */}
                  <Grid item xs={12} md={8}>
                    <DarkSection>
                      {/* first/last */}
                      <Grid container spacing={2} sx={{ mb: 1 }}>
                        <Grid item xs={12} md={6}>
                          <UnderlineInput
                            variant="standard"
                            required fullWidth label="First Name" name="firstName"
                            value={form.firstName} onChange={handleTextChange} disabled={isSaving}
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <UnderlineInput
                            variant="standard"
                            required fullWidth label="Last Name" name="lastName"
                            value={form.lastName} onChange={handleTextChange} disabled={isSaving}
                          />
                        </Grid>
                      </Grid>

                      {/* date/days */}
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
                              disabled={isSaving}
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
                            required fullWidth label="Number of Days"
                            type="number" inputProps={{ min: 1 }}
                            name="numberOfDays" value={form.numberOfDays}
                            onChange={handleTextChange} disabled={isSaving}
                          />
                        </Grid>
                      </Grid>

                      {/* delivery */}
                      <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={12}>
                          <FormControl variant="standard" fullWidth disabled={isSaving}>
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

                      {/* toggles */}
                      <Stack spacing={2} sx={{ mb: 2 }}>
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Typography sx={{ minWidth: 200, color: '#ddd' }}>Upgrade Insurance</Typography>
                          <div>
                            <YnBtn disabled={isSaving} active={form.insurance} yes onClick={() => toggleBool('insurance', true)}>Yes</YnBtn>
                            <YnBtn disabled={isSaving} active={!form.insurance} onClick={() => toggleBool('insurance', false)}>No</YnBtn>
                          </div>
                        </Stack>

                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Typography sx={{ minWidth: 200, color: '#ddd' }}>Provide Docs in Office</Typography>
                          <div>
                            <YnBtn disabled={isSaving} active={form.provideDocsInOffice} yes onClick={() => toggleBool('provideDocsInOffice', true)}>Yes</YnBtn>
                            <YnBtn disabled={isSaving} active={!form.provideDocsInOffice} onClick={() => toggleBool('provideDocsInOffice', false)}>No</YnBtn>
                          </div>
                        </Stack>
                      </Stack>

                      {/* consent – only when uploading docs */}
                      {!form.provideDocsInOffice && (
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
                              disabled={isSaving}
                            >
                              {form.consentGiven ? 'Consent given' : 'Give consent'}
                            </Button>
                            <Typography variant="body2" sx={{ color:'#bbb' }}>
                              Retention: {form.dataRetentionDays} days · Policy v{form.consentTextVersion}
                            </Typography>
                          </Stack>
                        </Box>
                      )}

                      {/* uploads – only when not providing in office */}
                      {!form.provideDocsInOffice && (
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                          <Grid item xs={12} md={6}>
                            <Stack direction="row" alignItems="center" spacing={2}>
                              <Typography sx={{ minWidth: 160, color: '#ddd' }}>
                                Upload License <span style={{ color: '#ff6b6b' }}>*</span>
                              </Typography>
                              <IconButton onClick={() => handlePickFile(licenseInputRef)} disabled={isSaving}>
                                {licenseFile
                                  ? <CheckCircleOutlineIcon sx={{ color: 'limegreen' }} />
                                  : <InsertDriveFileOutlinedIcon sx={{ color: '#fff' }} />}
                              </IconButton>
                              <input
                                ref={licenseInputRef}
                                type="file" accept="image/*" hidden
                                onChange={(e) => handleFileChange(e, 'license')}
                                disabled={isSaving}
                              />
                            </Stack>
                          </Grid>

                          <Grid item xs={12} md={6}>
                            <Stack direction="row" alignItems="center" spacing={2}>
                              <Typography sx={{ minWidth: 160, color: '#ddd' }}>
                                Upload Passport <span style={{ color: '#ff6b6b' }}>*</span>
                              </Typography>
                              <IconButton onClick={() => handlePickFile(passportInputRef)} disabled={isSaving}>
                                {passportFile
                                  ? <CheckCircleOutlineIcon sx={{ color: 'limegreen' }} />
                                  : <InsertDriveFileOutlinedIcon sx={{ color: '#fff' }} />}
                              </IconButton>
                              <input
                                ref={passportInputRef}
                                type="file" accept="image/*" hidden
                                onChange={(e) => handleFileChange(e, 'passport')}
                                disabled={isSaving}
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
                        <Grid item xs={5}><Typography align="right">
                          ฿{(DELIVERY_OPTIONS.find(o => o.value === form.deliveryLocation)?.fee ?? 0).toLocaleString()}
                        </Typography></Grid>

                        <Grid item xs={12}><Box sx={{ borderBottom: '1px solid #333', my: 1 }} /></Grid>

                        <Grid item xs={7}><Typography variant="h6">Total</Typography></Grid>
                        <Grid item xs={5}>
                          <Typography variant="h6" align="right">
                            ฿{(pricePreview.total + (DELIVERY_OPTIONS.find(o => o.value === form.deliveryLocation)?.fee ?? 0)).toLocaleString()}
                          </Typography>
                        </Grid>
                      </Grid>
                    </DarkSection>
                  </Grid>
                </Grid>

                {/* Pretty MUI Alert for friendly error messaging */}
                {returnWindowError && (
                  <Alert
                    severity="warning"
                    sx={{
                      mt: 2,
                      borderRadius: 2,
                      border: '1px solid #333',
                      background: '#1f1a14',
                      color: '#fff'
                    }}
                  >
                    <strong>Your return overlaps another booking.</strong><br />
                    Please set your return to <strong>on or before {fmt(returnWindowError.latestReturn)}</strong>.<br />
                    The next booking starts at <strong>{fmt(returnWindowError.nextStart)}</strong>.
                  </Alert>
                )}

                {/* Fallback text for other errors */}
                {!returnWindowError && statusMessage && (
                  <Alert severity="error" sx={{ mt: 2 }}>{String(statusMessage).replace(/^{"error":\s*"?|"}$/g, '')}</Alert>
                )}

                {/* Saving overlay */}
                {isSaving && (
                  <Box sx={{
                    position: 'absolute', inset: 0, display: 'flex',
                    alignItems: 'center', justifyContent: 'center', pointerEvents: 'none'
                  }}>
                    <CircularProgress />
                  </Box>
                )}

                <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ mt: 3 }}>
                  <Button onClick={onClose} disabled={isSaving}>Cancel</Button>
                  <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={isSaving}
                    startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : null}
                  >
                    {isSaving ? 'Saving…' : 'Add to bookings'}
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