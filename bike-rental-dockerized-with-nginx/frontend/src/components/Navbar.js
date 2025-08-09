import React, { useState, useContext } from 'react';
import {
  AppBar, Toolbar, Typography, Box, Button, Menu, MenuItem, IconButton,
  Drawer, List, ListItem, ListItemText, Avatar
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircle from '@mui/icons-material/AccountCircle'; // (unused, but kept)
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const navItems = ['Home', 'Bikes', 'Booking'];

const Navbar = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleMenuOpen = (event) => {
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

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const fullName = user?.firstName && user?.lastName
    ? `${user.firstName} ${user.lastName}`
    : 'Guest';

  const drawer = (
    <Box sx={{ textAlign: 'center', px: 2, py: 4 }}>
      <Typography
        variant="h6"
        component={Link}
        to="/"
        sx={{ color: '#fff', textDecoration: 'none', mb: 2, display: 'block' }}
      >
        Pattaya Bike Rental
      </Typography>
      <List>
        {navItems.map((item) => (
          <ListItem
            button
            key={item}
            onClick={() => navigate(item === 'Home' ? '/' : `/${item.toLowerCase()}`)}
          >
            <ListItemText primary={item} sx={{ color: '#fff' }} />
          </ListItem>
        ))}
        {user?.role === 'admin' && (
          <ListItem button onClick={() => navigate('/admin')}>
            <ListItemText primary="Admin" sx={{ color: '#fff' }} />
          </ListItem>
        )}
        {user ? (
          <ListItem button onClick={handleSignOut}>
            <ListItemText primary="Sign Out" sx={{ color: '#fff' }} />
          </ListItem>
        ) : (
          <ListItem button onClick={() => navigate('/signin')}>
            <ListItemText primary="Sign In" sx={{ color: '#fff' }} />
          </ListItem>
        )}
      </List>
    </Box>
  );

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          backgroundColor: 'transparent',
          boxShadow: 'none',
          px: 2,
          py: 1,
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          {/* Mobile Menu */}
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={handleDrawerToggle}
            sx={{ display: { sm: 'none' }, color: '#fff' }}
          >
            <MenuIcon />
          </IconButton>

          {/* Brand */}
          <Typography
            variant="h6"
            component={Link}
            to="/"
            sx={{
              color: '#fff',
              textDecoration: 'none',
              fontWeight: 600,
              letterSpacing: 1,
              flexGrow: 1,
            }}
          >
            Pattaya Bike Rental
          </Typography>

          {/* Desktop Links */}
          <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center' }}>
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

            {/* User Menu Icon */}
            <IconButton onClick={handleMenuOpen} sx={{ ml: 2 }}>
              <Avatar sx={{ width: 32, height: 32 }} />
            </IconButton>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => handleMenuClose()}
              PaperProps={{
                sx: {
                  mt: 1,
                  backgroundColor: '#333',
                  color: '#fff',
                  borderRadius: 1,
                },
              }}
            >
              <MenuItem disabled>👤 {fullName}</MenuItem>
              {user?.role === 'admin' && (
                <MenuItem onClick={() => handleMenuClose('/admin')}>Admin Page</MenuItem>
              )}
              {!user ? (
                <MenuItem onClick={() => handleMenuClose('/signin')}>Sign In</MenuItem>
              ) : (
                <MenuItem onClick={handleSignOut}>Sign Out</MenuItem>
              )}
            </Menu>
          </Box>
        </Toolbar>

        {/* Mobile Drawer */}
        <Drawer
          anchor="left"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          PaperProps={{ sx: { backgroundColor: '#222', color: '#fff' } }}
          ModalProps={{ keepMounted: true }}
        >
          {drawer}
        </Drawer>
      </AppBar>

      {/* Spacer to offset the fixed AppBar height */}
      <Toolbar />
    </>
  );
};

export default Navbar;