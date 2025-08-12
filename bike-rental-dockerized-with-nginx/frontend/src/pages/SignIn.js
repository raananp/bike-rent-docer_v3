// 📁 frontend/src/pages/SignIn.js
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, TextField, Button, Typography, InputAdornment, IconButton, Divider
} from '@mui/material';
import { Visibility, VisibilityOff, Lock, Person } from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';
import { setAuthToken } from '../utils/api';

export default function SignIn() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let token = null;

      if (typeof login === 'function') {
        try {
          const maybeToken = await login(form.email, form.password);
          if (typeof maybeToken === 'string') token = maybeToken;
        } catch {
          /* fall through to direct fetch */
        }
      }

      if (!token) {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: form.email, password: form.password }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.token) {
          throw new Error(data?.message || 'Invalid credentials');
        }
        token = data.token;
      }

      setAuthToken(token);
      navigate('/');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#000',         // ✅ page background stays black
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 2, sm: 4 },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          width: { xs: '100%', sm: '92%', md: '1000px' },
          borderRadius: '22px',
          overflow: 'hidden',
          // transparent wrapper — we’ll color only the right card area
          background: 'transparent',
          flexDirection: { xs: 'column', md: 'row' },
          boxShadow: '0 30px 80px rgba(0,0,0,0.45)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Left Welcome Section (unchanged background look) */}
        <Box
          sx={{
            flex: 1,
            // keep your blue accent but refined a bit
            background: 'radial-gradient(1200px 600px at -10% -10%, rgba(0,0,0,0.65) 20%, rgba(0,0,0,0) 40%), radial-gradient(circle at 30% 30%, #007BFF, #004b99)',
            color: '#fff',
            p: { xs: 3, sm: 5 },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-start',
            position: 'relative',
          }}
        >
          <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ letterSpacing: 1 }}>
            RIDE FREEDOM
          </Typography>
          <Typography variant="h6" fontWeight="light">
            Discover Pattaya on Two Wheels
          </Typography>
          <Typography mt={2} fontSize={14} sx={{ maxWidth: 520, opacity: 0.9 }}>
            Explore the city your way. Rent high‑quality motorbikes quickly and easily—wherever the road takes you.
          </Typography>

          {/* subtle soft circles */}
          <Box
            sx={{
              position: 'absolute',
              width: 120,
              height: 120,
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.06)',
              bottom: -30,
              left: 50,
              filter: 'blur(2px)',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              width: 160,
              height: 160,
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.05)',
              top: -40,
              left: -40,
              filter: 'blur(2px)',
            }}
          />
        </Box>

        {/* Right Sign‑In Card (only this gets the new gradient color) */}
        <Box
          sx={{
            flex: 1,
            p: { xs: 3, sm: 5 },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            // 🔹 sleek, gentle gradient just on the card
            background:
              'linear-gradient(145deg, rgba(26,28,32,0.92) 0%, rgba(18,20,24,0.96) 60%, rgba(13,15,18,0.98) 100%)',
            borderLeft: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ color: '#fff' }}>
            Sign in
          </Typography>
          <Typography variant="body2" mb={3} sx={{ color: 'rgba(255,255,255,0.75)' }}>
            Sign in to manage your bookings and hit the road in no time.
          </Typography>

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              margin="normal"
              placeholder="User Name"
              name="email"
              value={form.email}
              onChange={handleChange}
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person sx={{ color: 'rgba(255,255,255,0.9)' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiInputBase-input': { color: '#fff' },
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  borderRadius: '14px',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.18)' },
                  '&:hover fieldset': { borderColor: 'rgba(173,216,230,0.6)' },
                  '&.Mui-focused fieldset': { borderColor: '#63b3ff' },
                },
                '& .MuiInputBase-input::placeholder': { color: 'rgba(255,255,255,0.6)' },
              }}
            />

            <TextField
              fullWidth
              margin="normal"
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              name="password"
              value={form.password}
              onChange={handleChange}
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: 'rgba(255,255,255,0.9)' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword((s) => !s)} edge="end">
                      {showPassword ? (
                        <VisibilityOff sx={{ color: 'rgba(255,255,255,0.9)' }} />
                      ) : (
                        <Visibility sx={{ color: 'rgba(255,255,255,0.9)' }} />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiInputBase-input': { color: '#fff' },
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  borderRadius: '14px',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.18)' },
                  '&:hover fieldset': { borderColor: 'rgba(173,216,230,0.6)' },
                  '&.Mui-focused fieldset': { borderColor: '#63b3ff' },
                },
                '& .MuiInputBase-input::placeholder': { color: 'rgba(255,255,255,0.6)' },
              }}
            />

            {error && (
              <Typography color="error" mt={1}>
                {error}
              </Typography>
            )}

            <Button
              fullWidth
              variant="contained"
              type="submit"
              disabled={loading}
              sx={{
                mt: 3,
                py: 1.5,
                borderRadius: '14px',
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '16px',
                // glossy primary button
                background:
                  'linear-gradient(180deg, rgba(0,123,255,0.95) 0%, rgba(0,97,201,0.95) 100%)',
                boxShadow: '0 8px 20px rgba(0,123,255,0.35)',
                '&:hover': {
                  background:
                    'linear-gradient(180deg, rgba(0,140,255,1) 0%, rgba(0,110,225,1) 100%)',
                  boxShadow: '0 10px 24px rgba(0,123,255,0.45)',
                },
              }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>

            <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.08)' }}>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                or
              </Typography>
            </Divider>

            <Button
              fullWidth
              variant="outlined"
              type="button"
              onClick={() => navigate('/signup')}
              sx={{
                py: 1.5,
                borderRadius: '14px',
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '16px',
                color: '#63b3ff',
                borderColor: 'rgba(99,179,255,0.6)',
                backgroundColor: 'rgba(255,255,255,0.02)',
                '&:hover': {
                  borderColor: '#63b3ff',
                  backgroundColor: 'rgba(99,179,255,0.06)',
                },
              }}
            >
              Sign Up
            </Button>
          </form>
        </Box>
      </Box>
    </Box>
  );
}