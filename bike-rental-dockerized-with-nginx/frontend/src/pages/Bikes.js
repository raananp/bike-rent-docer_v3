import React, { useState } from 'react';
import { Container, Grid, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import BikeCard from '../components/BikeCard';
import BikeModal from '../components/BikeModal';

const dummyBikes = [
  {
    image: 'https://via.placeholder.com/400x240?text=Honda+650F',
    title: 'Honda 650F',
    description: 'Comfortable sport touring bike, perfect for exploring Pattaya with ease.',
    year: 2021,
    km: 12000,
    pricePerDay: 400,
    pricePerWeek: 2500,
    pricePerMonth: 8000,
  },
  {
    image: 'https://via.placeholder.com/400x240?text=Yamaha+MT-07',
    title: 'Yamaha MT-07',
    description: 'Agile and powerful naked bike with excellent torque and balance.',
    year: 2022,
    km: 8500,
    pricePerDay: 450,
    pricePerWeek: 2800,
    pricePerMonth: 8500,
  },
  {
    image: 'https://via.placeholder.com/400x240?text=Kawasaki+Z900',
    title: 'Kawasaki Z900',
    description: 'High-performance street fighter with bold styling and smooth ride.',
    year: 2023,
    km: 5000,
    pricePerDay: 500,
    pricePerWeek: 3200,
    pricePerMonth: 9500,
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
