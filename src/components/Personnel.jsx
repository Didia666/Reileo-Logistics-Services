import React, { useEffect, useMemo, useState } from 'react';
import { Plus, MoreHorizontal, Pencil, Trash2, Search, Loader2, Filter, Download, Eye } from 'lucide-react';
import { personnelCrud } from '../services/api.js';
import PersonnelFormModal from './PersonnelForm.jsx';

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
  const [statusTab, setStatusTab] = useState('all');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [toast, setToast] = useState({ type: '', msg: '' });
  const [formOpen, setFormOpen] = useState(false);
  const [editPersonnel, setEditPersonnel] = useState(null);
  const [viewOnly, setViewOnly] = useState(false);

  const loadPersonnel = async () => {
    setLoading(true);
    try {
      const data = await personnelCrud.list(statusTab === 'all' ? {} : { status: statusTab });
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
  }, [statusTab]);

  useEffect(() => { setPage(1); }, [search, perPage, statusTab]);

  const filtered = useMemo(() => {
    let rows = all;
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
  }, [all, search]);

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

  if (loading) return <div className="loading"><Loader2 className="animate-spin" size={20} /> Loading personnel…</div>;

  const tabs = [
    { key: 'all',      label: 'All' },
    { key: 'Active',   label: 'Active' },
    { key: 'Inactive', label: 'Inactive' },
  ];
  const tabCounts = {
    all:      all.length,
    Active:   all.filter(r => r.status === 'Active').length,
    Inactive: all.filter(r => r.status === 'Inactive').length,
  };

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
          <button className="btn btn-ghost" title="Download CSV">
            <Download size={14} /> Download
          </button>
          <button className="btn btn-primary" onClick={handleAdd}>
            <Plus size={15} /> Personnel
          </button>
          <button className="btn btn-ghost" title="Filter">
            <Filter size={14} /> Filter
          </button>
        </div>
      </div>

      <div className="status-tabs" style={{ display: 'flex', gap: 0, marginBottom: 14, borderBottom: '1px solid #e5e7eb' }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setStatusTab(t.key)}
            style={{
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: statusTab === t.key ? 600 : 400,
              color: statusTab === t.key ? '#1d4ed8' : '#374151',
              borderBottom: statusTab === t.key ? '2px solid #1d4ed8' : '2px solid transparent',
              background: 'transparent',
              cursor: 'pointer',
            }}
          >
            {t.label} <span style={{ color: '#6b7280' }}>({tabCounts[t.key] ?? 0})</span>
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
    </>
  );
}
