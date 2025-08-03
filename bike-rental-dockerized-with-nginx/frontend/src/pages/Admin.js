// 📁 frontend/src/pages/Admin.js
import React, { useEffect, useState } from 'react';
import './Admin.css';
import {
  Card, CardContent, Typography, Grid, MenuItem, Select, InputLabel,
  FormControl, Tabs, Tab, Box, Table, TableHead, TableBody, TableRow,
  TableCell, TableSortLabel, TextField, Button, Link
} from '@mui/material';

const bikeOptions = {
  "Honda": ["CB650R", "CBR500R", "Rebel 500", "ADV160", "ADV350", "X-ADV", "CRF300L", "CB500X", "CBR650R", "CB1100"],
  "Yamaha": ["MT-07", "YZF-R3", "XSR900", "Tracer 900", "Ténéré 700", "R15 V4", "NMAX 155", "XMAX 300", "FZ6", "Bolt R-Spec"],
  "Kawasaki": ["Ninja 650", "Z900", "Versys 650", "Z650RS", "Vulcan S", "KLX230", "Ninja 400", "Z1000", "Versys-X 300", "KX250"],
  "Harley Davidson": ["Fat Boy 1990", "Fat Boy 2021", "Iron 883", "Street Bob", "Sportster S", "Pan America", "Heritage Classic", "Low Rider ST", "Road Glide", "Nightster"],
  "BMW": ["R1250GS", "S1000RR", "F900R", "G310GS", "R18", "K1600B", "C400X", "F850GS", "R nineT", "S1000XR"],
  "Ducati": ["Panigale V4", "Monster 937", "Scrambler Icon", "Multistrada V4", "Hypermotard 950", "Diavel V4", "Streetfighter V2", "DesertX", "Supersport 950", "XDiavel"],
  "Suzuki": ["GSX-R1000", "V-Strom 650", "Hayabusa", "SV650", "Burgman 400", "GSX250R", "DR-Z400SM", "Katana", "GSX-S750", "RM-Z250"],
  "Triumph": ["Street Triple RS", "Bonneville T120", "Tiger 900", "Speed Twin 1200", "Scrambler 1200", "Rocket 3 R", "Trident 660", "Thruxton RS", "Tiger Sport 660", "Daytona Moto2 765"],
  "KTM": ["Duke 390", "RC 390", "790 Adventure", "1290 Super Duke R", "690 SMC R", "250 Adventure", "890 Duke R", "450 SX-F", "EXC-F 500", "690 Enduro R"],
  "Royal Enfield": ["Classic 350", "Meteor 350", "Interceptor 650", "Himalayan 411", "Continental GT 650", "Scram 411", "Hunter 350", "Bullet 350", "Super Meteor 650", "Shotgun 650"]
};

function Admin() {
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [bikeForm, setBikeForm] = useState({ name: '', model: '', km: '', perDay: '', perWeek: '', perMonth: '' });
  const [bikeList, setBikeList] = useState([]);

  useEffect(() => {
    fetchStats();
    fetchUsers();
    fetchBookings();
    fetchBikeList();
  }, []);

  const fetchStats = async () => {
    const res = await fetch('/api/admin/bookings/stats');
    const data = await res.json();
    setStats(data);
  };

  const fetchUsers = async () => {
    const res = await fetch('/api/admin/users');
    const data = await res.json();
    setUsers(data);
  };

  const fetchBookings = async () => {
    const res = await fetch('/api/bookings');
    const data = await res.json();
    setBookings(data);
  };

  const fetchBikeList = async () => {
    const res = await fetch('/api/bikes');
    const data = await res.json();
    setBikeList(data);
  };

  const handleAddBike = async () => {
    const res = await fetch('/api/bikes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bikeForm)
    });
    if (res.ok) {
      setBikeForm({ name: '', model: '', km: '', perDay: '', perWeek: '', perMonth: '' });
      fetchBikeList();
    }
  };

  const updateUserRole = async (id, role) => {
    await fetch(`/api/admin/users/${id}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    fetchUsers();
  };

  const handleSort = (key) => {
    const direction = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ key, direction });
  };

  const sortedBookings = [...bookings]
    .filter((b) => `${b.firstName} ${b.lastName} ${b.bike}`.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const valA = a[sortConfig.key];
      const valB = b[sortConfig.key];
      return sortConfig.direction === 'asc' ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
    });

  const handleBrandChange = (e) => {
    const name = e.target.value;
    setBikeForm({ ...bikeForm, name, model: '' });
  };

  return (
    <div className="admin-container">
      <Typography variant="h4" gutterBottom sx={{ color: 'white' }}>📊 Admin Dashboard</Typography>

      <Tabs value={tab} onChange={(e, newVal) => setTab(newVal)} textColor="inherit" TabIndicatorProps={{ style: { background: '#4caf50' } }}>
        <Tab label="Dashboard" sx={{ color: 'white' }} />
        <Tab label="Booking Info" sx={{ color: 'white' }} />
        <Tab label="User Permissions" sx={{ color: 'white' }} />
        <Tab label="Manage Bike" sx={{ color: 'white' }} />
      </Tabs>

      {tab === 0 && (
        <Grid container spacing={2} sx={{ mt: 3 }}>
          <Grid item xs={12} sm={4}><Card sx={{ bgcolor: '#333', color: 'white' }}><CardContent><Typography variant="h6">Total Bookings</Typography><Typography variant="h4">{stats.totalBookings}</Typography></CardContent></Card></Grid>
          <Grid item xs={12} sm={4}><Card sx={{ bgcolor: '#333', color: 'white' }}><CardContent><Typography variant="h6">Total Profit</Typography><Typography variant="h4">฿{stats.totalProfit}</Typography></CardContent></Card></Grid>
          <Grid item xs={12} sm={4}><Card sx={{ bgcolor: '#333', color: 'white' }}><CardContent><Typography variant="h6">Active Bookings</Typography><Typography variant="h4">{stats.activeBookings}</Typography></CardContent></Card></Grid>
          {stats.profitByBike && Object.entries(stats.profitByBike).map(([bike, profit]) => (
            <Grid item xs={12} sm={6} md={4} key={bike}><Card sx={{ bgcolor: '#222', color: 'white' }}><CardContent><Typography variant="subtitle1">{bike}</Typography><Typography variant="h6">฿{profit}</Typography></CardContent></Card></Grid>
          ))}
        </Grid>
      )}

      {tab === 1 && (
        <Box sx={{ mt: 3 }}>
          <TextField label="Search" variant="outlined" value={search} onChange={(e) => setSearch(e.target.value)} InputLabelProps={{ style: { color: 'white' } }} inputProps={{ style: { color: 'white' } }} sx={{ mb: 2 }} />
          <Table>
            <TableHead><TableRow>
              <TableCell sx={{ color: 'white' }}><TableSortLabel active={sortConfig.key === 'firstName'} direction={sortConfig.direction} onClick={() => handleSort('firstName')} sx={{ color: 'white' }}>Name</TableSortLabel></TableCell>
              <TableCell sx={{ color: 'white' }}>Bike</TableCell>
              <TableCell sx={{ color: 'white' }}>Start</TableCell>
              <TableCell sx={{ color: 'white' }}>End</TableCell>
              <TableCell sx={{ color: 'white' }}>Days</TableCell>
              <TableCell sx={{ color: 'white' }}>Insurance</TableCell>
              <TableCell sx={{ color: 'white' }}>Total (฿)</TableCell>
              <TableCell sx={{ color: 'white' }}>Passport</TableCell>
              <TableCell sx={{ color: 'white' }}>License</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {sortedBookings.map((b) => (
                <TableRow key={b._id}>
                  <TableCell sx={{ color: 'white' }}>{b.firstName} {b.lastName}</TableCell>
                  <TableCell sx={{ color: 'white' }}>{b.bike}</TableCell>
                  <TableCell sx={{ color: 'white' }}>{new Date(b.startDateTime).toLocaleString()}</TableCell>
                  <TableCell sx={{ color: 'white' }}>{new Date(b.endDateTime).toLocaleString()}</TableCell>
                  <TableCell sx={{ color: 'white' }}>{b.numberOfDays}</TableCell>
                  <TableCell sx={{ color: 'white' }}>{b.insurance ? 'Yes' : 'No'}</TableCell>
                  <TableCell sx={{ color: 'white' }}>฿{b.totalPrice}</TableCell>
                  <TableCell sx={{ color: 'white' }}>{b.passportSignedUrl ? <Link href={b.passportSignedUrl} target="_blank" underline="hover">View</Link> : 'N/A'}</TableCell>
                  <TableCell sx={{ color: 'white' }}>{b.licenseSignedUrl ? <Link href={b.licenseSignedUrl} target="_blank" underline="hover">View</Link> : 'N/A'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}

      {tab === 2 && (
        <Box sx={{ mt: 3 }}>
          <Table><TableHead><TableRow>
            <TableCell sx={{ color: 'white' }}>Email</TableCell>
            <TableCell sx={{ color: 'white' }}>Role</TableCell>
            <TableCell sx={{ color: 'white' }}>Change</TableCell>
          </TableRow></TableHead>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u._id}>
                <TableCell sx={{ color: 'white' }}>{u.email}</TableCell>
                <TableCell sx={{ color: 'white' }}>{u.role}</TableCell>
                <TableCell>
                  <Select value={u.role} onChange={(e) => updateUserRole(u._id, e.target.value)} sx={{ color: 'white', borderColor: 'white' }}>
                    <MenuItem value="user">User</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody></Table>
        </Box>
      )}

      {tab === 3 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>Add New Bike</Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={4} md={3}>
              <FormControl fullWidth variant="standard">
                <InputLabel sx={{ color: 'white' }}>Brand</InputLabel>
                <Select value={bikeForm.name} onChange={handleBrandChange} sx={{ color: 'white' }}>
                  {Object.keys(bikeOptions).map((brand) => (
                    <MenuItem key={brand} value={brand}>{brand}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={4} md={3}>
              <FormControl fullWidth variant="standard">
                <InputLabel sx={{ color: 'white' }}>Model</InputLabel>
                <Select value={bikeForm.model} onChange={(e) => setBikeForm({ ...bikeForm, model: e.target.value })} sx={{ color: 'white' }}>
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
                />
              </Grid>
            ))}
            <Grid item xs={12}><Button variant="contained" onClick={handleAddBike} sx={{ mt: 2 }}>Add Bike</Button></Grid>
          </Grid>

          <Typography variant="h6" sx={{ color: 'white', mt: 4 }}>Bike List</Typography>
          <Table><TableHead><TableRow>
            <TableCell sx={{ color: 'white' }}>Name</TableCell>
            <TableCell sx={{ color: 'white' }}>Model</TableCell>
            <TableCell sx={{ color: 'white' }}>KM</TableCell>
            <TableCell sx={{ color: 'white' }}>฿/Day</TableCell>
            <TableCell sx={{ color: 'white' }}>฿/Week</TableCell>
            <TableCell sx={{ color: 'white' }}>฿/Month</TableCell>
          </TableRow></TableHead>
          <TableBody>
            {bikeList.map((b) => (
              <TableRow key={b._id}>
                <TableCell sx={{ color: 'white' }}>{b.name}</TableCell>
                <TableCell sx={{ color: 'white' }}>{b.model}</TableCell>
                <TableCell sx={{ color: 'white' }}>{b.km}</TableCell>
                <TableCell sx={{ color: 'white' }}>{b.perDay}</TableCell>
                <TableCell sx={{ color: 'white' }}>{b.perWeek}</TableCell>
                <TableCell sx={{ color: 'white' }}>{b.perMonth}</TableCell>
              </TableRow>
            ))}
          </TableBody></Table>
        </Box>
      )}
    </div>
  );
}

export default Admin;