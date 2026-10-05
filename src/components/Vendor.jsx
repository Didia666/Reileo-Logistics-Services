import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, MoreHorizontal, Pencil, Trash2, Search, Loader2, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { settingsCrud } from '../services/api.js';
import VendorFormModal from './VendorForm.jsx';

function ActionMenu({ vendor, onOpen, onClose, isOpen, onEdit, onDelete }) {
  const ref = React.useRef(null);
  useEffect(() => {
    if (!isOpen) return;
    const click = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', click);
    return () => document.removeEventListener('mousedown', click);
  }, [isOpen, onClose]);

  return (
    <div className="action-menu" ref={ref}>
      <button onClick={onOpen}><MoreHorizontal size={14} /> Select</button>
      {isOpen && (
        <div className="dropdown">
          <button onClick={() => { onClose(); onEdit(vendor); }}>
            <Pencil size={12} style={{ marginRight: 6 }} /> Edit / Update
          </button>
          <button className="danger" onClick={() => { onClose(); onDelete(vendor); }}>
            <Trash2 size={12} style={{ marginRight: 6 }} /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

export default function Vendor() {
  const vendorCrud = useMemo(() => settingsCrud('vendors'), []);

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);

  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [search, setSearch] = useState('');
  const [pendingSearch, setPendingSearch] = useState('');

  const [activeTab, setActiveTab] = useState('all');

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(8);

  const [formOpen, setFormOpen] = useState(false);
  const [editVendor, setEditVendor] = useState(null);

  const [openMenuId, setOpenMenuId] = useState(null);

  const [toast, setToast] = useState('');
  const [toastType, setToastType] = useState('success');

  const showToast = useCallback((msg, type = 'success') => {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(''), 3500);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      const res = await vendorCrud.list(params);
      const arr = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
      setRows(arr);
      setTotal(arr.length);
    } catch (e) {
      setRows([]);
      setTotal(0);
      showToast('Failed to load: ' + (e?.message || 'Unknown error'), 'error');
    } finally {
      setLoading(false);
    }
  }, [search, vendorCrud, showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => { setPage(1); }, [search, activeTab]);

  const filtered = useMemo(() => {
    let list = rows;
    if (activeTab !== 'all') list = list.filter(r => (r.status || 'Active') === activeTab);
    return list;
  }, [rows, activeTab]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const current = filtered.slice((page - 1) * perPage, page * perPage);

  const applyFilters = () => {
    setSearch(pendingSearch);
    setShowFilterPanel(false);
  };

  const clearFilters = () => {
    setPendingSearch('');
    setSearch('');
  };

  const handleEdit = (v) => {
    setEditVendor(v);
    setFormOpen(true);
  };

  const handleAdd = () => {
    setEditVendor(null);
    setFormOpen(true);
  };

  const handleDelete = async (v) => {
    const displayName = v.vendor_name || '(unnamed)';
    if (!v.vendor_id) {
      showToast('Cannot delete: missing ID', 'error');
      return;
    }
    if (!window.confirm(`Delete "${displayName}"? This cannot be undone.`)) return;
    try {
      const res = await vendorCrud.remove(v.vendor_id);
      if (res && res.success === false) {
        throw new Error((res && res.error) || 'Delete rejected by server');
      }
      setRows((prev) => prev.filter((r) => String(r.vendor_id) !== String(v.vendor_id)));
      setTotal((t) => Math.max(0, t - 1));
      showToast(`"${displayName}" deleted`);
    } catch (e) {
      showToast((e?.message || 'Delete failed'), 'error');
    }
  };

  const handleSaved = (savedData) => {
    if (editVendor) {
      setRows((prev) => prev.map((row) => String(row.vendor_id) === String(savedData.vendor_id) ? { ...row, ...savedData } : row));
      showToast('Vendor updated successfully');
    } else {
      const next = savedData.vendor_id ? savedData : { ...savedData, vendor_id: Date.now() };
      setRows((prev) => [next, ...prev]);
      setTotal((t) => t + 1);
      showToast('Vendor added successfully');
    }
    setEditVendor(null);
    setFormOpen(false);
  };

  return (
    <>
      <div className="page-header">
        <div>
          <div className="breadcrumb">Master Data / Vendors</div>
          <h2>
            Vendors ({filtered.length})
          </h2>
          <div style={{ color: '#6b7280', fontSize: 13 }}>
            {filtered.length} of {total} total
          </div>
         
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn btn-primary"
            style={{ background: '#16a34a' }}
            onClick={handleAdd}
          >
            <Plus size={15} /> Add Vendors
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setShowFilterPanel((v) => !v)}
          >
            <Filter size={15} /> Filter {showFilterPanel ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {toast && (
        <div className={`alert alert-${toastType === 'error' ? 'error' : 'success'}`} style={{ marginBottom: 14 }}>
          {toast}
        </div>
      )}

      {showFilterPanel && (
        <div className="report-filter-panel">
          <div className="report-filter-grid">
            <label>
              Vendor
              <input
                value={pendingSearch}
                onChange={(e) => setPendingSearch(e.target.value)}
                placeholder="Search vendors…"
              />
            </label>
          </div>
          <div className="report-filter-actions">
            <button className="btn btn-secondary" onClick={clearFilters}>Clear</button>
            <button className="btn btn-primary" onClick={applyFilters}>
              <Search size={14} /> Apply Filters
            </button>
          </div>
        </div>
      )}

      {(() => {
        const tabs = [
          { key: 'all',      label: 'All' },
          { key: 'Active',   label: 'Active' },
          { key: 'Inactive', label: 'Inactive' },
        ].map((tab) => ({
          ...tab,
          count: tab.key === 'all'
            ? total
            : rows.filter((row) => (row.status || 'Active') === tab.key).length,
        }));

        return (
          <div className="tabs">
            {tabs.map(tab => (
              <button
                key={tab.key}
                className={activeTab === tab.key ? 'active' : ''}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label} <span style={{ opacity: 0.75, marginLeft: 4 }}>({tab.count})</span>
              </button>
            ))}
          </div>
        );
      })()}

      <div className="card">
        <div className="table-toolbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Search size={14} color="#6b7280" />
            <input
              type="text"
              className="search-input"
              placeholder="Quick search vendors…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <span className="badge badge-info" style={{ marginLeft: 8 }}>Filtered</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <select
              value={perPage}
              onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
            >
              {[5, 8, 10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>{n} / page</option>
              ))}
            </select>
          </div>
        </div>

        <div className="table-wrap">
          {loading ? (
            <div className="loading" style={{ padding: 40 }}>
              <Loader2 className="animate-spin" size={20} /> Loading…
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Vendors</th>
                  <th style={{ width: 120 }}>Status</th>
                  <th style={{ textAlign: 'right', width: 120 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {current.length === 0 && (
                  <tr>
                    <td colSpan={3} className="empty-row">
                      No vendors match the current filters.
                    </td>
                  </tr>
                )}
                {current.map((row, idx) => {
                  const rid = row.vendor_id ?? `row-${idx}`;
                  const keyStr = String(rid) + '-' + String(idx);
                  return (
                    <tr key={keyStr}>
                      <td style={{ fontWeight: 500 }}>{row.vendor_name || ''}</td>
                      <td>
                        <span className={`badge badge-${(row.status || 'Active') === 'Active' ? 'success' : 'muted'}`}>
                          {row.status || 'Active'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <ActionMenu
                          vendor={row}
                          isOpen={openMenuId === String(rid)}
                          onOpen={() => setOpenMenuId(String(rid))}
                          onClose={() => setOpenMenuId(null)}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="pagination">
          <div>
            Showing {current.length === 0 ? 0 : ((page - 1) * perPage + 1)} – {Math.min(page * perPage, filtered.length)} of {filtered.length}
          </div>
          <div className="page-buttons">
            <button disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>«</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .slice(Math.max(0, page - 3), page + 2)
              .map((p) => (
                <button key={p} className={p === page ? 'active' : ''} onClick={() => setPage(p)}>{p}</button>
              ))}
            <button disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>»</button>
          </div>
        </div>
      </div>

      <VendorFormModal
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditVendor(null); }}
        onSaved={handleSaved}
        editVendor={editVendor}
      />
    </>
  );
}
