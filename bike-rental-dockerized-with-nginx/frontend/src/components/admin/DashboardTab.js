import React, { useEffect, useMemo, useState } from 'react';
import {
  Grid, Card, CardContent, Typography, Box, LinearProgress, Chip, Divider, Tooltip, Skeleton
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import AttachMoneyOutlinedIcon from '@mui/icons-material/AttachMoneyOutlined';
import { getStats } from '../../utils/api';

function prettyBaht(n) {
  const num = Number(n || 0);
  return `฿${num.toLocaleString()}`;
}

function KpiCard({ title, value, icon = null, sub = null }) {
  return (
    <Card sx={{ bgcolor: 'rgba(255,255,255,0.04)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.08)' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          {icon}
          <Typography variant="subtitle2" sx={{ color: '#cfd8dc' }}>{title}</Typography>
        </Box>
        <Typography variant="h4" sx={{ color: 'lightgreen', lineHeight: 1.2 }}>
          {value ?? <Skeleton width={80} />}
        </Typography>
        {sub && <Typography variant="caption" sx={{ color: '#90a4ae' }}>{sub}</Typography>}
      </CardContent>
    </Card>
  );
}

export default function DashboardTab() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await getStats();
      setStats(data || {});
    } finally {
      setLoading(false);
    }
  };

  // Normalize profitByBike to an array of { bike, profit, bookings }
  const profitEntries = useMemo(() => {
    const pbb = stats?.profitByBike;
    if (!pbb) return [];

    // New shape (array of objects)
    if (Array.isArray(pbb)) {
      return pbb
        .map(r => ({
          bike: r.label ?? r.bike ?? 'Unknown',
          profit: Number(r.revenue ?? r.profit ?? 0),
          bookings: Number(r.bookings ?? 0),
        }))
        .sort((a, b) => b.profit - a.profit);
    }

    // Old shape (object map: { "Bike Name": number })
    return Object.entries(pbb)
      .map(([bike, profit]) => ({ bike, profit: Number(profit || 0), bookings: undefined }))
      .sort((a, b) => b.profit - a.profit);
  }, [stats]);

  const maxProfit = useMemo(() => profitEntries[0]?.profit || 0, [profitEntries]);

  // Optional derived: total revenue fallback if backend didn’t send it
  const totalRevenue = stats?.totalRevenue ?? stats?.totalProfit ?? 0;

  return (
    <Grid container spacing={2} sx={{ mt: 3 }}>
      {/* KPI row */}
      <Grid item xs={12} sm={6} md={3}>
        <KpiCard
          title="Total Bookings"
          value={!loading ? stats?.totalBookings : null}
          icon={<TwoWheelerIcon sx={{ color: '#b2fab4' }} />}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <KpiCard
          title="Total Revenue"
          value={!loading ? prettyBaht(totalRevenue) : null}
          icon={<AttachMoneyOutlinedIcon sx={{ color: '#b2fab4' }} />}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <KpiCard
          title="Total Profit"
          value={!loading ? prettyBaht(stats?.totalProfit || 0) : null}
          icon={<TrendingUpIcon sx={{ color: '#b2fab4' }} />}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <KpiCard
          title="Active Bookings"
          value={!loading ? stats?.activeBookings : null}
          icon={<AssignmentTurnedInIcon sx={{ color: '#b2fab4' }} />}
        />
      </Grid>

      {/* Optional insights row */}
      {Boolean(stats?.insuranceUptakePct) || Boolean(stats?.verificationPassRate) || Boolean(stats?.deliveryBreakdown) ? (
        <>
          <Grid item xs={12} md={4}>
            <Card sx={{ bgcolor: 'rgba(255,255,255,0.04)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.08)' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <ShieldOutlinedIcon sx={{ color: '#b2fab4' }} />
                  <Typography variant="subtitle1" sx={{ color: '#eceff1' }}>Insurance Uptake</Typography>
                </Box>
                <Typography variant="h5" sx={{ color: 'lightgreen', mb: 1 }}>
                  {stats?.insuranceUptakePct != null ? `${stats.insuranceUptakePct}%` : <Skeleton width={80} />}
                </Typography>
                {!!stats?.insuranceUptakePct && (
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(100, Math.max(0, Number(stats.insuranceUptakePct)))}
                    sx={{ height: 8, borderRadius: 5 }}
                  />
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ bgcolor: 'rgba(255,255,255,0.04)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.08)' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <AssignmentTurnedInIcon sx={{ color: '#b2fab4' }} />
                  <Typography variant="subtitle1" sx={{ color: '#eceff1' }}>Verification Pass Rate</Typography>
                </Box>
                <Typography variant="h5" sx={{ color: 'lightgreen', mb: 1 }}>
                  {stats?.verificationPassRate != null ? `${stats.verificationPassRate}%` : <Skeleton width={80} />}
                </Typography>
                {!!stats?.verificationPassRate && (
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(100, Math.max(0, Number(stats.verificationPassRate)))}
                    sx={{ height: 8, borderRadius: 5 }}
                  />
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ bgcolor: 'rgba(255,255,255,0.04)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.08)' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <LocalShippingOutlinedIcon sx={{ color: '#b2fab4' }} />
                  <Typography variant="subtitle1" sx={{ color: '#eceff1' }}>Delivery Mix</Typography>
                </Box>
                {stats?.deliveryBreakdown ? (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {Object.entries(stats.deliveryBreakdown).map(([k, v]) => (
                      <Chip key={k} size="small" label={`${k.replace(/_/g, ' ')}: ${v}`} sx={{ bgcolor: 'rgba(255,255,255,0.06)', color: '#e0f2f1' }} />
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" sx={{ color: '#90a4ae' }}>—</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </>
      ) : null}

      {/* Profit by Bike */}
      <Grid item xs={12}>
        <Card sx={{ bgcolor: 'rgba(255,255,255,0.04)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.08)' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="h6" sx={{ color: 'white' }}>Profit by Bike</Typography>
              <Tooltip title="Names are normalized server‑side so similar bikes roll up.">
                <Typography variant="caption" sx={{ color: '#90a4ae' }}>Hover for tip</Typography>
              </Tooltip>
            </Box>
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 2 }} />

            {loading ? (
              [...Array(5)].map((_, i) => (
                <Box key={i} sx={{ mb: 2 }}>
                  <Skeleton width={220} />
                  <Skeleton variant="rectangular" height={10} />
                </Box>
              ))
            ) : profitEntries.length ? (
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2 }}>
                {profitEntries.map(({ bike, profit, bookings }) => {
                  const pct = maxProfit ? (profit / maxProfit) * 100 : 0;
                  return (
                    <Box key={bike} sx={{ mb: 1.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography sx={{ color: '#e0e0e0' }}>
                          {bike}
                          {typeof bookings === 'number' && (
                            <Typography component="span" sx={{ color: '#9fb3c8', ml: 1, fontSize: 12 }}>
                              ({bookings} booking{bookings === 1 ? '' : 's'})
                            </Typography>
                          )}
                        </Typography>
                        <Typography sx={{ color: 'lightgreen' }}>{prettyBaht(profit)}</Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(100, pct)}
                        sx={{ height: 8, borderRadius: 5 }}
                      />
                    </Box>
                  );
                })}
              </Box>
            ) : (
              <Typography sx={{ color: '#90a4ae' }}>No data yet.</Typography>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}