import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

// Usage:
// <ProtectedRoute><Booking /></ProtectedRoute>
// <ProtectedRoute requiredRole="admin"><Admin /></ProtectedRoute>
export default function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading) return null; // or a spinner component

  // Not logged in → go to Sign In and remember where they came from
  if (!user) {
    return <Navigate to="/signin" replace state={{ from: location }} />;
  }

  // If a role is required (e.g., "admin") and user doesn't have it
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return children;
}