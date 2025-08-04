// frontend/src/components/ScrollSection.js

import React from 'react';
import { Box, Typography } from '@mui/material';
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

const ScrollSection = ({ title, subtitles, image, reverse }) => {
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
          display: 'block',
        }}
      />
    </Box>
  );
};

export default ScrollSection;