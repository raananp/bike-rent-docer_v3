// frontend/src/components/styles.js
import { styled } from '@mui/material/styles';
import TextField from '@mui/material/TextField';

export const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '85%',
  maxWidth: 1100,
  maxHeight: '90vh',
  overflowY: 'auto',
  bgcolor: 'transparent', // let the inner card define silver bg
  borderRadius: '14px',
  boxShadow: 24,
  p: 0,
  zIndex: 1500,
};

/* Underline (standard) input with bright label/underline */
export const UnderlineInput = styled(TextField)({
  '& .MuiInputBase-input': { color: '#fff' },
  '& .MuiInputLabel-root': { color: '#cfcfcf' },
  '& .MuiInput-underline:before': { borderBottomColor: '#bfbfbf' },
  '& .MuiInput-underline:hover:not(.Mui-disabled):before': { borderBottomColor: '#e0e0e0' },
  '& .MuiInput-underline:after': { borderBottomColor: '#90ee90' }, // light green focus
});

/* Silver card that sits nicely on a black page */
export const SilverCard = styled('div')(({ theme }) => ({
  background: 'linear-gradient(rgb(230, 231, 234) 0%, rgba(0, 0, 0, 0.87) 100%)',
  color: '#fff',
  borderRadius: 14,
  boxShadow: '0 10px 30px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.15)',
  border: '1px solid rgba(255,255,255,0.2)',
  padding: theme.spacing(3),
}));

/* Dark section blocks inside the silver card */
export const DarkSection = styled('div')(({ theme }) => ({
  background: '#1a1b1e',
  color: '#fff',
  borderRadius: 12,
  border: '1px solid #2a2b2f',
  padding: theme.spacing(2),
}));

/* Yes/No chip-like buttons */
export const YnBtn = styled('button')(({ active = false, yes = false }) => ({
  appearance: 'none',
  border: '1px solid',
  borderColor: active ? (yes ? '#2ecc71' : '#ff5252') : '#555',
  background: active ? (yes ? 'rgba(46, 204, 113, 0.1)' : 'rgba(255, 82, 82, 0.12)') : 'transparent',
  color: active ? (yes ? '#2ecc71' : '#ff5252') : '#ddd',
  borderRadius: 10,
  padding: '8px 12px',
  fontSize: 14,
  cursor: 'pointer',
  marginRight: 8,
}));