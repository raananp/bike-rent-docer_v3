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
  IconButton,
  Stack,
} from '@mui/material';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import ElectricMopedIcon from '@mui/icons-material/ElectricMoped';
import CommuteIcon from '@mui/icons-material/Commute'; // ✅ Available in v5.11.0

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

const bikeTypes = [
  { label: 'Speed Bike', icon: <CommuteIcon /> }, // replaces MotorcycleIcon
  { label: 'Cruiser', icon: <TwoWheelerIcon /> },
  { label: 'Scooter', icon: <ElectricMopedIcon /> },
];

export default function Bikes() {
  const [bikes, setBikes] = useState([]);
  const [filteredBikes, setFilteredBikes] = useState([]);
  const [selectedBike, setSelectedBike] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState(null);

  const fetchBikes = async () => {
    try {
      const res = await fetch('/api/bikes');
      const data = await res.json();
      setBikes(data);
      setFilteredBikes(data);
    } catch (error) {
      console.error('Failed to fetch bikes:', error);
    }
  };

  useEffect(() => {
    fetchBikes();
  }, []);

  const handleCardClick = (bike) => {
    setSelectedBike(bike);
    setModalOpen(true);
  };

  const handleClose = () => {
    setModalOpen(false);
    setSelectedBike(null);
  };

  const handleFilter = (type) => {
    setSelectedType(type);
    if (type === null) {
      setFilteredBikes(bikes);
    } else {
      const filtered = bikes.filter((bike) => bike.type === type);
      setFilteredBikes(filtered);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <Typography variant="h4" style={{ color: 'white', marginBottom: '1rem' }}>
        Explore Our Bikes
      </Typography>
      <Typography variant="body1" style={{ color: 'gray', marginBottom: '2rem' }}>
        All our bikes are new, well-maintained, and ready for adventure. Perfect for your ride in Pattaya.
      </Typography>

      {/* Round Icon Filters */}
      <Stack direction="row" spacing={3} justifyContent="center" sx={{ mb: 4 }}>
        {bikeTypes.map(({ label, icon }) => (
          <IconButton
            key={label}
            onClick={() => handleFilter(label)}
            sx={{
              borderRadius: '50%',
              backgroundColor: selectedType === label ? '#90caf9' : '#333',
              color: 'white',
              width: 70,
              height: 70,
              '&:hover': {
                backgroundColor: '#555',
              },
            }}
          >
            <Box display="flex" flexDirection="column" alignItems="center">
              {icon}
              <Typography variant="caption" sx={{ mt: 0.5, fontSize: '0.65rem' }}>
                {label}
              </Typography>
            </Box>
          </IconButton>
        ))}
        <IconButton
          onClick={() => handleFilter(null)}
          sx={{
            borderRadius: '50%',
            backgroundColor: selectedType === null ? '#90caf9' : '#333',
            color: 'white',
            width: 70,
            height: 70,
            '&:hover': {
              backgroundColor: '#555',
            },
          }}
        >
          <Box display="flex" flexDirection="column" alignItems="center">
            <Typography variant="h6">All</Typography>
          </Box>
        </IconButton>
      </Stack>

      {/* Bike Cards */}
      <Grid container spacing={4}>
        {filteredBikes.map((bike) => (
          <Grid item xs={12} sm={6} md={4} key={bike._id}>
            <Card
              onClick={() => handleCardClick(bike)}
              style={{ cursor: 'pointer', borderRadius: '15px' }}
              elevation={6}
            >
              <CardMedia
                component="img"
                height="220"
                image={bike.signedImageUrl || '/images/bike_placeholder.jpg'}
                alt={`${bike.name} ${bike.modelYear}`}
              />
              <CardContent>
                <Typography variant="h6">
                  {bike.name} {bike.modelYear}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {bike.km} km driven
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {bike.type}
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
              <Typography>Type: {selectedBike.type}</Typography>
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