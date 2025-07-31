import React from 'react';
import { FullPage, Slide } from '@ap.cx/react-fullpage';
import { Box, Typography, Button } from '@mui/material';
import { motion } from 'framer-motion';

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8 } },
};

const FullpageHome = () => {
  return (
    <FullPage controls>
      <Slide>
        <Box
          sx={{
            height: '100vh',
            background: 'url(/images/bike1.jpg) center/cover no-repeat',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            color: '#fff',
            textShadow: '1px 1px 4px rgba(0,0,0,0.8)',
          }}
        >
          <motion.div variants={fadeInUp} initial="hidden" animate="visible">
            <Typography variant="h2" gutterBottom>Big Bike Rentals</Typography>
          </motion.div>
          <motion.div variants={fadeInUp} initial="hidden" animate="visible" transition={{ delay: 0.3 }}>
            <Typography variant="h5">Ride Pattaya in Style</Typography>
          </motion.div>
        </Box>
      </Slide>

      <Slide>
        <Box
          sx={{
            height: '100vh',
            background: 'url(/images/bike2.jpg) center/cover no-repeat',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: '#fff',
          }}
        >
          <motion.div variants={fadeInUp} initial="hidden" animate="visible">
            <Typography variant="h4" sx={{ backgroundColor: 'rgba(0,0,0,0.5)', p: 2, borderRadius: 2 }}>
              All Our Bikes Are Brand New & Fully Insured
            </Typography>
          </motion.div>
        </Box>
      </Slide>

      <Slide>
        <Box
          sx={{
            height: '100vh',
            background: 'url(/images/bike1.jpg) center/cover no-repeat',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            color: '#fff',
          }}
        >
          <motion.div variants={fadeInUp} initial="hidden" animate="visible">
            <Typography variant="h3" gutterBottom>Book Online, Pick Up & Ride</Typography>
          </motion.div>
          <motion.div variants={fadeInUp} initial="hidden" animate="visible" transition={{ delay: 0.3 }}>
            <Button variant="contained" color="primary" size="large">Book Now</Button>
          </motion.div>
        </Box>
      </Slide>
    </FullPage>
  );
};

export default FullpageHome;