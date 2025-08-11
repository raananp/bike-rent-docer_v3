import React, { useEffect, useState } from 'react';
import {
  Box, Table, TableHead, TableRow, TableCell, TableBody,
  TextField, Link, TableSortLabel, Chip, Stack, IconButton, Tooltip
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import DoNotDisturbAltIcon from '@mui/icons-material/DoNotDisturbAlt';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { getBookings, updateBookingVerification, deleteBooking } from '../../utils/api';

function statusColor(s) {
  switch ((s || '').toLowerCase()) {
    case 'passed':  return 'success';
    case 'failed':  return 'error';
    case 'skipped': return 'warning';
    case 'pending':
    default:        return 'default';
  }
}

const deliveryLabel = (loc) => {
  switch (loc) {
    case 'office_pattaya':   return 'Pickup (Pattaya)';
    case 'delivery_pattaya': return 'Delivery (Pattaya)';
    case 'bangkok':          return 'Bangkok';
    case 'phuket':           return 'Phuket';
    case 'chiang_mai':       return 'Chiang Mai';
    default:                 return loc || '—';
  }
};

export default function BookingInfoTab() {
  const [bookings, setBookings]   = useState([]);
  const [search, setSearch]       = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });

  useEffect(() => { fetchBookings(); }, []);

  const fetchBookings = async () => {
    const data = await getBookings();
    setBookings(Array.isArray(data) ? data : []);
  };

  const handleSort = (key) => {
    const direction = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ key, direction });
  };

  const setVerification = async (b, target) => {
    const payload =
      target === 'pass'
        ? { status: 'passed',  license: { status: 'passed'  }, passport: { status: 'passed'  }, message: 'Marked passed by admin' }
      : target === 'fail'
        ? { status: 'failed',  license: { status: 'failed'  }, passport: { status: 'failed'  }, message: 'Marked failed by admin' }
        : { status: 'pending', license: { status: 'pending' }, passport: { status: 'pending' }, message: 'Reset to pending' };

    await updateBookingVerification(b._id, payload);
    await fetchBookings();
  };

  const onDelete = async (id) => {
    if (!window.confirm('Delete this booking?')) return;
    await deleteBooking(id);
    await fetchBookings();
  };

  const sortedBookings = [...bookings]
    .filter((b) =>
      `${b.firstName} ${b.lastName} ${b.bike}`.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const valA = a[sortConfig.key];
      const valB = b[sortConfig.key];
      const aVal = valA instanceof Date ? valA.getTime() : (typeof valA === 'string' ? valA : String(valA ?? ''));
      const bVal = valB instanceof Date ? valB.getTime() : (typeof valB === 'string' ? valB : String(valB ?? ''));
      if (sortConfig.direction === 'asc') return aVal > bVal ? 1 : -1;
      return aVal < bVal ? 1 : -1;
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
          '& .MuiInput-underline:after': { borderBottomColor: 'white' }
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

            {/* NEW: Consent + Delivery */}
            <TableCell sx={{ color: 'white' }}>Consent</TableCell>
            <TableCell sx={{ color: 'white' }}>Delivery</TableCell>

            <TableCell sx={{ color: 'white' }}>Passport</TableCell>
            <TableCell sx={{ color: 'white' }}>License</TableCell>
            <TableCell sx={{ color: 'white' }}>Passport Status</TableCell>
            <TableCell sx={{ color: 'white' }}>License Status</TableCell>
            <TableCell sx={{ color: 'white' }}>Overall</TableCell>
            <TableCell sx={{ color: 'white' }} align="right">Actions</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {sortedBookings.map((b) => {
            const passportStatus = b?.verification?.passport?.status ?? (b.passportSignedUrl ? 'pending' : 'skipped');
            const licenseStatus  = b?.verification?.license?.status  ?? (b.licenseSignedUrl  ? 'pending' : 'skipped');
            const overall =
              (passportStatus === 'failed' || licenseStatus === 'failed') ? 'failed'
              : (passportStatus === 'pending' || licenseStatus === 'pending') ? 'pending'
              : (passportStatus === 'skipped' && licenseStatus === 'skipped') ? 'skipped'
              : 'passed';

            return (
              <TableRow key={b._id}>
                <TableCell sx={{ color: 'white' }}>{b.firstName} {b.lastName}</TableCell>
                <TableCell sx={{ color: 'white' }}>{b.bike}</TableCell>
                <TableCell sx={{ color: 'white' }}>{new Date(b.startDateTime).toLocaleString()}</TableCell>
                <TableCell sx={{ color: 'white' }}>{new Date(b.endDateTime).toLocaleString()}</TableCell>
                <TableCell sx={{ color: 'white' }}>{b.numberOfDays}</TableCell>
                <TableCell sx={{ color: 'white' }}>{b.insurance ? 'Yes' : 'No'}</TableCell>
                <TableCell sx={{ color: 'white' }}>฿{b.totalPrice}</TableCell>

                {/* Consent */}
                <TableCell sx={{ color: 'white' }}>
                  <Chip
                    size="small"
                    label={b.consentGiven ? 'Agreed' : 'Missing'}
                    color={b.consentGiven ? 'success' : 'error'}
                  />
                </TableCell>

                {/* Delivery */}
                <TableCell sx={{ color: 'white' }}>
                  {deliveryLabel(b.deliveryLocation)}{typeof b.deliveryFee === 'number' ? ` (฿${b.deliveryFee})` : ''}
                </TableCell>

                <TableCell sx={{ color: 'white' }}>
                  {b.passportSignedUrl
                    ? <Link href={b.passportSignedUrl} target="_blank" rel="noreferrer">View</Link>
                    : 'N/A'}
                </TableCell>
                <TableCell sx={{ color: 'white' }}>
                  {b.licenseSignedUrl
                    ? <Link href={b.licenseSignedUrl} target="_blank" rel="noreferrer">View</Link>
                    : 'N/A'}
                </TableCell>

                <TableCell sx={{ color: 'white' }}>
                  <Chip size="small" label={passportStatus} color={statusColor(passportStatus)} />
                </TableCell>
                <TableCell sx={{ color: 'white' }}>
                  <Chip size="small" label={licenseStatus} color={statusColor(licenseStatus)} />
                </TableCell>
                <TableCell sx={{ color: 'white' }}>
                  <Chip size="small" label={overall} color={statusColor(overall)} />
                </TableCell>

                <TableCell align="right" sx={{ color: 'white' }}>
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Tooltip title="Mark Passed">
                      <IconButton size="small" onClick={() => setVerification(b, 'pass')}>
                        <CheckIcon sx={{ color: '#4caf50' }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Mark Failed">
                      <IconButton size="small" onClick={() => setVerification(b, 'fail')}>
                        <DoNotDisturbAltIcon sx={{ color: '#f44336' }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Reset to Pending">
                      <IconButton size="small" onClick={() => setVerification(b, 'reset')}>
                        <RestartAltIcon sx={{ color: '#ff9800' }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete booking">
                      <IconButton size="small" onClick={() => onDelete(b._id)}>
                        <DoNotDisturbAltIcon sx={{ color: '#999' }} />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Box>
  );
}