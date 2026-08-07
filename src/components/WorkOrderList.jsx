import { useState, useMemo } from 'react'
import { Plus, Filter, ChevronDown, Eye, Pencil, Trash2, ChevronLeft, ChevronRight, XCircle } from 'lucide-react'
import { WORKORDER_STATUS_TABS, WORKORDERS } from '../data/mockData'
import StatusBadge from './StatusBadge'

const formatPHP = (amount) => {
  return '₱' + Number(amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function WorkOrderList({ onCreate, onEdit }) {
  const [activeTab, setActiveTab] = useState('All')
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [currentPage, setCurrentPage] = useState(1)
  const [woFilter, setWoFilter] = useState('')
  const [openMenuId, setOpenMenuId] = useState(null)

  const filtered = useMemo(() => {
    let result = WORKORDERS
    if (activeTab !== 'All') {
      result = result.filter((w) => w.status === activeTab)
    }
    if (woFilter.trim()) {
      const needle = woFilter.trim().toLowerCase()
      result = result.filter((w) => (w.woNo || '').toLowerCase().includes(needle))
    }
    return result
  }, [activeTab, woFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage))
  const startIdx = (currentPage - 1) * itemsPerPage
  const endIdx = startIdx + itemsPerPage
  const visible = filtered.slice(startIdx, endIdx)

  return (
    <div onClick={() => setOpenMenuId(null)}>
      <div className="page-header">
        <h1 className="page-title">Work Orders ({WORKORDERS.length})</h1>
        <div className="header-actions">
          <button className="btn btn-green" onClick={onCreate}>
            <Plus /> Create Work Order
          </button>
          <button className="btn btn-outline">
            <Filter /> Options <ChevronDown />
          </button>
        </div>
      </div>

      <div className="status-tabs">
        {WORKORDER_STATUS_TABS.map((tab) => (
          <button
            key={tab}
            className={`tab${activeTab === tab ? ' active' : ''}`}
            onClick={() => { setActiveTab(tab); setCurrentPage(1)}}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="table-toolbar">
        <div className="toolbar-left">
          <span>Filter:</span>
          <input
            type="text"
            placeholder="WO #"
            value={woFilter}
            onChange={(e) => { setWoFilter(e.target.value); setCurrentPage(1) }}
          />
        </div>
        <div className="toolbar-right">
          <span>Items per page:</span>
          <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1) }}>
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
              <th>WO #</th>
              <th>Date Needed</th>
              <th>Depot</th>
              <th>Plate No.</th>
              <th>Scope of Work</th>
              <th>Total Cost</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((w) => (
              <tr key={w.id}>
                <td className="booking-no">{w.woNo}</td>
                <td>{w.dateNeeded}</td>
                <td>{w.depot}</td>
                <td className={w.plateNo && w.plateNo !== '-' ? '' : 'empty-cell'}>{(w.plateNo && w.plateNo !== '-') ? w.plateNo : '-'}</td>
                <td>{w.scopeOfWork}</td>
                <td className="amount-cell">{formatPHP(w.totalCost)}</td>
                <td>
                  <StatusBadge status={w.status} />
                </td>
                <td className="action-cell">
                  <button
                    className="action-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      setOpenMenuId(openMenuId === w.id ? null : w.id)
                    }}
                  >
                    Select <ChevronDown />
                  </button>
                  {openMenuId === w.id && (
                    <div className="action-menu" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => setOpenMenuId(null)}>
                        <Eye size={13} style={{ marginRight: 6, verticalAlign: -2 }} />
                        View
                      </button>
                      <button
                        onClick={() => {
                          setOpenMenuId(null)
                          onEdit(w)
                        }}
                      >
                        <Pencil size={13} style={{ marginRight: 6, verticalAlign: -2 }} />
                        Update
                      </button>
                      <button className="danger" onClick={() => setOpenMenuId(null)}>
                        <XCircle size={13} style={{ marginRight: 6, verticalAlign: -2 }} />
                        Cancel
                      </button>
                      <button className="danger" onClick={() => setOpenMenuId(null)}>
                        <Trash2 size={13} style={{ marginRight: 6, verticalAlign: -2 }} />
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={8} className="no-results">
                  No work orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="table-pagination">
        <button
          className="page-btn"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
        >
          <ChevronLeft size={14} />
        </button>
        <span className="page-info">
          Page {currentPage} of {totalPages}
        </span>
        <button
          className="page-btn"
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}
