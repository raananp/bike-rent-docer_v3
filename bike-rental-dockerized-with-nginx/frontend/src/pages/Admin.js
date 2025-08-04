
import React, { useState } from 'react';
import { Tabs, Tab, Typography } from '@mui/material';
import DashboardTab from '../components/admin/DashboardTab';
import BookingInfoTab from '../components/admin/BookingInfoTab';
import UserPermissionsTab from '../components/admin/UserPermissionsTab';
import ManageBikeTab from '../components/admin/ManageBikeTab';
import './Admin.css';

function Admin() {
  const [tab, setTab] = useState(0);

  return (
    <div className="admin-container">
      <Typography variant="h4" gutterBottom sx={{ color: 'white' }}>📊 Admin Dashboard</Typography>
      <Tabs
        value={tab}
        onChange={(e, newVal) => setTab(newVal)}
        textColor="inherit"
        TabIndicatorProps={{ style: { background: '#4caf50' } }}
      >
        <Tab label="Dashboard" sx={{ color: 'white' }} />
        <Tab label="Booking Info" sx={{ color: 'white' }} />
        <Tab label="User Permissions" sx={{ color: 'white' }} />
        <Tab label="Manage Bike" sx={{ color: 'white' }} />
      </Tabs>

      {tab === 0 && <DashboardTab />}
      {tab === 1 && <BookingInfoTab />}
      {tab === 2 && <UserPermissionsTab />}
      {tab === 3 && <ManageBikeTab />}
    </div>
  );
}

export default Admin;