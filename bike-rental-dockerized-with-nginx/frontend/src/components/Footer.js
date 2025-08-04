// frontend/src/components/Footer.js

import React from 'react';
import { Box, Typography, Grid } from '@mui/material';
import { motion } from 'framer-motion';

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

const Footer = () => (
  <Box
    sx={{
      padding: '40px 20px',
      borderTop: '1px solid #444',
      color: '#fff',
      backgroundColor: '#121212',
      width: '100%',
      overflowX: 'hidden',
    }}
  >
    <Grid container spacing={4} alignItems="flex-start">
      <Grid item xs={12} md={6}>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.3 }}
        >
          <motion.div variants={lineVariants}>
            <Typography variant="h6" gutterBottom>
              Contact Us
            </Typography>
          </motion.div>
          <motion.div variants={lineVariants}>
            <Typography>Email: info@bikerentthailand.com</Typography>
          </motion.div>
          <motion.div variants={lineVariants}>
            <Typography>Phone: +66 91 234 5678</Typography>
          </motion.div>
          <motion.div variants={lineVariants}>
            <Typography>Location: Pattaya, Thailand</Typography>
          </motion.div>
        </motion.div>
      </Grid>

      <Grid item xs={12} md={6}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          viewport={{ once: false, amount: 0.5 }}
        >
          <Box sx={{ width: '100%', overflow: 'hidden' }}>
            <iframe
              title="Google Maps Pattaya"
              src="https://maps.google.com/maps?q=pattaya&t=&z=13&ie=UTF8&iwloc=&output=embed"
              width="100%"
              height="250"
              style={{ border: 0, display: 'block' }}
              allowFullScreen=""
              loading="lazy"
            ></iframe>
          </Box>
        </motion.div>
      </Grid>
    </Grid>
  </Box>
);

export default Footer;