import React from 'react';
import { Box, Typography, Grid } from '@mui/material';
import { motion } from 'framer-motion';

const ScrollSection = ({ title, subtitles, image, reverse }) => {
  const containerVariants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.3 },
    },
  };

  const lineVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: 'easeOut' },
    },
  };

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: '1400px',
        mx: 'auto',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: reverse ? { xs: 'column', md: 'row-reverse' } : { xs: 'column', md: 'row' },
        alignItems: 'center',
        justifyContent: 'space-between',
        px: { xs: 2, sm: 4, md: 6 },
        py: 10,
        gap: { xs: 4, md: 8 },
        backgroundColor: '#121212',
      }}
    >
      <motion.div
        style={{ flex: 1, color: '#fff' }}
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, amount: 0.5 }}
      >
        <motion.div variants={lineVariants}>
          <Typography variant="h4" gutterBottom>
            {title}
          </Typography>
        </motion.div>

        {subtitles.map((line, idx) => (
          <motion.div key={idx} variants={lineVariants}>
            <Typography variant="h6">{line}</Typography>
          </motion.div>
        ))}
      </motion.div>

      <motion.img
        src={image}
        alt={title}
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1 }}
        viewport={{ once: false, amount: 0.5 }}
        style={{
          flex: 1,
          width: '100%',
          maxWidth: '500px',
          borderRadius: '20px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        }}
      />
    </Box>
  );
};

const Footer = () => (
  <Box
    sx={{
      padding: '40px 20px',
      borderTop: '1px solid #444',
      color: '#fff',
    }}
  >
    <Grid container spacing={4} alignItems="flex-start">
      <Grid item xs={12} md={6}>
        <Typography variant="h6" gutterBottom>
          Contact Us
        </Typography>
        <Typography>Email: info@bikerentthailand.com</Typography>
        <Typography>Phone: +66 91 234 5678</Typography>
        <Typography>Location: Pattaya, Thailand</Typography>
      </Grid>
      <Grid item xs={12} md={6}>
        <iframe
          title="Google Maps Pattaya"
          src="https://maps.google.com/maps?q=pattaya&t=&z=13&ie=UTF8&iwloc=&output=embed"
          width="100%"
          height="250"
          style={{ border: 0 }}
          allowFullScreen=""
          loading="lazy"
        ></iframe>
      </Grid>
    </Grid>
  </Box>
);

const Home = () => {
  return (
    <Box sx={{ backgroundColor: '#121212', overflowX: 'hidden', m: 0, p: 0 }}>
      <ScrollSection
        title="Ride in Style"
        subtitles={['From sport to cruiser,', 'we’ve got your dream ride.', 'Book with confidence.']}
        image="/images/bike_h2.jpg"
      />
      <ScrollSection
        title="Book in Seconds"
        subtitles={['Fast online booking', 'with instant confirmation', 'and real-time support.']}
        image="/images/bike_h1.jpg"
        reverse
      />
      <ScrollSection
        title="Explore Thailand"
        subtitles={['Pickup and ride anywhere you want.', 'Adventure starts here.', 'No limits, just freedom.']}
        image="/images/bike3.jpg"
      />
      <Footer />
    </Box>
  );
};

export default Home;
