// frontend/src/pages/Bikes.js
import React, { useEffect, useMemo, useState } from 'react';
import {
  Grid, Card, CardContent, CardMedia, Typography, Box, Button,
  Dialog, DialogContent, IconButton, CircularProgress, Stack
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import BikeModal from '../components/Bikes/BikeModal'; // <-- adjust path if your BikeModal lives elsewhere

// If you already have helpers in utils/api use them, otherwise swap to fetch().
import { getBikes, getBookings } from '../utils/api';

// Card used within the grid
function BikeCard({ bike, onBook, onOpenDetails }) {
  if (!bike) return null;

  const thb = (n) =>
    new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 })
      .format(Number(n || 0));

  // Normalize any image field into one array
  const images = useMemo(() => {
    const raw = bike.images || bike.gallery || bike.photos || bike.imageUrls || [];
    const arr = Array.isArray(raw) ? raw.filter(Boolean) : [];
    const extras = [bike.signedImageUrl, bike.imageUrl].filter(Boolean);
    const result = [...arr, ...extras];
    return result.length ? result : ['/images/bike_placeholder.jpg'];
  }, [bike]);

  const [idx, setIdx] = useState(0);
  const prev = (e) => { e.stopPropagation(); setIdx((p) => (p - 1 + images.length) % images.length); };
  const next = (e) => { e.stopPropagation(); setIdx((p) => (p + 1) % images.length); };

  return (
    <Card
      elevation={6}
      sx={{ cursor: 'pointer', borderRadius: 2, overflow: 'hidden', position: 'relative', bgcolor: '#0b0b0b' }}
      onClick={() => onOpenDetails(bike, images, idx)}
    >
      <Box position="relative">
        <CardMedia
          component="img"
          height="220"
          image={images[idx]}
          alt={`${bike?.name || 'Bike'} ${bike?.modelYear || ''}`.trim()}
          onError={(e) => { e.currentTarget.src = '/images/bike_placeholder.jpg'; }}
        />
        {images.length > 1 && (
          <>
            <Button
              size="small"
              onClick={prev}
              sx={{
                position: 'absolute', top: '50%', left: 8, transform: 'translateY(-50%)',
                minWidth: 0, color: '#fff', background: 'rgba(0,0,0,0.45)',
                '&:hover': { background: 'rgba(0,0,0,0.7)' }
              }}
            >‹</Button>
            <Button
              size="small"
              onClick={next}
              sx={{
                position: 'absolute', top: '50%', right: 8, transform: 'translateY(-50%)',
                minWidth: 0, color: '#fff', background: 'rgba(0,0,0,0.45)',
                '&:hover': { background: 'rgba(0,0,0,0.7)' }
              }}
            >›</Button>
          </>
        )}
      </Box>

      <CardContent sx={{ color: '#fff' }}>
        <Typography variant="h6" gutterBottom>
          {(bike?.name || 'Bike')} {bike?.modelYear || ''}
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Typography variant="body1">
            {thb(bike?.perDay)}{' '}
            <Typography component="span" variant="body2" color="text.secondary">/ day</Typography>
          </Typography>
          <Typography variant="body2">
            {thb(bike?.perWeek)}{' '}
            <Typography component="span" variant="caption" color="text.secondary">/ week</Typography>
          </Typography>
          <Typography variant="body2">
            {thb(bike?.perMonth)}{' '}
            <Typography component="span" variant="caption" color="text.secondary">/ month</Typography>
          </Typography>
        </Box>

        <Button
          variant="contained"
          color="primary"
          fullWidth
          sx={{ mt: 1 }}
          onClick={(e) => { e.stopPropagation(); onBook?.(bike); }}
        >
          Book
        </Button>
      </CardContent>
    </Card>
  );
}

export default function BikesPage() {
  const [bikes, setBikes] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  // Bike details dialog state
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsBike, setDetailsBike] = useState(null);
  const [detailsImages, setDetailsImages] = useState([]);
  const [detailsIdx, setDetailsIdx] = useState(0);

  // Booking modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBike, setSelectedBike] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      setErr('');
      const [b, bk] = await Promise.all([
        getBikes(),          // public bikes
        getBookings().catch(() => []), // all bookings (or adapt to your endpoint)
      ]);
      setBikes(Array.isArray(b) ? b : []);
      setBookings(Array.isArray(bk) ? bk : []);
    } catch (e) {
      setErr('Failed to load bikes. Please try again.');
      setBikes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openDetails = (bike, images, startIdx = 0) => {
    setDetailsBike(bike);
    setDetailsImages(images || []);
    setDetailsIdx(startIdx);
    setDetailsOpen(true);
  };

  const prevDetail = () => setDetailsIdx((p) => (p - 1 + detailsImages.length) % detailsImages.length);
  const nextDetail = () => setDetailsIdx((p) => (p + 1) % detailsImages.length);

  const handleBook = (bike) => {
    setSelectedBike(bike);
    setModalOpen(true);
  };

  // Refresh bookings after a booking is saved in the modal
  const refetchBookings = async () => {
    try {
      const bk = await getBookings();
      setBookings(Array.isArray(bk) ? bk : []);
    } catch {
      /* ignore */
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, pt: { xs: 10, md: 12 }, background: '#121212', minHeight: '100vh' }}>
      <Stack direction="row" alignItems="baseline" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h4" sx={{ color: '#fff', fontWeight: 700 }}>Bikes</Typography>
      </Stack>

      {loading ? (
        <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 240 }}>
          <CircularProgress />
        </Box>
      ) : err ? (
        <Box sx={{ color: '#fff', textAlign: 'center', p: 2 }}>{err}</Box>
      ) : bikes.length === 0 ? (
        <Box sx={{ color: '#fff', textAlign: 'center', p: 2 }}>No bikes available.</Box>
      ) : (
        <Grid container spacing={2}>
          {bikes.map((bike) => (
            <Grid key={bike._id || `${bike.name}-${bike.modelYear}`} item xs={12} sm={6} md={4} lg={3}>
              <BikeCard
                bike={bike}
                onBook={handleBook}
                onOpenDetails={openDetails}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Details dialog (clicking a card) */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogContent sx={{ position: 'relative', background: '#121212', color: '#fff' }}>
          <IconButton
            onClick={() => setDetailsOpen(false)}
            sx={{ position: 'absolute', top: 8, right: 8, color: '#fff' }}
          >
            <CloseIcon />
          </IconButton>

          {detailsBike && (
            <>
              <Box sx={{ textAlign: 'center' }}>
                <img
                  src={detailsImages[detailsIdx] || '/images/bike_placeholder.jpg'}
                  alt={`${detailsBike?.name || 'Bike'} ${detailsBike?.modelYear || ''}`.trim()}
                  style={{ maxWidth: '100%', maxHeight: '480px', objectFit: 'contain' }}
                  onError={(e) => { e.currentTarget.src = '/images/bike_placeholder.jpg'; }}
                />
              </Box>

              {detailsImages.length > 1 && (
                <Box sx={{ textAlign: 'center', mt: 1 }}>
                  <Button onClick={prevDetail} sx={{ mr: 1 }}>Prev</Button>
                  <Button onClick={nextDetail}>Next</Button>
                </Box>
              )}

              <Typography variant="h5" sx={{ mt: 2 }}>
                {(detailsBike?.name || 'Bike')} {detailsBike?.modelYear || ''}
              </Typography>
              <Typography variant="body1">Per Day: {detailsBike?.perDay}</Typography>
              <Typography variant="body1">Per Week: {detailsBike?.perWeek}</Typography>
              <Typography variant="body1">Per Month: {detailsBike?.perMonth}</Typography>
              {detailsBike?.description && (
                <Typography variant="body2" sx={{ mt: 1 }}>{detailsBike.description}</Typography>
              )}

              <Button
                variant="contained"
                sx={{ mt: 2 }}
                onClick={() => {
                  setDetailsOpen(false);
                  handleBook(detailsBike);
                }}
              >
                Book this bike
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Booking modal (reuses your existing component) */}
      {selectedBike && (
        <BikeModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          bike={selectedBike}
          bookings={bookings}
          fetchBookings={refetchBookings}
        />
      )}
    </Box>
  );
}