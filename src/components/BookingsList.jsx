import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { bookings, lookups } from '../services/api.js';
import { Plus, MoreHorizontal, Eye, Pencil, X, Search, Loader2, Save } from 'lucide-react';
import BookingFormModal from './BookingForm.jsx';
import UnderReviewModal from './BookingUnderReviewModal.jsx';
import DeliveryModal from './BookingDeliveredModal.jsx';
import CompleteBookingModal from './BookingCompleteModal.jsx';

const STATUS_TABS = [
  { key: 'all',                 label: 'All',         variant: 'default' },
  { key: 'Under Review',        label: 'Under Review', variant: 'info' },
  { key: 'Approved',            label: 'Approved',     variant: 'warning' },
  { key: 'Dispatched',          label: 'Dispatched',   variant: 'info' },
  { key: 'Delivered',           label: 'Delivered',    variant: 'success' },
  { key: 'Completed',           label: 'Completed',    variant: 'success' },
  { key: 'Cancelled',           label: 'Cancelled',    variant: 'danger' },
  { key: 'Declined',            label: 'Declined',     variant: 'danger' },
];

function statusVariant(name) {
  switch (name) {
    case 'Completed': case 'Delivered': case 'Approved': return 'success';
    case 'Dispatched': case 'Under Review': return 'info';
    case 'Cancelled': case 'Declined': return 'danger';
    default: return 'default';
  }
}

// const DELIVERY_TABS = [
//   { key: 'booking', label: 'Booking Information' },
//   { key: 'references', label: 'References' },
//   { key: 'expenses', label: 'Expenses' },
// ];

// const EMPTY_DELIVERY = {
//   delivered_at: '',
//   received_at: '',
//   odometer: '',
//   farthest_destination: '',
//   client_rate: '0',
//   trips: '1',
//   trip_allowance: '',
//   subcon_rate: '0',
//   remarks: '',
//   client_ref_no: '',
//   charges: '',
//   fuel_liters: '',
//   fuel_amount: '',
//   fuel_po: '',
//   toll_fees: '0.00',
//   extra_drop: '0.00',
//   extra_helper: '0.00',
//   other_expenses: '0.00',
//   parking_fees: '0.00',
//   toll_fees_non_billable: '0.00',
//   demurrage_fees: '0.00',
//   backload_fees: '0.00',
//   other_deductions: '0.00',
// };

// const COMPLETE_TABS = [
//   { key: 'booking', label: 'Booking Information' },
//   { key: 'client_cost', label: 'Client Cost' },
//   { key: 'expenses', label: 'Expenses' },
//   { key: 'personnel_fee', label: 'Personnel Fee' },
// ];

// const EMPTY_COMPLETE = {
//   completed_at: '',
//   farthest_destination_id: '',
//   client_rate: '',
//   no_of_trips: '1',
//   subcon_rate: '',
//   toll_fees: '0.00',
//   extra_drop: '0.00',
//   extra_helper: '0.00',
//   other_expenses: '0.00',
//   parking_fees: '0.00',
//   toll_fees_non_billable: '0.00',
//   demurrage_fees: '0.00',
//   backload_fees: '0.00',
//   other_deductions: '0.00',
//   driver_rate: '',
//   driver_allowance: '0.00',
//   helper1_rate: '',
//   helper1_allowance: '0.00',
//   helper2_rate: '',
//   helper2_allowance: '0.00',
// };

// function CompleteBookingModal({ booking, bookingDetail, lookups, onClose, onConfirm, saving }) {
//   const [activeTab, setActiveTab] = useState('booking');
//   const [form, setForm] = useState(() => {
//     const prefill = { ...EMPTY_COMPLETE };
//     prefill.completed_at = new Date().toISOString().slice(0, 16);
//     if (bookingDetail) {
//       if (bookingDetail.origin_id) prefill.origin_id = bookingDetail.origin_id;
//       if (bookingDetail.destination_id) prefill.farthest_destination_id = bookingDetail.destination_id;
//       if (bookingDetail.trips_number) prefill.no_of_trips = String(bookingDetail.trips_number);
//       const assignments = bookingDetail.personnel_assignments || [];
//       const driver = assignments.find(a => a.assignment_role === 'driver');
//       const helper1 = assignments.find(a => a.assignment_role === 'helper1');
//       const helper2 = assignments.find(a => a.assignment_role === 'helper2');
//       if (driver) prefill.driver_id = driver.personnel_id;
//       if (helper1) prefill.helper1_id = helper1.personnel_id;
//       if (helper2) prefill.helper2_id = helper2.personnel_id;
//     }
//     return prefill;
//   });
//   const [errors, setErrors] = useState({});

//   const update = (key, value) => {
//     setForm(prev => ({ ...prev, [key]: value }));
//     setErrors(prev => ({ ...prev, [key]: '' }));
//   };

//   const totalAmount = useMemo(() => {
//     const rate = parseFloat(form.client_rate) || 0;
//     const trips = parseInt(form.no_of_trips) || 0;
//     return (rate * trips).toFixed(2);
//   }, [form.client_rate, form.no_of_trips]);

//   const driverInfo = useMemo(() => {
//     const list = lookups?.personnel || [];
//     return list.find(p => String(p.personnel_id) === String(form.driver_id)) || null;
//   }, [form.driver_id, lookups]);

//   const helper1Info = useMemo(() => {
//     const list = lookups?.personnel || [];
//     return list.find(p => String(p.personnel_id) === String(form.helper1_id)) || null;
//   }, [form.helper1_id, lookups]);

//   const helper2Info = useMemo(() => {
//     const list = lookups?.personnel || [];
//     return list.find(p => String(p.personnel_id) === String(form.helper2_id)) || null;
//   }, [form.helper2_id, lookups]);

//   const validate = () => {
//     const next = {};
//     if (!form.completed_at) next.completed_at = 'Completed date and time is required';
//     if (!form.farthest_destination_id) next.farthest_destination_id = 'Farthest destination is required';
//     if (form.client_rate === '' || isNaN(parseFloat(form.client_rate))) next.client_rate = 'Client rate is required';
//     if (!form.no_of_trips || isNaN(parseInt(form.no_of_trips))) next.no_of_trips = 'No. of Trips is required';
//     if (form.helper1_id && (form.helper1_rate === '' || isNaN(parseFloat(form.helper1_rate)) || parseFloat(form.helper1_rate) <= 0)) {
//       next.helper1_rate = 'Helper rate must be greater than 0';
//     }
//     setErrors(next);
//     if (Object.keys(next).length) {
//       if (next.completed_at) setActiveTab('booking');
//       else if (next.farthest_destination_id || next.client_rate || next.no_of_trips) setActiveTab('client_cost');
//       else if (next.helper1_rate) setActiveTab('personnel_fee');
//       return false;
//     }
//     return true;
//   };

//   const field = (key, label, type = 'text', required = false, placeholder = '', disabled = false) => (
//     <div className="bf-field">
//       <label>
//         {label}{required && <span className="req"> *</span>}
//       </label>
//       <input
//         type={type}
//         value={form[key]}
//         placeholder={placeholder}
//         disabled={disabled}
//         onChange={e => update(key, e.target.value)}
//         className={errors[key] ? 'input-error' : ''}
//         style={disabled ? { background: '#f1f5f9', color: '#475569' } : {}}
//       />
//       {errors[key] && <div className="field-error">{errors[key]}</div>}
//     </div>
//   );

//   const readonlyField = (label, value) => (
//     <div className="bf-field">
//       <label>{label}</label>
//       <input
//         type="text"
//         value={value || '—'}
//         disabled
//         style={{ background: '#f1f5f9', color: '#475569' }}
//       />
//     </div>
//   );

//   return (
//     <div className="modal-overlay" onClick={onClose}>
//       <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
//         <div className="modal-header">
//           <h3>Update status to COMPLETED</h3>
//           <button className="modal-close" onClick={onClose} disabled={saving}><X size={18} /></button>
//         </div>
//         <div style={{ padding: '14px 20px 0' }}>
//           <div className="reminder-banner" style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', fontSize: 13, marginBottom: 14 }}>
//             <strong>⚠ IMPORTANT!</strong><br />
//             Please review the associated rates for this shipment before pressing <strong>'Submit'</strong> button.
//             Make sure to check the farthest destination of the shipment.
//           </div>
//           <div className="tabs" style={{ marginBottom: 16 }}>
//             {COMPLETE_TABS.map(tab => (
//               <button key={tab.key} type="button" className={activeTab === tab.key ? 'active' : ''} onClick={() => setActiveTab(tab.key)}>
//                 {tab.label}
//               </button>
//             ))}
//           </div>
//         </div>
//         <form onSubmit={e => { e.preventDefault(); if (validate()) onConfirm({ ...form, total_amount: totalAmount }); }} style={{ maxHeight: '68vh', overflowY: 'auto', padding: '0 20px 20px' }}>
//           {activeTab === 'booking' && (
//             <div className="bf-section">
//               <div className="bf-section-title">Booking #: <strong style={{ color: '#0f172a' }}>{booking.booking_no}</strong></div>
//               <div className="bf-grid">
//                 {readonlyField('Delivery Date', bookingDetail?.delivery_date || booking.created_at ? new Date(bookingDetail?.delivery_date || booking.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—')}
//                 {readonlyField('Vehicle Type', bookingDetail?.vehicle_type || '—')}
//                 <div className="bf-col-full" />
//                 <div className="bf-col-full">{field('completed_at', 'Completed Date & Time', 'datetime-local', true)}</div>
//                 {readonlyField('Customer', bookingDetail?.customer_name || booking.customer_name || '—')}
//                 <div className="bf-col-1" />
//                 {readonlyField('Booking Type', bookingDetail?.book_type || booking.booking_type || '—')}
//                 {readonlyField('Depot', bookingDetail?.depot_name || booking.depot_name || '—')}
//                 {readonlyField('Vehicle No.', bookingDetail?.plate_no || booking.plate_no || '—')}
//                 {readonlyField('Truck Type', bookingDetail?.vehicle_type || '—')}
//                 {readonlyField('Commodity Type', bookingDetail?.commodity_type || '—')}
//               </div>
//             </div>
//           )}

//           {activeTab === 'client_cost' && (
//             <div className="bf-section">
//               <div className="bf-section-title">Client Cost</div>
//               <div className="bf-grid">
//                 <div className="bf-col-full">
//                   <div className="bf-field">
//                     <label>Origin</label>
//                     <select
//                       value={form.origin_id || ''}
//                       onChange={e => update('origin_id', e.target.value)}
//                       disabled
//                       style={{ background: '#f1f5f9', color: '#475569' }}
//                     >
//                       <option value="">- Select -</option>
//                       {(lookups?.origins || []).map(o => (
//                         <option key={o.origin_id} value={o.origin_id}>{o.origin_name}</option>
//                       ))}
//                     </select>
//                   </div>
//                 </div>
//                 <div className="bf-col-full">
//                   <div className="bf-field">
//                     <label>Farthest destination<span className="req"> *</span></label>
//                     <select
//                       value={form.farthest_destination_id || ''}
//                       onChange={e => update('farthest_destination_id', e.target.value)}
//                       className={errors.farthest_destination_id ? 'input-error' : ''}
//                     >
//                       <option value="">- Select -</option>
//                       {(lookups?.destination || []).map(d => (
//                         <option key={d.destination_id} value={d.destination_id}>{d.destination_name}</option>
//                       ))}
//                     </select>
//                     {errors.farthest_destination_id && <div className="field-error">{errors.farthest_destination_id}</div>}
//                   </div>
//                 </div>
//                 {field('client_rate', 'Client Rate', 'number', true, '0.00')}
//                 {field('no_of_trips', 'No. of Trips', 'number', true, '1')}
//                 <div className="bf-col-1">
//                   <div className="bf-field">
//                     <label>Total Amount <span className="bf-info-icon" title="Client Rate × No. of Trips">ⓘ</span></label>
//                     <input type="text" value={`₱ ${totalAmount}`} disabled style={{ background: '#f1f5f9', color: '#0f172a', fontWeight: 600 }} />
//                   </div>
//                 </div>
//                 <div className="bf-col-full">{field('subcon_rate', 'Subcon Rate', 'number', false, '0.00')}</div>
//               </div>
//             </div>
//           )}

//           {activeTab === 'expenses' && (
//             <div className="bf-section">
//               <div className="bf-section-title">Expenses</div>
//               <div style={{ border: '1px dashed #cbd5e1', borderRadius: 4, padding: 14, marginBottom: 14 }}>
//                 <div className="bf-sublabel" style={{ color: '#3b82f6', marginBottom: 10 }}>Billable</div>
//                 <div className="bf-grid">
//                   {field('toll_fees', 'Toll Fees', 'number', false, '0.00')}
//                   {field('extra_drop', 'Extra Drop', 'number', false, '0.00')}
//                   {field('extra_helper', 'Extra Helper', 'number', false, '0.00')}
//                   {field('other_expenses', 'Other Expenses/Fees', 'number', false, '0.00')}
//                 </div>
//               </div>
//               <div style={{ border: '1px dashed #cbd5e1', borderRadius: 4, padding: 14 }}>
//                 <div className="bf-sublabel" style={{ color: '#64748b', marginBottom: 10 }}>Non-Billable</div>
//                 <div className="bf-grid">
//                   {field('parking_fees', 'Parking Fees', 'number', false, '0.00')}
//                   {field('toll_fees_non_billable', 'Toll Fees-Non Billable', 'number', false, '0.00')}
//                   {field('demurrage_fees', 'Demurrage Fees', 'number', false, '0.00')}
//                   {field('backload_fees', 'Backload Fees', 'number', false, '0.00')}
//                   <div className="bf-col-1">{field('other_deductions', 'Other Deductions', 'number', false, '0.00')}</div>
//                 </div>
//               </div>
//             </div>
//           )}

//           {activeTab === 'personnel_fee' && (
//             <div className="bf-section">
//               <div className="bf-section-title">Personnel Fee</div>
//               <div className="bf-grid">
//                 {readonlyField('Driver', driverInfo ? `${driverInfo.last_name}, ${driverInfo.first_name}` : '—')}
//                 <div className="bf-col-1" />
//                 {field('driver_rate', 'Driver Rate', 'number', false, '0.00')}
//                 {field('driver_allowance', 'Driver Allowance', 'number', false, '0.00')}
//                 {readonlyField('Helper 1', helper1Info ? `${helper1Info.last_name}, ${helper1Info.first_name}` : '—')}
//                 <div className="bf-col-1" />
//                 {field('helper1_rate', 'Helper 1 Rate', 'number', !!form.helper1_id, '0.00')}
//                 {field('helper1_allowance', 'Helper 1 Allowance', 'number', false, '0.00')}
//                 {helper2Info && (
//                   <>
//                     {readonlyField('Helper 2', `${helper2Info.last_name}, ${helper2Info.first_name}`)}
//                     <div className="bf-col-1" />
//                     {field('helper2_rate', 'Helper 2 Rate', 'number', false, '0.00')}
//                     {field('helper2_allowance', 'Helper 2 Allowance', 'number', false, '0.00')}
//                   </>
//                 )}
//               </div>
//             </div>
//           )}

//           <div className="modal-footer">
//             <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}><X size={14} /> Cancel</button>
//             <button type="submit" className="btn btn-primary" disabled={saving}>
//               {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
//               {saving ? 'Saving…' : 'Confirm'}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }

// function DeliveryModal({ booking, onClose, onConfirm, saving }) {
//   const [activeTab, setActiveTab] = useState('booking');
//   const [form, setForm] = useState(() => ({
//     ...EMPTY_DELIVERY,
//     delivered_at: new Date().toISOString().slice(0, 16),
//     received_at: new Date().toISOString().slice(0, 16),
//   }));
//   const [errors, setErrors] = useState({});

//   const update = (key, value) => {
//     setForm(prev => ({ ...prev, [key]: value }));
//     setErrors(prev => ({ ...prev, [key]: '' }));
//   };

//   const validate = () => {
//     const next = {};
//     if (!form.delivered_at) next.delivered_at = 'Delivered date and time is required';
//     if (!form.received_at) next.received_at = 'Received date and time is required';
//     if (!form.farthest_destination.trim()) next.farthest_destination = 'Farthest destination is required';
//     if (!form.client_rate.trim()) next.client_rate = 'Client rate is required';
//     if (!form.trips.trim()) next.trips = 'Number of trips is required';
//     setErrors(next);
//     if (Object.keys(next).length) {
//       if (next.delivered_at || next.received_at || next.farthest_destination || next.client_rate || next.trips) setActiveTab('booking');
//       return false;
//     }
//     return true;
//   };

//   const field = (key, label, type = 'text', required = false, placeholder = '') => (
//     <div className="form-group">
//       <label>{label}{required && <span style={{ color: '#dc2626' }}> *</span>}</label>
//       <input
//         type={type}
//         value={form[key]}
//         placeholder={placeholder}
//         onChange={e => update(key, e.target.value)}
//         className={errors[key] ? 'input-error' : ''}
//       />
//       {errors[key] && <div className="field-error">{errors[key]}</div>}
//     </div>
//   );

//   return (
//     <div className="modal-overlay" onClick={onClose}>
//       <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
//         <div className="modal-header">
//           <h3>Update status to DELIVERED</h3>
//           <button className="modal-close" onClick={onClose} disabled={saving}><X size={18} /></button>
//         </div>
//         <div style={{ padding: '14px 20px 0' }}>
//           <div style={{ color: '#334155', fontSize: 14, marginBottom: 12 }}>
//             Booking #: <strong>{booking.booking_no}</strong>
//           </div>
//           <div className="tabs" style={{ marginBottom: 16 }}>
//             {DELIVERY_TABS.map(tab => (
//               <button key={tab.key} type="button" className={activeTab === tab.key ? 'active' : ''} onClick={() => setActiveTab(tab.key)}>
//                 {tab.label}
//               </button>
//             ))}
//           </div>
//         </div>
//         <form onSubmit={e => { e.preventDefault(); if (validate()) onConfirm(form); }} style={{ maxHeight: '68vh', overflowY: 'auto', padding: '0 20px 20px' }}>
//           {activeTab === 'booking' && (
//             <div className="bf-section">
//               <div className="bf-section-title">Booking Information</div>
//               <div className="bf-grid">
//                 <div className="bf-col-1"><div className="form-group"><label>Delivery Date</label><input type="text" value={booking.delivery_date || '—'} disabled /></div></div>
//                 <div className="bf-col-1"><div className="form-group"><label>Vehicle No.</label><input type="text" value={booking.plate_no || '—'} disabled /></div></div>
//                 <div className="bf-col-1">{field('delivered_at', 'Delivered Date & Time', 'datetime-local', true)}</div>
//                 <div className="bf-col-1">{field('received_at', 'Received Date & Time', 'datetime-local', true)}</div>
//                 <div className="bf-col-full">{field('odometer', 'Odometer Reading', 'number', false, 'Current odometer')}</div>
//                 <div className="bf-col-full">{field('farthest_destination', 'Farthest Destination', 'text', true)}</div>
//                 <div className="bf-col-1">{field('client_rate', 'Client Rate', 'number', true)}</div>
//                 <div className="bf-col-1">{field('trips', 'No. of Trips', 'number', true)}</div>
//                 <div className="bf-col-full">{field('trip_allowance', 'Trip Allowance', 'number')}</div>
//                 <div className="bf-col-full">{field('subcon_rate', 'Subcon Rate', 'number')}</div>
//                 <div className="bf-col-full">{field('remarks', 'Remarks', 'text')}</div>
//               </div>
//             </div>
//           )}
//           {activeTab === 'references' && (
//             <div className="bf-section">
//               <div className="bf-section-title">References</div>
//               <div className="bf-grid">
//                 <div className="bf-col-full">{field('client_ref_no', 'Client Ref. No.')}</div>
//                 <div className="bf-col-full">
//                   <div className="form-group"><label>Charges</label><select value={form.charges} onChange={e => update('charges', e.target.value)}><option value="">-Select-</option><option value="Billable">Billable</option><option value="Non-Billable">Non-Billable</option></select></div>
//                 </div>
//                 <div className="bf-col-1">{field('fuel_liters', 'Fuel (L)', 'number')}</div>
//                 <div className="bf-col-1">{field('fuel_amount', 'Fuel Amount', 'number')}</div>
//                 <div className="bf-col-full">{field('fuel_po', 'Fuel P.O.')}</div>
//               </div>
//             </div>
//           )}
//           {activeTab === 'expenses' && (
//             <div className="bf-section">
//               <div className="bf-section-title">Expenses</div>
//               <div className="bf-grid">
//                 <div className="bf-col-1">{field('toll_fees', 'Toll Fees', 'number')}</div>
//                 <div className="bf-col-1">{field('extra_drop', 'Extra Drop', 'number')}</div>
//                 <div className="bf-col-1">{field('extra_helper', 'Extra Helper', 'number')}</div>
//                 <div className="bf-col-1">{field('other_expenses', 'Other Expenses/Fees', 'number')}</div>
//                 <div className="bf-col-1">{field('parking_fees', 'Parking Fees', 'number')}</div>
//                 <div className="bf-col-1">{field('toll_fees_non_billable', 'Toll Fees - Non Billable', 'number')}</div>
//                 <div className="bf-col-1">{field('demurrage_fees', 'Demurrage Fees', 'number')}</div>
//                 <div className="bf-col-1">{field('backload_fees', 'Backload Fees', 'number')}</div>
//                 <div className="bf-col-1">{field('other_deductions', 'Other Deductions', 'number')}</div>
//               </div>
//             </div>
//           )}
//           <div className="modal-footer">
//             <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}><X size={14} /> Cancel</button>
//             <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} {saving ? 'Saving…' : 'Confirm'}</button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }

function ActionMenu({ booking, onOpen, onClose, isOpen, onView, onEdit, onApprove, onDispatch, onDeliver, onComplete, onCancel }) {
  const navigate = useNavigate();
  const ref = React.useRef(null);
  useEffect(() => {
    if (!isOpen) return;
    const click = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', click);
    return () => document.removeEventListener('mousedown', click);
  }, [isOpen, onClose]);

  return (
    <div className="action-menu" ref={ref}>
      <button onClick={onOpen}><MoreHorizontal size={14} /> Select</button>
      {isOpen && (
        <div className="dropdown">
          <button onClick={() => { onClose(); onView(booking); }}>
            <Eye size={12} style={{ marginRight: 6 }} /> View
          </button>
          <button onClick={() => { onClose(); onEdit(booking); }}>
            <Pencil size={12} style={{ marginRight: 6 }} /> Update
          </button>
          {booking.status_name === 'Under Review' && (
            <button onClick={() => { onClose(); onDispatch(booking); }} style={{ color: '#059669' }}>
              ✓ Dispatch
            </button>
          )}
          {booking.status_name === 'Approved' && (
            <button onClick={() => { onClose(); onDispatch(booking); }} style={{ color: '#059669' }}>
              ✓ Dispatch
            </button>
          )}
          {booking.status_name === 'Dispatched' && (
            <button onClick={() => { onClose(); onDeliver(booking); }} style={{ color: '#059669' }}>
              ✓ Deliver
            </button>
          )}
          {booking.status_name === 'Delivered' && (
            <button onClick={() => { onClose(); onComplete(booking); }} style={{ color: '#059669' }}>
              ✓ Complete
            </button>
          )}
          <button className="danger" onClick={() => { onClose(); onCancel(booking); }}>
            <X size={12} style={{ marginRight: 6 }} /> Cancel
          </button>
        </div>
      )}
    </div>
  );
}

export default function BookingsList() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [all, setAll] = useState([]);
  const [total, setTotal] = useState(0);
  const [statuses, setStatuses] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [toast, setToast] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editBooking, setEditBooking] = useState(null);
  const [viewOnly, setViewOnly] = useState(false);
  const [underReviewBooking, setUnderReviewBooking] = useState(null);
  const [deliveryBooking, setDeliveryBooking] = useState(null);
  const [deliverySaving, setDeliverySaving] = useState(false);
  const [completeBooking, setCompleteBooking] = useState(null);
  const [completeBookingDetail, setCompleteBookingDetail] = useState(null);
  const [completeSaving, setCompleteSaving] = useState(false);
  const [completeLookups, setCompleteLookups] = useState({ origins: [], destination: [], personnel: [] });

  useEffect(() => {
    (async () => {
      try {
        const [a, s, origins, destList, personnelList] = await Promise.all([
          bookings.list({ limit: 1000 }),
          lookups.bookingStatuses().catch(() => []),
          lookups.origins().catch(() => []),
          lookups.destination().catch(() => []),
          lookups.personnel().catch(() => []),
        ]);
        const rows = Array.isArray(a) ? a : (Array.isArray(a?.data) ? a.data : []);
        setAll(rows);
        setTotal(a?.total || rows.length);
        setStatuses(Array.isArray(s) ? s : (Array.isArray(s?.data) ? s.data : []));
        setCompleteLookups({
          origins: Array.isArray(origins) ? origins : (Array.isArray(origins?.data) ? origins.data : []),
          destination: Array.isArray(destList) ? destList : (Array.isArray(destList?.data) ? destList.data : []),
          personnel: Array.isArray(personnelList) ? personnelList : (Array.isArray(personnelList?.data) ? personnelList.data : []),
        });
      } catch (e) {
        setToast(e.message || 'Unable to load bookings.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => { setPage(1); }, [activeTab, perPage]);

  const filtered = useMemo(() => {
    let rows = all;
    if (activeTab !== 'all') rows = rows.filter(r => (r.status_name || '') === activeTab);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(r =>
        (r.booking_no || '').toLowerCase().includes(q) ||
        (r.customer_name || '').toLowerCase().includes(q) ||
        (r.plate_no || '').toLowerCase().includes(q) ||
        (r.origin_name || '').toLowerCase().includes(q) ||
        (r.destination || '').toLowerCase().includes(q)
      );
    }
    return rows;
  }, [all, activeTab, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const current = filtered.slice((page - 1) * perPage, page * perPage);
  const tabs = useMemo(() => {
    const base = STATUS_TABS.map(t => {
      const count = t.key === 'all' ? all.length : all.filter(r => (r.status_name || '') === t.key).length;
      return { ...t, count };
    });
    return base;
  }, [all]);

  const handleCancel = async (b) => {
    if (!confirm(`Cancel booking ${b.booking_no}?`)) return;
    try {
      await bookings.cancel(b.booking_id);
      setAll(prev => prev.map(r => r.booking_id === b.booking_id ? { ...r, status_name: 'Cancelled', status_id: 7 } : r));
      setToast(`Booking ${b.booking_no} cancelled.`);
      setTimeout(() => setToast(''), 3000);
    } catch (e) { setToast(e.message); setTimeout(() => setToast(''), 4000); }
  };

  const handleApprove = async (b) => {
    if (!confirm(`Approve booking ${b.booking_no}?`)) return;
    try {
      await bookings.approve(b.booking_id);
      setAll(prev => prev.map(r => r.booking_id === b.booking_id ? { ...r, status_name: 'Approved', status_id: 2 } : r));
      setToast(`Booking ${b.booking_no} approved.`);
      setTimeout(() => setToast(''), 3000);
    } catch (e) { setToast(e.message); setTimeout(() => setToast(''), 4000); }
  };

  const handleDispatch = async (b) => {
    setUnderReviewBooking(b);
  };

  const handleDeliver = async (b) => {
    setDeliveryBooking(b);
  };

  const confirmDelivery = async (details) => {
    if (!deliveryBooking) return;
    setDeliverySaving(true);
    try {
      await bookings.deliver(deliveryBooking.booking_id, {
        fueltrip_allowance: {
          trip_allowance: details.trip_allowance || null,
          fuel: details.fuel_liters || null,
          fuel_po: details.fuel_po || null,
          fuel_amount: details.fuel_amount || null,
        },
      });
      setAll(prev => prev.map(r => r.booking_id === deliveryBooking.booking_id ? { ...r, status_name: 'Delivered', status_id: 4 } : r));
      setDeliveryBooking(null);
      setToast(`Booking ${deliveryBooking.booking_no} marked as delivered.`);
      setTimeout(() => setToast(''), 3000);
    } catch (e) { setToast(e.message); setTimeout(() => setToast(''), 4000); }
    finally { setDeliverySaving(false); }
  };

  const handleComplete = async (b) => {
    setCompleteBooking(b);
    try {
      const detail = await bookings.get(b.booking_id);
      setCompleteBookingDetail(detail);
    } catch (e) {
      setCompleteBookingDetail(null);
      setToast(e.message || 'Unable to load booking details.');
      setTimeout(() => setToast(''), 4000);
    }
  };

  const confirmComplete = async (payload) => {
    if (!completeBooking) return;
    setCompleteSaving(true);
    try {
      await bookings.complete(completeBooking.booking_id, payload);
      setAll(prev => prev.map(r => r.booking_id === completeBooking.booking_id ? { ...r, status_name: 'Completed', status_id: 6 } : r));
      setCompleteBooking(null);
      setCompleteBookingDetail(null);
      setToast(`Booking ${completeBooking.booking_no} completed.`);
      setTimeout(() => setToast(''), 3000);
    } catch (e) { setToast(e.message); setTimeout(() => setToast(''), 4000); }
    finally { setCompleteSaving(false); }
  };

  const handleView = (booking) => {
    setEditBooking(booking);
    setViewOnly(true);
    setFormOpen(true);
  };

  const handleEdit = (booking) => {
    setEditBooking(booking);
    setViewOnly(false);
    setFormOpen(true);
  };

  const handleAdd = () => {
    setEditBooking(null);
    setViewOnly(false);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditBooking(null);
    setViewOnly(false);
  };

  if (loading) return <div className="loading"><Loader2 className="animate-spin" size={20} /> Loading bookings…</div>;

  return (
    <>
      <div className="page-header">
        <div>
          <div className="breadcrumb">Operations / Bookings</div>
          <h2>Bookings</h2>
          <div style={{ color: '#6b7280', fontSize: 13 }}>
            {filtered.length} of {total} total · {statuses.length} statuses
          </div>
        </div>
        <div>
          <button className="btn btn-primary" onClick={handleAdd}>
            <Plus size={15} /> New Booking
          </button>
        </div>
      </div>

      {toast && <div className="alert alert-success" style={{ marginBottom: 14 }}>{toast}</div>}

      <div className="tabs">
        {tabs.map(t => (
          <button key={t.key} className={activeTab === t.key ? 'active' : ''} onClick={() => setActiveTab(t.key)}>
            {t.label} <span style={{ opacity: 0.75, marginLeft: 4 }}>({t.count})</span>
          </button>
        ))}
      </div>

      <div className="card">
        <div className="table-toolbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Search size={14} color="#6b7280" />
            <input
              type="text"
              className="search-input"
              placeholder="Search booking no, customer, plate, route…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <select value={perPage} onChange={(e) => setPerPage(Number(e.target.value))}>
              {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n} / page</option>)}
            </select>
          </div>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Booking No</th>
                <th>Delivery Date</th>
                <th>Customer</th>
                <th>Type</th>
                <th>Fuel (L)</th>
                <th>Depot</th>
                <th>Origin</th>
                <th>Vendor</th>
                <th>Plate No.</th>
                <th>Client Ref No.</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {current.length === 0 && (
                <tr><td colSpan={10} className="empty-row">No bookings match the current filters.</td></tr>
              )}
              {current.map(b => (
                <tr key={b.booking_id}>
                  <td style={{ fontWeight: 600, color: '#2563eb' }}>{b.booking_no}</td>
                  <td style={{ whiteSpace: 'nowrap', color: '#6b7280' }}>
                    {b.created_at ? new Date(b.created_at).toLocaleDateString() : '—'}
                  </td>
                  <td>{b.customer_name || '—'}</td>
                  <td>{b.booking_type || '—'}</td>
                  <td>{b.fuel || '—'}</td>
                  <td>{b.depot_name || '—'}</td>
                  <td>
                    <div>{b.origin_name || '—'}</div>
                    <div style={{ color: '#6b7280', fontSize: 12 }}>→ {b.destination || '—'}</div>
                  </td>
                  <td>
                    {b.vendor_name || '—'}
                    {/* {b.personnel && b.personnel.length > 0 ? (
                      <div className="personnel-tags">
                        {b.personnel.map((p, i) => (
                          <span key={i} className="personnel-tag">
                            {p.assignment_role === 'driver' ? '🚚' : '👷'} {p.full_name}
                          </span>
                        ))}
                      </div>
                    ) : <span style={{ color: '#94a3b8' }}>—</span>} */}
                  </td>
                  <td>{b.plate_no || '—'}</td>
                  <td>{b.client_ref_no || '—'}</td>
                  <td>
                    <span className={`badge badge-${statusVariant(b.status_name)}`}>{b.status_name || 'Unknown'}</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <ActionMenu
                      booking={b}
                      isOpen={openMenuId === b.booking_id}
                      onOpen={() => setOpenMenuId(b.booking_id)}
                      onClose={() => setOpenMenuId(null)}
                      onView={handleView}
                      onEdit={handleEdit}
                      // onDispatch={handleApprove}
                      onDispatch={handleDispatch}
                      onDeliver={handleDeliver}
                      onComplete={handleComplete}
                      onCancel={handleCancel}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <div>
            Showing {current.length === 0 ? 0 : ((page - 1) * perPage + 1)} – {Math.min(page * perPage, filtered.length)} of {filtered.length}
          </div>
          <div className="page-buttons">
            <button disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 7).map(p => (
              <button key={p} className={p === page ? 'active' : ''} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next</button>
          </div>
        </div>
      </div>


      <BookingFormModal
        isOpen={formOpen}
        onClose={closeForm}
        onSaved={(saved) => {
          setAll(prev => {
            const exists = prev.some(r => String(r.booking_id) === String(saved.booking_id));
            if (exists) {
              return prev.map(r => String(r.booking_id) === String(saved.booking_id) ? saved : r);
            } else {
              return [...prev, saved];
            }
          });
          closeForm();
        }}
        editBooking={editBooking}
        viewOnly={viewOnly}
      />
      <UnderReviewModal
        isOpen={Boolean(underReviewBooking)}
        onClose={() => setUnderReviewBooking(null)}
        onSaved={(saved) => {
          setAll(prev => prev.map(row => (
            String(row.booking_id) === String(saved.booking_id)
              ? { ...row, status_id: saved.status_id, status_name: saved.status_name }
              : row
          )));
          setUnderReviewBooking(null);
        }}
        editBooking={underReviewBooking}
      />
      <DeliveryModal
        isOpen={Boolean(deliveryBooking)}
        editBooking={deliveryBooking}
        onClose={() => setDeliveryBooking(null)}
        onSaved={(saved) => {
          const deliveredStatus = statuses.find(status => status.status_name === 'Delivered');
          setAll(prev => prev.map(row => (
            String(row.booking_id) === String(deliveryBooking?.booking_id)
              ? {
                  ...row,
                  status_id: saved?.status_id ?? deliveredStatus?.status_id ?? row.status_id,
                  status_name: saved?.status_name ?? deliveredStatus?.status_name ?? 'Delivered',
                }
              : row
          )));
          setDeliveryBooking(null);
        }}
        viewOnly={false}
      />
      {completeBooking && (
        <CompleteBookingModal
          booking={completeBooking}
          bookingDetail={completeBookingDetail}
          lookups={completeLookups}
          onClose={() => { setCompleteBooking(null); setCompleteBookingDetail(null); }}
          onConfirm={confirmComplete}
          saving={completeSaving}
        />
      )}
    </>
  );
}
