import React from 'react';
import { Card, CardContent, CardMedia, Typography } from '@mui/material';

export default function BikeCard({ bike, onClick }) {
  return (
    <Card onClick={onClick} style={{ cursor: 'pointer', borderRadius: '15px' }} elevation={6}>
      <CardMedia
        component="img"
        height="220"
        image={bike.signedImageUrl || '/images/bike_placeholder.jpg'}
        alt={`${bike.name} ${bike.modelYear}`}
      />
      <CardContent>
        <Typography variant="h6">{bike.name} {bike.modelYear}</Typography>
        <Typography variant="body2" color="textSecondary">{bike.km} km driven</Typography>
        <Typography variant="caption" color="textSecondary">{bike.type}</Typography>
      </CardContent>
    </Card>
  );
}