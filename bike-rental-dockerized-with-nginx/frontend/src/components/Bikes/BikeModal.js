import React, { useEffect, useState } from 'react';
import {
  Modal, Box, Fade, Typography, Stack, Button
} from '@mui/material';
import { modalStyle, WhiteInput } from './styles';

export default function BikeModal({ open, onClose, bike, bookings, fetchBookings }) {
  const [form, setForm] = useState({
    firstName: '', lastName: '', startDateTime: '', numberOfDays: '', bike: '', insurance: false, provideDocsInOffice: false
  });
  const [licenseFile, setLicenseFile] = useState(null);
  const [passportFile, setPassportFile] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [pricePreview, setPricePreview] = useState({ base: 0, surcharge: 0, insurance: 0, total: 0 });
  const [unavailableDates, setUnavailableDates] = useState([]);

  useEffect(() => {
    if (bike) {
      const fullName = `${bike.name} ${bike.modelYear}`;
      setForm(prev => ({ ...prev, bike: fullName }));
      setUnavailableDates(getUnavailableDates(fullName));
    }
  }, [bike]);

  useEffect(() => {
    if (bike && form.numberOfDays) {
      const price = calculatePrice(parseInt(form.numberOfDays), form.insurance, bike);
      setPricePreview(price);
    }
  }, [form.numberOfDays, form.insurance, bike]);

  const getUnavailableDates = (bikeName) => {
    const dates = new Set();
    bookings.forEach(b => {
      if (b.bike === bikeName) {
        const start = new Date(b.startDateTime);
        for (let i = 0; i < b.numberOfDays; i++) {
          const d = new Date(start);
          d.setDate(d.getDate() + i);
          dates.add(d.toISOString().split('T')[0]);
        }
      }
    });
    return Array.from(dates);
  };

  const calculatePrice = (days, insurance, bike) => {
    if (!bike || !days) return { base: 0, surcharge: 0, insurance: 0, total: 0 };
    let base = 0;
    let remaining = days;
    const months = Math.floor(remaining / 30);
    base += months * bike.perMonth;
    remaining -= months * 30;
    const weeks = Math.floor(remaining / 7);
    base += weeks * bike.perWeek;
    remaining -= weeks * 7;
    base += remaining * bike.perDay;
    const surcharge = days * 50;
    const insuranceCost = insurance ? days * 50 : 0;
    return { base, surcharge, insurance: insuranceCost, total: base + surcharge + insuranceCost };
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const maxSizeMB = 10;
    if (!allowedTypes.includes(file.type)) return setStatusMessage(`❌ ${type} must be image`);
    if (file.size > maxSizeMB * 1024 * 1024) return setStatusMessage(`❌ ${type} too large`);
    if (type === 'license') setLicenseFile(file);
    if (type === 'passport') setPassportFile(file);
    setStatusMessage('');
  };

  const handleSubmit = async () => {
    if (!form.provideDocsInOffice && !licenseFile) return setStatusMessage('❌ Upload license or check office option');
    if (!form.provideDocsInOffice && !passportFile) return setStatusMessage('❌ Upload passport or check office option');
    const formData = new FormData();
    for (const key in form) formData.append(key, form[key]);
    if (licenseFile) formData.append('licenseFile', licenseFile);
    if (passportFile) formData.append('passportFile', passportFile);
    try {
      const res = await fetch('/api/bookings', { method: 'POST', body: formData });
      const result = await res.json();
      if (res.ok) {
        setStatusMessage('✅ Booking successful!');
        fetchBookings();
        handleClose();
      } else {
        setStatusMessage(`❌ Error: ${result.error}`);
      }
    } catch (err) {
      console.error(err);
      setStatusMessage('❌ Error submitting form.');
    }
  };

  const handleClose = () => {
    onClose();
    setForm({
      firstName: '', lastName: '', startDateTime: '', numberOfDays: '',
      bike: '', insurance: false, provideDocsInOffice: false
    });
    setLicenseFile(null);
    setPassportFile(null);
    setStatusMessage('');
  };

  if (!bike) return null;

  return (
    <Modal open={open} onClose={handleClose} closeAfterTransition>
      <Fade in={open}>
        <Box sx={modalStyle}>
          <Typography variant="h5">{bike.name} {bike.modelYear}</Typography>

          <Box mt={3} display="grid" gap={2}>
            <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
              <WhiteInput label="First Name" fullWidth value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
              <WhiteInput label="Last Name" fullWidth value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
              <WhiteInput
                label="Start Date & Time"
                type="datetime-local"
                InputLabelProps={{ shrink: true }}
                value={form.startDateTime}
                onChange={(e) => {
                  const dateOnly = e.target.value.split('T')[0];
                  if (unavailableDates.includes(dateOnly)) {
                    setStatusMessage('❌ Date not available for this bike');
                    return;
                  }
                  setForm({ ...form, startDateTime: e.target.value });
                  setStatusMessage('');
                }}
                fullWidth
              />
              <WhiteInput label="Number of Days" type="number" fullWidth value={form.numberOfDays} onChange={(e) => setForm({ ...form, numberOfDays: e.target.value })} />
            </Stack>

            <Box>
              <Typography sx={{ mb: 0.5 }}>Upgrade Insurance:</Typography>
              <Stack direction="row" spacing={2}>
                {['Yes', 'No'].map(val => (
                  <Typography
                    key={val}
                    onClick={() => setForm({ ...form, insurance: val === 'Yes' })}
                    sx={{
                      cursor: 'pointer',
                      color: form.insurance === (val === 'Yes') ? 'white' : 'gray',
                      textDecoration: form.insurance === (val === 'Yes') ? 'underline' : 'none',
                      textUnderlineOffset: '4px'
                    }}
                  >{val}</Typography>
                ))}
              </Stack>
            </Box>

            <Box>
              <Typography sx={{ mb: 0.5 }}>Provide Docs in Office:</Typography>
              <Stack direction="row" spacing={2}>
                {['Yes', 'No'].map(val => (
                  <Typography
                    key={val}
                    onClick={() => setForm({ ...form, provideDocsInOffice: val === 'Yes' })}
                    sx={{
                      cursor: 'pointer',
                      color: form.provideDocsInOffice === (val === 'Yes') ? 'white' : 'gray',
                      textDecoration: form.provideDocsInOffice === (val === 'Yes') ? 'underline' : 'none',
                      textUnderlineOffset: '4px'
                    }}
                  >{val}</Typography>
                ))}
              </Stack>
            </Box>

            {!form.provideDocsInOffice && (
              <>
                <Typography onClick={() => document.getElementById('uploadLicense').click()} sx={{ cursor: 'pointer' }}>
                  Upload License: {licenseFile ? '✅' : '❌'}
                </Typography>
                <Typography onClick={() => document.getElementById('uploadPassport').click()} sx={{ cursor: 'pointer' }}>
                  Upload Passport: {passportFile ? '✅' : '❌'}
                </Typography>
                <input id="uploadLicense" type="file" accept="image/*" hidden onChange={(e) => handleFileChange(e, 'license')} />
                <input id="uploadPassport" type="file" accept="image/*" hidden onChange={(e) => handleFileChange(e, 'passport')} />
              </>
            )}

            <Box sx={{ backgroundColor: '#222', borderRadius: 2, p: 2 }}>
              <Typography>💰 Price Breakdown:</Typography>
              <Typography>- Base: ฿{pricePreview.base}</Typography>
              <Typography>- Surcharge: ฿{pricePreview.surcharge}</Typography>
              {form.insurance && <Typography>- Insurance: ฿{pricePreview.insurance}</Typography>}
              <Typography><strong>Total: ฿{pricePreview.total}</strong></Typography>
            </Box>

            <Typography variant="caption" sx={{ color: 'gray' }}>
              Per Day: ฿{bike.perDay} | Per Week: ฿{bike.perWeek} | Per Month: ฿{bike.perMonth}
            </Typography>

            <Button variant="contained" color="primary" onClick={handleSubmit}>CONFIRM BOOKING</Button>
            {statusMessage && <Typography color="error">{statusMessage}</Typography>}
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
}