import { styled } from '@mui/material/styles';
import TextField from '@mui/material/TextField';

export const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '95%',
  maxWidth: 800,
  bgcolor: '#121212',
  color: 'white',
  borderRadius: '12px',
  boxShadow: 24,
  p: 4,
  zIndex: 1500, // Ensures modal appears
};

export const WhiteInput = styled(TextField)({
  '& .MuiInputBase-root': { color: 'white' },
  '& .MuiInputLabel-root': { color: '#aaa' },
  '& .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline': {
    borderColor: '#888',
  },
});