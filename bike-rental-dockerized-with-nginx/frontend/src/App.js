import React, { useContext, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import Home from './pages/Home';
import Booking from './pages/Booking';
import Admin from './pages/Admin';
import Bikes from './pages/Bikes';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import VerifyEmail from './pages/VerifyEmail';
import SettingsSecurity from './pages/SettingsSecurity'; // NEW

import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { trackPageView } from './utils/analytics';

function RouteTracker() {
  const { pathname } = useLocation();
  useEffect(() => {
    trackPageView(pathname);
  }, [pathname]);
  return null;
}

function AppRoutes() {
  const location = useLocation();
  const { loading } = useContext(AuthContext);

  if (loading) return null; // optionally render a spinner or splash here

  return (
    <>
      {/* Track page views OUTSIDE <Routes> */}
      <RouteTracker />

      <AnimatePresence mode="wait" initial={false}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home />} />
          <Route path="/bikes" element={<Bikes />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          {/* 🔒 Booking requires any logged-in user */}
          <Route
            path="/booking"
            element={
              <ProtectedRoute>
                <Booking />
              </ProtectedRoute>
            }
          />

          {/* 🔒 Settings (Security) requires login */}
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsSecurity />
              </ProtectedRoute>
            }
          />

          <Route path="/signup" element={<SignUp />} />
          <Route path="/signin" element={<SignIn />} />

          {/* 🔒 Admin requires role=admin */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <Admin />
              </ProtectedRoute>
            }
          />

          {/* 404 fallback: send unknown routes home */}
          <Route path="*" element={<Home />} />
        </Routes>
      </AnimatePresence>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Navbar />
      <AppRoutes />
    </AuthProvider>
  );
}