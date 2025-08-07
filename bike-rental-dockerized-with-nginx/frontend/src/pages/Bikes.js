// 📁 frontend/src/pages/Bikes.js

import React, { useEffect, useState } from 'react';
import {
  Grid, Card, CardContent, CardMedia, Typography, Modal, Box, Button, IconButton, Stack, TextField
} from '@mui/material';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import ElectricMopedIcon from '@mui/icons-material/ElectricMoped';
import CommuteIcon from '@mui/icons-material/Commute';
import { styled } from '@mui/material/styles';
import Fade from '@mui/material/Fade';

const modalStyle = {
  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
  width: '95%', maxWidth: 800, bgcolor: '#121212', color: 'white',
  borderRadius: '12px', boxShadow: 24, p: 4,
};

const WhiteInput = styled(TextField)({
  '& .MuiInputBase-root': { color: 'white' },
  '& .MuiInputLabel-root': { color: 'white' },
  '& .MuiOutlinedInput-root': {
    '& fieldset': { borderColor: 'gray' },
    '&:hover fieldset': { borderColor: 'white' },
    '&.Mui-focused fieldset': { borderColor: '#90caf9' },
  },
  '& input[type="datetime-local"]::-webkit-calendar-picker-indicator': {
    filter: 'invert(1)',
  },
});

const bikeTypes = [
  { label: 'Speed Bike', icon: <CommuteIcon /> },
  { label: 'Cruiser', icon: <TwoWheelerIcon /> },
  { label: 'Scooter', icon: <ElectricMopedIcon /> },
];

export default function Bikes() {
  const [bikes, setBikes] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [filteredBikes, setFilteredBikes] = useState([]);
  const [selectedBike, setSelectedBike] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [form, setForm] = useState({
    firstName: '', lastName: '', startDateTime: '', numberOfDays: '', bike: '', insurance: false, provideDocsInOffice: false
  });
  const [licenseFile, setLicenseFile] = useState(null);
  const [passportFile, setPassportFile] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [pricePreview, setPricePreview] = useState({ base: 0, surcharge: 0, insurance: 0, total: 0 });
  const [unavailableDates, setUnavailableDates] = useState([]);

  useEffect(() => {
    fetchBikes();
    fetchBookings();
  }, []);

  useEffect(() => {
    if (selectedBike && form.numberOfDays) {
      const price = calculatePrice(parseInt(form.numberOfDays), form.insurance, selectedBike);
      setPricePreview(price);
    }
  }, [form.numberOfDays, form.insurance, selectedBike]);

  const fetchBikes = async () => {
    const res = await fetch('/api/bikes');
    const data = await res.json();
    setBikes(data);
    setFilteredBikes(data);
  };

  const fetchBookings = async () => {
    const res = await fetch('/api/bookings');
    const data = await res.json();
    setBookings(data);
  };

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

  const handleFilter = (type) => {
    setSelectedType(type);
    setFilteredBikes(type ? bikes.filter(b => b.type === type) : bikes);
  };

  const handleCardClick = (bike) => {
    const name = `${bike.name} ${bike.modelYear}`;
    setSelectedBike(bike);
    setForm({ ...form, bike: name });
    setUnavailableDates(getUnavailableDates(name));
    setModalOpen(true);
  };

  const handleClose = () => {
    setModalOpen(false);
    setSelectedBike(null);
    setLicenseFile(null);
    setPassportFile(null);
    setStatusMessage('');
    setForm({
      firstName: '', lastName: '', startDateTime: '', numberOfDays: '', bike: '', insurance: false, provideDocsInOffice: false
    });
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

  return (
    <div style={{ padding: '2rem' }}>
      <Typography variant="h4" style={{ color: 'white', marginBottom: '1rem' }}>Explore Our Bikes</Typography>
      <Typography variant="body1" style={{ color: 'gray', marginBottom: '2rem' }}>All our bikes are ready for adventure.</Typography>

      <Stack direction="row" spacing={3} justifyContent="center" sx={{ mb: 4 }}>
        {bikeTypes.map(({ label, icon }) => (
          <IconButton key={label} onClick={() => handleFilter(label)} sx={{
            borderRadius: '50%', backgroundColor: selectedType === label ? '#90caf9' : '#333',
            color: 'white', width: 70, height: 70, '&:hover': { backgroundColor: '#555' },
          }}>
            <Box display="flex" flexDirection="column" alignItems="center">
              {icon}
              <Typography variant="caption" sx={{ mt: 0.5, fontSize: '0.65rem' }}>{label}</Typography>
            </Box>
          </IconButton>
        ))}
      </Stack>

      <Grid container spacing={4}>
        {filteredBikes.map((bike) => (
          <Grid item xs={12} sm={6} md={4} key={bike._id}>
            <Card onClick={() => handleCardClick(bike)} style={{ cursor: 'pointer', borderRadius: '15px' }} elevation={6}>
              <CardMedia component="img" height="220" image={bike.signedImageUrl || '/images/bike_placeholder.jpg'} alt={`${bike.name} ${bike.modelYear}`} />
              <CardContent>
                <Typography variant="h6">{bike.name} {bike.modelYear}</Typography>
                <Typography variant="body2" color="textSecondary">{bike.km} km driven</Typography>
                <Typography variant="caption" color="textSecondary">{bike.type}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Modal open={modalOpen} onClose={handleClose} closeAfterTransition>
        <Fade in={modalOpen}>
          <Box sx={modalStyle}>
            {selectedBike && (
              <>
                <Typography variant="h5">{selectedBike.name} {selectedBike.modelYear}</Typography>

                <Box mt={3} display="grid" gap={2}>
                  <Box display="flex" gap={2} flexDirection={{ xs: 'column', sm: 'row' }}>
                    <WhiteInput label="First Name" fullWidth value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
                    <WhiteInput label="Last Name" fullWidth value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
                  </Box>
                  <Box display="flex" gap={2} flexDirection={{ xs: 'column', sm: 'row' }}>
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
                  </Box>

                  {/* Updated Boolean Toggles */}
                  <Box display="flex" flexDirection="column" gap={2}>
                    <Box>
                      <Typography sx={{ mb: 0.5 }}>Upgrade Insurance:</Typography>
                      <Box display="flex" gap={2}>
                        <Typography
                          sx={{ cursor: 'pointer', color: form.insurance ? 'white' : 'gray', textDecoration: form.insurance ? 'underline' : 'none', textUnderlineOffset: '4px' }}
                          onClick={() => setForm({ ...form, insurance: true })}
                        >Yes</Typography>
                        <Typography
                          sx={{ cursor: 'pointer', color: !form.insurance ? 'white' : 'gray', textDecoration: !form.insurance ? 'underline' : 'none', textUnderlineOffset: '4px' }}
                          onClick={() => setForm({ ...form, insurance: false })}
                        >No</Typography>
                      </Box>
                    </Box>

                    <Box>
                      <Typography sx={{ mb: 0.5 }}>Provide Docs in Office:</Typography>
                      <Box display="flex" gap={2}>
                        <Typography
                          sx={{ cursor: 'pointer', color: form.provideDocsInOffice ? 'white' : 'gray', textDecoration: form.provideDocsInOffice ? 'underline' : 'none', textUnderlineOffset: '4px' }}
                          onClick={() => setForm({ ...form, provideDocsInOffice: true })}
                        >Yes</Typography>
                        <Typography
                          sx={{ cursor: 'pointer', color: !form.provideDocsInOffice ? 'white' : 'gray', textDecoration: !form.provideDocsInOffice ? 'underline' : 'none', textUnderlineOffset: '4px' }}
                          onClick={() => setForm({ ...form, provideDocsInOffice: false })}
                        >No</Typography>
                      </Box>
                    </Box>
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
                    Per Day: ฿{selectedBike.perDay} | Per Week: ฿{selectedBike.perWeek} | Per Month: ฿{selectedBike.perMonth}
                  </Typography>

                  <Button variant="contained" color="primary" onClick={handleSubmit}>CONFIRM BOOKING</Button>
                  {statusMessage && <Typography color="error">{statusMessage}</Typography>}
                </Box>
              </>
            )}
          </Box>
        </Fade>
      </Modal>
    </div>
  );
}
