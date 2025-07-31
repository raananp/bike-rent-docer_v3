import React from 'react';
import { Container, Grid, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import BikeCard from '../components/BikeCard';

const dummyBikes = [
  {
    image: 'https://via.placeholder.com/400x240?text=Honda+650F',
    title: 'Honda 650F',
    description: 'Comfortable sport touring bike, perfect for exploring Pattaya with ease.',
  },
  {
    image: 'https://via.placeholder.com/400x240?text=Yamaha+MT-07',
    title: 'Yamaha MT-07',
    description: 'Agile and powerful naked bike with excellent torque and balance.',
  },
  {
    image: 'https://via.placeholder.com/400x240?text=Kawasaki+Z900',
    title: 'Kawasaki Z900',
    description: 'High-performance street fighter with bold styling and smooth ride.',
  },
];

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
};

function Bikes() {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
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
              <BikeCard {...bike} />
            </Grid>
          ))}
        </Grid>
      </Container>
    </motion.div>
  );
}

export default Bikes;