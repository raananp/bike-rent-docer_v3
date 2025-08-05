// 📁 frontend/src/components/ScrollSection.js
import React from 'react';
import { Box, Typography, useTheme, useMediaQuery } from '@mui/material';

const ScrollSection = ({ title, subtitles, image, reverse = false }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : reverse ? 'row-reverse' : 'row',
        alignItems: 'center',
        justifyContent: 'center',
        py: 6,
        px: { xs: 2, sm: 4, md: 10 },
        gap: 4,
        flexWrap: 'wrap',
      }}
    >
      {/* Image Section */}
      <Box
        component="img"
        src={image}
        alt="bike"
        sx={{
          width: { xs: '100%', sm: '90%', md: '50%' },
          maxHeight: 400,
          objectFit: 'cover',
          borderRadius: 2,
          boxShadow: 3,
        }}
      />

      {/* Text Section */}
      <Box sx={{ flex: 1, textAlign: isMobile ? 'center' : 'left', color: 'white' }}>
        <Typography variant="h4" gutterBottom>
          {title}
        </Typography>
        {subtitles.map((line, index) => (
          <Typography key={index} variant="body1" sx={{ mb: 1.5 }}>
            • {line}
          </Typography>
        ))}
      </Box>
    </Box>
  );
};

export default ScrollSection;