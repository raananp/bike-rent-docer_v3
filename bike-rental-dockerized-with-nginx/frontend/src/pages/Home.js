import React, { useRef } from 'react';
import { Box, Typography } from '@mui/material';
import { motion, useScroll, useTransform } from 'framer-motion';

// Reusable section with text + image + scroll animation
const ScrollSection = ({ title, subtitle, image, reverse }) => {
  const textRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: textRef,
    offset: ["start end", "end start"]
  });

  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.5, 1], [50, 0, -50]);

  const containerVariants = {
    visible: {
      transition: {
        staggerChildren: 0.3,
      },
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
      ref={textRef}
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: reverse ? { xs: 'column', md: 'row-reverse' } : { xs: 'column', md: 'row' },
        alignItems: 'center',
        justifyContent: 'center',
        px: { xs: 2, md: 6 },
        py: 10,
        gap: 6,
        overflow: 'hidden',
      }}
    >
      {/* Text Section */}
      <motion.div
        style={{ flex: 1, opacity, y }}
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, amount: 0.5 }}
      >
        <motion.div variants={lineVariants}>
          <Typography variant="h4" color="white" gutterBottom>
            {title}
          </Typography>
        </motion.div>
        <motion.div variants={lineVariants}>
          <Typography variant="h6" color="white">
            {subtitle}
          </Typography>
        </motion.div>
      </motion.div>

      {/* Image Section */}
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

const Home = () => {
  return (
    <Box
      sx={{
        backgroundColor: '#121212',
        overflowX: 'hidden',
        m: 0,
        p: 0,
      }}
    >
      <ScrollSection
        title="Ride in Style"
        subtitle="From sport to cruiser, we’ve got your dream ride."
        image="/images/bike1.jpg"
      />
      <ScrollSection
        title="Book in Seconds"
        subtitle="Fast online booking with instant confirmation."
        image="/images/bike2.jpg"
        reverse
      />
      <ScrollSection
        title="Explore Thailand"
        subtitle="Pickup and ride anywhere you want. Adventure starts here."
        image="/images/bike3.jpg"
      />
    </Box>
  );
};

export default Home;