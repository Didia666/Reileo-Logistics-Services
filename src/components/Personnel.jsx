import React, { useEffect, useMemo, useState } from 'react';
import { Plus, MoreHorizontal, Pencil, Trash2, Search, Loader2, Filter, Download, Eye, FileText, X } from 'lucide-react';
import { personnelCrud } from '../services/api.js';
import PersonnelFormModal from './PersonnelForm.jsx';

const EMPTY_PERSONNEL_FILTERS = {
  name: '',
  contactNumber: '',
  email: '',
  personnelType: '',
  depotId: '',
  employmentType: '',
  vendorId: '',
  status: '',
};

const PERSONNEL_EXPORT_COLUMNS = [
  ['display_name', 'Name'],
  ['personnel_type', 'Personnel Type'],
  ['depot_name', 'Depot'],
  ['employment_type', 'Employment Type'],
  ['vendor_name', 'Vendor'],
  ['contact_number', 'Contact Number'],
  ['email', 'Email'],
  ['dl_codes', 'DL Codes'],
  ['daily_rate', 'Daily Rate'],
  ['status', 'Status'],
];

function matchesPersonnelFilters(person, filters) {
  const name = person.display_name || person.full_name || '';
  return (!filters.name || String(name).toLowerCase().includes(filters.name.toLowerCase()))
    && (!filters.contactNumber || String(person.contact_number || '').toLowerCase().includes(filters.contactNumber.toLowerCase()))
    && (!filters.email || String(person.email || '').toLowerCase().includes(filters.email.toLowerCase()))
    && (!filters.personnelType || String(person.personnel_type || '') === filters.personnelType)
    && (!filters.depotId || String(person.depot_id || '') === filters.depotId)
    && (!filters.employmentType || String(person.employment_type || '') === filters.employmentType)
    && (!filters.vendorId || String(person.vendor_id || '') === filters.vendorId)
    && (!filters.status || String(person.status || '') === filters.status);
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

function downloadPersonnelReport(rows, filters) {
  const header = PERSONNEL_EXPORT_COLUMNS
    .map(([, label]) => `<th>${escapeExcel(label)}</th>`)
    .join('');
  const body = rows.map((row) => (
    `<tr>${PERSONNEL_EXPORT_COLUMNS.map(([key]) => `<td>${escapeExcel(row[key])}</td>`).join('')}</tr>`
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
  const statusPart = filters.status ? `-${filters.status.toLowerCase()}` : '';
  link.href = url;
  link.download = `Personnel${statusPart}-${generatedDate}.xls`;
  link.click();
  URL.revokeObjectURL(url);
}

function ActionMenu({ row, onOpen, onClose, isOpen, onView, onEdit, onDelete }) {
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
          <button onClick={() => { onClose(); onView(row); }}>
            <Eye size={12} style={{ marginRight: 6 }} /> View
          </button>
          <button onClick={() => { onClose(); onEdit(row); }}>
            <Pencil size={12} style={{ marginRight: 6 }} /> Edit
          </button>
          <button className="danger" onClick={() => { onClose(); onDelete(row); }}>
            <Trash2 size={12} style={{ marginRight: 6 }} /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

export default function Personnel() {
  const [loading, setLoading] = useState(true);
  const [all, setAll] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [toast, setToast] = useState({ type: '', msg: '' });
  const [formOpen, setFormOpen] = useState(false);
  const [editPersonnel, setEditPersonnel] = useState(null);
  const [viewOnly, setViewOnly] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showDownload, setShowDownload] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const [personnelFilters, setPersonnelFilters] = useState(EMPTY_PERSONNEL_FILTERS);
  const [draftFilters, setDraftFilters] = useState(EMPTY_PERSONNEL_FILTERS);

  const loadPersonnel = async () => {
    setLoading(true);
    try {
      const data = await personnelCrud.list({});
      setAll(Array.isArray(data) ? data : (data.data || []));
    } catch (e) {
      setToast({ type: 'error', msg: e.message || 'Failed to load personnel.' });
      setTimeout(() => setToast({ type: '', msg: '' }), 4000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPersonnel();
  }, []);

  useEffect(() => { setPage(1); }, [search, perPage, activeTab, personnelFilters]);

  const filtered = useMemo(() => {
    let rows = all;
    if (activeTab !== 'all') rows = rows.filter(r => r.status === activeTab);
    rows = rows.filter((row) => matchesPersonnelFilters(row, personnelFilters));
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(r =>
        (r.display_name || r.full_name || '').toLowerCase().includes(q) ||
        (r.email || '').toLowerCase().includes(q) ||
        (r.contact_number || '').toLowerCase().includes(q) ||
        (r.depot_name || '').toLowerCase().includes(q) ||
        (r.personnel_type || '').toLowerCase().includes(q)
      );
    }
    return rows;
  }, [all, activeTab, search, personnelFilters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const current = filtered.slice((page - 1) * perPage, page * perPage);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast({ type: '', msg: '' }), 4000);
  };

  const handleView = async (p) => {
    setEditPersonnel(p);
    setViewOnly(true);
    setFormOpen(true);
  };

  const handleEdit = async (p) => {
    try {
      const full = await personnelCrud.get(p.personnel_id);
      setEditPersonnel(full);
      setViewOnly(false);
      setFormOpen(true);
    } catch (e) {
      showToast('error', e.message || 'Failed to load personnel details.');
    }
  };

  const handleAdd = () => {
    setEditPersonnel(null);
    setViewOnly(false);
    setFormOpen(true);
  };

  const handleDelete = async (p) => {
    if (!confirm(`Delete personnel "${p.display_name || p.full_name}"?`)) return;
    try {
      const result = await personnelCrud.remove(p.personnel_id);
      if (result && result.success) {
        setAll(prev => prev.filter(r => r.personnel_id !== p.personnel_id));
        showToast('success', 'Personnel deleted successfully.');
      } else {
        throw new Error(result?.error || 'Delete failed.');
      }
    } catch (e) {
      showToast('error', e.message || 'Failed to delete personnel.');
    }
  };

  const handleSaved = (savedData) => {
    if (editPersonnel && editPersonnel.personnel_id) {
      setAll(prev => prev.map(r => r.personnel_id === savedData.personnel_id ? savedData : r));
    } else {
      setAll(prev => [...prev, savedData].sort((a, b) =>
        (a.display_name || a.last_name || '').localeCompare(b.display_name || b.last_name || '')
      ));
    }
    setEditPersonnel(null);
    setViewOnly(false);
  };

  const updateDraftFilter = (key, value) => {
    setDraftFilters((previous) => ({ ...previous, [key]: value }));
    setDownloadError('');
  };

  const applyPersonnelFilters = () => {
    setPersonnelFilters(draftFilters);
    setShowFilters(false);
  };

  const clearPersonnelFilters = () => {
    setDraftFilters(EMPTY_PERSONNEL_FILTERS);
    setPersonnelFilters(EMPTY_PERSONNEL_FILTERS);
    setDownloadError('');
  };

  const getOptions = (valueKey, labelKey) => [...new Map(
    all
      .filter((person) => person[valueKey] !== null && person[valueKey] !== undefined && person[valueKey] !== '')
      .map((person) => [
        String(person[valueKey]),
        { value: String(person[valueKey]), label: String(person[labelKey] || person[valueKey]) },
      ])
  ).values()];

  const renderPersonnelFilterFields = () => (
    <div className="report-filter-grid">
      <label>
        Name
        <input value={draftFilters.name} onChange={(e) => updateDraftFilter('name', e.target.value)} />
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
        Personnel Type
        <select value={draftFilters.personnelType} onChange={(e) => updateDraftFilter('personnelType', e.target.value)}>
          <option value="">All types</option>
          {getOptions('personnel_type', 'personnel_type').map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </label>
      <label>
        Depot
        <select value={draftFilters.depotId} onChange={(e) => updateDraftFilter('depotId', e.target.value)}>
          <option value="">All depots</option>
          {getOptions('depot_id', 'depot_name').map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </label>
      <label>
        Employment Type
        <select value={draftFilters.employmentType} onChange={(e) => updateDraftFilter('employmentType', e.target.value)}>
          <option value="">All employment types</option>
          {getOptions('employment_type', 'employment_type').map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </label>
      <label>
        Vendor
        <select value={draftFilters.vendorId} onChange={(e) => updateDraftFilter('vendorId', e.target.value)}>
          <option value="">All vendors</option>
          {getOptions('vendor_id', 'vendor_name').map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
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

  const renderPersonnelFilterActions = (downloadMode = false) => (
    <div className="report-filter-actions">
      <button
        className="btn btn-secondary"
        type="button"
        onClick={() => {
          if (downloadMode) {
            setDraftFilters(EMPTY_PERSONNEL_FILTERS);
            setDownloadError('');
          } else {
            clearPersonnelFilters();
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
              const query = search.trim().toLowerCase();
              const exportRows = all
                .filter((row) => matchesPersonnelFilters(row, draftFilters))
                .filter((row) => activeTab === 'all' || row.status === activeTab)
                .filter((row) => !query || [
                  row.display_name,
                  row.full_name,
                  row.email,
                  row.contact_number,
                  row.depot_name,
                  row.personnel_type,
                ].some((value) => String(value || '').toLowerCase().includes(query)));
              if (exportRows.length === 0) {
                setDownloadError('No personnel match the selected filters. Adjust your filters and try again.');
                return;
              }
              setDownloadError('');
              setShowDownload(false);
              downloadPersonnelReport(exportRows, draftFilters);
            }}
          >
            <FileText size={14} /> Generate Report
          </button>
        )
        : <button className="btn btn-primary" type="button" onClick={applyPersonnelFilters}>Apply Filters</button>}
    </div>
  );

  if (loading) return <div className="loading"><Loader2 className="animate-spin" size={20} /> Loading personnel…</div>;

  const tabs = [
    { key: 'all',      label: 'All' },
    { key: 'Active',   label: 'Active' },
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
          <div className="breadcrumb">Master Data / Personnel</div>
          <h2>Personnel ({filtered.length})</h2>
          <div style={{ color: '#6b7280', fontSize: 13 }}>
            {filtered.length} of {all.length} total
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn btn-ghost"
            title="Download personnel report"
            onClick={() => {
              setDraftFilters(personnelFilters);
              setDownloadError('');
              setShowDownload(true);
            }}
          >
            <Download size={14} /> Download
          </button>
          <button className="btn btn-primary" onClick={handleAdd}>
            <Plus size={15} /> Personnel
          </button>
          <button
            className="btn btn-ghost"
            title="Filter personnel"
            onClick={() => {
              setDraftFilters(personnelFilters);
              setShowFilters((visible) => !visible);
            }}
          >
            <Filter size={14} /> Filter
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="report-filter-panel">
          {renderPersonnelFilterFields()}
          {renderPersonnelFilterActions()}
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
              placeholder="Search name, email, contact, type, depot…"
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
                <th>Type</th>
                <th>Depot</th>
                <th>Employment</th>
                <th>Vendor</th>
                <th>Contact</th>
                <th>DL Codes</th>
                <th>Daily Rate</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {current.length === 0 && (
                <tr><td colSpan={10} className="empty-row">No personnel match the current filters.</td></tr>
              )}
              {current.map(p => (
                <tr key={p.personnel_id}>
                  <td style={{ fontWeight: 500 }}>{p.display_name || p.full_name || '—'}</td>
                  <td>{p.personnel_type || '—'}</td>
                  <td>{p.depot_name || '—'}</td>
                  <td>{p.employment_type || '—'}</td>
                  <td>{p.vendor_name || '—'}</td>
                  <td>
                    <div>{p.contact_number || '—'}</div>
                    {p.email && <div style={{ color: '#6b7280', fontSize: 12 }}>{p.email}</div>}
                  </td>
                  <td>{p.dl_codes || '—'}</td>
                  <td>{p.daily_rate ? Number(p.daily_rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</td>
                  <td>
                    <span className={`badge badge-${p.status === 'Active' ? 'success' : 'danger'}`} style={{ fontWeight: 600 }}>
                      {(p.status || 'ACTIVE').toUpperCase()}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <ActionMenu
                      row={p}
                      isOpen={openMenuId === p.personnel_id}
                      onOpen={() => setOpenMenuId(p.personnel_id)}
                      onClose={() => setOpenMenuId(null)}
                      onView={handleView}
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
            {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 7).map(pn => (
              <button key={pn} className={pn === page ? 'active' : ''} onClick={() => setPage(pn)}>{pn}</button>
            ))}
            <button disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next</button>
          </div>
        </div>
      </div>

      <PersonnelFormModal
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditPersonnel(null); setViewOnly(false); }}
        onSaved={handleSaved}
        editPersonnel={editPersonnel}
        viewOnly={viewOnly}
      />

      {showDownload && (
        <div className="report-modal-backdrop" onClick={() => setShowDownload(false)}>
          <div className="report-download-modal" onClick={(e) => e.stopPropagation()}>
            <div className="report-modal-header">
              <span>Download Personnel Report</span>
              <button type="button" onClick={() => setShowDownload(false)} aria-label="Close download dialog">
                <X size={16} />
              </button>
            </div>
            <div className="report-modal-intro">Choose personnel filters for the downloaded report.</div>
            {downloadError && (
              <div className="alert alert-error" role="alert" style={{ margin: '0 16px 12px' }}>
                {downloadError}
              </div>
            )}
            {renderPersonnelFilterFields()}
            {renderPersonnelFilterActions(true)}
          </div>
        </div>
      )}
    </>
  );
}
