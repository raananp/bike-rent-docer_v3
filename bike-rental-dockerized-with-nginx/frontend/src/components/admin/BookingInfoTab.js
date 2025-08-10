import React, { useEffect, useState } from 'react';
import {
  Box, Table, TableHead, TableRow, TableCell, TableBody,
  TextField, Link, TableSortLabel, IconButton, Tooltip
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { getBookings, deleteBooking } from '../../utils/api';

function BookingInfoTab() {
  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const data = await getBookings();
      setBookings(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to load bookings', e);
      setBookings([]);
    }
  };

  const handleSort = (key) => {
    const direction =
      sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ key, direction });
  };

  const handleDelete = async (id) => {
    const yes = window.confirm('Delete this booking? This cannot be undone.');
    if (!yes) return;

    // Optimistic UI
    setDeletingId(id);
    const prev = bookings;
    setBookings((list) => list.filter((b) => b._id !== id));
    try {
      await deleteBooking(id);
    } catch (e) {
      // rollback on failure
      console.error('Delete failed', e);
      setBookings(prev);
      alert('Failed to delete booking.');
    } finally {
      setDeletingId(null);
    }
  };

  const sortedBookings = [...bookings]
    .filter((b) =>
      `${b.firstName} ${b.lastName} ${b.bike}`.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const va = a[sortConfig.key];
      const vb = b[sortConfig.key];
      // Handle dates/strings/numbers simply
      if (va === vb) return 0;
      if (sortConfig.direction === 'asc') return va > vb ? 1 : -1;
      return va < vb ? 1 : -1;
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
          '& .MuiInput-underline:before': { borderBottomColor: 'white' },
          '& .MuiInput-underline:hover:before': { borderBottomColor: 'white' },
          '& .MuiInput-underline:after': { borderBottomColor: 'white' },
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
            <TableCell sx={{ color: 'white' }}>
              <TableSortLabel
                active={sortConfig.key === 'startDateTime'}
                direction={sortConfig.direction}
                onClick={() => handleSort('startDateTime')}
                sx={{ color: 'white' }}
              >
                Start
              </TableSortLabel>
            </TableCell>
            <TableCell sx={{ color: 'white' }}>
              <TableSortLabel
                active={sortConfig.key === 'endDateTime'}
                direction={sortConfig.direction}
                onClick={() => handleSort('endDateTime')}
                sx={{ color: 'white' }}
              >
                End
              </TableSortLabel>
            </TableCell>
            <TableCell sx={{ color: 'white' }}>Days</TableCell>
            <TableCell sx={{ color: 'white' }}>Insurance</TableCell>
            <TableCell sx={{ color: 'white' }}>
              <TableSortLabel
                active={sortConfig.key === 'totalPrice'}
                direction={sortConfig.direction}
                onClick={() => handleSort('totalPrice')}
                sx={{ color: 'white' }}
              >
                Total (฿)
              </TableSortLabel>
            </TableCell>
            <TableCell sx={{ color: 'white' }}>Passport</TableCell>
            <TableCell sx={{ color: 'white' }}>License</TableCell>
            <TableCell sx={{ color: 'white' }} align="center">Actions</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {sortedBookings.map((b) => (
            <TableRow key={b._id} hover>
              <TableCell sx={{ color: 'white' }}>
                {b.firstName} {b.lastName}
              </TableCell>
              <TableCell sx={{ color: 'white' }}>{b.bike}</TableCell>
              <TableCell sx={{ color: 'white' }}>
                {new Date(b.startDateTime).toLocaleString()}
              </TableCell>
              <TableCell sx={{ color: 'white' }}>
                {new Date(b.endDateTime).toLocaleString()}
              </TableCell>
              <TableCell sx={{ color: 'white' }}>{b.numberOfDays}</TableCell>
              <TableCell sx={{ color: 'white' }}>{b.insurance ? 'Yes' : 'No'}</TableCell>
              <TableCell sx={{ color: 'white' }}>฿{b.totalPrice}</TableCell>
              <TableCell sx={{ color: 'white' }}>
                {b.passportSignedUrl ? (
                  <Link href={b.passportSignedUrl} target="_blank" rel="noopener">
                    View
                  </Link>
                ) : (
                  'N/A'
                )}
              </TableCell>
              <TableCell sx={{ color: 'white' }}>
                {b.licenseSignedUrl ? (
                  <Link href={b.licenseSignedUrl} target="_blank" rel="noopener">
                    View
                  </Link>
                ) : (
                  'N/A'
                )}
              </TableCell>

              <TableCell align="center" sx={{ color: 'white' }}>
                <Tooltip title="Delete booking">
                  <span>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(b._id)}
                      disabled={deletingId === b._id}
                      sx={{ color: deletingId === b._id ? 'gray' : '#ff6b6b' }}
                    >
                      <DeleteOutlineIcon />
                    </IconButton>
                  </span>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}

export default BookingInfoTab;