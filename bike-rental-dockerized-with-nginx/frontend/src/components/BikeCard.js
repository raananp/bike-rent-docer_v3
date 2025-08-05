import React from 'react';
import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  Box,
} from '@mui/material';

function BikeCard({ image, title, description }) {
  return (
    <Card
      sx={{
        maxWidth: 400,
        borderRadius: 4,
        boxShadow: 4,
        transition: 'transform 0.3s ease',
        '&:hover': {
          transform: 'scale(1.03)',
        },
        cursor: 'pointer',
        mx: 'auto', // centers card on mobile
      }}
    >
      <CardMedia
        component="img"
        image={image}
        alt={title}
        sx={{
          height: { xs: 180, sm: 220 },
          objectFit: 'cover',
        }}
      />
      <CardContent sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 2.5 } }}>
        <Box>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
          >
            {title}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontSize: { xs: '0.85rem', sm: '0.95rem' } }}
          >
            {description}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

export default BikeCard;