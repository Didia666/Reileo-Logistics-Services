import { useState } from 'react'
import Sidebar from './components/Sidebar'
import BookingsList from './components/BookingsList'
import BookingForm from './components/BookingForm'
import PayrollList from './components/PayrollList'
import PayrollForm from './components/PayrollForm'
import LicenseRenewalList from './components/LicenseRenewalList'
import LicenseRenewalForm from './components/LicenseRenewalForm'
import WorkOrderList from './components/WorkOrderList'
import WorkOrderForm from './components/WorkOrderForm'
import FuelRecordList from './components/FuelRecordList'
import FuelRecordForm from './components/FuelRecordForm'
import { LayoutDashboard, Home, ClipboardList, FileCheck, User, FileText, Fuel, BarChart3, AlertTriangle, Wrench, Boxes, Receipt } from 'lucide-react'

const MODULE_KEYS = [
  'bookings',
  'payroll',
  'license-renewal',
  'workorder',
  'fuel',
]

const DEFAULT_ACTIVE = 'bookings'

const Placeholder = ({ title, subtitle, icon: Icon }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 20px' }}>
      <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
        {Icon && <Icon size={48} style={{ marginBottom: 16, opacity: 0.5 }} />}
        <h2 style={{ color: 'var(--text-dark)', margin: '0 0 8px', fontSize: 22 }}>{title}</h2>
        <p style={{ margin: 0, fontSize: 14 }}>{subtitle}</p>
      </div>
    </div>
  )
}

export default function App() {
  const [activeKey, setActiveKey] = useState(DEFAULT_ACTIVE)
  const [view, setView] = useState('list')
  const [editingRecord, setEditingRecord] = useState(null)

  const goToList = () => {
    setView('list')
    setEditingRecord(null)
  }

  const goToAddForm = () => {
    setEditingRecord(null)
    setView('form')
  }

  const goToEditForm = (record) => {
    setEditingRecord(record)
    setView('form')
  }

  const handleNavigate = (key) => {
    if (key === activeKey) return
    const topLevelMap = {
      dashboard: ['dashboard'],
      home: ['home'],
      bookings: ['bookings'],
      billing: ['billing'],
      accounting: ['accounting'],
      assets: ['assets'],
      reminders: ['reminders'],
      incidents: ['incidents'],
      parts: ['parts'],
      workorder: ['workorder'],
      fuel: ['fuel'],
      reports: ['reports'],
      payroll: ['payroll'],
      'license-renewal': ['license-renewal'],
    }
    if (MODULE_KEYS.includes(key)) {
      setActiveKey(key)
      setView('list')
      setEditingRecord(null)
    } else if (topLevelMap[key]) {
      setActiveKey(key)
      setView('list')
      setEditingRecord(null)
    }
  }

  const handleSave = (formData) => {
    console.log(`[${activeKey}] Saving record:`, formData)
    goToList()
  }

  const renderMain = () => {
    if (activeKey === 'bookings') {
      return view === 'list' ? (
        <BookingsList onAddBooking={goToAddForm} onEditBooking={goToEditForm} />
      ) : (
        <BookingForm existingBooking={editingRecord} onCancel={goToList} onSave={handleSave} />
      )
    }

    if (activeKey === 'payroll') {
      return view === 'list' ? (
        <PayrollList onCreate={goToAddForm} onEdit={goToEditForm} />
      ) : (
        <PayrollForm existingPayroll={editingRecord} onCancel={goToList} onSave={handleSave} />
      )
    }

    if (activeKey === 'license-renewal') {
      return view === 'list' ? (
        <LicenseRenewalList onCreate={goToAddForm} onEdit={goToEditForm} />
      ) : (
        <LicenseRenewalForm existingRenewal={editingRecord} onCancel={goToList} onSave={handleSave} />
      )
    }

    if (activeKey === 'workorder') {
      return view === 'list' ? (
        <WorkOrderList onCreate={goToAddForm} onEdit={goToEditForm} />
      ) : (
        <WorkOrderForm existingWorkOrder={editingRecord} onCancel={goToList} onSave={handleSave} />
      )
    }

    if (activeKey === 'fuel') {
      return view === 'list' ? (
        <FuelRecordList onCreate={goToAddForm} onEdit={goToEditForm} />
      ) : (
        <FuelRecordForm existingFuelRecord={editingRecord} onCancel={goToList} onSave={handleSave} />
      )
    }

    const placeholders = {
      dashboard: { title: 'Dashboard', subtitle: 'Fleet overview and KPIs coming soon.', icon: LayoutDashboard },
      home: { title: 'Home', subtitle: 'Welcome landing page coming soon.', icon: Home },
      billing: { title: 'Billing Management', subtitle: 'Invoicing and AR module placeholder.', icon: Receipt },
      accounting: { title: 'Accounting Management', subtitle: 'Select Payroll or submenu items.', icon: FileCheck },
      assets: { title: 'Asset Management', subtitle: 'Vehicles and equipment placeholder.', icon: Boxes },
      reminders: { title: 'Reminders', subtitle: 'Select License Renewals or create more reminder types.', icon: User },
      incidents: { title: 'Incidents', subtitle: 'Accident and incident tracking coming soon.', icon: AlertTriangle },
      parts: { title: 'Inventory Management', subtitle: 'Spare parts and inventory management coming soon.', icon: Wrench },
      reports: { title: 'Reports', subtitle: 'Analytics and reports coming soon.', icon: BarChart3 },
    }

    const cfg = placeholders[activeKey] || { title: 'Coming Soon', subtitle: 'This module is a placeholder.', icon: ClipboardList }
    return <Placeholder {...cfg} />
  }

  return (
    <div className="app">
      <Sidebar activeKey={activeKey} onNavigate={handleNavigate} />
      <main className="main">{renderMain()}</main>
    </div>
  )
}
