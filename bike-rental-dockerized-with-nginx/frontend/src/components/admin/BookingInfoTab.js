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

function deriveOverall(passportStatus, licenseStatus) {
  const s1 = (passportStatus || '').toLowerCase();
  const s2 = (licenseStatus  || '').toLowerCase();
  if (s1 === 'failed' || s2 === 'failed') return 'failed';
  if (s1 === 'pending' || s2 === 'pending') return 'pending';
  if (s1 === 'skipped' && s2 === 'skipped') return 'skipped';
  return 'passed';
}

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
      const toComp = (v) => {
        if (v == null) return '';
        if (typeof v === 'string') {
          // try to parse dates in ISO
          const t = Date.parse(v);
          return isNaN(t) ? v : t;
        }
        if (v instanceof Date) return v.getTime();
        return v;
      };
      const aVal = toComp(valA);
      const bVal = toComp(valB);
      return sortConfig.direction === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
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
            // ✅ read from the backend structure
            const passObj = b.verification?.passport || {};
            const licObj  = b.verification?.license  || {};
            let passportStatus = passObj.status;
            let licenseStatus  = licObj.status;

            // fallback: if no verification yet but file exists, show pending
            if (!passportStatus) passportStatus = b.passportSignedUrl ? 'pending' : 'skipped';
            if (!licenseStatus)  licenseStatus  = b.licenseSignedUrl  ? 'pending' : 'skipped';

            const overall = b.verification?.status || deriveOverall(passportStatus, licenseStatus);

            return (
              <TableRow key={b._id}>
                <TableCell sx={{ color: 'white' }}>{b.firstName} {b.lastName}</TableCell>
                <TableCell sx={{ color: 'white' }}>{b.bike}</TableCell>
                <TableCell sx={{ color: 'white' }}>{new Date(b.startDateTime).toLocaleString()}</TableCell>
                <TableCell sx={{ color: 'white' }}>{new Date(b.endDateTime).toLocaleString()}</TableCell>
                <TableCell sx={{ color: 'white' }}>{b.numberOfDays}</TableCell>
                <TableCell sx={{ color: 'white' }}>{b.insurance ? 'Yes' : 'No'}</TableCell>
                <TableCell sx={{ color: 'white' }}>฿{b.totalPrice}</TableCell>

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
                  <Tooltip title={passObj.reason || '—'}>
                    <Chip size="small" label={passportStatus} color={statusColor(passportStatus)} />
                  </Tooltip>
                </TableCell>
                <TableCell sx={{ color: 'white' }}>
                  <Tooltip title={licObj.reason || '—'}>
                    <Chip size="small" label={licenseStatus} color={statusColor(licenseStatus)} />
                  </Tooltip>
                </TableCell>
                <TableCell sx={{ color: 'white' }}>
                  <Tooltip title={b.verification?.updatedAt ? new Date(b.verification.updatedAt).toLocaleString() : ''}>
                    <Chip size="small" label={overall} color={statusColor(overall)} />
                  </Tooltip>
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