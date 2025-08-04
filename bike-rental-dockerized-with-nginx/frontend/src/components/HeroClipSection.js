// 📁 frontend/src/components/HeroClipSection.js
import React from 'react';
import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';

const HeroClipSection = () => {
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
        flexDirection: { xs: 'column', md: 'row' },
        alignItems: 'center',
        justifyContent: 'space-between',
        px: { xs: 2, sm: 4, md: 6 },
        py: 10,
        gap: { xs: 4, md: 8 },
        backgroundColor: '#121212',
      }}
    >
      {/* Text Section */}
      <motion.div
        style={{ flex: 1, color: '#fff' }}
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, amount: 0.5 }}
      >
        <motion.div variants={lineVariants}>
          <Typography variant="h4" gutterBottom>
            Feel the Ride
          </Typography>
        </motion.div>

        {[
          'Experience motion like never before with our immersive video tours.',
          'Our bikes aren’t just for riding — they tell a story.',
          'Watch the thrill unfold and picture yourself on the journey.',
        ].map((line, idx) => (
          <motion.div key={idx} variants={lineVariants}>
            <Typography variant="h6">{line}</Typography>
          </motion.div>
        ))}
      </motion.div>

      {/* Video Section */}
      <motion.video
        src="/video/clip2.mp4"
        autoPlay
        muted
        loop
        playsInline
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

export default HeroClipSection;