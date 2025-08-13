// 📁 frontend/src/pages/SignIn.js
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, TextField, Button, Typography, InputAdornment, IconButton
} from '@mui/material';
import { Visibility, VisibilityOff, Lock, Person, Shield } from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';
import { setAuthToken, startIdleLogout } from '../utils/api';

export default function SignIn() {
  const { loginWithToken } = useContext(AuthContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  // MFA step
  const [step, setStep] = useState('login'); // 'login' | 'mfa'
  const [tempToken, setTempToken] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaError, setMfaError] = useState('');
  const [mfaLoading, setMfaLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // avoid focus churn / IME glitches
    setForm(prev => (prev[name] === value ? prev : { ...prev, [name]: value }));
  };

  const fetchProfileAndFinish = async (token) => {
    try {
      // hydrate context with real names
      const res = await fetch('/api/user/me', { headers: { Authorization: `Bearer ${token}` } });
      const user = await res.json().catch(() => ({}));
      // save token + idle timer
      setAuthToken(token);
      startIdleLogout({ idleMs: 5 * 60 * 1000 });
      // update context (names/email/role)
      if (typeof loginWithToken === 'function') {
        loginWithToken(token, user && user.id ? user : undefined);
      }
      navigate('/');
    } catch {
      // even if /me fails, at least store token and go home
      setAuthToken(token);
      startIdleLogout({ idleMs: 5 * 60 * 1000 });
      navigate('/');
    }
  };

  const onSubmitLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password }),
        credentials: 'include', // so refresh cookie sets on success too
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || data?.message || 'Invalid credentials');
      }

      // MFA required path
      if (data?.mfa_required && data?.tempToken) {
        setTempToken(data.tempToken);
        setStep('mfa');
        return;
      }

      // Normal login with access token
      if (data?.token) {
        await fetchProfileAndFinish(data.token);
        return;
      }

      throw new Error('Unexpected response from server');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const onSubmitMfa = async (e) => {
    e.preventDefault();
    setMfaError('');
    setMfaLoading(true);
    try {
      if (!mfaCode.trim()) throw new Error('Enter the 6‑digit code');

      const res = await fetch('/api/auth/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: mfaCode.trim(), tempToken }),
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.token) {
        throw new Error(data?.error || data?.message || 'MFA verification failed');
      }

      await fetchProfileAndFinish(data.token);
    } catch (err) {
      setMfaError(err.message || 'MFA verification failed');
    } finally {
      setMfaLoading(false);
    }
  };

  // ✅ inputs styled for dark (white text, subtle borders)
  const inputDark = {
    input: { color: '#fff' },
    '& .MuiOutlinedInput-root': {
      '& fieldset': { borderColor: '#444' },
      '&:hover fieldset': { borderColor: '#777' },
      '&.Mui-focused fieldset': { borderColor: '#9ecbff' },
      color: '#fff',
      backgroundColor: 'transparent'
    },
    '& .MuiInputLabel-root': { color: '#bbb' },
    '& .MuiFormHelperText-root': { color: '#bbb' },
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#000', // page stays black
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
          background: 'transparent', // let each side own its look
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        {/* Left side (brand) */}
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
            RIDE FREEDOM
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9 }}>
            Discover Pattaya on Two Wheels
          </Typography>
          <Typography mt={2} fontSize={14} sx={{ opacity: 0.85, maxWidth: 420 }}>
            Explore the city your way. Rent high‑quality motorbikes quickly and easily—wherever the road takes you.
          </Typography>
        </Box>

        {/* Right side (form / MFA) — now black with white text */}
        <Box
          sx={{
            flex: 1,
            p: { xs: 3, sm: 5 },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            bgcolor: '#000', // black background
            color: '#fff',   // default text color
          }}
        >
          {step === 'login' ? (
            <>
              <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ color: '#fff' }}>
                Sign in
              </Typography>
              <Typography variant="body2" mb={3} sx={{ color: '#bbb' }}>
                Enter your credentials to continue.
              </Typography>

              <form onSubmit={onSubmitLogin}>
                <TextField
                  fullWidth
                  margin="normal"
                  placeholder="Email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  variant="outlined"
                  sx={inputDark}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person sx={{ color: '#fff' }} />
                      </InputAdornment>
                    ),
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
                  sx={inputDark}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock sx={{ color: '#fff' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(s => !s)} edge="end">
                          {showPassword ? (
                            <VisibilityOff sx={{ color: '#fff' }} />
                          ) : (
                            <Visibility sx={{ color: '#fff' }} />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
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
                    mt: 3, py: 1.5, borderRadius: 2,
                    textTransform: 'none', fontWeight: 'bold', fontSize: '16px',
                    background: 'linear-gradient(135deg, #004b99 0%, #005bcc 50%, #007bff 100%)',
                    boxShadow: '0 8px 24px rgba(0,123,255,0.35)',
                    '&:hover': { filter: 'brightness(1.02)' }
                  }}
                >
                  {loading ? 'Signing in…' : 'Sign in'}
                </Button>

                <Box sx={{ my: 2, textAlign: 'center', color: '#bbb' }}>or</Box>

                <Button
                  fullWidth
                  variant="outlined"
                  sx={{
                    py: 1.5, borderRadius: 2, fontWeight: 'bold', textTransform: 'none',
                    fontSize: '16px', borderColor: '#4aa3ff', color: '#4aa3ff',
                  }}
                  onClick={() => navigate('/signup')}
                  type="button"
                >
                  Sign Up
                </Button>
              </form>
            </>
          ) : (
            <>
              <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ color: '#fff' }}>
                Multi‑Factor Authentication
              </Typography>
              <Typography variant="body2" mb={3} sx={{ color: '#bbb' }}>
                Enter the 6‑digit code from your authenticator app.
              </Typography>

              <form onSubmit={onSubmitMfa}>
                <TextField
                  fullWidth
                  margin="normal"
                  placeholder="123456"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  variant="outlined"
                  sx={inputDark}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Shield sx={{ color: '#fff' }} />
                      </InputAdornment>
                    ),
                    inputProps: { inputMode: 'numeric', pattern: '[0-9]*', maxLength: 6 },
                  }}
                />

                {mfaError && (
                  <Typography color="error" mt={1}>
                    {mfaError}
                  </Typography>
                )}

                <Button
                  fullWidth
                  variant="contained"
                  type="submit"
                  disabled={mfaLoading}
                  sx={{
                    mt: 3, py: 1.5, borderRadius: 2,
                    textTransform: 'none', fontWeight: 'bold', fontSize: '16px',
                    background: 'linear-gradient(135deg, #004b99 0%, #005bcc 50%, #007bff 100%)',
                    boxShadow: '0 8px 24px rgba(0,123,255,0.35)',
                    '&:hover': { filter: 'brightness(1.02)' }
                  }}
                >
                  {mfaLoading ? 'Verifying…' : 'Verify & Continue'}
                </Button>

                <Button
                  fullWidth
                  variant="text"
                  sx={{ mt: 1.5, textTransform: 'none', color: '#9ecbff' }}
                  onClick={() => { setStep('login'); setMfaCode(''); setTempToken(''); setMfaError(''); }}
                  type="button"
                >
                  Back
                </Button>
              </form>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
}