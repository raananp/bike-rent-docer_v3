// 📁 frontend/src/pages/SignUp.js
import React, { useState, useContext } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  InputAdornment,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Lock, Person } from '@mui/icons-material';

function SignUp() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { loginWithToken } = useContext(AuthContext);

  const validate = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{6,}$/;

    if (!form.firstName) newErrors.firstName = 'First name is required';
    if (!form.lastName) newErrors.lastName = 'Last name is required';
    if (!emailRegex.test(form.email)) newErrors.email = 'Invalid email format';
    if (!passwordRegex.test(form.password))
      newErrors.password = 'Password must be at least 6 characters, include one uppercase letter and one special character';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
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

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('token', data.token);
        loginWithToken(data.token);
        navigate('/booking');
      } else {
        alert(data.message || 'Sign up failed');
      }
    } catch (err) {
      console.error('Sign up error:', err);
      alert('An error occurred during sign up.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyles = {
    input: { color: 'black' },
    '& .MuiOutlinedInput-root': {
      '& fieldset': { borderColor: 'black' },
      '&:hover fieldset': { borderColor: 'black' },
      '&.Mui-focused fieldset': { borderColor: 'black' }
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
            CREATE ACCOUNT
          </Typography>
          <Typography variant="h6" fontWeight="light">
            JOIN OUR RIDERS COMMUNITY
          </Typography>
          <Typography mt={2} fontSize={14}>
            Sign up to rent premium motorbikes in Pattaya and enjoy hassle-free booking with full insurance options.
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

        {/* Right Form Section */}
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
            Sign Up
          </Typography>
          <Typography variant="body2" mb={3} color="text.secondary">
            Create your account to get started
          </Typography>

          <form onSubmit={handleSubmit}>
            <TextField
              name="firstName"
              placeholder="First Name"
              fullWidth
              margin="normal"
              value={form.firstName}
              onChange={handleChange}
              error={!!errors.firstName}
              helperText={errors.firstName}
              variant="outlined"
              sx={inputStyles}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person sx={{ color: 'black' }} />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              name="lastName"
              placeholder="Last Name"
              fullWidth
              margin="normal"
              value={form.lastName}
              onChange={handleChange}
              error={!!errors.lastName}
              helperText={errors.lastName}
              variant="outlined"
              sx={inputStyles}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person sx={{ color: 'black' }} />
                  </InputAdornment>
                ),
              }}
            />

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
              sx={inputStyles}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person sx={{ color: 'black' }} />
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
              sx={inputStyles}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: 'black' }} />
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{
                mt: 3,
                py: 1.5,
                borderRadius: 2,
                backgroundColor: '#004b99',
                textTransform: 'none',
                fontWeight: 'bold',
                fontSize: '16px',
              }}
              disabled={loading}
            >
              {loading ? 'Registering...' : 'Register'}
            </Button>

            <Typography variant="body2" sx={{ mt: 2, color: '#555' }}>
              Password must be at least 6 characters, include one uppercase letter, and one special character.
            </Typography>
          </form>
        </Box>
      </Box>
    </Box>
  );
}

export default SignUp;