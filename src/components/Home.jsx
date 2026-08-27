import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Receipt,
  AlertTriangle,
  Car,
  Users,
  UserCog,
  Building2,
  UserCheck,
  Truck,
  ClipboardList,
  FileBarChart,
} from 'lucide-react';

const SHORTCUTS = [
  [
    { label: 'BOOKINGS', route: '/bookings', Icon: BarChart3, color: '#4FC3F7' },
    { label: 'CLIENT BILLING', route: '/billing', Icon: Receipt, color: '#29B6F6' },
    { label: 'INCIDENTS', route: '/incidents', Icon: AlertTriangle, color: '#039BE5' },
    { label: 'VEHICLES', route: '/vehicles', Icon: Car, color: '#0288D1' },
    { label: 'CUSTOMERS', route: '/customers', Icon: Users, color: '#0277BD' },
  ],
  [
    { label: 'USERS', route: '/settings/users', Icon: UserCog, color: '#0277BD' },
    { label: 'VENDORS', route: '/settings/vendors', Icon: Building2, color: '#0288D1' },
    { label: 'PERSONNEL', route: '/settings/personnel', Icon: UserCheck, color: '#039BE5' },
    { label: 'CLIENT TRUCKER RATES', route: '/billing', Icon: Truck, color: '#29B6F6' },
    { label: 'WORK ORDER', route: '/work-orders', Icon: ClipboardList, color: '#4FC3F7' },
  ],
  [
    { label: 'REPORTS', route: '/reports', Icon: FileBarChart, color: '#0288D1' },
  ],
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      <div className="page-header">
        <div>
          <div className="breadcrumb">Dashboard / Home</div>
          <h2>Home</h2>
          <div style={{ color: '#6b7280', fontSize: 13 }}>
            Quick access to all modules
          </div>
        </div>
      </div>

      <div className="home-shortcuts">
        {SHORTCUTS.map((row, rowIdx) => (
          <div key={rowIdx} className="home-shortcut-row">
            {row.map(({ label, route, Icon, color }) => (
              <button
                key={label}
                className="shortcut-card"
                onClick={() => navigate(route)}
              >
                <div className="shortcut-icon" style={{ background: color }}>
                  <Icon size={28} color="#fff" />
                </div>
                <div className="shortcut-label">{label}</div>
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
