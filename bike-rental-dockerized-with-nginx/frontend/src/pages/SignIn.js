// 📁 frontend/src/pages/SignIn.js
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff, Lock, Person } from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';

export default function SignIn() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(form.email, form.password);
      navigate('/admin');
    } catch (err) {
      console.error(err);
      setError('Invalid credentials');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#000',
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
          boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
          flexDirection: { xs: 'column', md: 'row' },
          backgroundColor: '#fff',
        }}
      >
        {/* Left Welcome Section */}
        <Box
          sx={{
            flex: 1,
            background: 'radial-gradient(circle at 30% 30%, #007BFF, #004b99)',
            color: '#fff',
            p: { xs: 3, sm: 5 },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-start',
            position: 'relative',
          }}
        >
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            RIDE FREEDOM
          </Typography>
          <Typography variant="h6" fontWeight="light">
            Discover Pattaya on Two Wheels
          </Typography>
          <Typography mt={2} fontSize={14}>
            Explore the city your way. Rent high-quality motorbikes quickly and easily — wherever the road takes you.
          </Typography>

          {/* Decorative Circles */}
          <Box
            sx={{
              position: 'absolute',
              width: 120,
              height: 120,
              borderRadius: '50%',
              backgroundColor: '#0066cc',
              bottom: -30,
              left: 50,
              opacity: 0.6,
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              width: 160,
              height: 160,
              borderRadius: '50%',
              backgroundColor: '#005bb5',
              top: -40,
              left: -40,
              opacity: 0.7,
            }}
          />
        </Box>

        {/* Right Sign-In Form Section */}
        <Box
          sx={{
            flex: 1,
            p: { xs: 3, sm: 5 },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Sign in
          </Typography>
          <Typography variant="body2" mb={3} color="text.secondary">
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
              inputProps={{ style: { color: 'black' } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person sx={{ color: 'black' }} />
                  </InputAdornment>
                ),
                style: { color: 'black' },
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: 'black' },
                  '&:hover fieldset': { borderColor: 'black' },
                  '&.Mui-focused fieldset': { borderColor: 'black' },
                },
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
              inputProps={{ style: { color: 'black' } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: 'black' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? (
                        <VisibilityOff sx={{ color: 'black' }} />
                      ) : (
                        <Visibility sx={{ color: 'black' }} />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
                style: { color: 'black' },
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: 'black' },
                  '&:hover fieldset': { borderColor: 'black' },
                  '&.Mui-focused fieldset': { borderColor: 'black' },
                },
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
              sx={{
                mt: 3,
                py: 1.5,
                borderRadius: 2,
                backgroundColor: '#004b99',
                textTransform: 'none',
                fontWeight: 'bold',
                fontSize: '16px',
              }}
            >
              Sign in
            </Button>

            <Box sx={{ my: 2, textAlign: 'center', color: 'gray' }}>or</Box>

            <Button
              fullWidth
              variant="outlined"
              sx={{
                py: 1.5,
                borderRadius: 2,
                fontWeight: 'bold',
                textTransform: 'none',
                fontSize: '16px',
                borderColor: '#004b99',
                color: '#004b99',
              }}
              onClick={() => navigate('/signup')}
            >
              Sign Up
            </Button>
          </form>
        </Box>
      </Box>
    </Box>
  );
}