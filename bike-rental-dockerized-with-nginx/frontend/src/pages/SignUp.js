import React, { useState, useContext } from 'react';
import { Box, TextField, Button, Typography, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function SignUp() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { loginWithToken } = useContext(AuthContext);

  const validate = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{6,}$/;

    if (!emailRegex.test(form.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!passwordRegex.test(form.password)) {
      newErrors.password =
        'Password must be at least 6 characters, include one uppercase letter and one special character';
    }

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

  return (
    <Box
      sx={{
        mt: 10,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        px: 2,
      }}
    >
      <Paper
        elevation={6}
        sx={{
          width: '100%',
          maxWidth: 500,
          p: 4,
          backgroundColor: '#1e1e1e',
          color: '#fff',
        }}
      >
        <Typography variant="h4" align="center" gutterBottom>
          Sign Up
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            name="email"
            label="Email"
            variant="outlined"
            value={form.email}
            onChange={handleChange}
            fullWidth
            margin="normal"
            error={!!errors.email}
            helperText={errors.email}
            InputLabelProps={{ style: { color: '#ccc' } }}
            InputProps={{ style: { color: '#fff' } }}
          />
          <TextField
            name="password"
            label="Password"
            type="password"
            variant="outlined"
            value={form.password}
            onChange={handleChange}
            fullWidth
            margin="normal"
            error={!!errors.password}
            helperText={errors.password}
            InputLabelProps={{ style: { color: '#ccc' } }}
            InputProps={{ style: { color: '#fff' } }}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2 }}
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Register'}
          </Button>
          <Typography variant="body2" sx={{ mt: 2, color: '#aaa' }}>
            Password must be at least 6 characters, include one uppercase letter, and one special character.
          </Typography>
        </form>
      </Paper>
    </Box>
  );
}

export default SignUp;