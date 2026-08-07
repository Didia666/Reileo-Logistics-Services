import { useState, useMemo } from 'react'
import { ArrowLeft } from 'lucide-react'
import { PERSONNEL_LIST, DEPOTS } from '../data/mockData'

const emptyForm = {
  periodStart: '',
  periodEnd: '',
  dateCreated: '',
  processedBy: '',
  depot: '',
  payrollNo: '',
  employeeCount: 0,
  totalEarnings: 0,
  totalDeductions: 0,
  notes: '',
}

export default function PayrollForm({ existingPayroll, onCancel, onSave }) {
  const [form, setForm] = useState(() =>
    existingPayroll
      ? {
          ...emptyForm,
          periodStart: existingPayroll.periodStart || '',
          periodEnd: existingPayroll.periodEnd || '',
          dateCreated: existingPayroll.dateCreated || '',
          processedBy: existingPayroll.processedBy || '',
          depot: existingPayroll.depot || '',
          payrollNo: existingPayroll.payrollNo || '',
          employeeCount: existingPayroll.employeeCount || 0,
          totalEarnings: existingPayroll.totalEarnings || 0,
          totalDeductions:
            existingPayroll.totalEarnings && existingPayroll.totalNetPay
              ? existingPayroll.totalEarnings - existingPayroll.totalNetPay
              : 0,
        }
      : emptyForm
  )

  const set = (field) => (e) => {
    const value =
      e.target.type === 'number' ? Number(e.target.value) : e.target.value
    setForm((f) => ({ ...f, [field]: value }))
  }

  const totalNetPay = useMemo(() => {
    return Math.max(0, (form.totalEarnings || 0) - (form.totalDeductions || 0))
  }, [form.totalEarnings, form.totalDeductions])

  const formatCurrency = (amount) =>
    '\u20B1' +
    Number(amount || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({ ...form, totalNetPay })
  }

  return (
    <div className="form-page">
      <button className="form-back" onClick={onCancel}>
        <ArrowLeft /> Back to Payroll List
      </button>

      <form onSubmit={handleSubmit}>
        <div className="form-card">
          <h3>Payroll Information</h3>
          <div className="form-grid">
            <div className="form-field">
              <label>
                Period Start<span className="req">*</span>
              </label>
              <input
                type="date"
                value={form.periodStart}
                onChange={set('periodStart')}
                required
              />
            </div>

            <div className="form-field">
              <label>
                Period End<span className="req">*</span>
              </label>
              <input
                type="date"
                value={form.periodEnd}
                onChange={set('periodEnd')}
                required
              />
            </div>

            <div className="form-field">
              <label>
                Date Created<span className="req">*</span>
              </label>
              <input
                type="date"
                value={form.dateCreated}
                onChange={set('dateCreated')}
                required
              />
            </div>

            <div className="form-field">
              <label>
                Processed By<span className="req">*</span>
              </label>
              <select
                value={form.processedBy}
                onChange={set('processedBy')}
                required
              >
                <option value="">Select personnel</option>
                {PERSONNEL_LIST.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>
                Depot<span className="req">*</span>
              </label>
              <select value={form.depot} onChange={set('depot')} required>
                <option value="">Select depot</option>
                {DEPOTS.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>Payroll No</label>
              <input
                type="text"
                value={form.payrollNo}
                onChange={set('payrollNo')}
                placeholder="Auto-generated"
              />
            </div>
          </div>
        </div>

        <div className="form-card">
          <h3>Employee Earnings Summary</h3>
          <div style={{ marginBottom: 14 }}>
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--text-muted)',
                letterSpacing: 0.3,
              }}
            >
              Employee Compensation
            </span>
          </div>
          <div className="form-grid">
            <div className="form-field">
              <label>Employee Count</label>
              <input
                type="number"
                min="0"
                value={form.employeeCount}
                onChange={set('employeeCount')}
              />
            </div>

            <div className="form-field">
              <label>Total Earnings (\u20B1)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.totalEarnings}
                onChange={set('totalEarnings')}
              />
            </div>

            <div className="form-field">
              <label>Total Deductions (\u20B1)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.totalDeductions}
                onChange={set('totalDeductions')}
              />
            </div>

            <div className="form-field">
              <label>Total Net Pay (\u20B1)</label>
              <input
                type="text"
                value={formatCurrency(totalNetPay)}
                readOnly
                style={{ background: '#f7f8fb' }}
              />
            </div>
          </div>
        </div>

        <div className="form-card">
          <h3>Notes</h3>
          <div className="form-grid">
            <div className="form-field span-2">
              <label>Description</label>
              <textarea
                rows={4}
                value={form.notes}
                onChange={set('notes')}
                placeholder="Additional notes or remarks about this payroll"
                style={{
                  border: '1px solid var(--border-light)',
                  borderRadius: 6,
                  padding: '9px 10px',
                  fontSize: 13.5,
                  color: 'var(--text-dark)',
                  background: '#fff',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
                onFocus={(e) => {
                  e.target.style.outline = 'none'
                  e.target.style.borderColor = 'var(--accent-blue)'
                  e.target.style.boxShadow =
                    '0 0 0 3px rgba(47, 111, 237, 0.12)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = ''
                  e.target.style.boxShadow = ''
                }}
              />
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-outline" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn btn-green">
            Save
          </button>
        </div>
      </form>
    </div>
  )
}
