import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Grid, FormControl, InputLabel, Select,
  MenuItem, TextField, Button, Table, TableHead, TableRow,
  TableCell, TableBody, Card, CardContent, Modal, CircularProgress
} from '@mui/material';
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

  useEffect(() => {
    refreshBikes();
  }, []);

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

      // addBike throws on error; returns parsed JSON on success
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
      await deleteBike(id); // throws on non-2xx
      // optimistic UI
      setBikeList((prev) => prev.filter((b) => b._id !== id));
      setStatusMessage('✅ Bike deleted!');
    } catch (e) {
      console.warn(e);
      // If backend says 404, it’s already gone — remove from UI anyway
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

  const whiteTextField = {
    '& label': { color: 'white' },
    '& .MuiInputBase-input': { color: 'white' },
    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'lightgreen' },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'lightgreen' }
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Card sx={{ backgroundColor: '#1e1e1e', mb: 4 }}>
        <CardContent>
          <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>Add New Bike</Typography>

          {statusMessage && <Typography sx={{ color: 'lightgreen', mb: 2 }}>{statusMessage}</Typography>}
          {errorMessage && <Typography sx={{ color: '#ff8080', mb: 2 }}>{errorMessage}</Typography>}

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: 'white' }}>Brand</InputLabel>
                <Select
                  value={bikeForm.name}
                  onChange={handleBrandChange}
                  label="Brand"
                  sx={whiteTextField}
                >
                  {Object.keys(bikeOptions).map((brand) => (
                    <MenuItem key={brand} value={brand}>{brand}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: 'white' }}>Model</InputLabel>
                <Select
                  value={bikeForm.modelYear}
                  onChange={(e) => setBikeForm({ ...bikeForm, modelYear: e.target.value })}
                  label="Model"
                  sx={whiteTextField}
                >
                  {(bikeOptions[bikeForm.name] || []).map((model) => (
                    <MenuItem key={model} value={model}>{model}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: 'white' }}>Bike Type</InputLabel>
                <Select
                  value={bikeForm.type}
                  onChange={(e) => setBikeForm({ ...bikeForm, type: e.target.value })}
                  label="Bike Type"
                  sx={whiteTextField}
                >
                  <MenuItem value="Speed Bike">Speed Bike</MenuItem>
                  <MenuItem value="Cruiser">Cruiser</MenuItem>
                  <MenuItem value="Scooter">Scooter</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {['km', 'perDay', 'perWeek', 'perMonth'].map((field) => (
              <Grid item xs={12} sm={6} md={3} key={field}>
                <TextField
                  fullWidth
                  variant="outlined"
                  label={field}
                  value={bikeForm[field]}
                  onChange={(e) => setBikeForm({ ...bikeForm, [field]: e.target.value })}
                  sx={whiteTextField}
                  type="number"
                  inputProps={{ min: 0 }}
                />
              </Grid>
            ))}

            <Grid item xs={12} sm={6} md={4}>
              <Button
                variant="outlined"
                component="label"
                fullWidth
                sx={{ color: 'white', borderColor: 'white' }}
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

            <Grid item xs={12}>
              <Button variant="contained" onClick={handleAddBike} sx={{ mt: 2 }} disabled={submitting}>
                {submitting ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Add Bike'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ backgroundColor: '#1e1e1e' }}>
        <CardContent>
          <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>Bike List</Typography>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: 'white' }}>Name</TableCell>
                  <TableCell sx={{ color: 'white' }}>Model</TableCell>
                  <TableCell sx={{ color: 'white' }}>Type</TableCell>
                  <TableCell sx={{ color: 'white' }}>KM</TableCell>
                  <TableCell sx={{ color: 'white' }}>฿/Day</TableCell>
                  <TableCell sx={{ color: 'white' }}>฿/Week</TableCell>
                  <TableCell sx={{ color: 'white' }}>฿/Month</TableCell>
                  <TableCell sx={{ color: 'white' }}>Image</TableCell>
                  <TableCell sx={{ color: 'white' }}>Delete</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bikeList.map((b) => {
                  const img = b.signedImageUrl || b.imageUrl || '';
                  return (
                    <TableRow key={b._id}>
                      <TableCell sx={{ color: 'white' }}>{b.name}</TableCell>
                      <TableCell sx={{ color: 'white' }}>{b.modelYear}</TableCell>
                      <TableCell sx={{ color: 'white' }}>{b.type}</TableCell>
                      <TableCell sx={{ color: 'white' }}>{b.km}</TableCell>
                      <TableCell sx={{ color: 'white' }}>{b.perDay}</TableCell>
                      <TableCell sx={{ color: 'white' }}>{b.perWeek}</TableCell>
                      <TableCell sx={{ color: 'white' }}>{b.perMonth}</TableCell>
                      <TableCell>
                        {img ? (
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => {
                              setSelectedImage(img);
                              setModalOpen(true);
                            }}
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
          )}
        </CardContent>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <Box
          sx={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)', bgcolor: '#1a1a1a',
            p: 2, borderRadius: 2, maxWidth: 600
          }}
        >
          {selectedImage ? (
            <img src={selectedImage} alt="Bike" style={{ maxWidth: '100%', maxHeight: 500, borderRadius: 8 }} />
          ) : (
            <Typography sx={{ color: 'white' }}>No image</Typography>
          )}
        </Box>
      </Modal>
    </Box>
  );
}

export default ManageBikeTab;