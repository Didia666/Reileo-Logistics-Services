import React, { useEffect, useState } from 'react';
import { Loader2, Ban } from 'lucide-react';
import { auditLogs } from '../services/api.js';

const MODULES = [
  ['auth', 'Authentication'],
  ['bookings', 'Bookings'],
  ['customers', 'Customers'],
  ['personnel', 'Personnel'],
  ['vehicles', 'Vehicles'],
  ['settings', 'Settings'],
  ['system', 'System'],
];

const ACTIONS = ['login', 'logout', 'create', 'update', 'delete', 'approve', 'dispatch', 'deliver', 'complete', 'cancel'];

function moduleLabel(module) {
  const labels = {
    bookings: 'a booking',
    customers: 'a customer',
    personnel: 'a personnel record',
    vehicles: 'a vehicle',
    auth: 'the system',
    booking_types: 'a booking type',
    depots: 'a depot',
    origins: 'an origin',
    destination: 'a destination',
    item_types: 'an item type',
    vendors: 'a vendor',
    settings: 'a setting',
  };
  return labels[module] || `a ${String(module || 'record').replace(/_/g, ' ')}`;
}

function formatChanges(_value, action, module) {
  if (action === 'login') return 'User signed in';
  if (action === 'logout') return 'User signed out';

  const subject = moduleLabel(module);
  const summaries = {
    create: `Added ${subject}`,
    update: `Updated ${subject}`,
    delete: `Deleted ${subject}`,
    approve: `Approved ${subject}`,
    dispatch: `Dispatched ${subject}`,
    deliver: `Marked ${subject} as delivered`,
    complete: `Completed ${subject}`,
    cancel: `Cancelled ${subject}`,
  };
  return summaries[action] || `${String(action || 'Completed').replace(/^./, (letter) => letter.toUpperCase())} ${subject}`;
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value.replace(' ', 'T'));
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export default function Logs() {
  const [filters, setFilters] = useState({ module: '', action: '', from: '', to: '' });
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const perPage = 10;

  const loadLogs = async (nextFilters = filters) => {
    setLoading(true);
    setError('');
    try {
      const data = await auditLogs.list(
        Object.fromEntries(Object.entries(nextFilters).filter(([, value]) => value))
      );
      setLogs(Array.isArray(data) ? data : (data?.data || []));
      setPage(1);
    } catch (e) {
      setError(e.message || 'Unable to load audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadLogs(); }, []);

  const current = logs.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.max(1, Math.ceil(logs.length / perPage));

  const updateFilter = (key, value) => {
    setFilters((previous) => ({ ...previous, [key]: value }));
  };

  return (
    <div className="logs-page">
      <div className="logs-card">
        <h2>Audit Logs</h2>
        <div className="logs-divider" />

        <div className="logs-filters">
          <div className="logs-field logs-module-field">
            <label htmlFor="audit-module">Module <span>*</span></label>
            <select id="audit-module" value={filters.module} onChange={(e) => updateFilter('module', e.target.value)}>
              <option value="">All modules</option>
              {MODULES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>

          <div className="logs-filter-row">
            <div className="logs-field">
              <label htmlFor="audit-action">Filter Type</label>
              <select id="audit-action" value={filters.action} onChange={(e) => updateFilter('action', e.target.value)}>
                <option value="">All actions</option>
                {ACTIONS.map((action) => <option key={action} value={action}>{action[0].toUpperCase() + action.slice(1)}</option>)}
              </select>
            </div>
            <div className="logs-field">
              <label htmlFor="audit-from">From <span>*</span></label>
              <input id="audit-from" type="date" value={filters.from} onChange={(e) => updateFilter('from', e.target.value)} />
            </div>
            <div className="logs-field">
              <label htmlFor="audit-to">To <span>*</span></label>
              <input id="audit-to" type="date" value={filters.to} onChange={(e) => updateFilter('to', e.target.value)} />
            </div>
            <button className="btn btn-success logs-apply" type="button" onClick={() => loadLogs()} disabled={loading}>
              Apply filter
            </button>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        <div className="logs-table-wrap">
          <table className="data-table logs-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Action</th>
                <th>Date</th>
                <th>User</th>
                <th>Changes Made</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="logs-empty"><Loader2 className="animate-spin" size={22} /> Loading logs...</td></tr>
              ) : current.length === 0 ? (
                <tr><td colSpan="5" className="logs-empty"><span>No items</span> <Ban size={27} /></td></tr>
              ) : current.map((log) => (
                <tr key={log.log_id}>
                  <td>{log.reference || '-'}</td>
                  <td><span className="badge badge-info">{log.action[0].toUpperCase() + log.action.slice(1)}</span></td>
                  <td>{formatDate(log.created_at)}</td>
                  <td>{log.username || 'System'}</td>
                  <td className="logs-changes" title={formatChanges(log.changes_made, log.action, log.module)}>{formatChanges(log.changes_made, log.action, log.module)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="logs-pagination">
          <button type="button" disabled={page === 1} onClick={() => setPage(1)}>&laquo;</button>
          <button type="button" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>&lsaquo;</button>
          <button type="button" className="active">{page}</button>
          <button type="button" disabled={page === totalPages} onClick={() => setPage((value) => value + 1)}>&rsaquo;</button>
          <button type="button" disabled={page === totalPages} onClick={() => setPage(totalPages)}>&raquo;</button>
        </div>
      </div>
    </div>
  );
}
