import React from 'react';
import { Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Login from './components/Login.jsx';
import Sidebar from './components/Sidebar.jsx';
import BookingsList from './components/BookingsList.jsx';
import BookingForm from './components/BookingForm.jsx';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Loading…</div>;
  if (user) return <Navigate to="/bookings" replace />;
  return children;
}

function DashboardPlaceholder({ title }) {
  return (
    <div className="page-placeholder">
      <h2>{title}</h2>
      <p>This module is coming soon. <NavLink to="/bookings">Go to Bookings →</NavLink></p>
    </div>
  );
}

function Layout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/bookings" replace />} />
          <Route path="/dashboard" element={<DashboardPlaceholder title="Dashboard" />} />
          <Route path="/home" element={<DashboardPlaceholder title="Home" />} />
          <Route path="/bookings" element={<BookingsList />} />
          <Route path="/bookings/new" element={<BookingForm />} />
          <Route path="/bookings/:id/edit" element={<BookingForm />} />
          <Route path="/billing" element={<DashboardPlaceholder title="Billing Management" />} />
          <Route path="/assets" element={<DashboardPlaceholder title="Asset Management" />} />
          <Route path="/reminders" element={<DashboardPlaceholder title="Reminders" />} />
          <Route path="/incidents" element={<DashboardPlaceholder title="Incidents" />} />
          <Route path="/parts" element={<DashboardPlaceholder title="Parts Management" />} />
          <Route path="/work-orders" element={<DashboardPlaceholder title="Work Order" />} />
          <Route path="/fuel" element={<DashboardPlaceholder title="Fuel Record" />} />
          <Route path="/reports" element={<DashboardPlaceholder title="Reports" />} />
          <Route path="*" element={<Navigate to="/bookings" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
      <Route path="/*" element={<ProtectedRoute><Layout /></ProtectedRoute>} />
    </Routes>
  );
}
