// src/components/BikeModal.js
import React from 'react';
import { Box, Typography, Button, IconButton } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from 'react-router-dom';

const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  backgroundColor: 'rgba(0,0,0,0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
};

const modalStyle = {
  width: '90%',
  maxWidth: '600px',
  background: '#1e1e1e',
  borderRadius: '16px',
  padding: '24px',
  color: 'white',
  position: 'relative',
  boxShadow: '0 0 20px rgba(0,0,0,0.5)',
};

const BikeModal = ({ bike, onClose }) => {
  const navigate = useNavigate();

  const handleBookClick = () => {
    const encodedBike = encodeURIComponent(bike.title);
    navigate(`/booking?bike=${encodedBike}`);
  };

  return (
    <AnimatePresence>
      {bike && (
        <motion.div
          style={overlayStyle}
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            style={modalStyle}
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <IconButton
              onClick={onClose}
              sx={{ position: 'absolute', top: 8, right: 8, color: 'white' }}
            >
              <CloseIcon />
            </IconButton>

            <img
              src={bike.image}
              alt={bike.title}
              style={{
                width: '100%',
                maxHeight: '300px',
                objectFit: 'cover',
                borderRadius: '12px',
                marginBottom: '16px',
              }}
            />

            <Typography variant="h5" gutterBottom>{bike.title}</Typography>
            <Typography variant="body1" gutterBottom>{bike.description}</Typography>
            <Typography variant="body2">Year: {bike.year}</Typography>
            <Typography variant="body2">Kilometers: {bike.km}</Typography>
            <Typography variant="body2" sx={{ mt: 2 }}>
              <strong>Price:</strong><br />
              Per Day: ฿{bike.pricePerDay}<br />
              Per Week: ฿{bike.pricePerWeek}<br />
              Per Month: ฿{bike.pricePerMonth}
            </Typography>

            <Button
              variant="contained"
              sx={{ mt: 3 }}
              onClick={handleBookClick}
            >
              Book
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BikeModal;
