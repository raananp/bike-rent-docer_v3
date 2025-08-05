import React, { useState, useContext } from 'react';
import {
  AppBar, Toolbar, Typography, Box, Button, Menu, MenuItem, IconButton, Drawer, List, ListItem, ListItemText
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const navItems = ['Home', 'Bikes', 'Booking'];

const Navbar = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
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

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const fullName = user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : '';

  const drawer = (
    <Box sx={{ textAlign: 'center', px: 2, py: 4 }}>
      <Typography variant="h6" component={Link} to="/" sx={{ color: '#fff', textDecoration: 'none', mb: 2, display: 'block' }}>
        Pattaya Bike Rental
      </Typography>
      <List>
        {navItems.map((item) => (
          <ListItem button key={item} onClick={() => navigate(item === 'Home' ? '/' : `/${item.toLowerCase()}`)}>
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
        {/* Mobile Menu Button */}
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          onClick={handleDrawerToggle}
          sx={{ display: { sm: 'none' }, color: '#fff' }}
        >
          <MenuIcon />
        </IconButton>

        {/* Brand Logo */}
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

        {/* Desktop Menu */}
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

          {user && (
            <Typography sx={{ color: '#fff', mx: 2 }}>
              Welcome, <strong>{fullName}</strong>
            </Typography>
          )}

          {!user ? (
            <Button component={Link} to="/signin" sx={{ color: '#fff', mx: 1 }}>
              Sign In
            </Button>
          ) : (
            <Button onClick={handleSignOut} sx={{ color: '#fff', mx: 1 }}>
              Sign Out
            </Button>
          )}
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
  );
};

export default Navbar;