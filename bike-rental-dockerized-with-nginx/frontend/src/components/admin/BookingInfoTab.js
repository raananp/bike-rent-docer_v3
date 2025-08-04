import React, { useEffect, useState } from 'react';
import {
  Box, Table, TableHead, TableRow, TableCell, TableBody,
  TextField, Link, TableSortLabel
} from '@mui/material';
import { getBookings } from '../../utils/api';

function BookingInfoTab() {
  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    const data = await getBookings();
    setBookings(data);
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

  return (
    <Box sx={{ mt: 3 }}>
      <TextField
        label="Search"
        variant="standard"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        InputLabelProps={{ style: { color: 'white' } }}
        inputProps={{ style: { color: 'white' } }}
        sx={{
          mb: 2,
          '& .MuiInput-underline:before': {
            borderBottomColor: 'white',
          },
          '& .MuiInput-underline:hover:before': {
            borderBottomColor: 'white',
          },
          '& .MuiInput-underline:after': {
            borderBottomColor: 'white',
          }
        }}
      />

      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ color: 'white' }}>
              <TableSortLabel
                active={sortConfig.key === 'firstName'}
                direction={sortConfig.direction}
                onClick={() => handleSort('firstName')}
                sx={{ color: 'white' }}
              >
                Name
              </TableSortLabel>
            </TableCell>
            <TableCell sx={{ color: 'white' }}>Bike</TableCell>
            <TableCell sx={{ color: 'white' }}>Start</TableCell>
            <TableCell sx={{ color: 'white' }}>End</TableCell>
            <TableCell sx={{ color: 'white' }}>Days</TableCell>
            <TableCell sx={{ color: 'white' }}>Insurance</TableCell>
            <TableCell sx={{ color: 'white' }}>Total (฿)</TableCell>
            <TableCell sx={{ color: 'white' }}>Passport</TableCell>
            <TableCell sx={{ color: 'white' }}>License</TableCell>
          </TableRow>
        </TableHead>
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
              <TableCell sx={{ color: 'white' }}>{b.passportSignedUrl ? <Link href={b.passportSignedUrl} target="_blank">View</Link> : 'N/A'}</TableCell>
              <TableCell sx={{ color: 'white' }}>{b.licenseSignedUrl ? <Link href={b.licenseSignedUrl} target="_blank">View</Link> : 'N/A'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}

export default BookingInfoTab;