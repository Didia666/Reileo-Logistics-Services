import { useState, useMemo } from 'react'
import { Plus, Filter, ChevronDown, Eye, Pencil, Trash2, ChevronLeft, ChevronRight, Settings } from 'lucide-react'
import { LICENSE_STATUS_TABS, LICENSE_RENEWALS } from '../data/mockData'
import StatusBadge from './StatusBadge'

export default function LicenseRenewalList({ onCreate, onEdit }) {
  const [activeTab, setActiveTab] = useState('All')
  const [filterQuery, setFilterQuery] = useState('')
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [currentPage, setCurrentPage] = useState(1)
  const [openMenuId, setOpenMenuId] = useState(null)

  const filtered = useMemo(() => {
    let result = LICENSE_RENEWALS
    if (activeTab !== 'All') {
      result = result.filter((r) => r.status === activeTab)
    }
    if (filterQuery.trim()) {
      result = result.filter((r) =>
        r.personnel.toLowerCase().includes(filterQuery.trim().toLowerCase())
      )
    }
    return result
  }, [activeTab, filterQuery])

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage))
  const startIdx = (currentPage - 1) * itemsPerPage
  const visible = filtered.slice(startIdx, startIdx + itemsPerPage)
  const showingStart = filtered.length === 0 ? 0 : startIdx + 1
  const showingEnd = Math.min(startIdx + itemsPerPage, filtered.length)

  return (
    <div onClick={() => setOpenMenuId(null)}>
      <div className="page-header">
        <h1 className="page-title">License Renewal Reminders ({LICENSE_RENEWALS.length})</h1>
        <div className="header-actions">
          <button className="btn btn-green" onClick={onCreate}>
            <Plus /> Add License Renewal Reminder
          </button>
          <button className="btn btn-outline">
            <Settings /> Options
          </button>
        </div>
      </div>

      <div className="filter-row">
        {LICENSE_STATUS_TABS.map((tab) => (
          <label key={tab} className={activeTab === tab ? 'active-radio' : ''}>
            <input
              type="radio"
              name="license-status"
              value={tab}
              checked={activeTab === tab}
              onChange={() => {
                setActiveTab(tab)
                setCurrentPage(1)
              }}
            />
            {tab}
          </label>
        ))}
      </div>

      <div className="toolbar-row">
        <div className="toolbar-left">
          <Filter size={14} />
          <input
            type="text"
            placeholder="Filter Personnel"
            value={filterQuery}
            onChange={(e) => {
              setFilterQuery(e.target.value)
              setCurrentPage(1)
            }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-muted)' }}>
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
              <th>Personnel</th>
              <th>License Renewal Type</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr key={r.id}>
                <td>{r.personnel}</td>
                <td>{r.licenseType}</td>
                <td>{r.dueDate}</td>
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
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={5} className="no-results">
                  No license renewal reminders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="pagination">
          <div>
            Showing {showingStart} to {showingEnd} of {filtered.length} entries
          </div>
          <div className="pagination-controls">
            <button
              className="page-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                className={`page-btn${page === currentPage ? ' active' : ''}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}
            <button
              className="page-btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              <ChevronRight />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
