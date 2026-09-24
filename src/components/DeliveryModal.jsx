import React, { useState } from 'react';
import { X, Loader2, Save } from 'lucide-react';

const DELIVERY_TABS = [
  { key: 'booking', label: 'Booking Information' },
  { key: 'references', label: 'References' },
  { key: 'expenses', label: 'Expenses' },
];

const EMPTY_DELIVERY = {
  delivered_at: '',
  received_at: '',
  odometer: '',
  farthest_destination: '',
  client_rate: '0',
  trips: '1',
  trip_allowance: '',
  subcon_rate: '0',
  remarks: '',
  client_ref_no: '',
  charges: '',
  fuel_liters: '',
  fuel_amount: '',
  fuel_po: '',
  toll_fees: '0.00',
  extra_drop: '0.00',
  extra_helper: '0.00',
  other_expenses: '0.00',
  parking_fees: '0.00',
  toll_fees_non_billable: '0.00',
  demurrage_fees: '0.00',
  backload_fees: '0.00',
  other_deductions: '0.00',
};

export default function DeliveryModal({ booking, onClose, onConfirm, saving }) {
  const [activeTab, setActiveTab] = useState('booking');
  const [form, setForm] = useState(() => ({
    ...EMPTY_DELIVERY,
    delivered_at: new Date().toISOString().slice(0, 16),
    received_at: new Date().toISOString().slice(0, 16),
  }));
  const [errors, setErrors] = useState({});

  const update = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: '' }));
  };

  const validate = () => {
    const next = {};
    if (!form.delivered_at) next.delivered_at = 'Delivered date and time is required';
    if (!form.received_at) next.received_at = 'Received date and time is required';
    if (!form.farthest_destination.trim()) next.farthest_destination = 'Farthest destination is required';
    if (!form.client_rate.trim()) next.client_rate = 'Client rate is required';
    if (!form.trips.trim()) next.trips = 'Number of trips is required';
    setErrors(next);
    if (Object.keys(next).length) {
      if (next.delivered_at || next.received_at || next.farthest_destination || next.client_rate || next.trips) setActiveTab('booking');
      return false;
    }
    return true;
  };

  const field = (key, label, type = 'text', required = false, placeholder = '') => (
    <div className="form-group">
      <label>{label}{required && <span style={{ color: '#dc2626' }}> *</span>}</label>
      <input
        type={type}
        value={form[key]}
        placeholder={placeholder}
        onChange={e => update(key, e.target.value)}
        className={errors[key] ? 'input-error' : ''}
      />
      {errors[key] && <div className="field-error">{errors[key]}</div>}
    </div>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Update status to DELIVERED</h3>
          <button className="modal-close" onClick={onClose} disabled={saving}><X size={18} /></button>
        </div>
        <div style={{ padding: '14px 20px 0' }}>
          <div style={{ color: '#334155', fontSize: 14, marginBottom: 12 }}>
            Booking #: <strong>{booking.booking_no}</strong>
          </div>
          <div className="tabs" style={{ marginBottom: 16 }}>
            {DELIVERY_TABS.map(tab => (
              <button key={tab.key} type="button" className={activeTab === tab.key ? 'active' : ''} onClick={() => setActiveTab(tab.key)}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <form onSubmit={e => { e.preventDefault(); if (validate()) onConfirm(form); }} style={{ maxHeight: '68vh', overflowY: 'auto', padding: '0 20px 20px' }}>
          {activeTab === 'booking' && (
            <div className="bf-section">
              <div className="bf-section-title">Booking Information</div>
              <div className="bf-grid">
                <div className="bf-col-1"><div className="form-group"><label>Delivery Date</label><input type="text" value={booking.delivery_date || '—'} disabled /></div></div>
                <div className="bf-col-1"><div className="form-group"><label>Vehicle No.</label><input type="text" value={booking.plate_no || '—'} disabled /></div></div>
                <div className="bf-col-1">{field('delivered_at', 'Delivered Date & Time', 'datetime-local', true)}</div>
                <div className="bf-col-1">{field('received_at', 'Received Date & Time', 'datetime-local', true)}</div>
                <div className="bf-col-full">{field('odometer', 'Odometer Reading', 'number', false, 'Current odometer')}</div>
                <div className="bf-col-full">{field('farthest_destination', 'Farthest Destination', 'text', true)}</div>
                <div className="bf-col-1">{field('client_rate', 'Client Rate', 'number', true)}</div>
                <div className="bf-col-1">{field('trips', 'No. of Trips', 'number', true)}</div>
                <div className="bf-col-full">{field('trip_allowance', 'Trip Allowance', 'number')}</div>
                <div className="bf-col-full">{field('subcon_rate', 'Subcon Rate', 'number')}</div>
                <div className="bf-col-full">{field('remarks', 'Remarks', 'text')}</div>
              </div>
            </div>
          )}
          {activeTab === 'references' && (
            <div className="bf-section">
              <div className="bf-section-title">References</div>
              <div className="bf-grid">
                <div className="bf-col-full">{field('client_ref_no', 'Client Ref. No.')}</div>
                <div className="bf-col-full">
                  <div className="form-group"><label>Charges</label><select value={form.charges} onChange={e => update('charges', e.target.value)}><option value="">-Select-</option><option value="Billable">Billable</option><option value="Non-Billable">Non-Billable</option></select></div>
                </div>
                <div className="bf-col-1">{field('fuel_liters', 'Fuel (L)', 'number')}</div>
                <div className="bf-col-1">{field('fuel_amount', 'Fuel Amount', 'number')}</div>
                <div className="bf-col-full">{field('fuel_po', 'Fuel P.O.')}</div>
              </div>
            </div>
          )}
          {activeTab === 'expenses' && (
            <div className="bf-section">
              <div className="bf-section-title">Expenses</div>
              <div className="bf-grid">
                <div className="bf-col-1">{field('toll_fees', 'Toll Fees', 'number')}</div>
                <div className="bf-col-1">{field('extra_drop', 'Extra Drop', 'number')}</div>
                <div className="bf-col-1">{field('extra_helper', 'Extra Helper', 'number')}</div>
                <div className="bf-col-1">{field('other_expenses', 'Other Expenses/Fees', 'number')}</div>
                <div className="bf-col-1">{field('parking_fees', 'Parking Fees', 'number')}</div>
                <div className="bf-col-1">{field('toll_fees_non_billable', 'Toll Fees - Non Billable', 'number')}</div>
                <div className="bf-col-1">{field('demurrage_fees', 'Demurrage Fees', 'number')}</div>
                <div className="bf-col-1">{field('backload_fees', 'Backload Fees', 'number')}</div>
                <div className="bf-col-1">{field('other_deductions', 'Other Deductions', 'number')}</div>
              </div>
            </div>
          )}
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}><X size={14} /> Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} {saving ? 'Saving…' : 'Confirm'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
