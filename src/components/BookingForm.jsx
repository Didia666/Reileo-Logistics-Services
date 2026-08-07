import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import {
  CUSTOMERS,
  BOOKING_TYPES,
  DEPOTS,
  COMMODITY_TYPES,
  ORIGINS,
  DESTINATIONS,
  VEHICLES,
  DRIVERS,
  HELPERS,
} from '../data/mockData'

const emptyForm = {
  customer: '',
  bookingType: '',
  depot: '',
  commodityType: '',
  origin: '',
  destination: '',
  subcon: false,
  vehicle: '',
  truckType: '',
  driver: '',
  helper1: '',
  helper2: '',
  driverIncluded: false,
}

export default function BookingForm({ existingBooking, onCancel, onSave }) {
  const [form, setForm] = useState(() =>
    existingBooking
      ? {
          ...emptyForm,
          customer: existingBooking.customer,
          bookingType: existingBooking.type === 'DELIVERY' ? 'Delivery' : 'Transfer',
          depot: existingBooking.depot,
          origin: existingBooking.origin,
          vehicle: existingBooking.plateNo,
          driver: existingBooking.trucker,
        }
      : emptyForm
  )

  const set = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((f) => ({ ...f, [field]: value }))
  }


  const vehicleOptions = VEHICLES.filter((v) => v.subcon === form.subcon)

  const handleVehicleChange = (e) => {
    const plateNo = e.target.value
    const vehicle = VEHICLES.find((v) => v.plateNo === plateNo)
    setForm((f) => ({ ...f, vehicle: plateNo, truckType: vehicle ? vehicle.type : '' }))
  }


  const helperOptions = form.driverIncluded ? [...HELPERS, ...DRIVERS] : HELPERS

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(form)
  }

  return (
    <div className="form-page">
      <button className="form-back" onClick={onCancel}>
        <ArrowLeft /> Back to Bookings
      </button>

      <form onSubmit={handleSubmit}>
        <div className="form-card">
          <h3>Booking Information</h3>
          <div className="form-grid">
            <div className="form-field">
              <label>
                Customer<span className="req">*</span>
              </label>
              <select value={form.customer} onChange={set('customer')} required>
                <option value="">Select customer</option>
                {CUSTOMERS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>
                Booking Type<span className="req">*</span>
              </label>
              <select value={form.bookingType} onChange={set('bookingType')} required>
                <option value="">Select booking type</option>
                {BOOKING_TYPES.map((t) => (
                  <option key={t}>{t}</option>
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
              <label>
                Commodity Type<span className="req">*</span>
              </label>
              <select value={form.commodityType} onChange={set('commodityType')} required>
                <option value="">Select commodity type</option>
                {COMMODITY_TYPES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>
                Origin<span className="req">*</span>
              </label>
              <select value={form.origin} onChange={set('origin')} required>
                <option value="">Select origin</option>
                {ORIGINS.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>
                Destination<span className="req">*</span>
              </label>
              <select value={form.destination} onChange={set('destination')} required>
                <option value="">Select destination</option>
                {DESTINATIONS.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
              <span className="hint">Filtered by Customer, Commodity Type, Depot, Origin &amp; Truck Type</span>
            </div>
          </div>
        </div>

        <div className="form-card">
          <h3>Vehicle Assignment</h3>
          <div className="form-grid">
            <div className="form-field">
              <label className="checkbox-row" style={{ marginTop: 6 }}>
                <input type="checkbox" checked={form.subcon} onChange={set('subcon')} />
                Subcon (third-party vehicle)
              </label>
            </div>

            <div className="form-field">
              <label>
                Vehicle No.<span className="req">*</span>
              </label>
              <select value={form.vehicle} onChange={handleVehicleChange} required>
                <option value="">Select vehicle</option>
                {vehicleOptions.map((v) => (
                  <option key={v.plateNo}>{v.plateNo}</option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>Truck Type</label>
              <input type="text" value={form.truckType} readOnly placeholder="Auto-filled from vehicle" />
            </div>
          </div>
        </div>

        <div className="form-card">
          <h3>Personnel Assignment</h3>
          <div className="form-grid">
            <div className="form-field">
              <label>
                Assigned Driver<span className="req">*</span>
              </label>
              <select value={form.driver} onChange={set('driver')} required>
                <option value="">Select driver</option>
                {DRIVERS.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>Helper 1</label>
              <select value={form.helper1} onChange={set('helper1')}>
                <option value="">Select helper</option>
                {helperOptions.map((h) => (
                  <option key={h}>{h}</option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>Helper 2</label>
              <select value={form.helper2} onChange={set('helper2')}>
                <option value="">Select helper</option>
                {helperOptions.map((h) => (
                  <option key={h}>{h}</option>
                ))}
              </select>
            </div>

            <div className="form-field span-2">
              <label className="checkbox-row" style={{ marginTop: 6 }}>
                <input type="checkbox" checked={form.driverIncluded} onChange={set('driverIncluded')} />
                Driver Included? (allow a driver to be set as a helper)
              </label>
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
