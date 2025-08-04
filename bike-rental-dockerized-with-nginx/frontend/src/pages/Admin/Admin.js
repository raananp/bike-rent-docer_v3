// 📁 frontend/src/pages/Admin/Admin.js
import React, { useEffect, useState } from 'react';
import './Admin.css';
import {
  Typography, Tabs, Tab, Box
} from '@mui/material';
import DashboardTab from './DashboardTab';
import BookingInfoTab from './BookingInfoTab';
import UserPermissionsTab from './UserPermissionsTab';
import ManageBikeTab from './ManageBikeTab';
import { fetchStats, fetchUsers, fetchBookings, fetchBikeList, updateUserRole, addBike } from './api';
import { bikeOptions } from './constants';

function Admin() {
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [tab, setTab] = useState(0);
  const [bikeList, setBikeList] = useState([]);

  useEffect(() => {
    fetchStats().then(setStats);
    fetchUsers().then(setUsers);
    fetchBookings().then(setBookings);
    fetchBikeList().then(setBikeList);
  }, []);

  return (
    <div className="admin-container">
      <Typography variant="h4" gutterBottom sx={{ color: 'white' }}>📊 Admin Dashboard</Typography>

      <Tabs value={tab} onChange={(e, newVal) => setTab(newVal)} textColor="inherit" TabIndicatorProps={{ style: { background: '#4caf50' } }}>
        <Tab label="Dashboard" sx={{ color: 'white' }} />
        <Tab label="Booking Info" sx={{ color: 'white' }} />
        <Tab label="User Permissions" sx={{ color: 'white' }} />
        <Tab label="Manage Bike" sx={{ color: 'white' }} />
      </Tabs>

      {tab === 0 && <DashboardTab stats={stats} />}
      {tab === 1 && <BookingInfoTab bookings={bookings} />}
      {tab === 2 && <UserPermissionsTab users={users} updateUserRole={updateUserRole} />}
      {tab === 3 && <ManageBikeTab bikeList={bikeList} fetchBikeList={fetchBikeList} bikeOptions={bikeOptions} addBike={addBike} />}
    </div>
  );
}

export default Admin;
