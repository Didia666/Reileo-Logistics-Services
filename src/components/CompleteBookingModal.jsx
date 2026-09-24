import React, { useMemo, useState } from 'react';
import { X, Loader2, Save } from 'lucide-react';

const COMPLETE_TABS = [
  { key: 'booking', label: 'Booking Information' },
  { key: 'client_cost', label: 'Client Cost' },
  { key: 'expenses', label: 'Expenses' },
  { key: 'personnel_fee', label: 'Personnel Fee' },
];

const EMPTY_COMPLETE = {
  completed_at: '',
  farthest_destination_id: '',
  client_rate: '',
  no_of_trips: '1',
  subcon_rate: '',
  toll_fees: '0.00',
  extra_drop: '0.00',
  extra_helper: '0.00',
  other_expenses: '0.00',
  parking_fees: '0.00',
  toll_fees_non_billable: '0.00',
  demurrage_fees: '0.00',
  backload_fees: '0.00',
  other_deductions: '0.00',
  driver_rate: '',
  driver_allowance: '0.00',
  helper1_rate: '',
  helper1_allowance: '0.00',
  helper2_rate: '',
  helper2_allowance: '0.00',
};

export default function CompleteBookingModal({ booking, bookingDetail, lookups, onClose, onConfirm, saving }) {
  const [activeTab, setActiveTab] = useState('booking');
  const [form, setForm] = useState(() => {
    const prefill = { ...EMPTY_COMPLETE };
    prefill.completed_at = new Date().toISOString().slice(0, 16);
    if (bookingDetail) {
      if (bookingDetail.origin_id) prefill.origin_id = bookingDetail.origin_id;
      if (bookingDetail.destination_id) prefill.farthest_destination_id = bookingDetail.destination_id;
      if (bookingDetail.trips_number) prefill.no_of_trips = String(bookingDetail.trips_number);
      const assignments = bookingDetail.personnel_assignments || [];
      const driver = assignments.find(a => a.assignment_role === 'driver');
      const helper1 = assignments.find(a => a.assignment_role === 'helper1');
      const helper2 = assignments.find(a => a.assignment_role === 'helper2');
      if (driver) prefill.driver_id = driver.personnel_id;
      if (helper1) prefill.helper1_id = helper1.personnel_id;
      if (helper2) prefill.helper2_id = helper2.personnel_id;
    }
    return prefill;
  });
  const [errors, setErrors] = useState({});

  const update = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: '' }));
  };

  const totalAmount = useMemo(() => {
    const rate = parseFloat(form.client_rate) || 0;
    const trips = parseInt(form.no_of_trips) || 0;
    return (rate * trips).toFixed(2);
  }, [form.client_rate, form.no_of_trips]);

  const driverInfo = useMemo(() => {
    const list = lookups?.personnel || [];
    return list.find(p => String(p.personnel_id) === String(form.driver_id)) || null;
  }, [form.driver_id, lookups]);

  const helper1Info = useMemo(() => {
    const list = lookups?.personnel || [];
    return list.find(p => String(p.personnel_id) === String(form.helper1_id)) || null;
  }, [form.helper1_id, lookups]);

  const helper2Info = useMemo(() => {
    const list = lookups?.personnel || [];
    return list.find(p => String(p.personnel_id) === String(form.helper2_id)) || null;
  }, [form.helper2_id, lookups]);

  const validate = () => {
    const next = {};
    if (!form.completed_at) next.completed_at = 'Completed date and time is required';
    if (!form.farthest_destination_id) next.farthest_destination_id = 'Farthest destination is required';
    if (form.client_rate === '' || isNaN(parseFloat(form.client_rate))) next.client_rate = 'Client rate is required';
    if (!form.no_of_trips || isNaN(parseInt(form.no_of_trips))) next.no_of_trips = 'No. of Trips is required';
    if (form.helper1_id && (form.helper1_rate === '' || isNaN(parseFloat(form.helper1_rate)) || parseFloat(form.helper1_rate) <= 0)) {
      next.helper1_rate = 'Helper rate must be greater than 0';
    }
    setErrors(next);
    if (Object.keys(next).length) {
      if (next.completed_at) setActiveTab('booking');
      else if (next.farthest_destination_id || next.client_rate || next.no_of_trips) setActiveTab('client_cost');
      else if (next.helper1_rate) setActiveTab('personnel_fee');
      return false;
    }
    return true;
  };

  const field = (key, label, type = 'text', required = false, placeholder = '', disabled = false) => (
    <div className="bf-field">
      <label>
        {label}{required && <span className="req"> *</span>}
      </label>
      <input
        type={type}
        value={form[key]}
        placeholder={placeholder}
        disabled={disabled}
        onChange={e => update(key, e.target.value)}
        className={errors[key] ? 'input-error' : ''}
        style={disabled ? { background: '#f1f5f9', color: '#475569' } : {}}
      />
      {errors[key] && <div className="field-error">{errors[key]}</div>}
    </div>
  );

  const readonlyField = (label, value) => (
    <div className="bf-field">
      <label>{label}</label>
      <input
        type="text"
        value={value || '—'}
        disabled
        style={{ background: '#f1f5f9', color: '#475569' }}
      />
    </div>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Update status to COMPLETED</h3>
          <button className="modal-close" onClick={onClose} disabled={saving}><X size={18} /></button>
        </div>
        <div style={{ padding: '14px 20px 0' }}>
          <div className="reminder-banner" style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', fontSize: 13, marginBottom: 14 }}>
            <strong>⚠ IMPORTANT!</strong><br />
            Please review the associated rates for this shipment before pressing <strong>'Submit'</strong> button.
            Make sure to check the farthest destination of the shipment.
          </div>
          <div className="tabs" style={{ marginBottom: 16 }}>
            {COMPLETE_TABS.map(tab => (
              <button key={tab.key} type="button" className={activeTab === tab.key ? 'active' : ''} onClick={() => setActiveTab(tab.key)}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <form onSubmit={e => { e.preventDefault(); if (validate()) onConfirm({ ...form, total_amount: totalAmount }); }} style={{ maxHeight: '68vh', overflowY: 'auto', padding: '0 20px 20px' }}>
          {activeTab === 'booking' && (
            <div className="bf-section">
              <div className="bf-section-title">Booking #: <strong style={{ color: '#0f172a' }}>{booking.booking_no}</strong></div>
              <div className="bf-grid">
                {readonlyField('Delivery Date', bookingDetail?.delivery_date || booking.created_at ? new Date(bookingDetail?.delivery_date || booking.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—')}
                {readonlyField('Vehicle Type', bookingDetail?.vehicle_type || '—')}
                <div className="bf-col-full" />
                <div className="bf-col-full">{field('completed_at', 'Completed Date & Time', 'datetime-local', true)}</div>
                {readonlyField('Customer', bookingDetail?.customer_name || booking.customer_name || '—')}
                <div className="bf-col-1" />
                {readonlyField('Booking Type', bookingDetail?.book_type || booking.booking_type || '—')}
                {readonlyField('Depot', bookingDetail?.depot_name || booking.depot_name || '—')}
                {readonlyField('Vehicle No.', bookingDetail?.plate_no || booking.plate_no || '—')}
                {readonlyField('Truck Type', bookingDetail?.vehicle_type || '—')}
                {readonlyField('Commodity Type', bookingDetail?.commodity_type || '—')}
              </div>
            </div>
          )}

          {activeTab === 'client_cost' && (
            <div className="bf-section">
              <div className="bf-section-title">Client Cost</div>
              <div className="bf-grid">
                <div className="bf-col-full">
                  <div className="bf-field">
                    <label>Origin</label>
                    <select
                      value={form.origin_id || ''}
                      onChange={e => update('origin_id', e.target.value)}
                      disabled
                      style={{ background: '#f1f5f9', color: '#475569' }}
                    >
                      <option value="">- Select -</option>
                      {(lookups?.origins || []).map(o => (
                        <option key={o.origin_id} value={o.origin_id}>{o.origin_name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="bf-col-full">
                  <div className="bf-field">
                    <label>Farthest destination<span className="req"> *</span></label>
                    <select
                      value={form.farthest_destination_id || ''}
                      onChange={e => update('farthest_destination_id', e.target.value)}
                      className={errors.farthest_destination_id ? 'input-error' : ''}
                    >
                      <option value="">- Select -</option>
                      {(lookups?.destination || []).map(d => (
                        <option key={d.destination_id} value={d.destination_id}>{d.destination_name}</option>
                      ))}
                    </select>
                    {errors.farthest_destination_id && <div className="field-error">{errors.farthest_destination_id}</div>}
                  </div>
                </div>
                {field('client_rate', 'Client Rate', 'number', true, '0.00')}
                {field('no_of_trips', 'No. of Trips', 'number', true, '1')}
                <div className="bf-col-1">
                  <div className="bf-field">
                    <label>Total Amount <span className="bf-info-icon" title="Client Rate × No. of Trips">ⓘ</span></label>
                    <input type="text" value={`₱ ${totalAmount}`} disabled style={{ background: '#f1f5f9', color: '#0f172a', fontWeight: 600 }} />
                  </div>
                </div>
                <div className="bf-col-full">{field('subcon_rate', 'Subcon Rate', 'number', false, '0.00')}</div>
              </div>
            </div>
          )}

          {activeTab === 'expenses' && (
            <div className="bf-section">
              <div className="bf-section-title">Expenses</div>
              <div style={{ border: '1px dashed #cbd5e1', borderRadius: 4, padding: 14, marginBottom: 14 }}>
                <div className="bf-sublabel" style={{ color: '#3b82f6', marginBottom: 10 }}>Billable</div>
                <div className="bf-grid">
                  {field('toll_fees', 'Toll Fees', 'number', false, '0.00')}
                  {field('extra_drop', 'Extra Drop', 'number', false, '0.00')}
                  {field('extra_helper', 'Extra Helper', 'number', false, '0.00')}
                  {field('other_expenses', 'Other Expenses/Fees', 'number', false, '0.00')}
                </div>
              </div>
              <div style={{ border: '1px dashed #cbd5e1', borderRadius: 4, padding: 14 }}>
                <div className="bf-sublabel" style={{ color: '#64748b', marginBottom: 10 }}>Non-Billable</div>
                <div className="bf-grid">
                  {field('parking_fees', 'Parking Fees', 'number', false, '0.00')}
                  {field('toll_fees_non_billable', 'Toll Fees-Non Billable', 'number', false, '0.00')}
                  {field('demurrage_fees', 'Demurrage Fees', 'number', false, '0.00')}
                  {field('backload_fees', 'Backload Fees', 'number', false, '0.00')}
                  <div className="bf-col-1">{field('other_deductions', 'Other Deductions', 'number', false, '0.00')}</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'personnel_fee' && (
            <div className="bf-section">
              <div className="bf-section-title">Personnel Fee</div>
              <div className="bf-grid">
                {readonlyField('Driver', driverInfo ? `${driverInfo.last_name}, ${driverInfo.first_name}` : '—')}
                <div className="bf-col-1" />
                {field('driver_rate', 'Driver Rate', 'number', false, '0.00')}
                {field('driver_allowance', 'Driver Allowance', 'number', false, '0.00')}
                {readonlyField('Helper 1', helper1Info ? `${helper1Info.last_name}, ${helper1Info.first_name}` : '—')}
                <div className="bf-col-1" />
                {field('helper1_rate', 'Helper 1 Rate', 'number', !!form.helper1_id, '0.00')}
                {field('helper1_allowance', 'Helper 1 Allowance', 'number', false, '0.00')}
                {helper2Info && (
                  <>
                    {readonlyField('Helper 2', `${helper2Info.last_name}, ${helper2Info.first_name}`)}
                    <div className="bf-col-1" />
                    {field('helper2_rate', 'Helper 2 Rate', 'number', false, '0.00')}
                    {field('helper2_allowance', 'Helper 2 Allowance', 'number', false, '0.00')}
                  </>
                )}
              </div>
            </div>
          )}

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}><X size={14} /> Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? 'Saving…' : 'Confirm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
