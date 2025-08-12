// 📁 frontend/src/pages/SignUp.js
import React, { useState, useContext } from 'react';
import {
  Box, TextField, Button, Typography, InputAdornment, Grid, Card, CardContent, CardActions
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Lock, Person, Email } from '@mui/icons-material';
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined';

export default function SignUp() {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // When signup succeeds, we show the confirmation card
  const [awaitingVerify, setAwaitingVerify] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const navigate = useNavigate();
  const { loginWithToken } = useContext(AuthContext);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const next = {};
    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passRx  = /^(?=.*[A-Z])(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{6,}$/;

    if (!form.firstName.trim()) next.firstName = 'First name is required';
    if (!form.lastName.trim())  next.lastName  = 'Last name is required';
    if (!emailRx.test(form.email)) next.email  = 'Invalid email';
    if (!passRx.test(form.password))
      next.password = 'Min 6 chars, include 1 uppercase & 1 special char';

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || data?.error || 'Sign up failed');

      // Show “awaiting verification” card.
      setRegisteredEmail(form.email);
      setAwaitingVerify(true);
    } catch (err) {
      console.error('Sign up error:', err);
      setErrors(prev => ({ ...prev, _root: err.message || 'Sign up failed' }));
    } finally {
      setLoading(false);
    }
  };

  // DARK input style (white text & borders for black background)
  const darkInputStyles = {
    input: { color: 'white' },
    '& .MuiOutlinedInput-root': {
      '& fieldset': { borderColor: 'rgba(255,255,255,0.6)' },
      '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.9)' },
      '&.Mui-focused fieldset': { borderColor: '#fff' }
    },
    '& .MuiFormHelperText-root': { color: '#ff9090' },
    '& .MuiInputAdornment-root svg': { color: 'white' }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#000', // keep page background black
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 2, sm: 4 },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          width: { xs: '100%', sm: '90%', md: '900px' },
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: '0 20px 50px rgba(0,0,0,0.35)',
          flexDirection: { xs: 'column', md: 'row' },
          background: 'linear-gradient(135deg, #ffffff 0%, #f6f7fb 50%, #eef1f7 100%)',
        }}
      >
        {/* Left brand/info panel */}
        <Box
          sx={{
            flex: 1,
            background:
              'radial-gradient(1200px 400px at -10% 20%, rgba(0,123,255,0.22), transparent 50%),' +
              'radial-gradient(800px 300px at 120% 120%, rgba(0,75,153,0.18), transparent 50%),' +
              'linear-gradient(180deg, #0a0f1a 0%, #0a1830 100%)',
            color: '#fff',
            p: { xs: 3, sm: 5 },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            CREATE ACCOUNT
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9 }}>
            Join our riders community
          </Typography>
          <Typography mt={2} fontSize={14} sx={{ opacity: 0.85, maxWidth: 420 }}>
            Sign up to rent premium motorbikes in Pattaya and enjoy hassle‑free booking with full insurance options.
          </Typography>

          {/* Decorative shapes */}
          <Box sx={{
            position: 'absolute', width: 120, height: 120, borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(0,102,204,0.6), rgba(0,102,204,0.2))',
            bottom: -30, left: 50, filter: 'blur(1px)'
          }}/>
          <Box sx={{
            position: 'absolute', width: 160, height: 160, borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(0,91,181,0.6), rgba(0,91,181,0.2))',
            top: -40, left: -40, filter: 'blur(1px)'
          }}/>
        </Box>

        {/* Right panel (BLACK) */}
        <Box
          sx={{
            flex: 1,
            p: { xs: 3, sm: 5 },
            backgroundColor: '#121212', // 👈 black card
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {!awaitingVerify ? (
            <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', maxWidth: 420 }}>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                Sign up
              </Typography>
              <Typography variant="body2" mb={3} sx={{ color: 'rgba(255,255,255,0.8)' }}>
                Create your account to get started
              </Typography>

              {/* First & Last name on the same row */}
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="firstName"
                    placeholder="First Name"
                    fullWidth
                    value={form.firstName}
                    onChange={handleChange}
                    error={!!errors.firstName}
                    helperText={errors.firstName}
                    variant="outlined"
                    sx={darkInputStyles}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="lastName"
                    placeholder="Last Name"
                    fullWidth
                    value={form.lastName}
                    onChange={handleChange}
                    error={!!errors.lastName}
                    helperText={errors.lastName}
                    variant="outlined"
                    sx={darkInputStyles}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>

              <TextField
                name="email"
                placeholder="Email"
                fullWidth
                margin="normal"
                value={form.email}
                onChange={handleChange}
                error={!!errors.email}
                helperText={errors.email}
                variant="outlined"
                sx={darkInputStyles}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                name="password"
                type="password"
                placeholder="Password"
                fullWidth
                margin="normal"
                value={form.password}
                onChange={handleChange}
                error={!!errors.password}
                helperText={errors.password}
                variant="outlined"
                sx={darkInputStyles}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock />
                    </InputAdornment>
                  ),
                }}
              />

              {errors._root && (
                <Typography color="error" mt={1}>{errors._root}</Typography>
              )}

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading}
                sx={{
                  mt: 3, py: 1.5, borderRadius: 2,
                  textTransform: 'none', fontWeight: 'bold', fontSize: '16px',
                  background:
                    'linear-gradient(135deg, #004b99 0%, #005bcc 50%, #007bff 100%)',
                  boxShadow: '0 8px 24px rgba(0,123,255,0.35)',
                  '&:hover': { filter: 'brightness(1.02)' }
                }}
              >
                {loading ? 'Registering…' : 'Create account'}
              </Button>

              <Typography variant="body2" sx={{ mt: 2, color: 'rgba(255,255,255,0.8)' }}>
                Password must be at least 6 characters, include one uppercase letter, and one special character.
              </Typography>

              <Button
                fullWidth
                variant="text"
                sx={{ mt: 1.5, textTransform: 'none', color: 'rgba(255,255,255,0.9)' }}
                onClick={() => navigate('/signin')}
                type="button"
              >
                Already have an account? Sign in
              </Button>
            </Box>
          ) : (
            <Card
              elevation={0}
              sx={{
                width: '100%',
                maxWidth: 420,
                borderRadius: 3,
                background: '#1a1a1a',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.12)',
              }}
            >
              <CardContent sx={{ textAlign: 'center', p: 4 }}>
                <MarkEmailReadOutlinedIcon sx={{ fontSize: 48, color: '#3ea6ff', mb: 1 }} />
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Check your email
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)' }}>
                  We’ve sent a verification link to:
                </Typography>
                <Typography variant="subtitle1" sx={{ mt: 1 }}>
                  <strong>{registeredEmail}</strong>
                </Typography>
                <Typography variant="body2" sx={{ mt: 2, color: 'rgba(255,255,255,0.75)' }}>
                  Click the link to verify your address. You can then sign in.
                </Typography>
              </CardContent>
              <CardActions sx={{ p: 2, pt: 0, gap: 1, justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  onClick={() => window.open('https://mail.google.com', '_blank')}
                  sx={{
                    textTransform: 'none',
                    borderRadius: 2,
                    px: 2.5,
                    background:
                      'linear-gradient(135deg, #004b99 0%, #005bcc 50%, #007bff 100%)',
                  }}
                >
                  Open Email
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/signin')}
                  sx={{
                    textTransform: 'none',
                    borderRadius: 2,
                    px: 2.5,
                    color: 'white',
                    borderColor: 'rgba(255,255,255,0.3)',
                    '&:hover': { borderColor: 'rgba(255,255,255,0.6)' }
                  }}
                >
                  Back to Sign in
                </Button>
              </CardActions>
            </Card>
          )}
        </Box>
      </Box>
    </Box>
  );
}