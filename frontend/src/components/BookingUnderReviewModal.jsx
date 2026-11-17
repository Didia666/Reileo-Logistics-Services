import React, { useEffect, useState } from 'react';
import { X, Loader2, Save } from 'lucide-react';
import { bookingUnderReviewCrud, lookups } from '../services/api.js';

const TABS = [
  { key: 'bookinginfo', label: 'Booking Information' },
];

function Field({ label, required, error, children, hint, style }) {
  return (
    <div style={style || { display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
      <label style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>
        {label}{required && <span style={{ color: '#dc2626', marginLeft: 2 }}>*</span>}
      </label>
      {children}
      {hint && !error && <div style={{ fontSize: 11, color: '#6b7280' }}>{hint}</div>}
      {error && <div style={{ fontSize: 12, color: '#dc2626' }}>{error}</div>}
    </div>
  );
}

const inputStyle = {
  padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13,
  outline: 'none', width: '100%', boxSizing: 'border-box', background: '#fff',
};

const readOnlyStyle = {
  padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 13,
  width: '100%', boxSizing: 'border-box', background: '#f9fafb', color: '#4b5563',
};
export default function UnderReviewModal({ isOpen, editBooking, onClose, onSaved, viewOnly }) {
  const [activeTab, setActiveTab] = useState('bookinginfo');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ type: '', msg: '' });
  const [lookupsData, setLookupsData] = useState({
    vehicles: [],
  });
  


  const blankForm = {
    // Under Review
    delivery_date: '',
    plate_no: '',
    delivered_datetime: '',
    fuel_po: '',
    odometer: '',
    travel_fund: '',
    remarks: '',       
  };

  const [form, setForm] = useState(blankForm);
  const [companyOwned, setCompanyOwned] = useState(false);
  const [errors, setErrors] = useState({});

  const loadLookups = async () => {   
    try {
      const [
        vehicles,
      ] = await Promise.all([
        lookups.vehicles ? lookups.vehicles().catch(() => []) : Promise.resolve([]),
      ]);

      const normalize = (data) => (Array.isArray(data) ? data : (data?.data || []));

      setLookupsData({
        vehicles: normalize(vehicles),
      });
    } catch {
      /* no-op */
    }
  };

  useEffect(() => {
    if (!isOpen || !editBooking?.booking_id) return undefined;

    let cancelled = false;
    loadLookups();
    setForm({ ...blankForm });
    setCompanyOwned(false);
    setActiveTab('bookinginfo');
    setErrors({});
    setToast({ type: '', msg: '' });

    bookingUnderReviewCrud.get(editBooking.booking_id)
      .then((booking) => {
        if (cancelled) return;
        const deliveredDatetime = booking.delivered_datetime
          ? String(booking.delivered_datetime).replace(' ', 'T').slice(0, 16)
          : '';
        setForm({
          ...blankForm,
          delivery_date: booking.delivery_date ?? '',
          plate_no: booking.plate_no ?? '',
          delivery_datetime: deliveredDatetime,
          fuel_po: booking.fuel_po ?? '',
          odometer: booking.odometer ?? '',
          travel_fund: booking.travel_fund ?? '',
          remarks: booking.remarks ?? '',
        });
      })
      .catch((error) => {
        if (!cancelled) {
          setToast({ type: 'error', msg: error.message || 'Failed to load booking details.' });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, editBooking]);

  const setField = (path, value) => {
    setForm(prev => {
      const next = { ...prev };
      const parts = path.split('.');
      if (parts.length === 1) next[parts[0]] = value;
      else {
        next[parts[0]] = { ...(next[parts[0]] || {}) };
        next[parts[0]][parts[1]] = value;
      }
      return next;
    });
  };

 

  const validate = () => {
    const errs = {};
    if (!form.delivery_date.trim()) errs.delivery_date = 'Delivery date is required.';
    if (!form.plate_no.trim()) errs.plate_no = 'Vehicle number is required.';
    if (!form.delivery_datetime.trim()) errs.delivery_datetime = 'Start/Dispatch date time is required.';
    if (!form.travel_fund.trim()) errs.travel_fund = 'Travel fund is required.';
    setErrors(errs);
    if (Object.keys(errs).length) {
      setToast({ type: 'error', msg: 'Please fill in all required fields.' });
      setTimeout(() => setToast({ type: '', msg: '' }), 4000);
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (viewOnly) return;
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = {
        // Under Review
        underreview: {
          delivery_date: form.delivery_date.trim() || null,
          plate_no: form.plate_no.trim() || null,
          delivery_datetime: form.delivery_datetime.trim() || null,
          fuel_po: form.fuel_po.trim() || null,
          odometer: form.odometer ? Number(form.odometer) : null,
          travel_fund: form.travel_fund ? Number(form.travel_fund) : null,
          
          remarks: form.remarks.trim() || null,
        },
        
      };

      const saved = await bookingUnderReviewCrud.create(editBooking?.booking_id, payload);
      setToast({ type: 'success', msg: 'Dispatched saved successfully.' });
      setTimeout(() => {
        onSaved(saved);
        onClose();
      }, 800);
    } catch (e) {
      setToast({ type: 'error', msg: e.message || 'Failed to save dispatched.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const renderInput = (path, placeholder = '', type = 'text', disabled = false) => {
    const v = path.split('.').reduce((o, k) => (o || {})[k], form) ?? '';
    return (
      <input
        type={type}
        disabled={viewOnly || disabled}
        style={viewOnly || disabled ? readOnlyStyle : inputStyle}
        value={v}
        placeholder={placeholder}
        onChange={(e) => setField(path, e.target.value)}
      />
    );
  };

  const renderSelect = (path, options, valueKey, labelKey, placeholder, disabled = false, onChange = null) => {
    const v = path.split('.').reduce((o, k) => (o || {})[k], form) ?? '';
    const safeOptions = Array.isArray(options) ? options : [];

    return (
      <select
        disabled={viewOnly || disabled}
        style={viewOnly || disabled ? readOnlyStyle : inputStyle}
        value={v}
        onChange={(e) => {
          if (onChange) onChange(e);
          else setField(path, e.target.value);
        }}
      >
        <option value="">{placeholder || '- Select -'}</option>
        {safeOptions.map((o, index) => {
          const optionValue = o[valueKey];
          const optionKey = optionValue !== undefined && optionValue !== null && optionValue !== ''
            ? `${optionValue}-${index}`
            : `option-${index}`;

          return (
            <option key={optionKey} value={optionValue ?? ''}>
              {o[labelKey]}
            </option>
          );
        })}
      </select>
    );
  };

  const renderTextarea = (path, placeholder = '', rows = 3) => {
    const v = path.split('.').reduce((o, k) => (o || {})[k], form) ?? '';
    return (
      <textarea
        disabled={viewOnly}
        style={{ ...(viewOnly ? readOnlyStyle : inputStyle), resize: 'vertical' }}
        value={v}
        rows={rows}
        placeholder={placeholder}
        onChange={(e) => setField(path, e.target.value)}
      />
    );
  };



  const renderTab = () => {
    const selectedCommodity = form.commodity_type_id;
    const selectedVendor = form.vendor_id;

    const vehicleOptions = lookupsData.vehicles.filter((vehicle) => {
      const matchesCommodity = !selectedCommodity || String(vehicle.commodity_type_id ?? '') === String(selectedCommodity);
      const vendorId = vehicle.vendor_id;
      const hasVendor = vendorId !== null && vendorId !== undefined && vendorId !== '' && String(vendorId) !== '0';

      if (companyOwned) {
        if (!selectedVendor) {
          return matchesCommodity && hasVendor;
        }
        return matchesCommodity && String(vendorId) === String(selectedVendor);
      }

      return matchesCommodity;
    });

    const handlePlateSelection = (e) => {
      const plateNo = e.target.value;
      const matchedVehicle = lookupsData.vehicles.find((vehicle) => vehicle.plate_no === plateNo);

      setField('plate_no', plateNo);
      setField('vehicle_id', matchedVehicle ? (matchedVehicle.vehicle_id ?? '') : '');
      setField('vehicle_type_id', matchedVehicle ? (matchedVehicle.vehicle_type_id ?? '') : '');
    };


    switch (activeTab) {
      case 'bookinginfo':
        return (
          <div style={{ padding: 18 }}>
            <fieldset style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 14, marginBottom: 18 }}>
              <legend style={{ fontSize: 14, fontWeight: 600, color: '#2563eb', padding: '0 6px'}}>
                Booking Information
              </legend>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <Field label="Delivery Date" required error={errors.delivery_date}>
                  {renderInput('delivery_date', '', 'date', true)}
                </Field>
                <Field label="Vehicle No." required error={errors.plate_no}>
                  {renderSelect(
                    'plate_no',
                    vehicleOptions,
                    'plate_no',
                    'plate_no',
                    '- Select Plate No. -',
                    true,
                    handlePlateSelection
                  )}
                </Field>
                <hr style={{ gridColumn: '1 / -1', border: 'none', borderTop: '1px solid #e5e7eb', margin: '12px 0' }} />
                <Field label="Start/Dispatch Date Time" required error={errors.delivery_datetime}>
                  {renderInput('delivery_datetime', '', 'datetime-local')}
                </Field>
                <Field label="Fuel P.O.">
                  {renderInput('fuel_po', 'e.g. CL-12345' )}
                </Field>
                <Field label="Odometer Reading">
                  {renderInput('odometer', 'e.g. 50000', 'number')}
                </Field>
                <Field label="Travel Fund" required error={errors.travel_fund}>
                  {renderInput('travel_fund', 'e.g. 50000', 'number')}
                </Field>
                </div>
                <Field label="Remarks">
                  {renderTextarea('remarks', 'Additional notes…')}
                </Field>
             
            </fieldset>
          </div>
        );

    

      default:
        return null;
    }
  
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(17, 24, 39, 0.5)',
      zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      padding: '2vh 2vw', overflow: 'auto',
    }}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{
        background: '#fff', borderRadius: 10, width: '100%', maxWidth: 1100,
        maxHeight: '96vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden',
      }}>
        <div style={{
          padding: '14px 18px', borderBottom: '1px solid #e5e7eb',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#111827' }}>
              {viewOnly ? 'View Booking' : <>Update status to UNDER REVIEW - <span style={{ color: '#2563eb' }}>Booking #:</span>  <span style={{ fontWeight: 400 }}>{editBooking?.booking_no}</span></>}
            </div>
            {viewOnly && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>Read-only mode</div>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {!viewOnly && (
              <>
                {toast.msg && (
                  <div className={`alert alert-${toast.type || 'success'}`} style={{ margin: 0, fontSize: 12 }}>
                    {toast.msg}
                  </div>
                )}
                <button
                  className="btn btn-primary"
                  onClick={handleSave}
                  disabled={submitting}
                >
                  {submitting ? <Loader2 className="animate-spin" size={14} style={{ marginRight: 6 }} /> : <Save size={14} style={{ marginRight: 6 }} />}
                  Save
                </button>
              </>
            )}
            <button className="btn btn-ghost" onClick={onClose}>
              <X size={15} />
            </button>
          </div>
        </div>

        <div className="tabs" style={{ margin: '0 10px 16px', flexWrap: 'nowrap', overflowX: 'auto' }}>
          {TABS.map(t => (
            <button
              key={t.key}
              type="button"
              className={activeTab === t.key ? 'active' : ''}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', background: '#fff' }}>
          {renderTab()}
        </div>
      </div>
    </div>
  );
}
