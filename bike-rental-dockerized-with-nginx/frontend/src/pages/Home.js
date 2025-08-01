import React, { useRef } from 'react';
import { Box, Typography } from '@mui/material';
import { motion, useScroll, useTransform } from 'framer-motion';

// Reusable section with title, multiple subtitle lines, and image
const ScrollSection = ({ title, subtitles, image, reverse }) => {
  const textRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: textRef,
    offset: ["start end", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.5, 1], [50, 0, -50]);

  const containerVariants = {
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
      ref={textRef}
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
        overflow: 'hidden',
      }}
    >
      {/* Text */}
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

        {subtitles.map((line, index) => (
          <motion.div key={index} variants={lineVariants}>
            <Typography variant="h6" color="white">
              {line}
            </Typography>
          </motion.div>
        ))}
      </motion.div>

      {/* Image */}
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
        subtitles={[
          'From sport to cruiser,',
          'we’ve got your dream ride.',
          'Book with confidence.',
        ]}
        image="/images/bike1.jpg"
      />
      <ScrollSection
        title="Book in Seconds"
        subtitles={[
          'Fast online booking',
          'with instant confirmation',
          'and real-time support.',
        ]}
        image="/images/bike2.jpg"
        reverse
      />
      <ScrollSection
        title="Explore Thailand"
        subtitles={[
          'Pickup and ride anywhere you want.',
          'Adventure starts here.',
          'No limits, just freedom.',
        ]}
        image="/images/bike3.jpg"
      />
    </Box>
  );
};

export default Home;
