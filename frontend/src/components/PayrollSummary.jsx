import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CircleDollarSign, Download, Eye, Loader2, Search, X } from 'lucide-react';
import { reports } from '../services/api.js';

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 10 }, (_, index) => currentYear - index);

function amount(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(amount(value));
}

function formatPeriodDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`));
}

function payrollNumber(row, personnelId) {
  return `PNO${String(personnelId).padStart(4, '0')}${String(row.period_start || '').replace(/-/g, '')}`;
}

function downloadCsv(rows, year, employee = null) {
  const columns = employee
    ? [
      ['payroll_no', 'Payroll No.'],
      ['period', 'Period Start - End'],
      ['total_earnings', 'Earnings'],
      ['total_deductions', 'Deductions'],
      ['net_pay', 'Net Pay'],
    ]
    : [
      ['employee_name', 'Employee Name'],
      ['completed_bookings', 'Completed Bookings'],
      ['base_earnings', 'Base Earnings'],
      ['allowances', 'Allowances'],
      ['total_earnings', 'Total Earnings'],
      ['total_deductions', 'Total Deductions'],
      ['net_pay', 'Net Pay'],
    ];
  const exportRows = employee
    ? rows.map((row) => ({
      ...row,
      payroll_no: payrollNumber(row, employee.personnel_id),
      period: `${row.period_start} - ${row.period_end}`,
    }))
    : rows;
  const escapeCsv = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const csv = [
    columns.map(([, label]) => escapeCsv(label)).join(','),
    ...exportRows.map((row) => columns.map(([key]) => escapeCsv(row[key])).join(',')),
  ].join('\r\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = employee
    ? `payroll-${employee.personnel_id}-${year}.csv`
    : `payroll-summary-${year}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function SummaryCard({ label, value, tone, icon: Icon }) {
  return (
    <article className={`payroll-summary-card payroll-summary-${tone}`}>
      <span className="payroll-summary-icon"><Icon size={16} /></span>
      <span className="payroll-summary-label">{label}</span>
      <strong className="payroll-summary-value">{formatCurrency(value)}</strong>
    </article>
  );
}

function PayrollDetails({ row, employee, onClose }) {
  const earningItems = [
    { label: 'Basic Salary', trips: Number(row.completed_bookings) || 0, value: row.base_earnings, recorded: true },
    { label: 'Holiday Pay', trips: null, value: null },
    { label: 'Overtime', trips: null, value: null },
    { label: 'Allowance', trips: null, value: row.allowances, recorded: true },
    { label: 'Adjustment', trips: null, value: null },
  ];
  const deductionItems = [
    'Rider Late', 'Charges', 'Meals', 'SSS', 'PHIC', 'Pag-ibig',
    'Pag-ibig STL', 'Utilities', 'Cash Advance', 'Other Deductions',
  ];

  return (
    <div className="payroll-modal-backdrop" onMouseDown={onClose}>
      <section
        className="payroll-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="payroll-details-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="payroll-modal-header">
          <div>
            <h3 id="payroll-details-title">Payroll Detail</h3>
          </div>
          <button type="button" onClick={onClose} aria-label="Close payroll breakdown"><X size={18} /></button>
        </header>
        <div className="payroll-detail-identity">
          <strong>{employee.employee_name}</strong>
          <span>{employee.personnel_type || 'Personnel'}{employee.depot_name ? ` · ${employee.depot_name}` : ''}</span>
          <small>Pay Period: {formatPeriodDate(row.period_start)} - {formatPeriodDate(row.period_end)}</small>
        </div>
        <div className="payroll-detail-columns">
          <section className="payroll-detail-section payroll-earnings-section">
            <h4>Earnings</h4>
            <table>
              <thead><tr><th>Earnings</th><th>Trips / Hrs</th><th>Amount</th></tr></thead>
              <tbody>
                {earningItems.map((item) => (
                  <tr key={item.label}>
                    <td>{item.label}</td>
                    <td>{item.trips ?? '—'}</td>
                    <td>{item.recorded ? formatCurrency(item.value) : '—'}</td>
                  </tr>
                ))}
                <tr className="payroll-detail-total">
                  <td colSpan="2">Total</td>
                  <td>{formatCurrency(row.total_earnings)}</td>
                </tr>
              </tbody>
            </table>
          </section>
          <section className="payroll-detail-section payroll-deductions-section">
            <h4>Deductions</h4>
            <table>
              <thead><tr><th>Deductions</th><th>Amount</th></tr></thead>
              <tbody>
                {deductionItems.map((item) => <tr key={item}><td>{item}</td><td>—</td></tr>)}
                <tr className="payroll-detail-total">
                  <td>Total</td>
                  <td>{formatCurrency(row.total_deductions)}</td>
                </tr>
              </tbody>
            </table>
          </section>
        </div>
        <div className="payroll-detail-net"><CircleDollarSign size={20} /><span>Net Pay</span><strong>{formatCurrency(row.net_pay)}</strong></div>
        <p className="payroll-deduction-note">Deduction amounts are not recorded in the current system and are shown as —.</p>
        <footer className="payroll-modal-footer">
          <button type="button" onClick={onClose}>Close</button>
        </footer>
      </section>
    </div>
  );
}

export default function PayrollSummary() {
  const [year, setYear] = useState(String(currentYear));
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [periodRows, setPeriodRows] = useState([]);
  const [periodsLoading, setPeriodsLoading] = useState(false);
  const [periodsError, setPeriodsError] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const periodRequestId = useRef(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    setRows([]);

    reports.list('payroll-summary', { year })
      .then((data) => {
        if (!Array.isArray(data)) throw new Error('The payroll summary response was invalid.');
        if (active) setRows(data);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || 'Unable to load the payroll summary.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [year]);

  useEffect(() => { setPage(1); }, [year, search, perPage, selectedEmployee]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    const source = selectedEmployee ? periodRows : rows;
    if (!query) return source;
    return source.filter((row) => selectedEmployee
      ? payrollNumber(row, selectedEmployee.personnel_id).toLowerCase().includes(query)
      : String(row.employee_name || '').toLowerCase().includes(query));
  }, [rows, periodRows, search, selectedEmployee]);

  const totals = useMemo(() => rows.reduce((summary, row) => ({
    earnings: summary.earnings + Math.round(amount(row.total_earnings) * 100),
    deductions: summary.deductions + Math.round(amount(row.total_deductions) * 100),
    netPay: summary.netPay + Math.round(amount(row.net_pay) * 100),
  }), { earnings: 0, deductions: 0, netPay: 0 }), [rows]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / perPage));
  const visibleRows = filteredRows.slice((page - 1) * perPage, page * perPage);

  const openEmployeePayroll = async (employee) => {
    const requestId = ++periodRequestId.current;
    setSelectedEmployee(employee);
    setPeriodRows([]);
    setPeriodsLoading(true);
    setPeriodsError('');
    setSearch('');

    try {
      const data = await reports.list('payroll-periods', {
        year,
        personnel_id: employee.personnel_id,
      });
      if (!Array.isArray(data)) throw new Error('The payroll periods response was invalid.');
      if (requestId === periodRequestId.current) setPeriodRows(data);
    } catch (requestError) {
      if (requestId === periodRequestId.current) {
        setPeriodsError(requestError.message || 'Unable to load payroll periods.');
      }
    } finally {
      if (requestId === periodRequestId.current) setPeriodsLoading(false);
    }
  };

  const returnToSummary = () => {
    periodRequestId.current += 1;
    setSelectedEmployee(null);
    setPeriodRows([]);
    setPeriodsError('');
    setSearch('');
    setPage(1);
  };

  return (
    <section className="payroll-page">
      <header className="payroll-page-header">
        <div>
          <h2>Payroll Summary</h2>
          <p>Annual payroll overview and breakdown — fiscal year {year}</p>
        </div>
      </header>

      <section className="payroll-year-panel" aria-label="Payroll year filter">
        <label htmlFor="payroll-year">Select year</label>
        <select
          id="payroll-year"
          value={year}
          onChange={(event) => {
            setYear(event.target.value);
            returnToSummary();
            setSelectedPeriod(null);
          }}
        >
          {YEAR_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      </section>

      <section className="payroll-summary-grid" aria-label="Annual payroll totals">
        <SummaryCard label="Total earnings" value={totals.earnings / 100} tone="earnings" icon={CircleDollarSign} />
        <SummaryCard label="Total deductions" value={totals.deductions / 100} tone="deductions" icon={CircleDollarSign} />
        <SummaryCard label="Net pay" value={totals.netPay / 100} tone="net" icon={CircleDollarSign} />
      </section>

      <section className="payroll-table-panel">
        <header className="payroll-table-header">
          <div>
            <h3>Annual Payroll Summary</h3>
            <p>{loading || periodsLoading ? 'Loading records…' : `Showing ${filteredRows.length} records`}</p>
          </div>
          <button
            type="button"
            className="payroll-export-btn"
            onClick={() => downloadCsv(filteredRows, year, selectedEmployee)}
            disabled={loading || periodsLoading || filteredRows.length === 0}
          >
            <Download size={14} /> Export CSV
          </button>
        </header>

        <div className="payroll-breadcrumb">
          <button type="button" onClick={returnToSummary}>Payroll Summary</button>
          <span>›</span>
          <button type="button" onClick={returnToSummary}>{year}</button>
          {selectedEmployee && <><span>›</span><span>{selectedEmployee.employee_name}</span></>}
        </div>
        <div className="payroll-toolbar">
          <label htmlFor="payroll-search">Filter:</label>
          <div className="payroll-search">
            <Search size={14} />
            <input
              id="payroll-search"
              type="search"
              placeholder={selectedEmployee ? 'Payroll No' : 'Employee name'}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <label htmlFor="payroll-per-page">Items per page:</label>
          <select
            id="payroll-per-page"
            value={perPage}
            onChange={(event) => setPerPage(Number(event.target.value))}
          >
            {[10, 25, 50].map((size) => <option key={size} value={size}>{size}</option>)}
          </select>
        </div>

        {error && <div className="alert alert-error payroll-error">{error}</div>}
        <div className="payroll-table-wrap">
          <table className="payroll-table">
            <thead>
              <tr>
                {selectedEmployee ? (
                  <>
                    <th>Payroll No</th>
                    <th>Period Start - End</th>
                    <th>Earnings</th>
                    <th>Deductions</th>
                    <th>Net Pay</th>
                  </>
                ) : (
                  <>
                    <th>Employee Name</th>
                    <th>Completed Bookings</th>
                    <th>Total Earnings</th>
                    <th>Total Deductions</th>
                    <th>Net Pay</th>
                  </>
                )}
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {(!selectedEmployee && loading) || (selectedEmployee && periodsLoading) ? (
                <tr><td className="payroll-empty" colSpan="6"><Loader2 className="animate-spin" size={18} /> Loading payroll records…</td></tr>
              ) : (!selectedEmployee && error) || (selectedEmployee && periodsError) ? (
                <tr><td className="payroll-empty" colSpan="6">Payroll records could not be loaded.</td></tr>
              ) : visibleRows.length === 0 ? (
                <tr><td className="payroll-empty" colSpan="6">No payroll records found for {year}.</td></tr>
              ) : selectedEmployee ? visibleRows.map((row) => (
                <tr key={`${row.period_start}-${selectedEmployee.personnel_id}`}>
                  <td>{payrollNumber(row, selectedEmployee.personnel_id)}</td>
                  <td>{formatPeriodDate(row.period_start)} - {formatPeriodDate(row.period_end)}</td>
                  <td>{formatCurrency(row.total_earnings)}</td>
                  <td>{formatCurrency(row.total_deductions)}</td>
                  <td>{formatCurrency(row.net_pay)}</td>
                  <td><button className="payroll-view-btn" type="button" onClick={() => setSelectedPeriod(row)}><Eye size={13} /> View Payroll</button></td>
                </tr>
              )) : visibleRows.map((row) => (
                <tr key={row.personnel_id}>
                  <td>{row.employee_name}</td>
                  <td>{Number(row.completed_bookings) || 0}</td>
                  <td>{formatCurrency(row.total_earnings)}</td>
                  <td>{formatCurrency(row.total_deductions)}</td>
                  <td>{formatCurrency(row.net_pay)}</td>
                  <td><button className="payroll-view-btn" type="button" onClick={() => openEmployeePayroll(row)}><Eye size={13} /> View Payroll</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <footer className="payroll-pagination">
          <span>{filteredRows.length ? `Showing ${(page - 1) * perPage + 1}–${Math.min(page * perPage, filteredRows.length)} of ${filteredRows.length}` : 'Showing 0 records'}</span>
          <div>
            <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1}>Previous</button>
            <span>Page {page} of {totalPages}</span>
            <button type="button" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={page >= totalPages}>Next</button>
          </div>
        </footer>
        <p className="payroll-data-note">
          Earnings include recorded personnel rates and allowances from completed bookings. Payroll deductions are not tracked in the current system.
        </p>
      </section>

      {periodsError && selectedEmployee && <div className="alert alert-error payroll-error">{periodsError}</div>}
      {selectedPeriod && selectedEmployee && (
        <PayrollDetails row={selectedPeriod} employee={selectedEmployee} onClose={() => setSelectedPeriod(null)} />
      )}
    </section>
  );
}
