import React, { useEffect, useState } from 'react';
import { Grid, Card, CardContent, Typography } from '@mui/material';
import { getStats } from '../../utils/api';

function DashboardTab() {
  const [stats, setStats] = useState({});

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const data = await getStats();
    setStats(data);
  };

  const cardStyle = {
    bgcolor: 'transparent',
    boxShadow: 'none'
  };

  return (
    <Grid container spacing={2} sx={{ mt: 3 }}>
      <Grid item xs={12} sm={4}>
        <Card sx={cardStyle}>
          <CardContent>
            <Typography variant="h6" sx={{ color: 'white' }}>Total Bookings</Typography>
            <Typography variant="h4" sx={{ color: 'lightgreen' }}>{stats.totalBookings}</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={4}>
        <Card sx={cardStyle}>
          <CardContent>
            <Typography variant="h6" sx={{ color: 'white' }}>Total Profit</Typography>
            <Typography variant="h4" sx={{ color: 'lightgreen' }}>฿{stats.totalProfit}</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={4}>
        <Card sx={cardStyle}>
          <CardContent>
            <Typography variant="h6" sx={{ color: 'white' }}>Active Bookings</Typography>
            <Typography variant="h4" sx={{ color: 'lightgreen' }}>{stats.activeBookings}</Typography>
          </CardContent>
        </Card>
      </Grid>

      {stats.profitByBike && Object.entries(stats.profitByBike).map(([bike, profit]) => (
        <Grid item xs={12} sm={6} md={4} key={bike}>
          <Card sx={cardStyle}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ color: 'white' }}>{bike}</Typography>
              <Typography variant="h6" sx={{ color: 'lightgreen' }}>฿{profit}</Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

export default DashboardTab;