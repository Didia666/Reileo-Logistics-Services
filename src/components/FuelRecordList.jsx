import { useState, useMemo } from 'react'
import { Plus, Filter, ChevronDown, Eye, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { FUEL_STATUS_TABS, FUEL_RECORDS } from '../data/mockData'
import StatusBadge from './StatusBadge'

export default function FuelRecordList({ onCreate, onEdit }) {
  const [activeTab, setActiveTab] = useState('All')
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [openMenuId, setOpenMenuId] = useState(null)
  const [filterRefNo, setFilterRefNo] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const filtered = useMemo(() => {
    let result = FUEL_RECORDS
    if (activeTab !== 'All') {
      result = result.filter((r) => r.status === activeTab)
    }
    if (filterRefNo) {
      result = result.filter((r) => r.fuelNo.toLowerCase().includes(filterRefNo.toLowerCase()))
    }
    return result
  }, [activeTab, filterRefNo])

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage))
  const startIdx = (currentPage - 1) * itemsPerPage
  const visible = filtered.slice(startIdx, startIdx + itemsPerPage)

  return (
    <div onClick={() => setOpenMenuId(null)}>
      <div className="page-header">
        <h1 className="page-title">Fuel Records ({FUEL_RECORDS.length})</h1>
        <div className="header-actions">
          <button className="btn btn-green" onClick={onCreate}>
            <Plus /> Create Fuel Record
          </button>
          <button className="btn btn-outline">
            Options <ChevronDown />
          </button>
        </div>
      </div>

      <div className="status-tabs">
        {FUEL_STATUS_TABS.map((tab) => (
          <button
            key={tab}
            className={`tab${activeTab === tab ? ' active' : ''}`}
            onClick={() => {
              setActiveTab(tab)
              setCurrentPage(1)
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="table-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Filter size={14} />
          <span>Filter:</span>
          <input
            type="text"
            placeholder="Fuel Ref. No."
            value={filterRefNo}
            onChange={(e) => {
              setFilterRefNo(e.target.value)
              setCurrentPage(1)
            }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>Items per page:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value))
              setCurrentPage(1)
            }}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Fuel Ref. No.</th>
              <th>Date Filed</th>
              <th>Depot</th>
              <th>Plate No.</th>
              <th>Driver</th>
              <th>Fuel Type</th>
              <th>Liters</th>
              <th>Amount</th>
              <th>Odometer</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr key={r.id}>
                <td className="booking-no">{r.fuelNo}</td>
                <td>{r.dateFiled}</td>
                <td>{r.depot}</td>
                <td>{r.plateNo}</td>
                <td>{r.driver}</td>
                <td>{r.fuelType}</td>
                <td className="num-cell">{r.liters.toLocaleString()}</td>
                <td className="amount-cell">₱{r.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="num-cell">{r.odometer.toLocaleString()}</td>
                <td>
                  <StatusBadge status={r.status} />
                </td>
                <td className="action-cell">
                  <button
                    className="action-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      setOpenMenuId(openMenuId === r.id ? null : r.id)
                    }}
                  >
                    Select <ChevronDown />
                  </button>
                  {openMenuId === r.id && (
                    <div className="action-menu" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => setOpenMenuId(null)}>
                        <Eye size={13} style={{ marginRight: 6, verticalAlign: -2 }} />
                        View
                      </button>
                      <button
                        onClick={() => {
                          setOpenMenuId(null)
                          onEdit(r)
                        }}
                      >
                        <Pencil size={13} style={{ marginRight: 6, verticalAlign: -2 }} />
                        Update
                      </button>
                      <button className="danger" onClick={() => setOpenMenuId(null)}>
                        <Trash2 size={13} style={{ marginRight: 6, verticalAlign: -2 }} />
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
                  No fuel records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="table-pagination">
        <span>
          Showing {filtered.length === 0 ? 0 : startIdx + 1}–{Math.min(startIdx + itemsPerPage, filtered.length)} of {filtered.length}
        </span>
        <div className="pagination-controls">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft size={14} />
          </button>
          <span className="page-indicator">{currentPage} / {totalPages}</span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
