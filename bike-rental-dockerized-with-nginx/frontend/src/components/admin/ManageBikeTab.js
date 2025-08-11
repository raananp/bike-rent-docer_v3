import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Grid, FormControl, InputLabel, Select,
  MenuItem, TextField, Button, Table, TableHead, TableRow,
  TableCell, TableBody, Card, CardContent, CardHeader, Modal,
  CircularProgress, IconButton, InputAdornment, Divider
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { bikeOptions } from '../../utils/constants';
import { getBikes, addBike, deleteBike } from '../../utils/api';

function ManageBikeTab() {
  const [bikeForm, setBikeForm] = useState({
    name: '', modelYear: '', km: '', perDay: '', perWeek: '', perMonth: '', type: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [bikeList, setBikeList] = useState([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { refreshBikes(); }, []);

  async function refreshBikes() {
    try {
      setLoading(true);
      setErrorMessage('');
      const data = await getBikes();
      setBikeList(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setErrorMessage(e.message || 'Failed to load bikes');
    } finally {
      setLoading(false);
    }
  }

  const handleBrandChange = (e) => {
    const name = e.target.value;
    setBikeForm({ ...bikeForm, name, modelYear: '' }); // reset model when brand changes
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const maxMB = 10;

    if (!allowed.includes(file.type)) {
      setStatusMessage('❌ Image must be jpg, png, gif, or webp.');
      return;
    }
    if (file.size > maxMB * 1024 * 1024) {
      setStatusMessage('❌ Image must be smaller than 10MB.');
      return;
    }
    setImageFile(file);
    setStatusMessage('');
  };

  const handleAddBike = async () => {
    // basic validation
    const required = ['name', 'modelYear', 'type', 'km', 'perDay', 'perWeek', 'perMonth'];
    for (const k of required) {
      if (!String(bikeForm[k]).trim()) {
        setStatusMessage(`❌ Please fill the "${k}" field.`);
        return;
      }
    }

    try {
      setSubmitting(true);
      setStatusMessage('');
      setErrorMessage('');

      const formData = new FormData();
      Object.entries(bikeForm).forEach(([k, v]) => formData.append(k, v));
      if (imageFile) formData.append('imageFile', imageFile);

      await addBike(formData);

      setBikeForm({ name: '', modelYear: '', km: '', perDay: '', perWeek: '', perMonth: '', type: '' });
      setImageFile(null);
      setStatusMessage('✅ Bike added successfully!');
      await refreshBikes();
    } catch (e) {
      console.error(e);
      setErrorMessage(e.message || 'Failed to add bike.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBike = async (id) => {
    if (!window.confirm('Are you sure you want to delete this bike?')) return;

    try {
      setSubmitting(true);
      setStatusMessage('');
      setErrorMessage('');
      await deleteBike(id);
      // optimistic UI
      setBikeList((prev) => prev.filter((b) => b._id !== id));
      setStatusMessage('✅ Bike deleted!');
    } catch (e) {
      console.warn(e);
      if (String(e.message).includes('404')) {
        setBikeList((prev) => prev.filter((b) => b._id !== id));
        setStatusMessage('ℹ️ Bike was already deleted. List updated.');
      } else {
        setErrorMessage(e.message || 'Failed to delete bike.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const whiteField = {
    '& label': { color: 'white' },
    '& .MuiInputBase-input': { color: 'white' },
    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#2e7d32' },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#66bb6a' },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#66bb6a' }
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Grid container spacing={3} alignItems="flex-start">
        {/* LEFT — Bike List (65%) */}
        <Grid item xs={12} md={7.8}>
          <Card sx={{ background: 'linear-gradient(180deg,#1b1b1b 0%,#141414 100%)', borderRadius: 3 }}>
            <CardHeader
              title={<Typography variant="h6" sx={{ color: 'white' }}>Bike List</Typography>}
              action={
                <IconButton onClick={refreshBikes} aria-label="refresh" title="Refresh">
                  <RefreshIcon sx={{ color: '#b2fab4' }} />
                </IconButton>
              }
              sx={{ borderBottom: '1px solid #2a2a2a' }}
            />
            <CardContent sx={{ pt: 0 }}>
              {errorMessage && <Typography sx={{ color: '#ff8080', mb: 2 }}>{errorMessage}</Typography>}
              {statusMessage && <Typography sx={{ color: 'lightgreen', mb: 2 }}>{statusMessage}</Typography>}

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Box sx={{ overflow: 'auto', maxHeight: 560 }}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow sx={{ '& th': { color: '#cfd8dc', backgroundColor: '#1f1f1f' } }}>
                        <TableCell>Name</TableCell>
                        <TableCell>Model</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>KM</TableCell>
                        <TableCell>฿/Day</TableCell>
                        <TableCell>฿/Week</TableCell>
                        <TableCell>฿/Month</TableCell>
                        <TableCell>Image</TableCell>
                        <TableCell>Delete</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {bikeList.map((b) => {
                        const img = b.signedImageUrl || b.imageUrl || '';
                        return (
                          <TableRow key={b._id} hover sx={{ '& td': { color: 'white' } }}>
                            <TableCell>{b.name}</TableCell>
                            <TableCell>{b.modelYear}</TableCell>
                            <TableCell>{b.type}</TableCell>
                            <TableCell>{b.km}</TableCell>
                            <TableCell>{b.perDay}</TableCell>
                            <TableCell>{b.perWeek}</TableCell>
                            <TableCell>{b.perMonth}</TableCell>
                            <TableCell>
                              {img ? (
                                <Button
                                  variant="outlined"
                                  size="small"
                                  onClick={() => { setSelectedImage(img); setModalOpen(true); }}
                                >
                                  View
                                </Button>
                              ) : (
                                <Typography variant="caption" sx={{ color: '#bbb' }}>N/A</Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outlined"
                                size="small"
                                color="error"
                                onClick={() => handleDeleteBike(b._id)}
                                disabled={submitting}
                              >
                                Delete
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* RIGHT — Add New Bike (35%) with requested layout */}
        <Grid item xs={12} md={4.2}>
          <Card
            sx={{
              background: 'linear-gradient(180deg,#202020 0%,#161616 100%)',
              borderRadius: 3,
              position: 'sticky',
              top: 24
            }}
          >
            <CardHeader
              title={<Typography variant="h6" sx={{ color: 'white' }}>Add New Bike</Typography>}
              sx={{ borderBottom: '1px solid #2a2a2a' }}
            />
            <CardContent>
              <Grid container spacing={2}>
                {/* Row 1: Brand + Model */}
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel sx={{ color: 'white' }}>Brand</InputLabel>
                    <Select
                      value={bikeForm.name}
                      onChange={handleBrandChange}
                      label="Brand"
                      sx={whiteField}
                    >
                      {Object.keys(bikeOptions).map((brand) => (
                        <MenuItem key={brand} value={brand}>{brand}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel sx={{ color: 'white' }}>Model</InputLabel>
                    <Select
                      value={bikeForm.modelYear}
                      onChange={(e) => setBikeForm({ ...bikeForm, modelYear: e.target.value })}
                      label="Model"
                      sx={whiteField}
                    >
                      {(bikeOptions[bikeForm.name] || []).map((model) => (
                        <MenuItem key={model} value={model}>{model}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Row 2: Bike Type + KM */}
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel sx={{ color: 'white' }}>Bike Type</InputLabel>
                    <Select
                      value={bikeForm.type}
                      onChange={(e) => setBikeForm({ ...bikeForm, type: e.target.value })}
                      label="Bike Type"
                      sx={whiteField}
                    >
                      <MenuItem value="Speed Bike">Speed Bike</MenuItem>
                      <MenuItem value="Cruiser">Cruiser</MenuItem>
                      <MenuItem value="Scooter">Scooter</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    variant="outlined"
                    label="KM"
                    value={bikeForm.km}
                    onChange={(e) => setBikeForm({ ...bikeForm, km: e.target.value })}
                    sx={whiteField}
                    type="number"
                    inputProps={{ min: 0 }}
                  />
                </Grid>

                {/* Row 3: Prices (3 columns) */}
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    variant="outlined"
                    label="Per Day"
                    value={bikeForm.perDay}
                    onChange={(e) => setBikeForm({ ...bikeForm, perDay: e.target.value })}
                    sx={whiteField}
                    type="number"
                    inputProps={{ min: 0 }}
                    InputProps={{ startAdornment: <InputAdornment position="start">฿</InputAdornment> }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    variant="outlined"
                    label="Per Week"
                    value={bikeForm.perWeek}
                    onChange={(e) => setBikeForm({ ...bikeForm, perWeek: e.target.value })}
                    sx={whiteField}
                    type="number"
                    inputProps={{ min: 0 }}
                    InputProps={{ startAdornment: <InputAdornment position="start">฿</InputAdornment> }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    variant="outlined"
                    label="Per Month"
                    value={bikeForm.perMonth}
                    onChange={(e) => setBikeForm({ ...bikeForm, perMonth: e.target.value })}
                    sx={whiteField}
                    type="number"
                    inputProps={{ min: 0 }}
                    InputProps={{ startAdornment: <InputAdornment position="start">฿</InputAdornment> }}
                  />
                </Grid>

                {/* Row 4: Upload image (alone) */}
                <Grid item xs={12}>
                  <Button
                    variant="outlined"
                    component="label"
                    fullWidth
                    startIcon={<UploadFileIcon />}
                    sx={{ color: 'white', borderColor: '#2e7d32', '&:hover': { borderColor: '#66bb6a' } }}
                    disabled={submitting}
                  >
                    Upload Image
                    <input hidden accept="image/*" type="file" onChange={handleImageChange} />
                  </Button>
                  {imageFile && (
                    <Typography variant="caption" sx={{ color: 'lightgreen' }}>
                      ✅ {imageFile.name}
                    </Typography>
                  )}
                </Grid>

                {(statusMessage || errorMessage) && (
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1, borderColor: '#2a2a2a' }} />
                    {statusMessage && <Typography sx={{ color: 'lightgreen' }}>{statusMessage}</Typography>}
                    {errorMessage && <Typography sx={{ color: '#ff8080' }}>{errorMessage}</Typography>}
                  </Grid>
                )}

                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    onClick={handleAddBike}
                    fullWidth
                    disabled={submitting}
                    sx={{ bgcolor: '#2e7d32', '&:hover': { bgcolor: '#1b5e20' } }}
                  >
                    {submitting ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Add Bike'}
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Image preview modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <Box
          sx={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)', bgcolor: '#1a1a1a',
            p: 2, borderRadius: 2, maxWidth: 640
          }}
        >
          {selectedImage ? (
            <img src={selectedImage} alt="Bike" style={{ maxWidth: '100%', maxHeight: 520, borderRadius: 8 }} />
          ) : (
            <Typography sx={{ color: 'white' }}>No image</Typography>
          )}
        </Box>
      </Modal>
    </Box>
  );
}

export default ManageBikeTab;