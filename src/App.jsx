import React from 'react';
import { Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Login from './components/Login.jsx';
import Sidebar from './components/Sidebar.jsx';
import BookingsList from './components/BookingsList.jsx';
import BookingForm from './components/BookingForm.jsx';
import Vehicles from './components/Vehicles.jsx';
import VehiclesForm from './components/VehiclesForm.jsx';
import Settings from './components/Settings.jsx';
import Home from './components/Home.jsx';
import Customers from './components/Customers.jsx';
import Personnel from './components/Personnel.jsx';
import Logs from './components/Logs.jsx';
import Reports from './components/Reports.jsx';

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
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/dashboard" element={<DashboardPlaceholder title="Dashboard" />} />
          <Route path="/home" element={<Home />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/personnel" element={<Personnel />} />
          <Route path="/bookings" element={<BookingsList />} />
          <Route path="/bookings/new" element={<BookingForm />} />
          <Route path="/bookings/:id/edit" element={<BookingForm />} />
          <Route path="/billing" element={<DashboardPlaceholder title="Billing Management" />} />
          <Route path="/assets" element={<DashboardPlaceholder title="Asset Management" />} />
          <Route path="/vehicles" element={<Vehicles />} />
          <Route path="/vehicles/new" element={<VehiclesForm />} />
          <Route path="/vehicles/:id/edit" element={<VehiclesForm />} />
          <Route path="/vehicle" element={<Navigate to="/vehicles" replace />} />
          <Route path="/vehicle/new" element={<Navigate to="/vehicles/new" replace />} />
          <Route path="/vehicle/:id/edit" element={<Navigate to="/vehicles/:id/edit" replace />} />
          <Route path="/reminders" element={<DashboardPlaceholder title="Reminders" />} />
          <Route path="/incidents" element={<DashboardPlaceholder title="Incidents" />} />
          <Route path="/parts" element={<DashboardPlaceholder title="Parts Management" />} />
          <Route path="/work-orders" element={<DashboardPlaceholder title="Work Order" />} />
          <Route path="/fuel" element={<DashboardPlaceholder title="Fuel Record" />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/logs" element={<Logs />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/settings/:category" element={<Settings />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
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
