import React, { useEffect, useState } from 'react';
import { Grid, Typography, Stack, IconButton, Box } from '@mui/material';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import ElectricMopedIcon from '@mui/icons-material/ElectricMoped';
import CommuteIcon from '@mui/icons-material/Commute';
import BikeCard from '../components/Bikes/BikeCard';
import BikeModal from '../components/Bikes/BikeModal';

const bikeTypes = [
  { label: 'Speed Bike', icon: <CommuteIcon /> },
  { label: 'Cruiser', icon: <TwoWheelerIcon /> },
  { label: 'Scooter', icon: <ElectricMopedIcon /> },
];

// Safe fetch helper that won't crash on HTML error pages (e.g., nginx 502)
async function safeJsonFetch(url, options = {}) {
  const res = await fetch(url, options);
  const ct = res.headers.get('content-type') || '';
  const text = await res.text(); // read once
  if (!res.ok) {
    const snippet = text.slice(0, 300);
    throw new Error(`HTTP ${res.status}: ${snippet}`);
  }
  return ct.includes('application/json') ? JSON.parse(text) : text;
}

export default function Bikes() {
  const [bikes, setBikes] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [filteredBikes, setFilteredBikes] = useState([]);
  const [selectedBike, setSelectedBike] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState(null);

  useEffect(() => {
    fetchBikes();
    fetchBookings();
  }, []);

  const fetchBikes = async () => {
    try {
      const data = await safeJsonFetch('/api/bikes');
      setBikes(data);
      setFilteredBikes(data);
    } catch (err) {
      console.error('Failed to load /api/bikes:', err.message);
      setBikes([]);
      setFilteredBikes([]);
    }
  };

  // For availability we still pull all bookings (public) as your backend returns.
  // If you later lock this down, switch to a public availability endpoint.
  const fetchBookings = async () => {
    try {
      const data = await safeJsonFetch('/api/bookings');
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load /api/bookings:', err.message);
      setBookings([]);
    }
  };

  const handleCardClick = (bike) => {
    setSelectedBike(bike);
    setModalOpen(true);
  };

  const handleFilter = (type) => {
    setSelectedType(type);
    setFilteredBikes(type ? bikes.filter((b) => b.type === type) : bikes);
  };

  return (
    <Box padding="2rem">
      <Typography variant="h4" sx={{ color: 'white', mb: 1 }}>
        Explore Our Bikes
      </Typography>
      <Typography variant="body1" sx={{ color: 'gray', mb: 4 }}>
        All our bikes are ready for adventure.
      </Typography>

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
              '&:hover': { backgroundColor: '#555' },
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
      </Stack>

      <Grid container spacing={4}>
        {filteredBikes.map((bike) => (
          <Grid item xs={12} sm={6} md={4} key={bike._id}>
            <BikeCard bike={bike} onClick={() => handleCardClick(bike)} />
          </Grid>
        ))}
      </Grid>

      <BikeModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        bike={selectedBike}
        bookings={bookings}
        fetchBookings={fetchBookings}
      />
    </Box>
  );
}