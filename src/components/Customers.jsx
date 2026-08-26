import React, { useEffect, useMemo, useState } from 'react';
import { Plus, MoreHorizontal, Pencil, Trash2, Search, Loader2, Filter, Download } from 'lucide-react';
import { customersCrud } from '../services/api.js';
import CustomerFormModal from './CustomerForm.jsx';

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

  useEffect(() => { setPage(1); }, [search, perPage]);

  const filtered = useMemo(() => {
    let rows = all;
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
  }, [all, search]);

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

  if (loading) return <div className="loading"><Loader2 className="animate-spin" size={20} /> Loading customers…</div>;

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
          <button className="btn btn-ghost" title="Download CSV">
            <Download size={14} /> Download
          </button>
          <button className="btn btn-primary" onClick={handleAdd}>
            <Plus size={15} /> Add Customer
          </button>
          <button className="btn btn-ghost" title="Filter">
            <Filter size={14} /> Filter
          </button>
        </div>
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
    </>
  );
}
