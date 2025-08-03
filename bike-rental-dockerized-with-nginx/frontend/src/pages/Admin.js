// 📁 frontend/src/pages/Admin.js
import React, { useEffect, useState } from 'react';
import './Admin.css';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Tabs,
  Tab,
  Box,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableSortLabel,
  TextField
} from '@mui/material';

function Admin() {
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });

  useEffect(() => {
    fetchStats();
    fetchUsers();
    fetchBookings();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/bookings/stats');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('Stats error:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error('Users error:', err);
    }
  };

  const fetchBookings = async () => {
    try {
      const res = await fetch('/api/bookings');
      const data = await res.json();
      setBookings(data);
    } catch (err) {
      console.error('Bookings fetch error:', err);
    }
  };

  const updateUserRole = async (id, role) => {
    try {
      await fetch(`/api/admin/users/${id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      fetchUsers();
    } catch (err) {
      console.error('Role update error:', err);
    }
  };

  const handleSort = (key) => {
    setSortConfig((prev) => {
      const direction = prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc';
      return { key, direction };
    });
  };

  const sortedBookings = [...bookings]
    .filter((b) => `${b.firstName} ${b.lastName} ${b.bike}`.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const valA = a[sortConfig.key];
      const valB = b[sortConfig.key];
      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

  return (
    <div className="admin-container">
      <Typography variant="h4" gutterBottom sx={{ color: 'white' }}>📊 Admin Dashboard</Typography>

      <Tabs value={tab} onChange={(e, newVal) => setTab(newVal)} textColor="inherit" TabIndicatorProps={{ style: { background: '#4caf50' } }}>
        <Tab label="Dashboard" sx={{ color: 'white' }} />
        <Tab label="Booking Info" sx={{ color: 'white' }} />
        <Tab label="User Permissions" sx={{ color: 'white' }} />
      </Tabs>

      {tab === 0 && (
        <>
          <Grid container spacing={3} className="admin-metrics">
            <Grid item xs={12} sm={4}>
              <Card className="metric-card">
                <CardContent>
                  <Typography className="metric-title">Total Bookings</Typography>
                  <Typography className="metric-value">{stats.totalBookings || 0}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card className="metric-card">
                <CardContent>
                  <Typography className="metric-title">Total Profit</Typography>
                  <Typography className="metric-value">฿{stats.totalProfit?.toLocaleString() || 0}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card className="metric-card">
                <CardContent>
                  <Typography className="metric-title">Active Bookings</Typography>
                  <Typography className="metric-value">{stats.activeBookings || 0}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          {stats.profitByBike && Object.keys(stats.profitByBike).length > 0 && (
            <Box mt={4}>
              <Typography variant="h6" sx={{ color: 'white' }}>Profit by Bike</Typography>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: 'white' }}>Bike</TableCell>
                    <TableCell sx={{ color: 'white' }}>Profit</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(stats.profitByBike).map(([bike, profit]) => (
                    <TableRow key={bike}>
                      <TableCell sx={{ color: 'white' }}>{bike}</TableCell>
                      <TableCell sx={{ color: 'white' }}>฿{profit.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </>
      )}

      {tab === 1 && (
        <Box className="admin-booking-table">
          <Typography variant="h5" className="admin-section-title">Booking Info</Typography>
          <TextField
            variant="outlined"
            size="small"
            fullWidth
            placeholder="Search by name or bike..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ mb: 2, input: { color: 'white' } }}
          />
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: 'white' }}>First Name</TableCell>
                <TableCell sx={{ color: 'white' }}>Last Name</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortConfig.key === 'bike'}
                    direction={sortConfig.key === 'bike' ? sortConfig.direction : 'asc'}
                    onClick={() => handleSort('bike')}
                    sx={{ color: 'white', '& .MuiTableSortLabel-icon': { color: 'white !important' } }}
                  >
                    Bike
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortConfig.key === 'numberOfDays'}
                    direction={sortConfig.key === 'numberOfDays' ? sortConfig.direction : 'asc'}
                    onClick={() => handleSort('numberOfDays')}
                    sx={{ color: 'white', '& .MuiTableSortLabel-icon': { color: 'white !important' } }}
                  >
                    Total Days
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortConfig.key === 'insurance'}
                    direction={sortConfig.key === 'insurance' ? sortConfig.direction : 'asc'}
                    onClick={() => handleSort('insurance')}
                    sx={{ color: 'white', '& .MuiTableSortLabel-icon': { color: 'white !important' } }}
                  >
                    Insurance
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ color: 'white' }}>Passport</TableCell>
                <TableCell sx={{ color: 'white' }}>License</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortConfig.key === 'createdAt'}
                    direction={sortConfig.key === 'createdAt' ? sortConfig.direction : 'asc'}
                    onClick={() => handleSort('createdAt')}
                    sx={{ color: 'white', '& .MuiTableSortLabel-icon': { color: 'white !important' } }}
                  >
                    Date Created
                  </TableSortLabel>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedBookings.map((b) => (
                <TableRow key={b._id}>
                  <TableCell sx={{ color: 'white' }}>{b.firstName}</TableCell>
                  <TableCell sx={{ color: 'white' }}>{b.lastName}</TableCell>
                  <TableCell sx={{ color: 'white' }}>{b.bike}</TableCell>
                  <TableCell sx={{ color: 'white' }}>{b.numberOfDays}</TableCell>
                  <TableCell sx={{ color: 'white' }}>{b.insurance ? 'Yes' : 'No'}</TableCell>
                  <TableCell>
                    {b.passportSignedUrl ? (
                      <a href={b.passportSignedUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#4caf50' }}>View</a>
                    ) : 'No'}
                  </TableCell>
                  <TableCell>
                    {b.licenseSignedUrl ? (
                      <a href={b.licenseSignedUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#4caf50' }}>View</a>
                    ) : 'No'}
                  </TableCell>
                  <TableCell sx={{ color: 'white' }}>{new Date(b.createdAt).toLocaleString('en-GB')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}

      {tab === 2 && (
        <div>
          <Typography variant="h5" gutterBottom className="admin-section-title">User Permissions</Typography>
          <div className="admin-user-management">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: 'white' }}>Email</TableCell>
                  <TableCell sx={{ color: 'white' }}>Current Role</TableCell>
                  <TableCell sx={{ color: 'white' }}>Change Role</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u._id}>
                    <TableCell sx={{ color: 'white' }}>{u.email}</TableCell>
                    <TableCell sx={{ color: 'white' }}>{u.role}</TableCell>
                    <TableCell>
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel id={`role-label-${u._id}`} sx={{ color: 'white' }}>Role</InputLabel>
                        <Select
                          labelId={`role-label-${u._id}`}
                          value={u.role}
                          label="Role"
                          onChange={(e) => updateUserRole(u._id, e.target.value)}
                          sx={{ color: 'white', borderColor: 'white' }}
                        >
                          <MenuItem value="user">User</MenuItem>
                          <MenuItem value="admin">Admin</MenuItem>
                        </Select>
                      </FormControl>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;