import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { LICENSE_TYPES, PERSONNEL_LIST } from '../data/mockData'

const emptyForm = {
  personnel: '',
  licenseType: '',
  dueDate: '',
  issuedDate: '',
  renewalRemarks: '',
  email: '',
  contactNumber: '',
  assignedTo: '',
  additionalNotes: '',
}

export default function LicenseRenewalForm({ existingRenewal, onCancel, onSave }) {
  const [form, setForm] = useState(() =>
    existingRenewal
      ? {
          ...emptyForm,
          personnel: existingRenewal.personnel || '',
          licenseType: existingRenewal.licenseType || '',
          dueDate: existingRenewal.dueDate || '',
          issuedDate: existingRenewal.issuedDate || '',
          renewalRemarks: existingRenewal.renewalRemarks || '',
          email: existingRenewal.email || '',
          contactNumber: existingRenewal.contactNumber || '',
          assignedTo: existingRenewal.assignedTo || '',
          additionalNotes: existingRenewal.additionalNotes || '',
        }
      : emptyForm
  )

  const set = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((f) => ({ ...f, [field]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(form)
  }

  return (
    <div className="form-page">
      <button className="form-back" onClick={onCancel}>
        <ArrowLeft /> Back to License Renewal List
      </button>

      <form onSubmit={handleSubmit}>
        <div className="form-card">
          <h3>Reminder Information</h3>
          <div className="form-grid">
            <div className="form-field">
              <label>
                Personnel<span className="req">*</span>
              </label>
              <select value={form.personnel} onChange={set('personnel')} required>
                <option value="">Select personnel</option>
                {PERSONNEL_LIST.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>
                License Renewal Type<span className="req">*</span>
              </label>
              <select value={form.licenseType} onChange={set('licenseType')} required>
                <option value="">Select license type</option>
                {LICENSE_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>
                Due Date<span className="req">*</span>
              </label>
              <input type="date" value={form.dueDate} onChange={set('dueDate')} required />
            </div>

            <div className="form-field">
              <label>Issued Date</label>
              <input type="date" value={form.issuedDate} onChange={set('issuedDate')} />
            </div>

            <div className="form-field span-2">
              <label>Renewal Remarks</label>
              <input type="text" value={form.renewalRemarks} onChange={set('renewalRemarks')} />
            </div>
          </div>
        </div>

        <div className="form-card">
          <h3>Contact Details</h3>
          <div className="form-grid">
            <div className="form-field">
              <label>Email</label>
              <input type="text" value={form.email} onChange={set('email')} />
            </div>

            <div className="form-field">
              <label>Contact Number</label>
              <input type="text" value={form.contactNumber} onChange={set('contactNumber')} />
            </div>

            <div className="form-field">
              <label>Assigned To</label>
              <select value={form.assignedTo} onChange={set('assignedTo')}>
                <option value="">Select personnel</option>
                {PERSONNEL_LIST.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="form-card">
          <h3>Additional Notes</h3>
          <div className="form-grid">
            <div className="form-field span-2">
              <textarea
                rows={5}
                value={form.additionalNotes}
                onChange={set('additionalNotes')}
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
