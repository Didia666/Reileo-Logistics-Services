import { useState } from 'react'
import {
  LayoutDashboard,
  Home,
  ClipboardList,
  Receipt,
  Boxes,
  Bell,
  AlertTriangle,
  Wrench,
  FileText,
  Fuel,
  BarChart3,
  ChevronRight,
  ChevronDown,
  Truck,
  Wallet,
  User,
  FileCheck,
} from 'lucide-react'

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'home', label: 'Home', icon: Home },
  { key: 'bookings', label: 'Bookings', icon: ClipboardList },
  {
    key: 'accounting',
    label: 'Accounting Management',
    icon: Wallet,
    collapsible: true,
    children: [
      { key: 'payroll', label: 'Payroll', icon: FileCheck },
    ],
  },
  { key: 'assets', label: 'Asset Management', icon: Boxes, collapsible: true },
  {
    key: 'reminders',
    label: 'Reminders',
    icon: Bell,
    collapsible: true,
    children: [
      { key: 'license-renewal', label: 'License Renewals', icon: User },
    ],
  },
  { key: 'incidents', label: 'Incidents', icon: AlertTriangle },
  { key: 'parts', label: 'Inventory Management', icon: Wrench, collapsible: true },
  { key: 'workorder', label: 'Work Order', icon: FileText },
  { key: 'fuel', label: 'Fuel Records', icon: Fuel },
  { key: 'reports', label: 'Reports', icon: BarChart3 },
]

export default function Sidebar({ activeKey, onNavigate }) {
  const [openGroups, setOpenGroups] = useState({
    accounting: true,
    reminders: true,
    'fuel-group': true,
  })

  const toggleGroup = (key) => (e) => {
    e.stopPropagation()
    setOpenGroups((g) => ({ ...g, [key]: !g[key] }))
  }

  const isChildActive = (item) =>
    item.children?.some((c) => c.key === activeKey) || false

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <Truck size={20} />
        <span>Smartfleet</span>
      </div>

      {NAV_ITEMS.map((item) => {
        const Icon = item.icon
        const isActive = item.key === activeKey
        const groupOpen = !!openGroups[item.key]
        const hasChildActive = isChildActive(item)

        return (
          <div key={item.key}>
            <div
              className={`nav-item${isActive || hasChildActive ? ' active' : ''}`}
              onClick={() => onNavigate(item.key)}
            >
              <Icon className="nav-icon" />
              <span className="nav-label">{item.label}</span>
              {item.collapsible && (
                <span onClick={toggleGroup(item.key)}>
                  {groupOpen ? (
                    <ChevronDown className="nav-chevron" />
                  ) : (
                    <ChevronRight className="nav-chevron" />
                  )}
                </span>
              )}
            </div>
            {item.collapsible && groupOpen && item.children && (
              <div className="nav-submenu">
                {item.children.map((child) => {
                  const ChildIcon = child.icon
                  const childActive = child.key === activeKey
                  return (
                    <div
                      key={child.key}
                      className={`nav-item nav-subitem${childActive ? ' active' : ''}`}
                      onClick={() => onNavigate(child.key)}
                    >
                      <ChildIcon className="nav-icon" />
                      <span className="nav-label">{child.label}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </aside>
  )
}
