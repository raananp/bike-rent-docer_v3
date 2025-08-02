import React, { useState } from 'react';
import { Container, Grid, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import BikeCard from '../components/BikeCard';
import BikeModal from '../components/BikeModal';

const dummyBikes = [
  {
    image: '/images/bike_cb650r.jpg',
    title: 'Honda CB650R E-Clutch',
    description: 'Sleek and stylish neo-sports café design with a revolutionary E-Clutch system for smooth riding in Pattaya.',
    year: 2023,
    km: 3200,
    pricePerDay: 550,
    pricePerWeek: 3300,
    pricePerMonth: 9800,
  },
  {
    image: '/images/bike_fatboy1.jpg',
    title: 'Harley-Davidson Fat Boy',
    description: 'Iconic American cruiser with bold looks and a powerful Milwaukee-Eight 114 engine for those who love to cruise in style.',
    year: 2022,
    km: 7400,
    pricePerDay: 700,
    pricePerWeek: 4500,
    pricePerMonth: 12500,
  },
  {
    image: '/images/bike_fatboy2.jpg',
    title: 'Harley-Davidson Fat Boy',
    description: 'Legendary heavyweight motorcycle delivering a muscular ride with modern comfort and premium finishes.',
    year: 2023,
    km: 3900,
    pricePerDay: 720,
    pricePerWeek: 4600,
    pricePerMonth: 12900,
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
      <Container sx={{ mt: 6, mb: 6 }}>
        <Typography variant="h4" gutterBottom>
          Explore Our Bikes
        </Typography>
        <Typography variant="body1" sx={{ mb: 4 }}>
          All our bikes are new, well-maintained, and ready for adventure. Perfect for your ride in Pattaya.
        </Typography>

        <Grid container spacing={4}>
          {dummyBikes.map((bike, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <div onClick={() => handleCardClick(bike)}>
                <BikeCard {...bike} />
              </div>
            </Grid>
          ))}
        </Grid>

        {/* Modal */}
        <BikeModal bike={selectedBike} onClose={handleCloseModal} />
      </Container>
    </motion.div>
  );
}

export default Bikes;
