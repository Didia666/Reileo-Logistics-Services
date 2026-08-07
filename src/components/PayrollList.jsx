import { useState, useMemo } from 'react'
import { Plus, FileDown, Filter, ChevronDown, Eye, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { PAYROLL_STATUS_TABS, PAYROLLS } from '../data/mockData'
import StatusBadge from './StatusBadge'

export default function PayrollList({ onCreate, onEdit }) {
  const [activeTab, setActiveTab] = useState('All')
  const [filterQuery, setFilterQuery] = useState('')
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [currentPage, setCurrentPage] = useState(1)
  const [openMenuId, setOpenMenuId] = useState(null)

  const filtered = useMemo(() => {
    let result = PAYROLLS
    if (activeTab !== 'All') {
      result = result.filter((p) => p.status === activeTab)
    }
    if (filterQuery.trim()) {
      result = result.filter((p) =>
        p.payrollNo.toLowerCase().includes(filterQuery.trim().toLowerCase())
      )
    }
    return result
  }, [activeTab, filterQuery])

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage))
  const startIdx = (currentPage - 1) * itemsPerPage
  const visible = filtered.slice(startIdx, startIdx + itemsPerPage)
  const showingStart = filtered.length === 0 ? 0 : startIdx + 1
  const showingEnd = Math.min(startIdx + itemsPerPage, filtered.length)

  const formatCurrency = (amount) =>
    '\u20B1' + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <div onClick={() => setOpenMenuId(null)}>
      <div className="page-header">
        <h1 className="page-title">Payroll List ({PAYROLLS.length})</h1>
        <div className="header-actions">
          <button className="btn btn-outline">
            <FileDown /> Download
          </button>
          <button className="btn btn-green" onClick={onCreate}>
            <Plus /> Create Payroll
          </button>
        </div>
      </div>

      <div className="filter-row">
        {PAYROLL_STATUS_TABS.map((tab) => (
          <label key={tab} className={activeTab === tab ? 'active-radio' : ''}>
            <input
              type="radio"
              name="payroll-status"
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
            placeholder="Filter Payroll No"
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
              <th>Payroll No</th>
              <th>Date Created</th>
              <th>Processed By</th>
              <th>Payroll Period</th>
              <th>Employee No.</th>
              <th>Total Earnings</th>
              <th>Total Net Pay</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((p) => (
              <tr key={p.id}>
                <td className="booking-no">{p.payrollNo}</td>
                <td>{p.dateCreated}</td>
                <td>{p.processedBy}</td>
                <td>{p.periodStart} - {p.periodEnd}</td>
                <td className="num-cell">{p.employeeCount}</td>
                <td className="amount-cell">{formatCurrency(p.totalEarnings)}</td>
                <td className="amount-cell">{formatCurrency(p.totalNetPay)}</td>
                <td>
                  <StatusBadge status={p.status} />
                </td>
                <td className="action-cell">
                  <button
                    className="action-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      setOpenMenuId(openMenuId === p.id ? null : p.id)
                    }}
                  >
                    Select <ChevronDown />
                  </button>
                  {openMenuId === p.id && (
                    <div className="action-menu" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => setOpenMenuId(null)}>
                        <Eye size={13} style={{ marginRight: 6, verticalAlign: -2 }} />
                        View
                      </button>
                      <button
                        onClick={() => {
                          setOpenMenuId(null)
                          onEdit(p)
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
                <td colSpan={9} className="no-results">
                  No payrolls found.
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
