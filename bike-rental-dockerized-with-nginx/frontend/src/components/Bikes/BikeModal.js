import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal, Box, Fade, Typography, Stack, Button, Grid, IconButton
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';
import { modalStyle, WhiteInput } from './styles';

export default function BikeModal({ open, onClose, bike, bookings, fetchBookings }) {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    startDateTime: null,     // Date object for DateTimePicker
    numberOfDays: '',
    bike: '',
    insurance: false,
    provideDocsInOffice: false,
  });

  const [licenseFile, setLicenseFile] = useState(null);
  const [passportFile, setPassportFile] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [pricePreview, setPricePreview] = useState({ base: 0, surcharge: 0, insurance: 0, total: 0 });

  const licenseInputRef = useRef(null);
  const passportInputRef = useRef(null);

  useEffect(() => {
    if (bike) {
      // Save readable "Name Model" for the booking record
      setForm((f) => ({ ...f, bike: `${bike.name || ''} ${bike.modelYear || ''}`.trim() }));
    }
  }, [bike]);

  // Build a set of disabled (booked) dates for this bike (YYYY-MM-DD)
  const disabledDates = useMemo(() => {
    if (!bookings || !bike) return new Set();
    const set = new Set();
    const thisId = bike._id || '';
    const thisName = `${bike.name || ''} ${bike.modelYear || ''}`.trim();

    const addRange = (start, end) => {
      const d0 = new Date(start);
      d0.setHours(0, 0, 0, 0);
      const d1 = new Date(end || start);
      d1.setHours(0, 0, 0, 0);
      for (let d = new Date(d0); d <= d1; d.setDate(d.getDate() + 1)) {
        set.add(format(d, 'yyyy-MM-dd'));
      }
    };

    bookings
      .filter((b) =>
        b.bike === thisName ||     // name+model stored
        b.bike === thisId   ||     // id stored as string
        b.bike?._id === thisId     // bike stored as object
      )
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
    if (key === 'provideDocsInOffice' && val === true) {
      // Clear files when switching to "Provide in Office"
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

  // Price calculation (day/week/month tiers + optional insurance)
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
    setPricePreview({ base, surcharge: 0, insurance: insuranceCost, total: base + insuranceCost });
  }, [form.numberOfDays, form.insurance, bike]);

  // Calendar rules
  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);
  const shouldDisableDate = (day) => disabledDates.has(format(day, 'yyyy-MM-dd'));

  // Validation: uploads required only when NOT providing in office
  const requireUploads = !form.provideDocsInOffice;

  const handleSubmit = async () => {
    try {
      // Validate required fields
      if (!form.firstName?.trim() ||
          !form.lastName?.trim() ||
          !form.startDateTime ||
          !String(form.numberOfDays || '').trim() ||
          !form.bike?.trim()) {
        setStatusMessage('All fields are required.');
        return;
      }

      // Validate date availability
      if (shouldDisableDate(new Date(form.startDateTime))) {
        setStatusMessage('Selected start date is unavailable for this bike.');
        return;
      }

      // Validate uploads when required
      if (requireUploads && (!licenseFile || !passportFile)) {
        setStatusMessage('License and Passport uploads are required.');
        return;
      }

      const body = new FormData();
      Object.entries({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        startDateTime: new Date(form.startDateTime).toISOString(),
        numberOfDays: form.numberOfDays,
        bike: form.bike, // name + model
        insurance: form.insurance,
        provideDocsInOffice: form.provideDocsInOffice,
        totalPrice: pricePreview.total,
      }).forEach(([k, v]) => body.append(k, v));

      // 🔁 use backend's expected field names
      if (licenseFile) body.append('licenseFile', licenseFile);
      if (passportFile) body.append('passportFile', passportFile);

      // 🔐 send JWT so backend can attach userId/userEmail
      const token = localStorage.getItem('token');
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined, // don't set Content-Type for FormData
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

  return (
    <Modal open={open} onClose={onClose} closeAfterTransition>
      <Fade in={open}>
        <Box sx={modalStyle}>
          {!bike ? (
            <Typography>Loading…</Typography>
          ) : (
            <Box>
              <Typography variant="h5" sx={{ mb: 2 }}>
                {bike.name} {bike.modelYear}
              </Typography>

              {/* Top form rows (all required) */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={6}>
                  <WhiteInput
                    required
                    fullWidth
                    label="First Name"
                    name="firstName"
                    value={form.firstName}
                    onChange={handleTextChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <WhiteInput
                    required
                    fullWidth
                    label="Last Name"
                    name="lastName"
                    value={form.lastName}
                    onChange={handleTextChange}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DateTimePicker
                      label="Start Date & Time"
                      value={form.startDateTime}
                      onChange={(val) => setForm((f) => ({ ...f, startDateTime: val }))}
                      views={['year', 'month', 'day', 'hours', 'minutes']}
                      openTo="day"
                      showDaysOutsideCurrentMonth
                      reduceAnimations
                      disablePast
                      minDate={today}                 // allow starting today
                      shouldDisableDate={shouldDisableDate} // block booked days
                      slotProps={{
                        textField: {
                          required: true,
                          fullWidth: true,
                          InputLabelProps: { shrink: true },
                          sx: {
                            '& .MuiInputBase-root': { color: 'white' },
                            '& .MuiFormLabel-root': { color: '#aaa' },
                          },
                        },
                      }}
                    />
                  </LocalizationProvider>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <WhiteInput
                    required
                    fullWidth
                    label="Number of Days"
                    type="number"
                    inputProps={{ min: 1 }}
                    name="numberOfDays"
                    value={form.numberOfDays}
                    onChange={handleTextChange}
                  />
                </Grid>
              </Grid>

              {/* Inline Yes/No rows */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={6}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Typography sx={{ minWidth: 180 }}>Upgrade Insurance:</Typography>
                    <Stack direction="row" spacing={2}>
                      <Button
                        variant="text"
                        sx={{ borderBottom: form.insurance ? '2px solid #fff' : '2px solid transparent', color:'#fff', px:1 }}
                        onClick={() => toggleBool('insurance', true)}
                      >
                        Yes
                      </Button>
                      <Button
                        variant="text"
                        sx={{ borderBottom: !form.insurance ? '2px solid #fff' : '2px solid transparent', color:'#fff', px:1 }}
                        onClick={() => toggleBool('insurance', false)}
                      >
                        No
                      </Button>
                    </Stack>
                  </Stack>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Typography sx={{ minWidth: 180 }}>Provide Docs in Office:</Typography>
                    <Stack direction="row" spacing={2}>
                      <Button
                        variant="text"
                        sx={{ borderBottom: form.provideDocsInOffice ? '2px solid #fff' : '2px solid transparent', color:'#fff', px:1 }}
                        onClick={() => toggleBool('provideDocsInOffice', true)}
                      >
                        Yes
                      </Button>
                      <Button
                        variant="text"
                        sx={{ borderBottom: !form.provideDocsInOffice ? '2px solid #fff' : '2px solid transparent', color:'#fff', px:1 }}
                        onClick={() => toggleBool('provideDocsInOffice', false)}
                      >
                        No
                      </Button>
                    </Stack>
                  </Stack>
                </Grid>
              </Grid>

              {/* Uploads + Price Breakdown */}
              <Grid container spacing={3} sx={{ mb: 1 }}>
                {/* Show uploads only when NOT providing docs in office */}
                {!form.provideDocsInOffice && (
                  <Grid item xs={12} md={6}>
                    <Stack spacing={2}>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Typography sx={{ minWidth: 160 }}>
                          Upload License <span style={{ color: '#ff6b6b' }}>*</span>
                        </Typography>
                        <IconButton onClick={() => handlePickFile(licenseInputRef)}>
                          {licenseFile ? (
                            <CheckCircleOutlineIcon sx={{ color: 'limegreen' }} />
                          ) : (
                            <InsertDriveFileOutlinedIcon sx={{ color: '#fff' }} />
                          )}
                        </IconButton>
                        <input
                          ref={licenseInputRef}
                          type="file"
                          accept="image/*"
                          hidden
                          onChange={(e) => handleFileChange(e, 'license')}
                        />
                      </Stack>

                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Typography sx={{ minWidth: 160 }}>
                          Upload Passport <span style={{ color: '#ff6b6b' }}>*</span>
                        </Typography>
                        <IconButton onClick={() => handlePickFile(passportInputRef)}>
                          {passportFile ? (
                            <CheckCircleOutlineIcon sx={{ color: 'limegreen' }} />
                          ) : (
                            <InsertDriveFileOutlinedIcon sx={{ color: '#fff' }} />
                          )}
                        </IconButton>
                        <input
                          ref={passportInputRef}
                          type="file"
                          accept="image/*"
                          hidden
                          onChange={(e) => handleFileChange(e, 'passport')}
                        />
                      </Stack>
                    </Stack>
                  </Grid>
                )}

                {/* Price breakdown: ALWAYS visible. Full width if uploads are hidden */}
                <Grid item xs={12} md={form.provideDocsInOffice ? 12 : 6}>
                  <Box>
                    <Grid container>
                      <Grid item xs={7}><Typography>Base</Typography></Grid>
                      <Grid item xs={5}><Typography align="right">฿{pricePreview.base}</Typography></Grid>

                      {form.insurance ? (
                        <>
                          <Grid item xs={7}><Typography>Insurance</Typography></Grid>
                          <Grid item xs={5}><Typography align="right">฿{pricePreview.insurance}</Typography></Grid>
                        </>
                      ) : null}

                      <Grid item xs={12}><Box sx={{ borderBottom: '1px solid #333', my: 1 }} /></Grid>

                      <Grid item xs={7}><Typography variant="h6">Total</Typography></Grid>
                      <Grid item xs={5}><Typography variant="h6" align="right">฿{pricePreview.total}</Typography></Grid>
                    </Grid>

                    <Typography variant="caption" sx={{ color: 'gray', display:'block', mt:1 }}>
                      Per Day: ฿{bike.perDay}  •  Per Week: ฿{bike.perWeek}  •  Per Month: ฿{bike.perMonth}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ mt: 2 }}>
                <Button onClick={onClose}>Cancel</Button>
                <Button variant="contained" onClick={handleSubmit}>Confirm Booking</Button>
              </Stack>

              {statusMessage && <Typography color="error" sx={{ mt: 1 }}>{statusMessage}</Typography>}
            </Box>
          )}
        </Box>
      </Fade>
    </Modal>
  );
}