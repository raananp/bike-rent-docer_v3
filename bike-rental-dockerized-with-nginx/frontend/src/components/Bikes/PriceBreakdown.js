import React from 'react';
import { Typography } from '@mui/material';

export default function PriceBreakdown({ bike, days, insurance }) {
  const d = parseInt(days || 0);
  let price = 0;

  if (d >= 30) {
    price = bike.pricePerMonth * Math.floor(d / 30) + (d % 30 >= 7
      ? bike.pricePerWeek * Math.floor((d % 30) / 7)
      : bike.pricePerDay * (d % 7));
  } else if (d >= 7) {
    price = bike.pricePerWeek * Math.floor(d / 7) + bike.pricePerDay * (d % 7);
  } else {
    price = bike.pricePerDay * d;
  }

  if (insurance) price += 100 * d;

  return (
    <div>
      <Typography variant="subtitle1">Price Breakdown:</Typography>
      <Typography variant="body2">Base Price: {price} THB</Typography>
      {insurance && <Typography variant="body2">+ Insurance: {100 * d} THB</Typography>}
      <Typography variant="h6" sx={{ mt: 1 }}>Total: {price} THB</Typography>
    </div>
  );
}