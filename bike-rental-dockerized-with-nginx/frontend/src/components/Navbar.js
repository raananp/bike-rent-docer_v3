import React, { useState, useContext, useMemo, useEffect } from 'react';
import {
  AppBar, Toolbar, Typography, Box, Button, Menu, MenuItem, IconButton,
  Drawer, List, ListItem, ListItemText, Avatar, Divider, Badge
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { keyframes } from '@mui/system';
import { getMyBookings } from '../utils/api';

const navItems = ['Home', 'Bikes', 'Booking'];

/* Soft pulsing glow for the booking count */
const pulse = keyframes`
  0%   { transform: scale(1);   opacity: .45; }
  50%  { transform: scale(1.35); opacity: .1; }
  100% { transform: scale(1);   opacity: .45; }
`;

const Navbar = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // --- Booking count state ---
  const [bookingCount, setBookingCount] = useState(0);

  // Fetch count (once and then every 20s while signed in)
  useEffect(() => {
    let timer;
    const load = async () => {
      try {
        if (!user) {
          setBookingCount(0);
          return;
        }
        const data = await getMyBookings();
        setBookingCount(Array.isArray(data) ? data.length : 0);
      } catch {
        // keep last known
      }
    };
    load();
    if (user) {
      timer = setInterval(load, 20000);
    }
    return () => timer && clearInterval(timer);
  }, [user]);

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = (path) => {
    setAnchorEl(null);
    if (path) navigate(path);
  };

  const handleSignOut = () => {
    logout();
    navigate('/signin');
  };

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  const fullName = user?.firstName && user?.lastName
    ? `${user.firstName} ${user.lastName}`
    : (user?.email || 'Guest');

  const initials = useMemo(() => {
    const f = (user?.firstName || '').trim();
    const l = (user?.lastName || '').trim();
    if (f || l) return `${f[0] || ''}${l[0] || ''}`.toUpperCase();
    const e = (user?.email || '').trim();
    return e ? e[0].toUpperCase() : 'U';
  }, [user]);

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
        {navItems.map((item) => {
          const to = item === 'Home' ? '/' : `/${item.toLowerCase()}`;
          const isBooking = item === 'Booking';

          return (
            <ListItem
              button
              key={item}
              onClick={() => {
                navigate(to);
                setMobileOpen(false);
              }}
              sx={{ position: 'relative' }}
            >
              {/* Mobile: show small badge to the right */}
              <ListItemText primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#fff' }}>
                  {item}
                  {isBooking && bookingCount > 0 && (
                    <Box sx={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                      {/* glow ring */}
                      <Box
                        sx={{
                          position: 'absolute',
                          inset: -4,
                          borderRadius: '999px',
                          background: 'radial-gradient(40px 40px at center, rgba(80,200,255,0.35), rgba(80,200,255,0) 70%)',
                          animation: `${pulse} 2.4s ease-in-out infinite`,
                          pointerEvents: 'none',
                          filter: 'blur(2px)',
                        }}
                      />
                      <Box
                        sx={{
                          px: 1,
                          lineHeight: 1.4,
                          borderRadius: '999px',
                          fontSize: 12,
                          fontWeight: 700,
                          background: 'linear-gradient(180deg,#0ea5e9,#2563eb)',
                          color: '#fff',
                          border: '1px solid rgba(255,255,255,0.18)',
                          boxShadow: '0 4px 14px rgba(14,165,233,0.35)',
                        }}
                      >
                        {bookingCount}
                      </Box>
                    </Box>
                  )}
                </Box>
              } />
            </ListItem>
          );
        })}

        {user && (
          <>
            <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.12)' }} />
            <ListItem button onClick={() => { navigate('/settings'); setMobileOpen(false); }}>
              <ListItemText primary="Settings" sx={{ color: '#fff' }} />
            </ListItem>
          </>
        )}

        {user?.role === 'admin' && (
          <ListItem button onClick={() => { navigate('/admin'); setMobileOpen(false); }}>
            <ListItemText primary="Admin" sx={{ color: '#fff' }} />
          </ListItem>
        )}

        {user ? (
          <ListItem button onClick={() => { handleSignOut(); setMobileOpen(false); }}>
            <ListItemText primary="Sign Out" sx={{ color: '#fff' }} />
          </ListItem>
        ) : (
          <ListItem button onClick={() => { navigate('/signin'); setMobileOpen(false); }}>
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
            {navItems.map((item) => {
              const to = item === 'Home' ? '/' : `/${item.toLowerCase()}`;
              const isBooking = item === 'Booking';

              if (!isBooking) {
                return (
                  <Button
                    key={item}
                    component={Link}
                    to={to}
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
                );
              }

              // Booking: add glow badge behind/above
              return (
                <Box key={item} sx={{ position: 'relative', mx: 1 }}>
                  {/* Glow behind/above the word */}
                  {bookingCount > 0 && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -10,
                        right: -14,
                        width: 46,
                        height: 46,
                        borderRadius: '50%',
                        background: 'radial-gradient(40px 40px at center, rgba(14,165,233,0.45), rgba(14,165,233,0) 70%)',
                        filter: 'blur(6px)',
                        animation: `${pulse} 2.4s ease-in-out infinite`,
                        pointerEvents: 'none',
                      }}
                    />
                  )}
                  <Button
                    component={Link}
                    to={to}
                    sx={{
                      color: '#fff',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        textShadow: '0 0 10px rgba(255,255,255,0.6)',
                      },
                      pr: bookingCount > 0 ? 4 : 2,
                    }}
                  >
                    {/* Label + little count pill */}
                    <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 1 }}>
                      {item}
                      {bookingCount > 0 && (
                        <Box sx={{ position: 'relative' }}>
                          {/* tight glow right around the pill */}
                          <Box
                            sx={{
                              position: 'absolute',
                              inset: -3,
                              borderRadius: '999px',
                              background: 'radial-gradient(32px 32px at center, rgba(56,189,248,0.45), rgba(56,189,248,0) 70%)',
                              animation: `${pulse} 2.4s ease-in-out infinite`,
                              filter: 'blur(2px)',
                              pointerEvents: 'none',
                            }}
                          />
                          <Box
                            sx={{
                              px: 1,
                              lineHeight: 1.4,
                              borderRadius: '999px',
                              fontSize: 12,
                              fontWeight: 700,
                              background: 'linear-gradient(180deg,#0ea5e9,#2563eb)',
                              color: '#fff',
                              border: '1px solid rgba(255,255,255,0.18)',
                              boxShadow: '0 4px 14px rgba(14,165,233,0.35)',
                            }}
                          >
                            {bookingCount}
                          </Box>
                        </Box>
                      )}
                    </Box>
                  </Button>
                </Box>
              );
            })}

            {/* User Menu Icon */}
            <IconButton onClick={handleMenuOpen} sx={{ ml: 2 }}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: '#1976d2' }}>
                {initials}
              </Avatar>
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

              {user && (
                <MenuItem onClick={() => handleMenuClose('/settings')}>
                  Settings
                </MenuItem>
              )}

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