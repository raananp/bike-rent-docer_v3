import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography
} from '@mui/material';
import { AuthContext } from '../context/AuthContext';

export default function SignIn() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

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
    <Box sx={{ mt: 8, maxWidth: 400, mx: 'auto', color: 'white' }}>
      <Typography variant="h5" gutterBottom>Sign In</Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          margin="normal"
          label="Email"
          name="email"
          value={form.email}
          onChange={handleChange}
          InputLabelProps={{ style: { color: 'white' } }}
          inputProps={{ style: { color: 'white' } }}
          variant="standard"
        />
        <TextField
          fullWidth
          margin="normal"
          label="Password"
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          InputLabelProps={{ style: { color: 'white' } }}
          inputProps={{ style: { color: 'white' } }}
          variant="standard"
        />
        {error && <Typography color="error">{error}</Typography>}
        <Button type="submit" variant="outlined" fullWidth sx={{ mt: 2 }}>
          Login
        </Button>
      </form>
    </Box>
  );
}