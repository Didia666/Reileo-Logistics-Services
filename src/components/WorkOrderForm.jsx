import { useState, useMemo } from 'react'
import { ArrowLeft } from 'lucide-react'
import {
  DEPOTS,
  VEHICLES,
  PERSONNEL_LIST,
  SCOPE_OF_WORK_OPTIONS,
} from '../data/mockData'

const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Urgent']

const emptyForm = {
  woNo: '',
  dateNeeded: '',
  depot: '',
  plateNo: '',
  assignedMechanic: '',
  priority: '',
  scopeOfWork: '',
  description: '',
  additionalNotes: '',
  partsCost: '',
  laborCost: '',
  otherFees: '',
}

export default function WorkOrderForm({ existingWorkOrder, onCancel, onSave }) {
  const [form, setForm] = useState(() =>
    existingWorkOrder
      ? {
          ...emptyForm,
          woNo: existingWorkOrder.woNo || '',
          dateNeeded: existingWorkOrder.dateNeeded || '',
          depot: existingWorkOrder.depot || '',
          plateNo: (existingWorkOrder.plateNo && existingWorkOrder.plateNo !== '-') ? existingWorkOrder.plateNo : '',
          scopeOfWork: existingWorkOrder.scopeOfWork || '',
        }
      : emptyForm
  )

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  const totalCost = useMemo(() => {
    const parts = Number(form.partsCost) || 0
    const labor = Number(form.laborCost) || 0
    const other = Number(form.otherFees) || 0
    return parts + labor + other
  }, [form.partsCost, form.laborCost, form.otherFees])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({ ...form, totalCost })
  }

  const formatPHP = (amount) => {
    return '₱' + Number(amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  return (
    <div className="form-page">
      <button className="form-back" onClick={onCancel}>
        <ArrowLeft /> Back to Work Order List
      </button>

      <form onSubmit={handleSubmit}>
        <div className="form-card">
          <h3>Work Order Information</h3>
          <div className="form-grid">
            <div className="form-field">
              <label>WO No.</label>
              <input type="text" value={form.woNo} onChange={set('woNo')} placeholder="Auto-generated or manual" />
            </div>

            <div className="form-field">
              <label>
                Date Needed<span className="req">*</span>
              </label>
              <input type="date" value={form.dateNeeded} onChange={set('dateNeeded')} required />
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
              <label>Plate No.</label>
              <select value={form.plateNo} onChange={set('plateNo')}>
                <option value="">Select vehicle</option>
                {VEHICLES.map((v) => (
                  <option key={v.plateNo}>{v.plateNo}</option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>Assigned Mechanic / Technician</label>
              <select value={form.assignedMechanic} onChange={set('assignedMechanic')}>
                <option value="">Select personnel</option>
                {PERSONNEL_LIST.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>Priority</label>
              <select value={form.priority} onChange={set('priority')}>
                <option value="">Select priority</option>
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="form-card">
          <h3>Scope of Work / Repair Details</h3>
          <div className="form-grid">
            <div className="form-field span-2">
              <label>
                Scope of Work<span className="req">*</span>
              </label>
              <select value={form.scopeOfWork} onChange={set('scopeOfWork')} required>
                <option value="">Select scope of work</option>
                {SCOPE_OF_WORK_OPTIONS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="form-field span-2">
              <label>Description</label>
              <textarea
                className="description"
                rows={5}
                value={form.description}
                onChange={set('description')}
                placeholder="Describe the repair or maintenance details..."
              />
            </div>

            <div className="form-field span-2">
              <label>Additional Notes</label>
              <textarea
                rows={3}
                value={form.additionalNotes}
                onChange={set('additionalNotes')}
                placeholder="Any additional notes or special instructions..."
              />
            </div>
          </div>
        </div>

        <div className="form-card">
          <h3>Costs Summary</h3>
          <div className="form-grid">
            <div className="form-field">
              <label>Parts Cost (₱)</label>
              <input type="number" step="0.01" min="0" value={form.partsCost} onChange={set('partsCost')} placeholder="0.00" />
            </div>

            <div className="form-field">
              <label>Labor Cost (₱)</label>
              <input type="number" step="0.01" min="0" value={form.laborCost} onChange={set('laborCost')} placeholder="0.00" />
            </div>

            <div className="form-field">
              <label>Other Fees (₱)</label>
              <input type="number" step="0.01" min="0" value={form.otherFees} onChange={set('otherFees')} placeholder="0.00" />
            </div>

            <div className="form-field">
              <label>Total Cost (₱)</label>
              <input type="text" value={formatPHP(totalCost)} readOnly />
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
