import React, { useState } from 'react';
import { Container, Grid, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import BikeCard from '../components/BikeCard';
import BikeModal from '../components/BikeModal';

const dummyBikes = [
  {
    image: '/images/bike2.jpg',
    title: 'Honda CB650R E-Clutch',
    description: 'Smooth power delivery with modern tech. Perfect for city and touring.',
    year: 2023,
    km: 3000,
    pricePerDay: 500,
    pricePerWeek: 3200,
    pricePerMonth: 9800,
  },
  {
    image: '/images/bike_h1.jpg',
    title: 'Harley Davidson Fat Boy 2021',
    description: 'Iconic design and raw power. A true American cruiser experience.',
    year: 2021,
    km: 9500,
    pricePerDay: 600,
    pricePerWeek: 3900,
    pricePerMonth: 10500,
  },
  {
    image: '/images/bike_h2.jpg',
    title: 'Harley Davidson Fat Boy 1990',
    description: 'Classic heritage with deep rumble and head-turning looks.',
    year: 1990,
    km: 18000,
    pricePerDay: 450,
    pricePerWeek: 3000,
    pricePerMonth: 9000,
  },
];

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
};

function Bikes() {
  const [selectedBike, setSelectedBike] = useState(null);

  const handleCardClick = (bike) => {
    setSelectedBike(bike);
  };

  const handleCloseModal = () => {
    setSelectedBike(null);
  };

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
      <Container sx={{ mt: { xs: 4, md: 6 }, mb: { xs: 4, md: 6 }, px: { xs: 2, sm: 3 } }}>
        <Typography
          variant="h4"
          gutterBottom
          sx={{ textAlign: { xs: 'center', md: 'left' }, fontSize: { xs: '1.8rem', md: '2.2rem' } }}
        >
          Explore Our Bikes
        </Typography>

        <Typography
          variant="body1"
          sx={{ mb: 4, textAlign: { xs: 'center', md: 'left' }, fontSize: { xs: '0.95rem', md: '1rem' } }}
        >
          All our bikes are new, well-maintained, and ready for adventure. Perfect for your ride in Pattaya.
        </Typography>

        <Grid container spacing={4}>
          {dummyBikes.map((bike, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <div
                onClick={() => handleCardClick(bike)}
                style={{ cursor: 'pointer' }}
              >
                <BikeCard {...bike} />
              </div>
            </Grid>
          ))}
        </Grid>

        {/* Bike Details Modal */}
        <BikeModal bike={selectedBike} onClose={handleCloseModal} />
      </Container>
    </motion.div>
  );
}

export default Bikes;