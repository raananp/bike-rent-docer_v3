import React, { useEffect, useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Modal,
  Box,
  Button,
} from '@mui/material';

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: '#1a1a1a',
  color: 'white',
  borderRadius: '8px',
  boxShadow: 24,
  p: 4,
};

export default function Bikes() {
  const [bikes, setBikes] = useState([]);
  const [selectedBike, setSelectedBike] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchBikes = async () => {
    try {
      const res = await fetch('/api/bikes');
      const data = await res.json();
      setBikes(data);
    } catch (error) {
      console.error('Failed to fetch bikes:', error);
    }
  };

  const handleCardClick = (bike) => {
    setSelectedBike(bike);
    setModalOpen(true);
  };

  const handleClose = () => {
    setModalOpen(false);
    setSelectedBike(null);
  };

  useEffect(() => {
    fetchBikes();
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <Typography variant="h4" style={{ color: 'white', marginBottom: '1rem' }}>
        Explore Our Bikes
      </Typography>
      <Typography variant="body1" style={{ color: 'gray', marginBottom: '2rem' }}>
        All our bikes are new, well-maintained, and ready for adventure. Perfect for your ride in Pattaya.
      </Typography>

      <Grid container spacing={4}>
        {bikes.map((bike) => (
          <Grid item xs={12} sm={6} md={4} key={bike._id}>
            <Card
              onClick={() => handleCardClick(bike)}
              style={{ cursor: 'pointer', borderRadius: '15px' }}
              elevation={6}
            >
              <CardMedia
                component="img"
                height="220"
                image={bike.imageUrl || '/images/bike_placeholder.jpg'}
                alt={`${bike.name} ${bike.modelYear}`}
              />
              <CardContent>
                <Typography variant="h6">
                  {bike.name} {bike.modelYear}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {bike.km} km driven
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Modal */}
      <Modal open={modalOpen} onClose={handleClose}>
        <Box sx={modalStyle}>
          {selectedBike && (
            <>
              <Typography variant="h6" gutterBottom>
                {selectedBike.name} {selectedBike.modelYear}
              </Typography>
              <Typography>Year: {selectedBike.modelYear}</Typography>
              <Typography>Kilometers: {selectedBike.km}</Typography>
              <Typography>Price:</Typography>
              <Typography>Per Day: ฿ {selectedBike.perDay}</Typography>
              <Typography>Per Week: ฿ {selectedBike.perWeek}</Typography>
              <Typography>Per Month: ฿ {selectedBike.perMonth}</Typography>
              <Box mt={2}>
                <Button variant="contained" fullWidth>
                  BOOK
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Modal>
    </div>
  );
}