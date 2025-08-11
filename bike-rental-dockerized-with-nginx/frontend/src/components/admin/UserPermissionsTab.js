import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Card, CardHeader, CardContent, Table, TableHead, TableRow, TableCell,
  TableBody, Select, MenuItem, IconButton, Chip, TextField, InputAdornment,
  Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Button, CircularProgress,
  Avatar, Stack, TablePagination, Switch, FormControlLabel, TableSortLabel
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import { getUsers, updateUserRole, deleteUser } from '../../utils/api';

const chipForRole = (role) =>
  role === 'admin'
    ? <Chip size="small" icon={<AdminPanelSettingsIcon />} label="Admin" color="secondary" variant="filled" />
    : <Chip size="small" icon={<PersonOutlineIcon />} label="User" color="default" variant="outlined" />;

function getComparator(order, orderBy) {
  return (a, b) => {
    const va = (a?.[orderBy] ?? '').toString().toLowerCase();
    const vb = (b?.[orderBy] ?? '').toString().toLowerCase();
    if (va < vb) return order === 'asc' ? -1 : 1;
    if (va > vb) return order === 'asc' ? 1 : -1;
    return 0;
  };
}

export default function UserPermissionsTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [orderBy, setOrderBy] = useState('firstName');
  const [order, setOrder] = useState('asc');

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dense, setDense] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [savingRoleId, setSavingRoleId] = useState(null);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await getUsers();
      setUsers(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  const initials = (u) =>
    `${(u.firstName || '?')[0] || ''}${(u.lastName || '')[0] || ''}`.toUpperCase();

  const handleRoleChange = async (id, role) => {
    try {
      setSavingRoleId(id);
      await updateUserRole(id, role);
      await fetchUsers();
    } finally {
      setSavingRoleId(null);
    }
  };

  const askDelete = (u) => { setToDelete(u); setConfirmOpen(true); };
  const closeConfirm = () => { setConfirmOpen(false); setToDelete(null); };
  const doDelete = async () => {
    if (!toDelete?._id) return;
    await deleteUser(toDelete._id);
    closeConfirm();
    fetchUsers();
  };

  // Filter + sort
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let arr = users;
    if (q) {
      arr = arr.filter(u =>
        `${u.firstName || ''} ${u.lastName || ''} ${u.email} ${u.role}`
          .toLowerCase()
          .includes(q)
      );
    }
    return [...arr].sort(getComparator(order, orderBy));
  }, [users, search, order, orderBy]);

  // Pagination slice
  const paged = useMemo(() => {
    const start = page * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, page, rowsPerPage]);

  const handleRequestSort = (key) => {
    if (orderBy === key) setOrder(order === 'asc' ? 'desc' : 'asc');
    else { setOrderBy(key); setOrder('asc'); }
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Card
        sx={{
          bgcolor: 'rgba(18,18,18,0.6)',
          borderRadius: 3,
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(6px)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.35)'
        }}
      >
        <CardHeader
          title="User Permissions"
          action={
            <Stack direction="row" spacing={1} alignItems="center">
              <FormControlLabel
                label="Dense"
                labelPlacement="start"
                control={
                  <Switch
                    checked={dense}
                    onChange={(e) => setDense(e.target.checked)}
                    size="small"
                  />
                }
                sx={{ color: '#bbb', mr: 1 }}
              />
              <Tooltip title="Refresh">
                <IconButton onClick={fetchUsers} sx={{ color: 'white' }}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          }
          sx={{ color: 'white', pb: 0.5 }}
        />
        <CardContent sx={{ pt: 1.5 }}>
          <Box sx={{ mb: 2 }}>
            <TextField
              placeholder="Search by name, email, or role…"
              variant="outlined"
              size="small"
              fullWidth
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#aaa' }} />
                  </InputAdornment>
                ),
                sx: {
                  color: 'white',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.35)' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#90ee90' },
                }
              }}
              InputLabelProps={{ sx: { color: '#bbb' } }}
            />
          </Box>

          <Box sx={{ overflow: 'auto' }}>
            <Table
              stickyHeader
              size={dense ? 'small' : 'medium'}
              sx={{
                minWidth: 860,
                '& .MuiTableCell-stickyHeader': {
                  bgcolor: 'rgba(30,30,30,0.9)',
                  color: 'white',
                  backdropFilter: 'blur(4px)',
                }
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: 'white', width: 56 }} />
                  <TableCell sortDirection={orderBy === 'firstName' ? order : false}>
                    <TableSortLabel
                      active={orderBy === 'firstName'}
                      direction={orderBy === 'firstName' ? order : 'asc'}
                      onClick={() => handleRequestSort('firstName')}
                      sx={{ color: 'white',
                        '&.Mui-active': { color: 'white' },
                        '& .MuiTableSortLabel-icon': { color: 'white !important' } }}
                    >
                      First Name
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sortDirection={orderBy === 'lastName' ? order : false}>
                    <TableSortLabel
                      active={orderBy === 'lastName'}
                      direction={orderBy === 'lastName' ? order : 'asc'}
                      onClick={() => handleRequestSort('lastName')}
                      sx={{ color: 'white',
                        '&.Mui-active': { color: 'white' },
                        '& .MuiTableSortLabel-icon': { color: 'white !important' } }}
                    >
                      Last Name
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sortDirection={orderBy === 'email' ? order : false}>
                    <TableSortLabel
                      active={orderBy === 'email'}
                      direction={orderBy === 'email' ? order : 'asc'}
                      onClick={() => handleRequestSort('email')}
                      sx={{ color: 'white',
                        '&.Mui-active': { color: 'white' },
                        '& .MuiTableSortLabel-icon': { color: 'white !important' } }}
                    >
                      Email
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sortDirection={orderBy === 'role' ? order : false}>
                    <TableSortLabel
                      active={orderBy === 'role'}
                      direction={orderBy === 'role' ? order : 'asc'}
                      onClick={() => handleRequestSort('role')}
                      sx={{ color: 'white',
                        '&.Mui-active': { color: 'white' },
                        '& .MuiTableSortLabel-icon': { color: 'white !important' } }}
                    >
                      Role
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ color: 'white', minWidth: 220 }}>Change Role</TableCell>
                  <TableCell sx={{ color: 'white', width: 80 }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ color: '#bbb', py: 6 }}>
                      <CircularProgress size={28} sx={{ color: '#90ee90' }} />
                    </TableCell>
                  </TableRow>
                ) : paged.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ color: '#bbb', py: 6 }}>
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  paged.map((u) => (
                    <TableRow
                      key={u._id}
                      sx={{
                        '&:nth-of-type(odd)': { backgroundColor: 'rgba(255,255,255,0.02)' },
                        '&:hover': { backgroundColor: 'rgba(144,238,144,0.08)' },
                        transition: 'background-color 180ms ease'
                      }}
                    >
                      <TableCell>
                        <Avatar
                          sx={{
                            width: 32, height: 32, fontSize: 13,
                            bgcolor: u.role === 'admin' ? 'secondary.main' : 'grey.800',
                            color: 'white',
                            border: '1px solid rgba(255,255,255,0.15)'
                          }}
                        >
                          {initials(u)}
                        </Avatar>
                      </TableCell>
                      <TableCell sx={{ color: 'white' }}>{u.firstName || '-'}</TableCell>
                      <TableCell sx={{ color: 'white' }}>{u.lastName || '-'}</TableCell>
                      <TableCell sx={{ color: 'white', fontFamily: 'ui-monospace, Menlo, monospace' }}>
                        {u.email}
                      </TableCell>
                      <TableCell sx={{ color: 'white' }}>
                        {chipForRole(u.role)}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Select
                            size="small"
                            value={u.role}
                            onChange={(e) => handleRoleChange(u._id, e.target.value)}
                            disabled={savingRoleId === u._id}
                            sx={{
                              minWidth: 140,
                              color: 'white',
                              '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.35)' },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#90ee90' },
                              '.MuiSvgIcon-root': { color: 'white' }
                            }}
                          >
                            <MenuItem value="user">User</MenuItem>
                            <MenuItem value="admin">Admin</MenuItem>
                          </Select>

                          {u.role !== 'admin' ? (
                            <Tooltip title="Make Admin">
                              <span>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => handleRoleChange(u._id, 'admin')}
                                  disabled={savingRoleId === u._id}
                                  startIcon={<AdminPanelSettingsIcon />}
                                  sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.2)' }}
                                >
                                  Admin
                                </Button>
                              </span>
                            </Tooltip>
                          ) : (
                            <Tooltip title="Make User">
                              <span>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => handleRoleChange(u._id, 'user')}
                                  disabled={savingRoleId === u._id}
                                  startIcon={<PersonOutlineIcon />}
                                  sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.2)' }}
                                >
                                  User
                                </Button>
                              </span>
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Delete user">
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => askDelete(u)}
                              sx={{ color: 'rgba(255,255,255,0.8)' }}
                            >
                              <DeleteOutlineIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Box>

          <TablePagination
            component="div"
            count={filtered.length}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[5, 10, 25, 50]}
            sx={{
              color: 'white',
              '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': { color: '#bbb' },
              '.MuiSvgIcon-root': { color: 'white' }
            }}
          />
        </CardContent>
      </Card>

      {/* Confirm delete dialog */}
      <Dialog open={confirmOpen} onClose={closeConfirm}>
        <DialogTitle>Delete user?</DialogTitle>
        <DialogContent>
          {toDelete ? (
            <Box sx={{ mt: 1 }}>
              This will permanently remove <b>{toDelete.email}</b>.
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeConfirm}>Cancel</Button>
          <Button color="error" variant="contained" onClick={doDelete} startIcon={<DeleteOutlineIcon />}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}