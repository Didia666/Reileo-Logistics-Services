import { useState, useMemo } from 'react'
import { ArrowLeft } from 'lucide-react'
import { DEPOTS, VEHICLES, DRIVERS, FUEL_TYPES } from '../data/mockData'

const emptyForm = {
  fuelNo: '',
  dateFiled: '',
  depot: '',
  plateNo: '',
  driver: '',
  odometer: '',
  fuelType: '',
  liters: '',
  pricePerLiter: '',
  totalAmount: '',
  totalAmountManual: false,
  supplier: '',
  receiptNo: '',
  attendant: '',
  remarks: '',
}

export default function FuelRecordForm({ existingFuelRecord, onCancel, onSave }) {
  const [form, setForm] = useState(() =>
    existingFuelRecord
      ? {
          ...emptyForm,
          fuelNo: existingFuelRecord.fuelNo || '',
          dateFiled: existingFuelRecord.dateFiled || '',
          depot: existingFuelRecord.depot || '',
          plateNo: existingFuelRecord.plateNo || '',
          driver: existingFuelRecord.driver || '',
          odometer: existingFuelRecord.odometer != null ? String(existingFuelRecord.odometer) : '',
          fuelType: existingFuelRecord.fuelType || '',
          liters: existingFuelRecord.liters != null ? String(existingFuelRecord.liters) : '',
          pricePerLiter: existingFuelRecord.liters && existingFuelRecord.amount
            ? (existingFuelRecord.amount / existingFuelRecord.liters).toFixed(2)
            : '',
          totalAmount: existingFuelRecord.amount != null ? String(existingFuelRecord.amount) : '',
          totalAmountManual: !!existingFuelRecord.amount,
        }
      : emptyForm
  )

  const set = (field) => (e) => {
    const value = e.target.value
    setForm((f) => {
      const next = { ...f, [field]: value }
      if (field === 'liters' || field === 'pricePerLiter') {
        if (!next.totalAmountManual) {
          const l = parseFloat(next.liters)
          const p = parseFloat(next.pricePerLiter)
          if (!isNaN(l) && !isNaN(p)) {
            next.totalAmount = (l * p).toFixed(2)
          } else {
            next.totalAmount = ''
          }
        }
      }
      if (field === 'totalAmount') {
        next.totalAmountManual = value !== ''
      }
      return next
    })
  }

  const computedTotal = useMemo(() => {
    const l = parseFloat(form.liters)
    const p = parseFloat(form.pricePerLiter)
    if (!isNaN(l) && !isNaN(p)) return (l * p).toFixed(2)
    return ''
  }, [form.liters, form.pricePerLiter])

  const totalReadonly = !form.totalAmountManual && computedTotal !== ''

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({
      ...form,
      odometer: form.odometer ? Number(form.odometer) : null,
      liters: form.liters ? Number(form.liters) : null,
      pricePerLiter: form.pricePerLiter ? Number(form.pricePerLiter) : null,
      amount: form.totalAmount ? Number(form.totalAmount) : null,
    })
  }

  return (
    <div className="form-page">
      <button className="form-back" onClick={onCancel}>
        <ArrowLeft /> Back to Fuel Record List
      </button>

      <form onSubmit={handleSubmit}>
        <div className="form-card">
          <h3>Fuel Record Information</h3>
          <div className="form-grid">
            <div className="form-field">
              <label>Fuel Ref. No.</label>
              <input type="text" value={form.fuelNo} onChange={set('fuelNo')} placeholder="Auto-generated or manual" />
            </div>

            <div className="form-field">
              <label>
                Date Filed<span className="req">*</span>
              </label>
              <input type="date" value={form.dateFiled} onChange={set('dateFiled')} required />
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
              <label>
                Plate No.<span className="req">*</span>
              </label>
              <select value={form.plateNo} onChange={set('plateNo')} required>
                <option value="">Select vehicle</option>
                {VEHICLES.map((v) => (
                  <option key={v.plateNo}>{v.plateNo}</option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>
                Driver<span className="req">*</span>
              </label>
              <select value={form.driver} onChange={set('driver')} required>
                <option value="">Select driver</option>
                {DRIVERS.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>
                Odometer Reading<span className="req">*</span>
              </label>
              <input type="number" min="0" step="1" value={form.odometer} onChange={set('odometer')} required placeholder="km" />
            </div>
          </div>
        </div>

        <div className="form-card">
          <h3>Fuel Details</h3>
          <div className="form-grid">
            <div className="form-field">
              <label>
                Fuel Type<span className="req">*</span>
              </label>
              <select value={form.fuelType} onChange={set('fuelType')} required>
                <option value="">Select fuel type</option>
                {FUEL_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>
                Liters<span className="req">*</span>
              </label>
              <input type="number" min="0" step="0.01" value={form.liters} onChange={set('liters')} required placeholder="L" />
            </div>

            <div className="form-field">
              <label>Price per Liter (₱)</label>
              <input type="number" min="0" step="0.01" value={form.pricePerLiter} onChange={set('pricePerLiter')} placeholder="₱" />
            </div>

            <div className="form-field">
              <label>Total Amount (₱)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.totalAmount}
                onChange={set('totalAmount')}
                readOnly={totalReadonly}
                placeholder={totalReadonly ? '' : '₱'}
                style={totalReadonly ? { background: '#f3f4f6', cursor: 'not-allowed' } : {}}
              />
              {!form.totalAmountManual && computedTotal !== '' && (
                <span className="hint">Computed: Liters × Price per Liter. Type to override.</span>
              )}
            </div>
          </div>
        </div>

        <div className="form-card">
          <h3>Additional</h3>
          <div className="form-grid">
            <div className="form-field span-2">
              <label>Fuel Supplier / Station</label>
              <input type="text" value={form.supplier} onChange={set('supplier')} placeholder="e.g. Caltex, Petron, Shell" />
            </div>

            <div className="form-field">
              <label>Receipt No.</label>
              <input type="text" value={form.receiptNo} onChange={set('receiptNo')} />
            </div>

            <div className="form-field">
              <label>Attendant Name</label>
              <input type="text" value={form.attendant} onChange={set('attendant')} />
            </div>

            <div className="form-field span-2">
              <label>Remarks</label>
              <textarea
                rows={4}
                value={form.remarks}
                onChange={set('remarks')}
                placeholder="Additional notes about this fuel purchase"
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
