import React, { useState } from 'react';
import { Stack, TextField, Button, Typography, Checkbox, FormControlLabel } from '@mui/material';
import { WhiteInput } from './styles';
import PriceBreakdown from './PriceBreakdown';

export default function BookingForm({ bike, onClose }) {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    startDate: '',
    numberOfDays: '',
    insurance: false,
    provideDocsInOffice: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async () => {
    const response = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, bike: bike._id }),
    });
    if (response.ok) {
      onClose();
    }
  };

  return (
    <Stack spacing={2}>
      <Typography variant="h6">Book {bike.name}</Typography>

      <Stack direction="row" spacing={2}>
        <WhiteInput fullWidth name="firstName" label="First Name" value={form.firstName} onChange={handleChange} />
        <WhiteInput fullWidth name="lastName" label="Last Name" value={form.lastName} onChange={handleChange} />
      </Stack>

      <WhiteInput type="datetime-local" name="startDate" label="Start Date & Time"
        InputLabelProps={{ shrink: true }} value={form.startDate} onChange={handleChange} />

      <WhiteInput type="number" name="numberOfDays" label="Number of Days"
        value={form.numberOfDays} onChange={handleChange} />

      <FormControlLabel
        control={<Checkbox checked={form.insurance} onChange={handleChange} name="insurance" />}
        label="Upgrade Insurance"
      />

      <FormControlLabel
        control={<Checkbox checked={form.provideDocsInOffice} onChange={handleChange} name="provideDocsInOffice" />}
        label="Provide Docs in Office"
      />

      <PriceBreakdown bike={bike} days={form.numberOfDays} insurance={form.insurance} />

      <Button variant="contained" color="primary" onClick={handleSubmit}>
        Confirm Booking
      </Button>
    </Stack>
  );
}