import React, { useEffect, useMemo, useState } from 'react';
import { Plus, MoreHorizontal, Pencil, Trash2, Search, Loader2, Filter, Download, FileText, X } from 'lucide-react';
import { customersCrud } from '../services/api.js';
import CustomerFormModal from './CustomerForm.jsx';

const EMPTY_CUSTOMER_FILTERS = {
  customerName: '',
  contactNumber: '',
  email: '',
  depotId: '',
  accountCode: '',
  rateType: '',
  status: '',
};

const CUSTOMER_EXPORT_COLUMNS = [
  ['customer_name', 'Customer Name'],
  ['contact_person', 'Contact Person'],
  ['contact_number', 'Contact Number'],
  ['email', 'Email'],
  ['address_one', 'Address 1'],
  ['address_two', 'Address 2'],
  ['depot_name', 'Depot'],
  ['tin', 'TIN'],
  ['account_code', 'Account Code'],
  ['rate_type', 'Rate Type'],
  ['status', 'Status'],
];

function matchesCustomerFilters(customer, filters) {
  return (!filters.customerName || String(customer.customer_name || '').toLowerCase().includes(filters.customerName.toLowerCase()))
    && (!filters.contactNumber || String(customer.contact_number || '').toLowerCase().includes(filters.contactNumber.toLowerCase()))
    && (!filters.email || String(customer.email || '').toLowerCase().includes(filters.email.toLowerCase()))
    && (!filters.depotId || String(customer.depot_id || '') === filters.depotId)
    && (!filters.accountCode || String(customer.account_code || '').toLowerCase().includes(filters.accountCode.toLowerCase()))
    && (!filters.rateType || String(customer.rate_type || '') === filters.rateType)
    && (!filters.status || String(customer.status || '') === filters.status);
}

function escapeExcel(value) {
  if (value === null || value === undefined || value === '') return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function downloadCustomerReport(rows, filters) {
  const header = CUSTOMER_EXPORT_COLUMNS
    .map(([, label]) => `<th>${escapeExcel(label)}</th>`)
    .join('');
  const body = rows.map((row) => (
    `<tr>${CUSTOMER_EXPORT_COLUMNS.map(([key]) => `<td>${escapeExcel(row[key])}</td>`).join('')}</tr>`
  )).join('');
  const html = `<html><head><meta charset="UTF-8"><style>
    table { border-collapse: collapse; font-family: Arial, sans-serif; font-size: 10pt; }
    th, td { border: 1px solid #7f7f7f; padding: 5px 7px; white-space: nowrap; }
    th { background: #f4b183; color: #000; font-weight: bold; text-align: center; }
    td { background: #fff; vertical-align: top; }
  </style></head><body><table><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table></body></html>`;
  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const generatedDate = new Date().toISOString().slice(0, 10);
  const datePart = filters.status ? `-${filters.status.toLowerCase()}` : '';
  link.href = url;
  link.download = `Customers${datePart}-${generatedDate}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
}

function ActionMenu({ customer, onOpen, onClose, isOpen, onEdit, onDelete }) {
  const ref = React.useRef(null);
  useEffect(() => {
    if (!isOpen) return;
    const click = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', click);
    return () => document.removeEventListener('mousedown', click);
  }, [isOpen, onClose]);

  return (
    <div className="action-menu" ref={ref}>
      <button onClick={onOpen} style={{ padding: '4px 12px' }}><MoreHorizontal size={14} /> Select</button>
      {isOpen && (
        <div className="dropdown">
          <button onClick={() => { onClose(); onEdit(customer); }}>
            <Pencil size={12} style={{ marginRight: 6 }} /> Edit
          </button>
          <button className="danger" onClick={() => { onClose(); onDelete(customer); }}>
            <Trash2 size={12} style={{ marginRight: 6 }} /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

export default function Customers() {
  const [loading, setLoading] = useState(true);
  const [all, setAll] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [toast, setToast] = useState({ type: '', msg: '' });
  const [formOpen, setFormOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showDownload, setShowDownload] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const [customerFilters, setCustomerFilters] = useState(EMPTY_CUSTOMER_FILTERS);
  const [draftFilters, setDraftFilters] = useState(EMPTY_CUSTOMER_FILTERS);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await customersCrud.list();
      setAll(Array.isArray(data) ? data : (data.data || []));
    } catch (e) {
      setToast({ type: 'error', msg: e.message || 'Failed to load customers.' });
      setTimeout(() => setToast({ type: '', msg: '' }), 4000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => { setPage(1); }, [search, perPage, activeTab, customerFilters]);

  const filtered = useMemo(() => {
    let rows = all;
    if (activeTab !== 'all') rows = rows.filter(r => r.status === activeTab);
    rows = rows.filter((row) => matchesCustomerFilters(row, customerFilters));
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(r =>
        (r.customer_name || '').toLowerCase().includes(q) ||
        (r.email || '').toLowerCase().includes(q) ||
        (r.address_one || '').toLowerCase().includes(q) ||
        (r.contact_number || '').toLowerCase().includes(q) ||
        (r.depot_name || '').toLowerCase().includes(q)
      );
    }
    return rows;
  }, [all, search, activeTab, customerFilters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const current = filtered.slice((page - 1) * perPage, page * perPage);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast({ type: '', msg: '' }), 4000);
  };

  const handleEdit = (c) => {
    setEditCustomer(c);
    setFormOpen(true);
  };

  const handleAdd = () => {
    setEditCustomer(null);
    setFormOpen(true);
  };

  const handleDelete = async (c) => {
    if (!confirm(`Delete customer "${c.customer_name}"?`)) return;
    try {
      const result = await customersCrud.remove(c.customer_id);
      if (result && result.success) {
        setAll(prev => prev.filter(r => r.customer_id !== c.customer_id));
        showToast('success', 'Customer deleted successfully.');
      } else {
        throw new Error(result?.error || 'Delete failed.');
      }
    } catch (e) {
      showToast('error', e.message || 'Failed to delete customer.');
    }
  };

  const handleSaved = (savedData) => {
    if (editCustomer) {
      setAll(prev => prev.map(r => r.customer_id === savedData.customer_id ? savedData : r));
    } else {
      setAll(prev => [...prev, savedData].sort((a, b) => (a.customer_name || '').localeCompare(b.customer_name || '')));
    }
    setEditCustomer(null);
  };

  const updateDraftFilter = (key, value) => {
    setDraftFilters((previous) => ({ ...previous, [key]: value }));
    setDownloadError('');
  };

  const applyCustomerFilters = () => {
    setCustomerFilters(draftFilters);
    setShowFilters(false);
    setShowDownload(false);
  };

  const clearCustomerFilters = () => {
    setDraftFilters(EMPTY_CUSTOMER_FILTERS);
    setCustomerFilters(EMPTY_CUSTOMER_FILTERS);
    setDownloadError('');
  };

  const depotOptions = [...new Map(
    all
      .filter((customer) => customer.depot_id && customer.depot_name)
      .map((customer) => [String(customer.depot_id), customer])
  ).values()];

  const renderCustomerFilterFields = () => (
    <div className="report-filter-grid">
      <label>
        Customer Name
        <input value={draftFilters.customerName} onChange={(e) => updateDraftFilter('customerName', e.target.value)} />
      </label>
      <label>
        Contact Number
        <input value={draftFilters.contactNumber} onChange={(e) => updateDraftFilter('contactNumber', e.target.value)} />
      </label>
      <label>
        Email
        <input type="email" value={draftFilters.email} onChange={(e) => updateDraftFilter('email', e.target.value)} />
      </label>
      <label>
        Depot
        <select value={draftFilters.depotId} onChange={(e) => updateDraftFilter('depotId', e.target.value)}>
          <option value="">All depots</option>
          {depotOptions.map((depot) => (
            <option key={depot.depot_id} value={depot.depot_id}>{depot.depot_name}</option>
          ))}
        </select>
      </label>
      <label>
        Account Code
        <input value={draftFilters.accountCode} onChange={(e) => updateDraftFilter('accountCode', e.target.value)} />
      </label>
      <label>
        Rate Type
        <select value={draftFilters.rateType} onChange={(e) => updateDraftFilter('rateType', e.target.value)}>
          <option value="">All rate types</option>
          <option value="Standard">Standard</option>
          <option value="Special">Special</option>
        </select>
      </label>
      <label>
        Status
        <select value={draftFilters.status} onChange={(e) => updateDraftFilter('status', e.target.value)}>
          <option value="">All statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </label>
    </div>
  );

  const renderCustomerFilterActions = (downloadMode = false) => (
    <div className="report-filter-actions">
      <button
        className="btn btn-secondary"
        type="button"
        onClick={() => {
          if (downloadMode) {
            setDraftFilters(EMPTY_CUSTOMER_FILTERS);
            setDownloadError('');
          } else {
            clearCustomerFilters();
          }
        }}
      >
        Clear
      </button>
      {downloadMode
        ? (
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => {
              const exportRows = all
                .filter((row) => matchesCustomerFilters(row, draftFilters))
                .filter((row) => activeTab === 'all' || row.status === activeTab)
                .filter((row) => {
                  if (!search.trim()) return true;
                  const query = search.toLowerCase();
                  return [
                    row.customer_name,
                    row.email,
                    row.address_one,
                    row.contact_number,
                    row.depot_name,
                  ].some((value) => String(value || '').toLowerCase().includes(query));
                });
              if (exportRows.length === 0) {
                setDownloadError('No customers match the selected filters. Adjust your filters and try again.');
                return;
              }
              setDownloadError('');
              setShowDownload(false);
              downloadCustomerReport(exportRows, draftFilters);
            }}
          >
            <FileText size={14} /> Generate Report
          </button>
        )
        : <button className="btn btn-primary" type="button" onClick={applyCustomerFilters}>Apply Filters</button>}
    </div>
  );

  if (loading) return <div className="loading"><Loader2 className="animate-spin" size={20} /> Loading customers…</div>;

  const tabs = [
    { key: 'all', label: 'All' },
    { key: 'Active', label: 'Active' },
    { key: 'Inactive', label: 'Inactive' },
  ].map((tab) => ({
    ...tab,
    count: tab.key === 'all'
      ? all.length
      : all.filter((row) => row.status === tab.key).length,
  }));

  return (
    <>
      <div className="page-header">
        <div>
          <div className="breadcrumb">Master Data / Customers</div>
          <h2>Customers ({filtered.length})</h2>
          <div style={{ color: '#6b7280', fontSize: 13 }}>
            {filtered.length} of {all.length} total
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn btn-ghost"
            title="Download customer report"
            onClick={() => {
              setDraftFilters(customerFilters);
              setDownloadError('');
              setShowDownload(true);
            }}
          >
            <Download size={14} /> Download
          </button>
          <button className="btn btn-primary" onClick={handleAdd}>
            <Plus size={15} /> Add Customer
          </button>
          <button
            className="btn btn-ghost"
            title="Filter customers"
            onClick={() => {
              setDraftFilters(customerFilters);
              setShowFilters((visible) => !visible);
            }}
          >
            <Filter size={14} /> Filter
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="report-filter-panel">
          {renderCustomerFilterFields()}
          {renderCustomerFilterActions()}
        </div>
      )}

      <div className="tabs">
        {tabs.map(t => (
          <button key={t.key} className={activeTab === t.key ? 'active' : ''} onClick={() => setActiveTab(t.key)}>
            {t.label} <span style={{ opacity: 0.75, marginLeft: 4 }}>({t.count})</span>
          </button>
        ))}
      </div>

      {toast.msg && <div className={`alert alert-${toast.type || 'success'}`} style={{ marginBottom: 14 }}>{toast.msg}</div>}

      <div className="card">
        <div className="table-toolbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Search size={14} color="#6b7280" />
            <input
              type="text"
              className="search-input"
              placeholder="Search name, email, address, contact…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <select value={perPage} onChange={(e) => setPerPage(Number(e.target.value))}>
              {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n} / page</option>)}
            </select>
          </div>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Address</th>
                <th>Contact No.</th>
                <th>Depot</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {current.length === 0 && (
                <tr><td colSpan={7} className="empty-row">No customers match the current filters.</td></tr>
              )}
              {current.map(c => (
                <tr key={c.customer_id}>
                  <td style={{ fontWeight: 500 }}>{c.customer_name || '—'}</td>
                  <td>{c.email || '—'}</td>
                  <td>
                    <div>{c.address_one || '—'}</div>
                    {c.address_two && <div style={{ color: '#6b7280', fontSize: 12 }}>{c.address_two}</div>}
                  </td>
                  <td>{c.contact_number || '—'}</td>
                  <td>{c.depot_name || '—'}</td>
                  <td>
                    <span className={`badge badge-${c.status === 'Active' ? 'success' : 'danger'}`} style={{ fontWeight: 600 }}>
                      {(c.status || 'ACTIVE').toUpperCase()}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <ActionMenu
                      customer={c}
                      isOpen={openMenuId === c.customer_id}
                      onOpen={() => setOpenMenuId(c.customer_id)}
                      onClose={() => setOpenMenuId(null)}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <div>
            Showing {current.length === 0 ? 0 : ((page - 1) * perPage + 1)} – {Math.min(page * perPage, filtered.length)} of {filtered.length}
          </div>
          <div className="page-buttons">
            <button disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 7).map(p => (
              <button key={p} className={p === page ? 'active' : ''} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next</button>
          </div>
        </div>
      </div>

      <CustomerFormModal
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditCustomer(null); }}
        onSaved={handleSaved}
        editCustomer={editCustomer}
      />

      {showDownload && (
        <div className="report-modal-backdrop" onClick={() => setShowDownload(false)}>
          <div className="report-download-modal" onClick={(e) => e.stopPropagation()}>
            <div className="report-modal-header">
              <span>Download Customer Report</span>
              <button type="button" onClick={() => setShowDownload(false)} aria-label="Close download dialog">
                <X size={16} />
              </button>
            </div>
            <div className="report-modal-intro">Choose customer filters for the downloaded report.</div>
            {downloadError && (
              <div className="alert alert-error" role="alert" style={{ margin: '0 16px 12px' }}>
                {downloadError}
              </div>
            )}
            {renderCustomerFilterFields()}
            {renderCustomerFilterActions(true)}
          </div>
        </div>
      )}
    </>
  );
}
