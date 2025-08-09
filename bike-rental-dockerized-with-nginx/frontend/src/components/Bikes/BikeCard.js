import React from 'react';
import { Card, CardContent, CardMedia, Typography, Box } from '@mui/material';

export default function BikeCard({ bike, onClick }) {
  // Safe formatter for THB without decimals
  const thb = (n) =>
    new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(n || 0);

  return (
    <Card onClick={onClick} style={{ cursor: 'pointer', borderRadius: '15px' }} elevation={6}>
      <CardMedia
        component="img"
        height="220"
        image={bike.signedImageUrl || bike.imageUrl || '/images/bike_placeholder.jpg'}
        alt={`${bike.name} ${bike.modelYear}`}
      />
      <CardContent>
        {/* Title */}
        <Typography variant="h6" gutterBottom>
          {bike.name} {bike.modelYear}
        </Typography>

        {/* Prices */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Typography variant="body1">
            {thb(bike.perDay)} <Typography component="span" variant="body2" color="textSecondary">/ day</Typography>
          </Typography>
          <Typography variant="body2">
            {thb(bike.perWeek)} <Typography component="span" variant="caption" color="textSecondary">/ week</Typography>
          </Typography>
          <Typography variant="body2">
            {thb(bike.perMonth)} <Typography component="span" variant="caption" color="textSecondary">/ month</Typography>
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}