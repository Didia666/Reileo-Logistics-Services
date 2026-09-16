import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { vehicleCrud, lookups } from '../services/api.js';
import { Plus, MoreHorizontal, Eye, Pencil, X, Search, Loader2 } from 'lucide-react';
import VehiclesFormModal from './VehiclesForm.jsx';

const STATUS_TABS = [
  { key: 'all',                 label: 'All',                variant: 'default' },
  { key: 'Active',              label: 'Active',             variant: 'info' },
  { key: 'Inactive',            label: 'Inactive',           variant: 'warning' },
  { key: 'Sold',                label: 'Sold',               variant: 'info' },
  { key: 'Archive',             label: 'Archive',            variant: 'success' },
  { key: 'Scrapped',            label: 'Scrapped',           variant: 'success' },
  { key: 'In-shop',             label: 'In-shop',            variant: 'danger' },
  { key: 'Out of Service',      label: 'Out of Service',     variant: 'danger' },
];


function statusVariant(name) {
  switch (name) {
    case 'Active': case 'Archive': case 'In-shop': return 'success';
    case 'Inactive': case 'Sold': return 'warning';
    case 'Scrapped': case 'Out of Service': return 'success';
    default: return 'default';
  }
}



function ActionMenu({ vehicle, onOpen, onClose, isOpen, onView, onEdit, onCancel }) {
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
          <button onClick={() => { onClose(); onView(vehicle); }}>
            <Eye size={12} style={{ marginRight: 6 }} /> View
          </button>
          <button onClick={() => { onClose(); onEdit(vehicle); }}>
            <Pencil size={12} style={{ marginRight: 6 }} /> Update
          </button>
          <button className="danger" onClick={() => { onClose(); onCancel(vehicle); }}>
            <X size={12} style={{ marginRight: 6 }} /> Cancel
          </button>
        </div>
      )}
    </div>
  );
}

export default function Vehicles() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [all, setAll] = useState([]);
  const [total, setTotal] = useState(0);
  const [statuses, setStatuses] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [toast, setToast] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editVehicle, setEditVehicle] = useState(null);
  const [viewOnly, setViewOnly] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [a, s] = await Promise.all([
          vehicleCrud.list({ limit: 1000 }),
          lookups.vehicle_statuses().catch(() => []),
        ]);
        const rows = Array.isArray(a) ? a : (Array.isArray(a?.data) ? a.data : []);
        setAll(rows);
        setTotal(a?.total || rows.length);
        setStatuses(Array.isArray(s) ? s : (Array.isArray(s?.data) ? s.data : []));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => { setPage(1); }, [activeTab, perPage]);

  const filtered = useMemo(() => {
    let rows = all;
    if (activeTab !== 'all') rows = rows.filter(r => (r.status_name || '') === activeTab);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(r =>
        (r.plate_no || '').toLowerCase().includes(q) ||
        (r.vehicle_type || '').toLowerCase().includes(q) ||
        (r.vehicle_manufacturer || '').toLowerCase().includes(q)
      );
    }
    return rows;
  }, [all, activeTab, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const current = filtered.slice((page - 1) * perPage, page * perPage);
  const tabs = useMemo(() => {
    const base = STATUS_TABS.map(t => {
      const count = t.key === 'all' ? all.length : all.filter(r => (r.status_name || '') === t.key).length;
      return { ...t, count };
    });
    return base;
  }, [all]);

  const handleCancel = async (v) => {
    if (!confirm(`Cancel vehicle ${v.plate_no}?`)) return;
    try {
      await vehicleCrud.cancel(v.vehicle_id);
      setAll(prev => prev.map(r => r.vehicle_id === v.vehicle_id ? { ...r, status_name: 'Cancelled', status_id: 7 } : r));
      setToast(`Vehicle ${v.plate_no} cancelled.`);
      setTimeout(() => setToast(''), 3000);
    } catch (e) { setToast(e.message); setTimeout(() => setToast(''), 4000); }
  };

  const handleView = async (v) => {
    setEditVehicle(v);
    setViewOnly(true);
    setFormOpen(true);
  };

  const handleEdit = async (v) => {
    try {
      const full = await vehicleCrud.get(v.vehicle_id);
      setEditVehicle(full);
      setViewOnly(false);
      setFormOpen(true);
    } catch (e) {
      setToast(e.message || 'Failed to load vehicle details.');
      setTimeout(() => setToast(''), 4000);
    }
  };

  const handleAdd = () => {
    setEditVehicle(null);
    setViewOnly(false);
    setFormOpen(true);
  };

  const handleSaved = (savedData) => {
    if (editVehicle && editVehicle.vehicle_id) {
      setAll(prev => prev.map(r => r.vehicle_id === savedData.vehicle_id ? savedData : r));
    } else {
      setAll(prev => [...prev, savedData]);
    }
    setEditVehicle(null);
    setViewOnly(false);
  };

  if (loading) return <div className="loading"><Loader2 className="animate-spin" size={20} /> Loading bookings…</div>;

  return (
    <>
      <div className="page-header">
        <div>
          <div className="breadcrumb">Operations / Vehicles</div>
          <h2>Vehicles</h2>
          <div style={{ color: '#6b7280', fontSize: 13 }}>
            {filtered.length} of {total} total · {statuses.length} status
          </div>
        </div>
        <div>
          <button className="btn btn-primary" onClick={handleAdd}>
            <Plus size={15} /> New Vehicles
          </button>
        </div>
      </div>

      {toast && <div className="alert alert-success" style={{ marginBottom: 14 }}>{toast}</div>}

      <div className="tabs">
        {tabs.map(t => (
          <button key={t.key} className={activeTab === t.key ? 'active' : ''} onClick={() => setActiveTab(t.key)}>
            {t.label} <span style={{ opacity: 0.75, marginLeft: 4 }}>({t.count})</span>
          </button>
        ))}
      </div>

      <div className="card">
        <div className="table-toolbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Search size={14} color="#6b7280" />
            <input
              type="text"
              className="search-input"
              placeholder="Search plate no, vehicle no, depot..."
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
                <th>Plate No.</th>
                <th>Vehicle Type</th>
                <th>Depot</th>
                <th>Maker</th>
                <th>With GPS</th>
                <th>Company Owned</th>
                <th>Subcon</th>
                <th>Category Type</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {current.length === 0 && (
                <tr key="empty-row"><td colSpan={10} className="empty-row">No vehicles match the current filters.</td></tr>
              )}
              {current.map((v, index) => (
                <tr key={v.vehicle_id ?? `${v.plate_no || 'vehicle'}-${index}`}>
                  <td style={{ fontWeight: 600, color: '#2563eb' }}>{v.plate_no}</td>
                  <td>{v.vehicle_type || '—'}</td>
                  <td>{v.depot_name || '—'}</td>
                  <td>{v.vehicle_manufacturer || '—'}</td>
                  <td>{v.GPS || '—'}</td>
                  <td>{v.vendor_id ? 'No' : 'Yes'}</td>
                  <td>{v.subcon_name || '—'}</td>
                  <td>{v.category_type || '—'}</td>
                  <td>
                    <span className={`badge badge-${statusVariant(v.status_name)}`}>{v.status_name || 'Unknown'}</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <ActionMenu
                      vehicle={v}
                      isOpen={openMenuId === v.vehicle_id}
                      onOpen={() => setOpenMenuId(v.vehicle_id)}
                      onClose={() => setOpenMenuId(null)}
                      onView={handleView}
                      onEdit={handleEdit}
                      onCancel={handleCancel}
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
      <VehiclesFormModal
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditVehicle(null); setViewOnly(false); }}
        onSaved={handleSaved}
        editVehicle={editVehicle}
        viewOnly={viewOnly}
      />
    </>
  );
}
