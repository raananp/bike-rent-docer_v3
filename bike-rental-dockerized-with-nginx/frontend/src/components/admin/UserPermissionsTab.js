import React, { useEffect, useState } from 'react';
import {
  Box, Table, TableHead, TableRow, TableCell, TableBody,
  Select, MenuItem
} from '@mui/material';
import { getUsers, updateUserRole } from '../../utils/api';

function UserPermissionsTab() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const data = await getUsers();
    setUsers(data);
  };

  const handleRoleChange = async (id, role) => {
    await updateUserRole(id, role);
    fetchUsers();
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ color: 'white' }}>Email</TableCell>
            <TableCell sx={{ color: 'white' }}>Role</TableCell>
            <TableCell sx={{ color: 'white' }}>Change</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((u) => (
            <TableRow key={u._id}>
              <TableCell sx={{ color: 'white' }}>{u.email}</TableCell>
              <TableCell sx={{ color: 'white' }}>{u.role}</TableCell>
              <TableCell>
                <Select
                  value={u.role}
                  onChange={(e) => handleRoleChange(u._id, e.target.value)}
                  sx={{ color: 'white' }}
                >
                  <MenuItem value="user">User</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </Select>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}

export default UserPermissionsTab;