// frontend/src/pages/VerifyEmail.jsx
import React, { useEffect, useState, useContext, useRef } from 'react';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { setAuthToken, startIdleLogout } from '../utils/api';
import { AuthContext } from '../context/AuthContext';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const { loginWithToken } = useContext(AuthContext);
  const [state, setState] = useState({ loading: true, ok: false, message: '' });

  // 👇 prevents double-call in React Strict Mode
  const didRun = useRef(false);

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    if (!tokenParam) {
      setState({ loading: false, ok: false, message: 'Missing token' });
      return;
    }

    (async () => {
      try {
        const res = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(tokenParam)}`);
        const data = await res.json().catch(() => ({}));

        if (!res.ok || !data?.token) {
          // If we already succeeded (another tab/click) just show a friendly state
          setState({
            loading: false,
            ok: false,
            message: data?.error || data?.message || 'This verification link has already been used.',
          });
          return;
        }

        setAuthToken(data.token);
        startIdleLogout({ idleMs: 5 * 60 * 1000 });
        try {
          if (typeof loginWithToken === 'function') {
            loginWithToken(data.token, data.user);
          }
        } catch {}

        setState({ loading: false, ok: true, message: 'Email verified! Redirecting…' });
        setTimeout(() => navigate('/'), 1200);
      } catch {
        setState({ loading: false, ok: false, message: 'Network error' });
      }
    })();
  }, [navigate, loginWithToken]);

  if (state.loading) {
    return (
      <Box sx={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Box sx={{ p: 4, borderRadius: 2, bgcolor: '#111', border: '1px solid #222', textAlign: 'center' }}>
        <Typography variant="h5" sx={{ color: state.ok ? 'lightgreen' : '#ff8080', mb: 1 }}>
          {state.ok ? 'Email Verified' : 'Verification Link'}
        </Typography>
        <Typography sx={{ color: '#ddd', mb: 3 }}>
          {state.ok ? state.message : (state.message || 'This link may already have been used. Try signing in.')}
        </Typography>
        {!state.ok && (
          <Button variant="contained" href="/signin">Go to Sign in</Button>
        )}
      </Box>
    </Box>
  );
}