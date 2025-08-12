// ranan
import React, { useContext } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import Home from './pages/Home';
import Booking from './pages/Booking';
import Admin from './pages/Admin';
import Bikes from './pages/Bikes';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';

import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, AuthContext } from './context/AuthContext';
import VerifyEmail from './pages/VerifyEmail';

function AppRoutes() {
  const location = useLocation();
  const { loading } = useContext(AuthContext);

  if (loading) return null; // optionally show a spinner here

  return (
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
      </Routes>
    </AnimatePresence>
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