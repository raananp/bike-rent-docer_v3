import React from 'react';
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
import { AuthProvider } from './context/AuthContext';

function App() {
  const location = useLocation();

  return (
    <AuthProvider>
      <Navbar />

      {/* AnimatePresence outside Routes to preserve Navbar and prevent re-animations */}
      <AnimatePresence mode="wait" initial={false}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home />} />
          <Route path="/bikes" element={<Bikes />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/signin" element={<SignIn />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Admin />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AnimatePresence>
    </AuthProvider>
  );
}

export default App;