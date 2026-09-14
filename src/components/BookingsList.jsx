import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { bookings, lookups } from '../services/api.js';
import { Plus, MoreHorizontal, Eye, Pencil, X, Search, Loader2 } from 'lucide-react';
import BookingFormModal from './BookingForm.jsx';

const STATUS_TABS = [
  { key: 'all',                 label: 'All',         variant: 'default' },
  { key: 'Under Review',        label: 'Under Review', variant: 'info' },
  { key: 'Approved',            label: 'Approved',     variant: 'warning' },
  { key: 'Dispatched',          label: 'Dispatched',   variant: 'info' },
  { key: 'Delivered',           label: 'Delivered',    variant: 'success' },
  { key: 'Completed',           label: 'Completed',    variant: 'success' },
  { key: 'Cancelled',           label: 'Cancelled',    variant: 'danger' },
  { key: 'Declined',            label: 'Declined',     variant: 'danger' },
];

function statusVariant(name) {
  switch (name) {
    case 'Completed': case 'Delivered': case 'Approved': return 'success';
    case 'Dispatched': case 'Under Review': return 'info';
    case 'Cancelled': case 'Declined': return 'danger';
    default: return 'default';
  }
}

function ActionMenu({ booking, onOpen, onClose, isOpen, onView, onEdit, onApprove, onDispatch, onDeliver, onComplete, onCancel }) {
  const navigate = useNavigate();
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
          <button onClick={() => { onClose(); onView(booking); }}>
            <Eye size={12} style={{ marginRight: 6 }} /> View
          </button>
          <button onClick={() => { onClose(); onEdit(booking); }}>
            <Pencil size={12} style={{ marginRight: 6 }} /> Update
          </button>
          {booking.status_name === 'Under Review' && (
            <button onClick={() => { onClose(); onApprove(booking); }} style={{ color: '#059669' }}>
              ✓ Approve
            </button>
          )}
          {booking.status_name === 'Approved' && (
            <button onClick={() => { onClose(); onDispatch(booking); }} style={{ color: '#059669' }}>
              ✓ Dispatch
            </button>
          )}
          {booking.status_name === 'Dispatched' && (
            <button onClick={() => { onClose(); onDeliver(booking); }} style={{ color: '#059669' }}>
              ✓ Deliver
            </button>
          )}
          {booking.status_name === 'Delivered' && (
            <button onClick={() => { onClose(); onComplete(booking); }} style={{ color: '#059669' }}>
              ✓ Complete
            </button>
          )}
          <button className="danger" onClick={() => { onClose(); onCancel(booking); }}>
            <X size={12} style={{ marginRight: 6 }} /> Cancel
          </button>
        </div>
      )}
    </div>
  );
}

export default function BookingsList() {
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
  const [editBooking, setEditBooking] = useState(null);
  const [viewOnly, setViewOnly] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [a, s] = await Promise.all([
          bookings.list({ limit: 1000 }),
          lookups.bookingStatuses().catch(() => []),
        ]);
        const rows = Array.isArray(a) ? a : (Array.isArray(a?.data) ? a.data : []);
        setAll(rows);
        setTotal(a?.total || rows.length);
        setStatuses(Array.isArray(s) ? s : (Array.isArray(s?.data) ? s.data : []));
      } catch (e) {
        setToast(e.message || 'Unable to load bookings.');
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
        (r.booking_no || '').toLowerCase().includes(q) ||
        (r.customer_name || '').toLowerCase().includes(q) ||
        (r.plate_no || '').toLowerCase().includes(q) ||
        (r.origin_name || '').toLowerCase().includes(q) ||
        (r.destination || '').toLowerCase().includes(q)
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

  const handleCancel = async (b) => {
    if (!confirm(`Cancel booking ${b.booking_no}?`)) return;
    try {
      await bookings.cancel(b.booking_id);
      setAll(prev => prev.map(r => r.booking_id === b.booking_id ? { ...r, status_name: 'Cancelled', status_id: 7 } : r));
      setToast(`Booking ${b.booking_no} cancelled.`);
      setTimeout(() => setToast(''), 3000);
    } catch (e) { setToast(e.message); setTimeout(() => setToast(''), 4000); }
  };

  const handleApprove = async (b) => {
    if (!confirm(`Approve booking ${b.booking_no}?`)) return;
    try {
      await bookings.approve(b.booking_id);
      setAll(prev => prev.map(r => r.booking_id === b.booking_id ? { ...r, status_name: 'Approved', status_id: 2 } : r));
      setToast(`Booking ${b.booking_no} approved.`);
      setTimeout(() => setToast(''), 3000);
    } catch (e) { setToast(e.message); setTimeout(() => setToast(''), 4000); }
  };

  const handleDispatch = async (b) => {
    if (!confirm(`Dispatch booking ${b.booking_no}?`)) return;
    try {
      await bookings.dispatch(b.booking_id);
      setAll(prev => prev.map(r => r.booking_id === b.booking_id ? { ...r, status_name: 'Dispatched', status_id: 3 } : r));
      setToast(`Booking ${b.booking_no} dispatched.`);
      setTimeout(() => setToast(''), 3000);
    } catch (e) { setToast(e.message); setTimeout(() => setToast(''), 4000); }
  };

  const handleDeliver = async (b) => {
    if (!confirm(`Mark booking ${b.booking_no} as delivered?`)) return;
    try {
      await bookings.deliver(b.booking_id);
      setAll(prev => prev.map(r => r.booking_id === b.booking_id ? { ...r, status_name: 'Delivered', status_id: 4 } : r));
      setToast(`Booking ${b.booking_no} marked as delivered.`);
      setTimeout(() => setToast(''), 3000);
    } catch (e) { setToast(e.message); setTimeout(() => setToast(''), 4000); }
  };

  const handleComplete = async (b) => {
    if (!confirm(`Complete booking ${b.booking_no}?`)) return;
    try {
      await bookings.complete(b.booking_id);
      setAll(prev => prev.map(r => r.booking_id === b.booking_id ? { ...r, status_name: 'Completed', status_id: 6 } : r));
      setToast(`Booking ${b.booking_no} completed.`);
      setTimeout(() => setToast(''), 3000);
    } catch (e) { setToast(e.message); setTimeout(() => setToast(''), 4000); }
  };

  const handleView = (booking) => {
    setEditBooking(booking);
    setViewOnly(true);
    setFormOpen(true);
  };

  const handleEdit = (booking) => {
    setEditBooking(booking);
    setViewOnly(false);
    setFormOpen(true);
  };

  const handleAdd = () => {
    setEditBooking(null);
    setViewOnly(false);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditBooking(null);
    setViewOnly(false);
  };

  if (loading) return <div className="loading"><Loader2 className="animate-spin" size={20} /> Loading bookings…</div>;

  return (
    <>
      <div className="page-header">
        <div>
          <div className="breadcrumb">Operations / Bookings</div>
          <h2>Bookings</h2>
          <div style={{ color: '#6b7280', fontSize: 13 }}>
            {filtered.length} of {total} total · {statuses.length} statuses
          </div>
        </div>
        <div>
          <button className="btn btn-primary" onClick={handleAdd}>
            <Plus size={15} /> New Booking
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
              placeholder="Search booking no, customer, plate, route…"
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
                <th>Booking No</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Type</th>
                <th>Route</th>
                <th>Depot</th>
                <th>Vehicle</th>
                <th>Personnel</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {current.length === 0 && (
                <tr><td colSpan={10} className="empty-row">No bookings match the current filters.</td></tr>
              )}
              {current.map(b => (
                <tr key={b.booking_id}>
                  <td style={{ fontWeight: 600, color: '#2563eb' }}>{b.booking_no}</td>
                  <td style={{ whiteSpace: 'nowrap', color: '#6b7280' }}>
                    {b.created_at ? new Date(b.created_at).toLocaleDateString() : '—'}
                  </td>
                  <td>{b.customer_name || '—'}</td>
                  <td>{b.booking_type || '—'}</td>
                  <td>
                    <div>{b.origin_name || '—'}</div>
                    <div style={{ color: '#6b7280', fontSize: 12 }}>→ {b.destination || '—'}</div>
                  </td>
                  <td>{b.depot_name || '—'}</td>
                  <td>{b.plate_no || '—'}</td>
                  <td>
                    {b.personnel && b.personnel.length > 0 ? (
                      <div className="personnel-tags">
                        {b.personnel.map((p, i) => (
                          <span key={i} className="personnel-tag">
                            {p.assignment_role === 'driver' ? '🚚' : '👷'} {p.full_name}
                          </span>
                        ))}
                      </div>
                    ) : <span style={{ color: '#94a3b8' }}>—</span>}
                  </td>
                  <td>
                    <span className={`badge badge-${statusVariant(b.status_name)}`}>{b.status_name || 'Unknown'}</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <ActionMenu
                      booking={b}
                      isOpen={openMenuId === b.booking_id}
                      onOpen={() => setOpenMenuId(b.booking_id)}
                      onClose={() => setOpenMenuId(null)}
                      onView={handleView}
                      onEdit={handleEdit}
                      onApprove={handleApprove}
                      onDispatch={handleDispatch}
                      onDeliver={handleDeliver}
                      onComplete={handleComplete}
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
      <BookingFormModal
        isOpen={formOpen}
        onClose={closeForm}
        onSaved={() => closeForm()}
        editVehicle={editBooking}
        viewOnly={viewOnly}
      />
    </>
  );
}
