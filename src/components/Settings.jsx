import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Plus, Search, Filter, Pencil, Trash2, Loader2, ChevronDown, ChevronUp,
  ShoppingBasket, FileText, MapPin, Map, Users, Cog, Wrench, Bell,
  CheckSquare, Clock, UserCog, Package, Car, X, MoreHorizontal, ChevronLeft,
  ShoppingCart, Layers,
} from 'lucide-react';
import { settingsCrud } from '../services/api.js';

const SETTINGS_CATEGORIES = [
  { key: 'booking-types',      label: 'Booking Types',       Icon: ShoppingBasket, endpoint: 'booking_types'  },
  { key: 'booking-item-types', label: 'Booking Item Types',  Icon: ShoppingCart,   endpoint: 'item_types'     },
  { key: 'commodity-types',    label: 'Commodity Types',     Icon: FileText,       endpoint: 'commodities'    },
  { key: 'category-types',     label: 'Category Types',      Icon: Layers,         endpoint: 'category_types' },
  { key: 'depots',             label: 'Depots',              Icon: MapPin,         endpoint: 'depots'         },
  { key: 'destinations',       label: 'Destinations',        Icon: Map,            endpoint: 'destinations'   },
  { key: 'origins',            label: 'Origins',             Icon: MapPin,         endpoint: 'origins'        },
  { key: 'personnel-types',    label: 'Personnel Types',     Icon: Users,          endpoint: 'p_types'        },
  { key: 'part-categories',    label: 'Part Categories',     Icon: Cog,            endpoint: null             },
  { key: 'part-locations',     label: 'Part Locations',      Icon: MapPin,         endpoint: null             },
  { key: 'personnel-renewal',  label: 'Personnel Renewal',   Icon: UserCog,        endpoint: null             },
  { key: 'vehicle-renewal',    label: 'Vehicle Renewal',     Icon: Bell,           endpoint: null             },
  { key: 'service-tasks',      label: 'Service Tasks',       Icon: Wrench,         endpoint: null             },
  { key: 'vehicle-types',      label: 'Vehicle Types',       Icon: CheckSquare,    endpoint: 'vh_types'             },
  { key: 'vehicle-makers',     label: 'Vehicle Makers',      Icon: Car,            endpoint: 'vh_manufacturers'             },
  { key: 'vehicle-models',     label: 'Vehicle Models',      Icon: Car,            endpoint: 'vh_models'             },
  { key: 'vendor-types',       label: 'Vendor Types',        Icon: Package,        endpoint: null             },
];

function stripTypeSuffix(label) {
  return label.replace(/ Types?$/, '');
}

function fallbackIdField(row) {
  if (!row) return '';
  const keys = Object.keys(row);
  const pk = keys.find((k) => k.endsWith('_id'));
  return pk || keys[0] || 'id';
}

function fallbackNameField(row) {
  if (!row) return '';
  const keys = Object.keys(row).filter(
    (k) => !k.endsWith('_id') && !['status', 'sort_order', 'created_at', 'updated_at'].includes(k)
  );
  return keys[0] || '';
}

function ActionMenu({ row, idKey, onEdit, onDelete, isOpen, onOpen, onClose }) {
  const ref = React.useRef(null);
  useEffect(() => {
    if (!isOpen) return;
    const click = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', click);
    return () => document.removeEventListener('mousedown', click);
  }, [isOpen, onClose]);

  const rid = idKey ? row?.[idKey] : null;

  return (
    <div className="action-menu" ref={ref}>
      <button onClick={onOpen}><MoreHorizontal size={14} /> Select</button>
      {isOpen && (
        <div className="dropdown">
          <button onClick={() => { onClose(); onEdit(row); }}>
            <Pencil size={12} style={{ marginRight: 6 }} /> Edit / Update
          </button>
          <button className="danger" onClick={() => { onClose(); onDelete(row, rid); }}>
            <Trash2 size={12} style={{ marginRight: 6 }} /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

function EditModal({ category, schema, item, onClose, onSave, saving }) {
  const nameField = schema?.nameField || 'name';
  const statusField = schema?.statusField || 'status';
  const [form, setForm] = useState(() => ({
    [nameField]: item?.[nameField] != null ? String(item[nameField]) : '',
    [statusField]: item?.[statusField] || item?.status || 'Active',
  }));
  const [err, setErr] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const value = (form[nameField] ?? '').toString().trim();
    if (!value) {
      setErr(`${stripTypeSuffix(category.label)} name is required`);
      return;
    }
    const payload = { ...form, [nameField]: value, [statusField]: form[statusField] || 'Active' };
    onSave(payload, { nameField, statusField });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{item ? 'Edit' : 'Add'} {stripTypeSuffix(category.label)}</h3>
          <button className="btn btn-ghost" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {err && <div className="alert alert-error">{err}</div>}
            <div className="form-group">
              <label>{stripTypeSuffix(category.label)} Name <span style={{color:'#dc2626'}}>*</span></label>
              <input
                type="text"
                value={form[nameField] ?? ''}
                onChange={(e) => { setForm({ ...form, [nameField]: e.target.value }); setErr(''); }}
                placeholder={`Enter ${category.label.toLowerCase()}`}
                autoFocus
              />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select
                value={form[statusField] || 'Active'}
                onChange={(e) => setForm({ ...form, [statusField]: e.target.value })}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving && <Loader2 className="animate-spin" size={14} />}
              {saving ? 'Saving…' : (item ? 'Update' : 'Save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Settings() {
  const { category } = useParams();
  const navigate = useNavigate();

  const activeCat = useMemo(() => {
    if (!category) return SETTINGS_CATEGORIES[0];
    return SETTINGS_CATEGORIES.find((c) => c.key === category) || SETTINGS_CATEGORIES[0];
  }, [category]);

  const hasApi = !!activeCat.endpoint;

  const [schema, setSchema] = useState(null);
  const [schemaLoading, setSchemaLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);

  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pendingSearch, setPendingSearch] = useState('');
  const [pendingStatus, setPendingStatus] = useState('all');

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const [editingItem, setEditingItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [openMenuId, setOpenMenuId] = useState(null);

  const [toast, setToast] = useState('');
  const [toastType, setToastType] = useState('success');

  const showToast = useCallback((msg, type = 'success') => {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(''), 3500);
  }, []);

  const crud = useMemo(() => {
    if (!hasApi) return null;
    try { return settingsCrud(activeCat.endpoint); } catch (e) { return null; }
  }, [activeCat.endpoint, hasApi]);

  const nameField = schema?.nameField || '';
  const idField = schema?.idField || '';
  const statusField = schema?.statusField || 'status';

  const fetchSchema = useCallback(async () => {
    if (!crud) return null;
    setSchemaLoading(true);
    try {
      const res = await crud.schema();
      if (res && res.success) {
        setSchema({
          idField: res.idField || '',
          nameField: res.nameField || '',
          statusField: res.statusField || 'status',
          allowedFields: res.allowedFields || [],
          table: res.table || '',
        });
        return res;
      }
      setSchema(null);
      return null;
    } catch (e) {
      setSchema(null);
      showToast('Failed to read schema: ' + (e?.message || 'Unknown error'), 'error');
      return null;
    } finally {
      setSchemaLoading(false);
    }
  }, [crud, showToast]);

  const fetchData = useCallback(async () => {
    if (!crud) return;
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await crud.list(params);
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
  }, [crud, search, statusFilter, showToast]);

  useEffect(() => {
    setSchema(null);
    setRows([]);
    setTotal(0);
    setPage(1);
    setEditingItem(null);
    setIsModalOpen(false);
    if (!crud) return;
    (async () => {
      await fetchSchema();
      await fetchData();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [crud]);

  useEffect(() => { setPage(1); }, [search, statusFilter]);
  useEffect(() => { if (schema) fetchData(); }, [fetchData, schema]);

  const totalPages = Math.max(1, Math.ceil(rows.length / perPage));
  const current = rows.slice((page - 1) * perPage, page * perPage);

  const applyFilters = () => {
    setSearch(pendingSearch);
    setStatusFilter(pendingStatus);
    setShowFilterPanel(false);
  };
  const clearFilters = () => {
    setPendingSearch('');
    setPendingStatus('all');
    setSearch('');
    setStatusFilter('all');
  };

  const resolveNameFieldForRow = (row) => {
    if (nameField && row && Object.prototype.hasOwnProperty.call(row, nameField)) return nameField;
    return fallbackNameField(row);
  };

  const resolveIdFieldForRow = (row) => {
    if (idField && row && Object.prototype.hasOwnProperty.call(row, idField)) return idField;
    return fallbackIdField(row);
  };

  const getRowName = (row) => {
    const k = resolveNameFieldForRow(row);
    return k ? (row[k] ?? '') : '';
  };

  const getRowStatus = (row) => {
    if (row && statusField && Object.prototype.hasOwnProperty.call(row, statusField)) {
      return row[statusField];
    }
    if (row && Object.prototype.hasOwnProperty.call(row, 'status')) {
      return row['status'];
    }
    return 'Active';
  };

  const handleSave = async (payload, fields) => {
    if (!crud) return;
    const nf = fields?.nameField || nameField;
    const sf = fields?.statusField || statusField;
    setSaving(true);
    try {
      const isEdit = !!editingItem;
      if (isEdit) {
        const rK = resolveIdFieldForRow(editingItem);
        const id = editingItem[rK];
        const res = await crud.update(id, payload);
        if (!res || res.success === false) {
          throw new Error((res && res.error) || 'Update rejected by server');
        }
        const updatedRow = res?.data || null;
        if (updatedRow) {
          const kU = resolveIdFieldForRow(updatedRow);
          setRows((prev) =>
            prev.map((r) => {
              const k = resolveIdFieldForRow(r);
              return String(r[k]) === String(updatedRow[kU]) ? { ...r, ...updatedRow } : r;
            })
          );
        } else {
          await fetchData();
        }
        showToast(`${stripTypeSuffix(activeCat.label)} updated successfully`);
      } else {
        const res = await crud.create(payload);
        if (!res || res.success === false) {
          throw new Error((res && res.error) || 'Create rejected by server');
        }
        const newRow = res?.data || null;
        if (newRow) {
          setRows((prev) => [newRow, ...prev]);
          setTotal((t) => t + 1);
        } else {
          await fetchData();
        }
        showToast(`${stripTypeSuffix(activeCat.label)} added successfully`);
      }
      setIsModalOpen(false);
      setEditingItem(null);
    } catch (e) {
      showToast((e?.message || 'Save failed'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row, ridIn) => {
    if (!crud || !row) return;
    const rK = resolveIdFieldForRow(row);
    const id = ridIn != null ? ridIn : (rK ? row[rK] : null);
    const displayName = getRowName(row) || '(unnamed)';
    if (id == null || id === '') {
      showToast('Cannot delete: missing ID', 'error');
      return;
    }
    if (!window.confirm(`Delete "${displayName}"? This cannot be undone.`)) return;
    try {
      const res = await crud.remove(id);
      if (res && res.success === false) {
        throw new Error((res && res.error) || 'Delete rejected by server');
      }
      setRows((prev) =>
        prev.filter((r) => {
          const k = resolveIdFieldForRow(r);
          return String(r[k]) !== String(id);
        })
      );
      setTotal((t) => Math.max(0, t - 1));
      showToast(`"${displayName}" deleted`);
    } catch (e) {
      showToast((e?.message || 'Delete failed'), 'error');
    }
  };

  return (
    <div className="settings-layout">
      <aside className="settings-sidebar">
        <div className="settings-sidebar-header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ChevronLeft size={14} />
          </button>
          <span style={{ fontWeight: 600 }}>SETTINGS</span>
        </div>
        <nav className="settings-nav">
          {SETTINGS_CATEGORIES.map(({ key, label, Icon }) => {
            const isActive = key === activeCat.key;
            return (
              <a
                key={key}
                href={`/settings/${key}`}
                className={isActive ? 'active' : ''}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(`/settings/${key}`);
                }}
              >
                <Icon size={16} /> <span>{label}</span>
              </a>
            );
          })}
        </nav>
      </aside>

      <div className="settings-main">
        <div className="page-header">
          <div>
            <div className="breadcrumb">Settings / {activeCat.label}</div>
            <h2>
              {activeCat.label} <span style={{ color: '#6b7280', fontSize: 18 }}>({total})</span>
            </h2>
            {schemaLoading && (
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                <Loader2 size={12} className="animate-spin" style={{ display: 'inline-block', marginRight: 6 }} />
                Detecting table columns…
              </div>
            )}
            {schema && schema.table && (
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                Table: <code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: 4 }}>{schema.table}</code>
                {' · '}Name field: <code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: 4 }}>{schema.nameField || '(auto)'}</code>
                {' · '}ID: <code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: 4 }}>{schema.idField || '(auto)'}</code>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-primary"
              style={{ background: '#16a34a' }}
              onClick={() => {
                if (!hasApi) { showToast('This module is coming soon', 'error'); return; }
                setEditingItem(null);
                setIsModalOpen(true);
              }}
            >
              <Plus size={15} /> Add {stripTypeSuffix(activeCat.label)}
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
          <div
            className={`alert alert-${toastType === 'error' ? 'error' : 'success'}`}
            style={{ marginBottom: 14 }}
          >
            {toast}
          </div>
        )}

        {showFilterPanel && (
          <div className="card" style={{ marginBottom: 16, padding: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'end' }}>
                <div className="form-group" style={{ flex: '1 1 280px', marginBottom: 0 }}>
                  <label>{stripTypeSuffix(activeCat.label)}</label>
                  <input
                    type="text"
                    value={pendingSearch}
                    onChange={(e) => setPendingSearch(e.target.value)}
                    placeholder={`Search ${activeCat.label.toLowerCase()}…`}
                  />
                </div>
                <div className="form-group" style={{ minWidth: 180, marginBottom: 0 }}>
                  <label>Status</label>
                  <select value={pendingStatus} onChange={(e) => setPendingStatus(e.target.value)}>
                    <option value="all">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 200 }}>
                <button className="btn btn-primary" onClick={applyFilters}>
                  <Search size={14} /> Search
                </button>
                <button className="btn btn-primary" style={{ background: '#3b82f6' }} onClick={clearFilters}>
                  Clear Search
                </button>
              </div>
            </div>
          </div>
        )}

        {!hasApi ? (
          <div className="page-placeholder">
            <h2>{activeCat.label}</h2>
            <p>This settings module is coming soon. Select <strong>Booking Types</strong> for a fully working demo.</p>
          </div>
        ) : (
          <div className="card">
            <div className="table-toolbar">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Search size={14} color="#6b7280" />
                <input
                  type="text"
                  className="search-input"
                  placeholder={`Quick search ${activeCat.label.toLowerCase()}…`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {(search || statusFilter !== 'all') && (
                  <span className="badge badge-info" style={{ marginLeft: 8 }}>Filtered</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <select
                  value={perPage}
                  onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
                >
                  {[5, 10, 25, 50, 100].map((n) => (
                    <option key={n} value={n}>{n} / page</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="table-wrap">
              {(loading || schemaLoading) ? (
                <div className="loading" style={{ padding: 40 }}>
                  <Loader2 className="animate-spin" size={20} /> Loading…
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{stripTypeSuffix(activeCat.label)}</th>
                      <th style={{ width: 120 }}>Status</th>
                      <th style={{ textAlign: 'right', width: 120 }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {current.length === 0 && (
                      <tr>
                        <td colSpan={3} className="empty-row">
                          No records. Click <strong>Add</strong> to create the first one.
                        </td>
                      </tr>
                    )}
                    {current.map((row, idx) => {
                      const rK = resolveIdFieldForRow(row);
                      const rid = rK ? (row[rK] ?? `row-${idx}`) : `row-${idx}`;
                      const keyStr = String(rid) + '-' + String(idx);
                      return (
                        <tr key={keyStr}>
                          <td style={{ fontWeight: 500 }}>{getRowName(row)}</td>
                          <td>
                            <span className={`badge badge-${getRowStatus(row) === 'Active' ? 'success' : 'muted'}`}>
                              {getRowStatus(row) || 'Active'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <ActionMenu
                              row={row}
                              idKey={rK}
                              isOpen={openMenuId === String(rid)}
                              onOpen={() => setOpenMenuId(String(rid))}
                              onClose={() => setOpenMenuId(null)}
                              onEdit={(r) => { setEditingItem(r); setIsModalOpen(true); }}
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
                Showing {current.length === 0 ? 0 : ((page - 1) * perPage + 1)} – {Math.min(page * perPage, rows.length)} of {rows.length}
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
        )}

        {isModalOpen && (
          <EditModal
            category={activeCat}
            schema={schema || { nameField: 'name', statusField: 'status' }}
            item={editingItem}
            onClose={() => { setIsModalOpen(false); setEditingItem(null); }}
            onSave={handleSave}
            saving={saving}
          />
        )}
      </div>
    </div>
  );
}
