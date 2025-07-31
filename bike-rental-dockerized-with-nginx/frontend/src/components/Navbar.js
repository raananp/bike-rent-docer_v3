import React from 'react';
import { AppBar, Toolbar, Typography, Box, Button } from '@mui/material';
import { Link } from 'react-router-dom';

const navItems = ['Home', 'Bikes', 'Booking', 'Contact'];

const Navbar = () => {
  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        backgroundColor: '#000',
        backdropFilter: 'blur(10px)',
        px: 4,
        py: 1,
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Typography variant="h6" component={Link} to="/" sx={{ color: '#fff', textDecoration: 'none' }}>
          Pattaya Bike Rental
        </Typography>
        <Box>
          {navItems.map((item) => (
            <Button
              key={item}
              component={Link}
              to={item === 'Home' ? '/' : `/${item.toLowerCase()}`}
              sx={{
                color: '#fff',
                mx: 1,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  textShadow: '0 0 10px rgba(255,255,255,0.6)',
                },
              }}
            >
              {item}
            </Button>
          ))}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;