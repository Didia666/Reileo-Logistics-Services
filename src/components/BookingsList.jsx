import { useState, useMemo } from 'react'
import { Plus, Filter, ChevronDown, Eye, Pencil, XCircle } from 'lucide-react'
import { STATUS_TABS, BOOKINGS } from '../data/mockData'
import StatusBadge from './StatusBadge'

export default function BookingsList({ onAddBooking, onEditBooking }) {
  const [activeTab, setActiveTab] = useState('All')
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [openMenuId, setOpenMenuId] = useState(null)

  const filtered = useMemo(() => {
    if (activeTab === 'All') return BOOKINGS
    return BOOKINGS.filter((b) => b.status === activeTab)
  }, [activeTab])

  const visible = filtered.slice(0, itemsPerPage)

  return (
    <div onClick={() => setOpenMenuId(null)}>
      <div className="page-header">
        <h1 className="page-title">Bookings ({BOOKINGS.length})</h1>
        <div className="header-actions">
          <button className="btn btn-green" onClick={onAddBooking}>
            <Plus /> Add Booking
          </button>
          <button className="btn btn-blue">
            <Filter /> Filter <ChevronDown />
          </button>
        </div>
      </div>

      <div className="status-tabs">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            className={`tab${activeTab === tab ? ' active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="table-toolbar">
        <span>Items per page:</span>
        <select value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))}>
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Booking No.</th>
              <th>Delivery Date</th>
              <th>Customer</th>
              <th>Type</th>
              <th>Depot</th>
              <th>Origin</th>
              <th>Trucker</th>
              <th>Plate No.</th>
              <th>Client Ref No.</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((b) => (
              <tr key={b.id}>
                <td className="booking-no">{b.bookingNo}</td>
                <td>{b.deliveryDate}</td>
                <td>{b.customer}</td>
                <td>
                  <span className="type-pill">{b.type}</span>
                </td>
                <td>{b.depot}</td>
                <td>{b.origin}</td>
                <td>{b.trucker}</td>
                <td>{b.plateNo}</td>
                <td className={b.clientRefNo ? '' : 'empty-cell'}>{b.clientRefNo || '—'}</td>
                <td>
                  <StatusBadge status={b.status} />
                </td>
                <td className="action-cell">
                  <button
                    className="action-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      setOpenMenuId(openMenuId === b.id ? null : b.id)
                    }}
                  >
                    Select <ChevronDown />
                  </button>
                  {openMenuId === b.id && (
                    <div className="action-menu" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => setOpenMenuId(null)}>
                        <Eye size={13} style={{ marginRight: 6, verticalAlign: -2 }} />
                        View
                      </button>
                      <button
                        onClick={() => {
                          setOpenMenuId(null)
                          onEditBooking(b)
                        }}
                      >
                        <Pencil size={13} style={{ marginRight: 6, verticalAlign: -2 }} />
                        Update
                      </button>
                      <button className="danger" onClick={() => setOpenMenuId(null)}>
                        <XCircle size={13} style={{ marginRight: 6, verticalAlign: -2 }} />
                        Cancel
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={11} className="no-results">
                  No bookings found for this status.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
