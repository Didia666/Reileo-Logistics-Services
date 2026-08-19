import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  Truck, LayoutDashboard, Home, ClipboardList, Receipt, Car, Bell,
  AlertTriangle, Wrench, Package, Fuel, BarChart3, LogOut,
} from 'lucide-react';

const NAV = [
  { to: '/dashboard',    label: 'Dashboard',        Icon: LayoutDashboard },
  { to: '/home',         label: 'Home',             Icon: Home },
  { to: '/bookings',     label: 'Bookings',         Icon: ClipboardList },
  { to: '/billing',      label: 'Billing Mgmt',     Icon: Receipt },
  { to: '/assets',       label: 'Asset Mgmt',       Icon: Car },
  { to: '/reminders',    label: 'Reminders',        Icon: Bell },
  { to: '/incidents',    label: 'Incidents',        Icon: AlertTriangle },
  { to: '/parts',        label: 'Parts Mgmt',       Icon: Wrench },
  { to: '/work-orders',  label: 'Work Order',       Icon: Package },
  { to: '/fuel',         label: 'Fuel Record',      Icon: Fuel },
  { to: '/reports',      label: 'Reports',          Icon: BarChart3 },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="logo-box"><Truck size={18} /></div>
        <span>Reileo <br></br>Logistics Services</span>
      </div>
      <nav className="sidebar-nav">
        {NAV.map(({ to, label, Icon }) => (
          <NavLink key={to} to={to}>
            <Icon size={16} /> <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-user">
        <div className="u-name">{user?.username || 'User'}</div>
        <div className="u-role">{(user?.role || '').toUpperCase()}</div>
        <button onClick={handleLogout}>
          <LogOut size={12} style={{ verticalAlign: -2, marginRight: 6 }} />
          Logout
        </button>
      </div>
    </aside>
  );
}
