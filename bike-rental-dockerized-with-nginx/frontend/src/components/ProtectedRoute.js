// /frontend/src/components/ProtectedRoute.js
import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user } = useContext(AuthContext);

  if (!user) return <Navigate to="/signin" replace />;

  if (user.role !== 'admin') {
    alert("Access denied. Admins only.");
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;