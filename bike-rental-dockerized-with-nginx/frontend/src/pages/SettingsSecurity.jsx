// frontend/src/pages/SettingsSecurity.jsx
import React, { useEffect, useState, useContext } from 'react';
import {
  Box, Card, CardContent, CardActions, Typography, Button, TextField,
  Grid, Divider, InputAdornment, Alert
} from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { AuthContext } from '../context/AuthContext';
import {
  startIdleLogout,
  getProfile,
  mfaSetup,
  mfaConfirm,
  mfaDisable,
  changePassword as apiChangePassword,
  privacyPurgeDocs
} from '../utils/api';

export default function SettingsSecurity() {
  const { user } = useContext(AuthContext);

  // MFA
  const [mfaState, setMfaState] = useState({ enabled: !!user?.mfaEnabled, qr: '', otpauth: '' });
  const [mfaCode, setMfaCode] = useState('');
  const [mfaBusy, setMfaBusy] = useState(false);
  const [mfaMsg, setMfaMsg] = useState('');

  // Password
  const [pwdBusy, setPwdBusy] = useState(false);
  const [pwdMsg, setPwdMsg] = useState('');
  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' });

  // Data / privacy
  const [reqBusy, setReqBusy] = useState(false);
  const [reqMsg, setReqMsg] = useState('');

  useEffect(() => {
    // refresh idle timer when entering settings
    startIdleLogout({ idleMs: 5 * 60 * 1000 });

    // Load current profile to know real MFA state
    (async () => {
      try {
        const me = await getProfile();
        setMfaState(s => ({ ...s, enabled: !!me?.mfaEnabled }));
      } catch {
        // non-fatal
      }
    })();
  }, []);

  // --- MFA flows ---
  const startMfaSetupHandler = async () => {
    try {
      setMfaBusy(true);
      setMfaMsg('');
      const data = await mfaSetup(); // { otpauth, qrDataUrl }
      setMfaState(s => ({ ...s, qr: data.qrDataUrl, otpauth: data.otpauth, enabled: false }));
    } catch (e) {
      setMfaMsg(e.message || 'Failed to start MFA');
    } finally {
      setMfaBusy(false);
    }
  };

  const confirmMfaHandler = async () => {
    try {
      setMfaBusy(true);
      setMfaMsg('');
      if (!mfaCode.trim()) throw new Error('Enter the 6-digit code');
      await mfaConfirm(mfaCode.trim());
      setMfaState(s => ({ ...s, enabled: true, qr: '', otpauth: '' }));
      setMfaCode('');
      setMfaMsg('MFA enabled.');
    } catch (e) {
      setMfaMsg(e.message || 'Failed to confirm MFA');
    } finally {
      setMfaBusy(false);
    }
  };

  const disableMfaHandler = async () => {
    try {
      setMfaBusy(true);
      setMfaMsg('');
      await mfaDisable();
      setMfaState({ enabled: false, qr: '', otpauth: '' });
      setMfaCode('');
      setMfaMsg('MFA disabled.');
    } catch (e) {
      setMfaMsg(e.message || 'Failed to disable MFA');
    } finally {
      setMfaBusy(false);
    }
  };

  // --- Password change ---
  const changePasswordHandler = async () => {
    try {
      setPwdBusy(true);
      setPwdMsg('');
      if (!pwd.current || !pwd.next || !pwd.confirm) throw new Error('Fill all fields');
      if (pwd.next !== pwd.confirm) throw new Error('New passwords do not match');
      await apiChangePassword(pwd.current, pwd.next); // PATCH /api/auth/change-password
      setPwd({ current: '', next: '', confirm: '' });
      setPwdMsg('Password changed.');
    } catch (e) {
      setPwdMsg(e.message || 'Failed to change password');
    } finally {
      setPwdBusy(false);
    }
  };

  // --- Privacy request ---
  const requestDocDeletion = async () => {
    try {
      setReqBusy(true);
      setReqMsg('');
      await privacyPurgeDocs(); // POST /api/user/privacy/purge-docs
      setReqMsg('Request received. We’ll remove your passport/license images once the rental is closed.');
    } catch (e) {
      setReqMsg(e.message || 'Failed to send request');
    } finally {
      setReqBusy(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', p: { xs: 2, md: 4 } }}>
      <Typography variant="h4" sx={{ color: '#fff', mb: 2 }}>Settings</Typography>
      <Typography variant="body2" sx={{ color: '#9fb3c8', mb: 4 }}>
        Manage your account security and privacy.
      </Typography>

      <Grid container spacing={3}>
        {/* MFA Card */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 2, bgcolor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <SecurityIcon sx={{ color: '#b2fab4' }} />
                <Typography variant="h6" sx={{ color: '#fff' }}>Multi‑factor Authentication (TOTP)</Typography>
              </Box>
              <Typography variant="body2" sx={{ color: '#90a4ae', mb: 2 }}>
                Use an authenticator app (Google Authenticator, Authy, 1Password) for a 6‑digit code.
              </Typography>

              {mfaMsg && (
                <Alert
                  severity={
                    mfaMsg.toLowerCase().includes('enabled') ? 'success'
                    : mfaMsg.toLowerCase().includes('disabled') ? 'warning'
                    : 'info'
                  }
                  sx={{ mb: 2 }}
                >
                  {mfaMsg}
                </Alert>
              )}

              {!mfaState.enabled && !mfaState.qr && (
                <Button variant="contained" disabled={mfaBusy} onClick={startMfaSetupHandler}>
                  {mfaBusy ? 'Starting…' : 'Start setup'}
                </Button>
              )}

              {!mfaState.enabled && mfaState.qr && (
                <>
                  <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.1)' }} />
                  <Typography variant="subtitle2" sx={{ color: '#e0e0e0', mb: 1 }}>
                    1) Scan this QR with your authenticator app:
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                    <img src={mfaState.qr} alt="MFA QR Code" style={{ width: 180, height: 180 }} />
                  </Box>
                  <Typography variant="subtitle2" sx={{ color: '#e0e0e0', mb: 1 }}>
                    2) Enter the 6‑digit code:
                  </Typography>
                  <TextField
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value)}
                    placeholder="123456"
                    size="small"
                    sx={{
                      mb: 2,
                      input: { color: '#fff' },
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                        '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.6)' },
                        '&.Mui-focused fieldset': { borderColor: '#fff' },
                      },
                    }}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">🔒</InputAdornment>,
                    }}
                  />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button variant="contained" disabled={mfaBusy} onClick={confirmMfaHandler}>
                      {mfaBusy ? 'Confirming…' : 'Confirm & Enable'}
                    </Button>
                    <Button
                      variant="text"
                      disabled={mfaBusy}
                      onClick={() => setMfaState({ enabled: false, qr: '', otpauth: '' })}
                    >
                      Cancel
                    </Button>
                  </Box>
                </>
              )}

              {mfaState.enabled && (
                <>
                  <Alert severity="success" sx={{ my: 2 }}>MFA is enabled on your account.</Alert>
                  <Button variant="outlined" color="warning" disabled={mfaBusy} onClick={disableMfaHandler}>
                    {mfaBusy ? 'Disabling…' : 'Disable MFA'}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Change Password */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 2, bgcolor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <VpnKeyIcon sx={{ color: '#b2fab4' }} />
                <Typography variant="h6" sx={{ color: '#fff' }}>Change Password</Typography>
              </Box>
              {pwdMsg && (
                <Alert severity={pwdMsg.toLowerCase().includes('changed') ? 'success' : 'error'} sx={{ mb: 2 }}>
                  {pwdMsg}
                </Alert>
              )}
              <TextField
                fullWidth
                type="password"
                label="Current password"
                value={pwd.current}
                onChange={(e) => setPwd(p => ({ ...p, current: e.target.value }))}
                sx={{ mb: 2, input: { color: '#fff' } }}
              />
              <TextField
                fullWidth
                type="password"
                label="New password"
                value={pwd.next}
                onChange={(e) => setPwd(p => ({ ...p, next: e.target.value }))}
                sx={{ mb: 2, input: { color: '#fff' } }}
              />
              <TextField
                fullWidth
                type="password"
                label="Confirm new password"
                value={pwd.confirm}
                onChange={(e) => setPwd(p => ({ ...p, confirm: e.target.value }))}
                sx={{ mb: 2, input: { color: '#fff' } }}
              />
            </CardContent>
            <CardActions sx={{ p: 2, pt: 0 }}>
              <Button variant="contained" onClick={changePasswordHandler} disabled={pwdBusy}>
                {pwdBusy ? 'Saving…' : 'Update Password'}
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Privacy / Data */}
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 2, bgcolor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <DeleteForeverIcon sx={{ color: '#ffcc80' }} />
                <Typography variant="h6" sx={{ color: '#fff' }}>Privacy & Data</Typography>
              </Box>
              {reqMsg && (
                <Alert severity={reqMsg.startsWith('Request') ? 'info' : 'error'} sx={{ mb: 2 }}>
                  {reqMsg}
                </Alert>
              )}
              <Typography variant="body2" sx={{ color: '#90a4ae', mb: 2 }}>
                Request deletion of your passport/license images after your rental is completed.
              </Typography>
              <Button variant="outlined" onClick={requestDocDeletion} disabled={reqBusy}>
                {reqBusy ? 'Sending…' : 'Request deletion'}
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}