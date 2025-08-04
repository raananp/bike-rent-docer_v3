import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Grid, FormControl, InputLabel, Select,
  MenuItem, TextField, Button, Table, TableHead, TableRow, TableCell, TableBody
} from '@mui/material';
import { bikeOptions } from '../../utils/constants';
import { getBikes, addBike } from '../../utils/api';

function ManageBikeTab() {
  const [bikeForm, setBikeForm] = useState({
    name: '', modelYear: '', km: '', perDay: '', perWeek: '', perMonth: ''
  });
  const [bikeList, setBikeList] = useState([]);

  useEffect(() => {
    fetchBikeList();
  }, []);

  const fetchBikeList = async () => {
    const data = await getBikes();
    setBikeList(data);
  };

  const handleBrandChange = (e) => {
    const name = e.target.value;
    setBikeForm({ ...bikeForm, name, modelYear: '' });
  };

  const handleAddBike = async () => {
    const res = await addBike(bikeForm);
    if (res.ok) {
      setBikeForm({ name: '', modelYear: '', km: '', perDay: '', perWeek: '', perMonth: '' });
      fetchBikeList();
    }
  };

  const underlineWhite = {
    color: 'white',
    '&:before': { borderBottom: '1px solid white' },
    '&:after': { borderBottom: '2px solid white' }
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>Add New Bike</Typography>
      <Grid container spacing={2}>
        <Grid item xs={6} sm={4} md={3}>
          <FormControl fullWidth variant="standard" sx={underlineWhite}>
            <InputLabel sx={{ color: 'white' }}>Brand</InputLabel>
            <Select value={bikeForm.name} onChange={handleBrandChange} sx={{ color: 'white' }}>
              {Object.keys(bikeOptions).map((brand) => (
                <MenuItem key={brand} value={brand}>{brand}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={6} sm={4} md={3}>
          <FormControl fullWidth variant="standard" sx={underlineWhite}>
            <InputLabel sx={{ color: 'white' }}>Model</InputLabel>
            <Select
              value={bikeForm.modelYear}
              onChange={(e) => setBikeForm({ ...bikeForm, modelYear: e.target.value })}
              sx={{ color: 'white' }}
            >
              {(bikeOptions[bikeForm.name] || []).map((model) => (
                <MenuItem key={model} value={model}>{model}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        {["km", "perDay", "perWeek", "perMonth"].map((field) => (
          <Grid item xs={6} sm={4} md={3} key={field}>
            <TextField
              fullWidth
              variant="standard"
              label={field}
              value={bikeForm[field]}
              onChange={(e) => setBikeForm({ ...bikeForm, [field]: e.target.value })}
              InputLabelProps={{ style: { color: 'white' } }}
              inputProps={{ style: { color: 'white' } }}
              sx={underlineWhite}
            />
          </Grid>
        ))}
        <Grid item xs={12}>
          <Button variant="contained" onClick={handleAddBike} sx={{ mt: 2 }}>
            Add Bike
          </Button>
        </Grid>
      </Grid>

      <Typography variant="h6" sx={{ color: 'white', mt: 4 }}>Bike List</Typography>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ color: 'white' }}>Name</TableCell>
            <TableCell sx={{ color: 'white' }}>Model</TableCell>
            <TableCell sx={{ color: 'white' }}>KM</TableCell>
            <TableCell sx={{ color: 'white' }}>฿/Day</TableCell>
            <TableCell sx={{ color: 'white' }}>฿/Week</TableCell>
            <TableCell sx={{ color: 'white' }}>฿/Month</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {bikeList.map((b) => (
            <TableRow key={b._id}>
              <TableCell sx={{ color: 'white' }}>{b.name}</TableCell>
              <TableCell sx={{ color: 'white' }}>{b.modelYear}</TableCell>
              <TableCell sx={{ color: 'white' }}>{b.km}</TableCell>
              <TableCell sx={{ color: 'white' }}>{b.perDay}</TableCell>
              <TableCell sx={{ color: 'white' }}>{b.perWeek}</TableCell>
              <TableCell sx={{ color: 'white' }}>{b.perMonth}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}

export default ManageBikeTab;