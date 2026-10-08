import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  LayoutDashboard, Home, ClipboardList, Receipt, Car, Bell,
  AlertTriangle, Wrench, Package, Fuel, BarChart3, FileText, LogOut, Settings2, Users, UserCheck, UserCog,
} from 'lucide-react';
import AccountManagementModal from './AccountManagementModal.jsx';

const NAV = [
  { to: '/dashboard',    label: 'Dashboard',        Icon: LayoutDashboard },
  { to: '/home',         label: 'Home',             Icon: Home },
  { to: '/bookings',     label: 'Bookings',         Icon: ClipboardList },
  { to: '/customers',    label: 'Customers',        Icon: Users },
  { to: '/vendors',      label: 'Vendors',          Icon: Users },
  { to: '/personnel',    label: 'Personnel',        Icon: UserCheck },
  //{ to: '/billing',      label: 'Billing Mgmt',     Icon: Receipt },
  //{ to: '/assets',       label: 'Asset Mgmt',       Icon: Car },
  { to: '/vehicles',     label: 'Vehicles',         Icon: Car },
  //{ to: '/reminders',    label: 'Reminders',        Icon: Bell },
  //{ to: '/incidents',    label: 'Incidents',        Icon: AlertTriangle },
  //{ to: '/parts',        label: 'Parts Mgmt',       Icon: Wrench },
  //{ to: '/work-orders',  label: 'Work Order',       Icon: Package },
  //{ to: '/fuel',         label: 'Fuel Record',      Icon: Fuel },
  { to: '/reports',      label: 'Reports',          Icon: BarChart3 },
  { to: '/logs',         label: 'Logs',             Icon: FileText },
  { to: '/settings',     label: 'Settings',         Icon: Settings2 },
];

export default function Sidebar() {
  const { user, logout, refresh } = useAuth();
  const navigate = useNavigate();
  const [accountOpen, setAccountOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <>
    <aside className="sidebar">
      <div className="sidebar-brand">
        <img src="/logo.png" alt="Reileo Logistics Services" />
      </div>
      <nav className="sidebar-nav">
        {NAV.map(({ to, label, Icon }) => (
          <NavLink key={to} to={to}>
            <Icon size={16} /> <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-user">
        <button
          type="button"
          className="sidebar-account-trigger"
          onClick={() => setAccountOpen(true)}
        >
          <UserCog size={15} />
          <span>
            <span className="u-name">{user?.username || 'User'}</span>
            <span className="u-role">Manage account</span>
          </span>
        </button>
        <button onClick={handleLogout}>
          <LogOut size={12} style={{ verticalAlign: -2, marginRight: 6 }} />
          Logout
        </button>
      </div>
    </aside>
    <AccountManagementModal
      isOpen={accountOpen}
      onClose={() => setAccountOpen(false)}
      onUpdated={refresh}
    />
    </>
  );
}
