import React, { useState, useContext } from 'react';
import {
  AppBar, Toolbar, Typography, Box, Button, Menu, MenuItem
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const navItems = ['Home', 'Bikes', 'Booking'];

const Navbar = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleAdminClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = (path) => {
    setAnchorEl(null);
    if (path) navigate(path);
  };

  const handleSignOut = () => {
    logout();
    navigate('/signin');
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        backgroundColor: 'transparent',
        boxShadow: 'none',
        px: 4,
        py: 1,
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Typography
          variant="h6"
          component={Link}
          to="/"
          sx={{
            color: '#fff',
            textDecoration: 'none',
            fontWeight: 600,
            letterSpacing: 1,
          }}
        >
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
                fontWeight: 500,
                textTransform: 'uppercase',
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

          {/* Admin Dropdown */}
          {user?.role === 'admin' && (
            <>
              <Button
                onClick={handleAdminClick}
                sx={{
                  color: '#fff',
                  mx: 1,
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    textShadow: '0 0 10px rgba(255,255,255,0.6)',
                  },
                }}
              >
                Admin
              </Button>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => handleMenuClose()}
                PaperProps={{
                  sx: {
                    mt: 1,
                    backgroundColor: '#333',
                    color: 'white',
                    borderRadius: 1,
                  },
                }}
              >
                <MenuItem onClick={() => handleMenuClose('/admin')}>Dashboard</MenuItem>
              </Menu>
            </>
          )}

          {/* Auth buttons */}
          {!user ? (
            <>
              <Button
                component={Link}
                to="/signin"
                sx={{ color: '#fff', mx: 1 }}
              >
                Sign In
              </Button>
              <Button
                component={Link}
                to="/signup"
                sx={{ color: '#fff', mx: 1 }}
              >
                Sign Up
              </Button>
            </>
          ) : (
            <Button
              onClick={handleSignOut}
              sx={{ color: '#fff', mx: 1 }}
            >
              Sign Out
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;