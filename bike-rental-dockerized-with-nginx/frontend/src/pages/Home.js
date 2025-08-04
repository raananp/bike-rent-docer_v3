import React from 'react';
import { Box } from '@mui/material';
import { motion } from 'framer-motion';
import ScrollSection from '../components/ScrollSection';
import Footer from '../components/Footer';
import HeroClipSection from '../components/HeroClipSection'; // ✅ Import the Hero section

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
};

const Home = () => {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{ overflowX: 'hidden' }}
    >
      <Box sx={{ backgroundColor: '#121212', m: 0, p: 0, overflowX: 'hidden' }}>
        <HeroClipSection /> {/* ✅ Clip-style hero section */}

        <ScrollSection
          title="Ride in Style"
          subtitles={[
            'Choose from a wide range of premium motorcycles — cruisers, sport models, and more.',
            'All bikes are regularly serviced for optimal safety and performance.',
            'Helmet and safety gear included for all rentals at no extra cost.',
            'Flexible pricing for daily, weekly, or monthly rentals tailored to your needs.',
          ]}
          image="/images/bike_h3.jpg"
        />
        <ScrollSection
          title="Book in Seconds"
          subtitles={[
            'Enjoy a seamless booking process from any device — mobile or desktop.',
            'Instant booking confirmation with real-time availability updates.',
            'Easily upload your license and passport, and choose add-ons like insurance.',
            'Secure payments and 24/7 customer support you can count on.',
          ]}
          image="/images/bike_h1.jpg"
          reverse
        />
        <ScrollSection
          title="Explore Thailand"
          subtitles={[
            'From the beaches of Pattaya to the hills of Chiang Mai — ride with freedom.',
            'Our bikes are perfect for exploring off-the-beaten-path locations.',
            'We offer trip planning help, route tips, and GPS options upon request.',
            'Make your trip unforgettable with the best way to travel in Thailand.',
          ]}
          image="/images/bike3.jpg"
        />
        <Footer />
      </Box>
    </motion.div>
  );
};

export default Home;