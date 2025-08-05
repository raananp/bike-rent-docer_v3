import React, { useState } from 'react';
import { Tabs, Tab, Typography, Box } from '@mui/material';
import SwipeableViews from 'react-swipeable-views';
import DashboardTab from '../components/admin/DashboardTab';
import BookingInfoTab from '../components/admin/BookingInfoTab';
import UserPermissionsTab from '../components/admin/UserPermissionsTab';
import ManageBikeTab from '../components/admin/ManageBikeTab';
import './Admin.css';

function Admin() {
  const [tab, setTab] = useState(0);

  const handleChange = (event, newValue) => {
    setTab(newValue);
  };

  const handleSwipeChange = (index) => {
    setTab(index);
  };

  return (
    <div className="admin-container">
      <Typography variant="h4" gutterBottom sx={{ color: 'white' }}>📊 Admin Dashboard</Typography>
      
      <Tabs
        value={tab}
        onChange={handleChange}
        variant="scrollable"
        scrollButtons="auto"
        textColor="inherit"
        TabIndicatorProps={{ style: { background: '#4caf50' } }}
      >
        <Tab label="Dashboard" sx={{ color: 'white' }} />
        <Tab label="Booking Info" sx={{ color: 'white' }} />
        <Tab label="User Permissions" sx={{ color: 'white' }} />
        <Tab label="Manage Bike" sx={{ color: 'white' }} />
      </Tabs>

      <SwipeableViews index={tab} onChangeIndex={handleSwipeChange}>
        <Box sx={{ p: 2 }}><DashboardTab /></Box>
        <Box sx={{ p: 2 }}><BookingInfoTab /></Box>
        <Box sx={{ p: 2 }}><UserPermissionsTab /></Box>
        <Box sx={{ p: 2 }}><ManageBikeTab /></Box>
      </SwipeableViews>
    </div>
  );
}

export default Admin;