import React, { useEffect, useMemo, useState } from 'react';
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
    name: '',
    modelYear: '',
    year: '',            // NEW
    licensePlate: '',    // NEW
    km: '',
    perDay: '',
    perWeek: '',
    perMonth: '',
    type: ''
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
    setBikeForm((p) => ({ ...p, name, modelYear: '' })); // reset model when brand changes
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
    // basic validation (now includes year & licensePlate)
    const required = ['name', 'modelYear', 'type', 'year', 'licensePlate', 'km', 'perDay', 'perWeek', 'perMonth'];
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

      setBikeForm({
        name: '', modelYear: '', year: '', licensePlate: '',
        km: '', perDay: '', perWeek: '', perMonth: '', type: ''
      });
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

  // Underline style for TextField/Select (variant="standard")
  const underlineField = {
    '& label': { color: '#cfd8dc' },
    '& .MuiInputBase-root': { color: '#fff' },
    '& .MuiInput-underline:before': { borderBottomColor: '#3a3a3a' },
    '& .MuiInput-underline:hover:before': { borderBottomColor: '#66bb6a' },
    '& .MuiInput-underline:after': { borderBottomColor: '#66bb6a' },
    '& .MuiSvgIcon-root': { color: '#fff' },
  };

  // years 1965–2025
  const years = useMemo(() => {
    const arr = [];
    for (let y = 2025; y >= 1965; y--) arr.push(y);
    return arr;
  }, []);

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
                        <TableCell>Year</TableCell>            {/* NEW */}
                        <TableCell>Plate</TableCell>           {/* NEW */}
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
                            <TableCell>{b.year ?? '-'}</TableCell>                 {/* NEW */}
                            <TableCell>{b.licensePlate || '-'}</TableCell>        {/* NEW */}
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

        {/* RIGHT — Add New Bike (35%) compact, underline inputs */}
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
              sx={{ borderBottom: '1px solid #2a2a2a', py: 1.5 }}
            />
            <CardContent sx={{ pt: 2, pb: 2 }}>
              <Grid container spacing={1.5}>
                {/* Row 1: Brand + Model (underline) */}
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth variant="standard" sx={underlineField}>
                    <InputLabel>Brand</InputLabel>
                    <Select
                      value={bikeForm.name}
                      onChange={handleBrandChange}
                    >
                      {Object.keys(bikeOptions).map((brand) => (
                        <MenuItem key={brand} value={brand}>{brand}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth variant="standard" sx={underlineField}>
                    <InputLabel>Model</InputLabel>
                    <Select
                      value={bikeForm.modelYear}
                      onChange={(e) => setBikeForm({ ...bikeForm, modelYear: e.target.value })}
                    >
                      {(bikeOptions[bikeForm.name] || []).map((model) => (
                        <MenuItem key={model} value={model}>{model}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Row 2: Bike Type + KM (underline) */}
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth variant="standard" sx={underlineField}>
                    <InputLabel>Bike Type</InputLabel>
                    <Select
                      value={bikeForm.type}
                      onChange={(e) => setBikeForm({ ...bikeForm, type: e.target.value })}
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
                    variant="standard"
                    label="KM"
                    value={bikeForm.km}
                    onChange={(e) => setBikeForm({ ...bikeForm, km: e.target.value })}
                    sx={underlineField}
                    type="number"
                    inputProps={{ min: 0 }}
                  />
                </Grid>

                {/* Row 3: Year + License Plate (underline) */}
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth variant="standard" sx={underlineField}>
                    <InputLabel>Year</InputLabel>
                    <Select
                      value={bikeForm.year}
                      onChange={(e) => setBikeForm({ ...bikeForm, year: e.target.value })}
                      MenuProps={{ PaperProps: { style: { maxHeight: 300 } } }}
                    >
                      {years.map((y) => (
                        <MenuItem key={y} value={y}>{y}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    variant="standard"
                    label="License Plate"
                    value={bikeForm.licensePlate}
                    onChange={(e) => setBikeForm({ ...bikeForm, licensePlate: e.target.value })}
                    sx={underlineField}
                    placeholder="e.g., 1กก-1234"
                  />
                </Grid>

                {/* Row 4: Prices (3 columns, underline) */}
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    variant="standard"
                    label="Per Day"
                    value={bikeForm.perDay}
                    onChange={(e) => setBikeForm({ ...bikeForm, perDay: e.target.value })}
                    sx={underlineField}
                    type="number"
                    inputProps={{ min: 0 }}
                    InputProps={{ startAdornment: <InputAdornment position="start">฿</InputAdornment> }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    variant="standard"
                    label="Per Week"
                    value={bikeForm.perWeek}
                    onChange={(e) => setBikeForm({ ...bikeForm, perWeek: e.target.value })}
                    sx={underlineField}
                    type="number"
                    inputProps={{ min: 0 }}
                    InputProps={{ startAdornment: <InputAdornment position="start">฿</InputAdornment> }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    variant="standard"
                    label="Per Month"
                    value={bikeForm.perMonth}
                    onChange={(e) => setBikeForm({ ...bikeForm, perMonth: e.target.value })}
                    sx={underlineField}
                    type="number"
                    inputProps={{ min: 0 }}
                    InputProps={{ startAdornment: <InputAdornment position="start">฿</InputAdornment> }}
                  />
                </Grid>

                {/* Row 5: Upload image (alone) */}
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