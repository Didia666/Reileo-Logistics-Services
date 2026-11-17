import React, { useEffect, useState } from 'react';
import { X, Loader2, Save } from 'lucide-react';
import { bookingDeliveryCrud, lookups } from '../services/api.js';

const TABS = [
  { key: 'bookinginfo', label: 'Booking Information' },
  { key: 'references', label: 'References' },
  { key: 'expenses', label: 'Expenses' },
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
export default function DeliveredModal({ isOpen, editBooking, onClose, onSaved, viewOnly }) {
  const [activeTab, setActiveTab] = useState('bookinginfo');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ type: '', msg: '' });
  const [lookupsData, setLookupsData] = useState({
    // customers: [],
    // booking_types: [],
    // depots: [],
    // commodity_type: [],
    // origins: [],
    destination: [],
    vehicles: [],
    // personnel:[],
    // vehicle_statuses: [],
    // item_types: [],
    // vh_types: [],
    // vh_manufacturers: [],
    // vh_models: [],
    // category_types: [],
    // vendors: [],
  });
  
  // const createBlankItem = () => ({
  //   item_type_id: '',
  //   item_description: '',
  //   length: '',
  //   width: '',
  //   height: '',
  //   weight: '',
  // });

  // const personnelIdForRole = (assignments, role) => {
  //   const assignment = Array.isArray(assignments)
  //     ? assignments.find((item) => item.assignment_role === role)
  //     : null;
  //   return assignment?.personnel_id ?? '';
  // };
  

  const blankForm = {
    // item_details: [createBlankItem()],

    // booking information
    delivery_date: '',
    plate_no: '',
    delivered_datetime: '',
    received_datetime: '',
    odometer: '',
    destination_id: '',
    client_rate: '',
    trips_number: '',
    subcon_rate: '',

    // references
    client_ref_no: '',
    charges: '',
    fuel: '',
    fuel_po: '',
    fuel_amount: '',
    remarks: '',

    // expenses
    b_toll_fees: '',
    b_extra_drop: '',
    b_extra_helper: '',
    b_other_expenses: '',
    nb_parking_fees: '',
    nb_toll_fees_non_billable: '',
    nb_demurrage_fees: '',
    nb_backload_fees: '',
    nb_other_deductions: '',
  };

  const [form, setForm] = useState(blankForm);
  const [companyOwned, setCompanyOwned] = useState(false);
  const [errors, setErrors] = useState({});

  const loadLookups = async () => {
    try {
      const [
        // customers,
        // bookingTypes,
        // depots,
        // commodityTypes,
        // origins,
        destination,
        vehicles,
        // personnel,
        // itemTypes,
        // vehicleStatuses,
        // vhTypes,
        // vhManufacturers,
        // vhModels,
        // categoryTypes,
        // vendors,
      ] = await Promise.all([
        // lookups.customers ? lookups.customers().catch(() => []) : Promise.resolve([]),
        // lookups.bookingTypes ? lookups.bookingTypes().catch(() => []) : Promise.resolve([]),
        // lookups.depots ? lookups.depots().catch(() => []) : Promise.resolve([]),
        // lookups.commodity_type ? lookups.commodity_type().catch(() => []) : Promise.resolve([]),
        // lookups.origins ? lookups.origins().catch(() => []) : Promise.resolve([]),
        lookups.destination ? lookups.destination().catch(() => []) : Promise.resolve([]),
        lookups.vehicles ? lookups.vehicles().catch(() => []) : Promise.resolve([]),
        // lookups.personnel ? lookups.personnel().catch(() => []) : Promise.resolve([]),
        // lookups.item_types ? lookups.item_types().catch(() => []) : Promise.resolve([]),
        // lookups.vehicle_statuses ? lookups.vehicle_statuses().catch(() => []) : Promise.resolve([]),
        // lookups.vh_types ? lookups.vh_types().catch(() => []) : Promise.resolve([]),
        // lookups.vh_manufacturers ? lookups.vh_manufacturers().catch(() => []) : Promise.resolve([]),
        // lookups.vh_models ? lookups.vh_models().catch(() => []) : Promise.resolve([]),
        // lookups.category_types ? lookups.category_types().catch(() => []) : Promise.resolve([]),
        // lookups.vendors ? lookups.vendors().catch(() => []) : Promise.resolve([]),
      ]);

      const normalize = (data) => (Array.isArray(data) ? data : (data?.data || []));

      setLookupsData({
        // customers: normalize(customers),
        // bookingTypes: normalize(bookingTypes),
        // depots: normalize(depots),
        // origins: normalize(origins),
        destination: normalize(destination),
        // booking_types: normalize(bookingTypes),
        vehicles: normalize(vehicles),
        // personnel: normalize(personnel),
        // item_types: normalize(itemTypes),
        // vehicle_statuses: normalize(vehicleStatuses),
        // vh_types: normalize(vhTypes),
        // vh_manufacturers: normalize(vhManufacturers),
        // vh_models: normalize(vhModels),
        // commodity_type: normalize(commodityTypes),
        // category_types: normalize(categoryTypes),
        // vendors: normalize(vendors),
      });
    } catch {
      /* no-op */
    }
  };

  // useEffect(() => {
  //   if (isOpen) {
  //     loadLookups();
  //     setForm({
  //       delivery_date: editBooking?.delivery_date ?? '',
  //       plate_no: editBooking?.plate_no ?? '',
  //     });
  //     setCompanyOwned(false);
  //     setActiveTab('bookinginfo');
  //     setErrors({});
  //     setToast({ type: '', msg: '' });
  //   }
  // }, [isOpen, editBooking]);

  useEffect(() => {
      if (!isOpen || !editBooking?.booking_id) return undefined;
  
      let cancelled = false;
      loadLookups();
      setForm({ ...blankForm });
      setCompanyOwned(false);
      setActiveTab('bookinginfo');
      setErrors({});
      setToast({ type: '', msg: '' });
  
      bookingDeliveryCrud.get(editBooking.booking_id)
        .then((booking) => {
          if (cancelled) return;
          const deliveredDatetime = booking.delivered_datetime
            ? String(booking.delivered_datetime).replace(' ', 'T').slice(0, 16)
            : '';
          setForm({
            ...blankForm,
            delivery_date: booking.delivery_date || '',
            plate_no: booking.plate_no || '',
            delivered_datetime: deliveredDatetime,
            received_datetime: booking.received_datetime || '',
            odometer: booking.odometer || '',
            destination_id: booking.destination_id || '',
            client_rate: booking.client_rate || '',
            trips_number: booking.trips_number || '',
            subcon_rate: booking.subcon_rate || '',

            client_ref_no: booking.client_ref_no || '',
            charges: booking.charges || '',
            fuel: booking.fuel || '',
            fuel_po: booking.fuel_po || '',
            fuel_amount: booking.fuel_amount || '',
            remarks: booking.remarks || '',

            // expenses
            b_toll_fees: booking.b_toll_fees || '',
            b_extra_drop: booking.b_extra_drop || '',
            b_extra_helper: booking.b_extra_helper || '',
            b_other_expenses: booking.b_other_expenses || '',
            nb_parking_fees: booking.nb_parking_fees || '',
            nb_toll_fees_non_billable: booking.nb_toll_fees_non_billable || '',
            nb_demurrage_fees: booking.nb_demurrage_fees || '',
            nb_backload_fees: booking.nb_backload_fees || '',
            nb_other_deductions: booking.nb_other_deductions || '',

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

  // const addAttachmentRow = (type) => {
  //   setForm(prev => ({
  //     ...prev,
  //     [type]: [
  //       ...(prev[type] || []),
  //       type === 'vh_documents'
  //         ? { document_name: '', document_path: '' }
  //         : { photo_name: '', photo_path: '' },
  //     ],
  //   }));
  // };

  // const removeAttachmentRow = (type, index) => {
  //   setForm(prev => ({
  //     ...prev,
  //     [type]: (prev[type] || []).filter((_, i) => i !== index),
  //   }));
  // };

  // const updateAttachmentRow = (type, index, field, value) => {
  //   setForm(prev => ({
  //     ...prev,
  //     [type]: (prev[type] || []).map((row, i) => i === index ? { ...row, [field]: value } : row),
  //   }));
  // };

  // const updateItem = (index, field, value) => {
  //   setForm(prev => ({
  //     ...prev,
  //     item_details: (prev.item_details || []).map((item, itemIndex) => (
  //       itemIndex === index ? { ...item, [field]: value } : item
  //     )),
  //   }));
  // };

  // const addItem = (index) => {
  //   setForm(prev => {
  //     const items = prev.item_details || [];
  //     const currentItem = items[index];

  //     if (!currentItem?.item_type_id || !String(currentItem.weight || '').trim()) {
  //       return prev;
  //     }

  //     return {
  //       ...prev,
  //       item_details: [
  //         ...items.slice(0, index + 1),
  //         createBlankItem(),
  //         ...items.slice(index + 1),
  //       ],
  //     };
  //   });
  // };

  const validate = () => {
    const errs = {};
    if (!form.delivery_date.trim()) errs.delivery_date = 'Delivery date is required.';
    if (!form.delivered_datetime.trim()) errs.delivered_datetime = 'Delivered date & time is required.';
    if (!form.received_datetime.trim()) errs.received_datetime = 'Received date & time is required.';
    if (!form.destination_id) errs.destination_id = 'Destination is required.';
    if (!form.client_rate || isNaN(Number(form.client_rate))) errs.client_rate = 'Client rate is required and must be a number.';
    if (!form.trips_number || isNaN(Number(form.trips_number))) errs.trips_number = 'No. of trips is required and must be a number.';
    // setErrors(errs);
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
      const totalAmount = Number((Number(form.client_rate) * Number(form.trips_number)).toFixed(2));
      const payload = {
        // Booking Info
        booking_info: {
          delivery_date: form.delivery_date.trim() || null,
          plate_no: form.plate_no.trim() || null,
          delivered_datetime: form.delivered_datetime.trim() || null,
          received_datetime: form.received_datetime.trim() || null,
          odometer: form.odometer ? Number(form.odometer) : null,          
          destination_id: form.destination_id ? Number(form.destination_id) : null,
          client_rate: form.client_rate ? Number(form.client_rate) : null,
          trips_number: form.trips_number ? Number(form.trips_number) : null, 
          total_amount: totalAmount,
          subcon_rate: form.subcon_rate ? Number(form.subcon_rate) : null,
        },

        //fueltripallowance
        fuel_trip: {
          charges: form.charges.trim() || null,
          fuel: form.fuel ? Number(form.fuel) : null,
          fuel_po: form.fuel_po.trim() || null,
          fuel_amount: form.fuel_amount ? Number(form.fuel_amount) : null,
        },

        // References
        references: {
          client_ref_no: form.client_ref_no.trim() || null,
          remarks : form.remarks.trim() || null,
        },

        expenses: {
          b_toll_fees: form.b_toll_fees ? Number(form.b_toll_fees) : null,
          b_extra_drop: form.b_extra_drop ? Number(form.b_extra_drop) : null,
          b_extra_helper: form.b_extra_helper ? Number(form.b_extra_helper) : null,
          b_other_fees: form.b_other_fees ? Number(form.b_other_fees) : null,
          nb_parking_fees: form.nb_parking_fees ? Number(form.nb_parking_fees) : null,
          nb_toll_fees: form.nb_toll_fees ? Number(form.nb_toll_fees) : null,
          nb_demurrage_fees: form.nb_demurrage_fees ? Number(form.nb_demurrage_fees) : null,
          nb_backload_fees: form.nb_backload_fees ? Number(form.nb_backload_fees) : null,
          nb_other_deductions: form.nb_other_deductions ? Number(form.nb_other_deductions) : null,
        }
        
      };

      const saved = await bookingDeliveryCrud.create(editBooking?.booking_id, payload);
      setToast({ type: 'success', msg: 'Booking Delivered successfully.' });
      setTimeout(() => {
        onSaved(saved);
        onClose();
      }, 800);
    } catch (e) {
      setToast({ type: 'error', msg: e.message || 'Failed to deliver booking.' });
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
    const clientRate = Number(form.client_rate) || 0;
    const tripsNumber = Number(form.trips_number) || 0;
    const totalAmount = (clientRate * tripsNumber).toFixed(2);

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

    const selectedVehicle = lookupsData.vehicles.find((vehicle) => (
      String(vehicle.plate_no ?? '') === String(form.plate_no ?? '')
    ));
    const hasVehicleVendor = selectedVehicle?.vendor_id !== null
      && selectedVehicle?.vendor_id !== undefined
      && String(selectedVehicle.vendor_id).trim() !== ''
      && String(selectedVehicle.vendor_id) !== '0';

    const handlePlateSelection = (e) => {
      const plateNo = e.target.value;
      const matchedVehicle = lookupsData.vehicles.find((vehicle) => vehicle.plate_no === plateNo);

      setField('plate_no', plateNo);
      setField('vehicle_id', matchedVehicle ? (matchedVehicle.vehicle_id ?? '') : '');
      setField('vehicle_type_id', matchedVehicle ? (matchedVehicle.vehicle_type_id ?? '') : '');
    };

    const handleCommoditySelection = (e) => {
      const nextCommodity = e.target.value;
      setField('commodity_type_id', nextCommodity);

      const currentPlate = form.plate_no;
      const plateStillValid = !nextCommodity || vehicleOptions.some((vehicle) => vehicle.plate_no === currentPlate);
      if (!plateStillValid) {
        setField('plate_no', '');
        setField('vehicle_id', '');
        setField('vehicle_type_id', '');
      }
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
                <Field label="Delivery Date">
                  {renderInput('delivery_date', '', 'date', true)}
                </Field>
                <Field label="Vehicle No.">
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
                <Field label="Delivered Date & Time" required error={errors.delivered_datetime}>
                  {renderInput('delivered_datetime', '', 'datetime-local')}
                </Field>
                <Field label="Received Date & Time" required error={errors.received_datetime}>
                  {renderInput('received_datetime', '', 'datetime-local')}
                </Field>
                <Field label="Odometer Reading">
                  {renderInput('odometer', '', 'number')}
                </Field>
                <Field label="Farthest Destination" required error={errors.delivery_date}>
                  {renderSelect('destination_id', lookupsData.destination, 'destination_id', 'destination', '- Select Destination -')}
                </Field>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
                <Field label="Client Rate" required error={errors.client_rate}>
                  {renderInput('client_rate', 'e.g. 5', 'number')}
                </Field>
                <Field label="No. of Trips" required error={errors.delivery_date}>
                  {renderInput('trips_number', 'e.g. 5', 'number')}
                </Field>
                <Field label="Total Amount">
                  <output aria-live="polite" style={{ ...readOnlyStyle, fontWeight: 600 }}>
                    {totalAmount}
                  </output>
                </Field>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                {hasVehicleVendor && (
                  <Field label="Subcon Rate">
                    {renderInput('subcon_rate', 'e.g. 5', 'number')}
                  </Field>
                )}

                
              </div>
            </fieldset>
          </div>
        );

      case 'references':
        return (
          <div style={{ padding: 18 }}>
            <fieldset style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 14, marginBottom: 18 }}>
              <legend style={{ fontSize: 14, fontWeight: 600, color: '#2563eb', padding: '0 6px'}}>
                References
              </legend>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <Field label="Client Reference No.">
                  {renderInput('client_ref_no', 'e.g. CL-12345')}
                </Field>
                <Field label="Charges ">
                  {renderSelect('charges', [ 
                    { value: 'NO CHARGES', label: 'NO CHARGES' }, 
                    { value: 'CHARGES RECORDED', label: 'CHARGES RECORDED' }], 
                    'value', 'label', '- Select-')}
                </Field>
                <Field label="Fuel (L)">
                  {renderInput('fuel', 'e.g. CL-12345', 'number')}
                </Field>
                <Field label="Fuel P.O.">
                  {renderInput('fuel_po', 'e.g. CL-12345' )}
                </Field>
                <Field label="Fuel Amount.">
                  {renderInput('fuel_amount', 'e.g. CL-12345', 'number')}
                </Field>
              </div>
              <Field label="Remarks">
                {renderTextarea('remarks', 'Additional notes…')}
              </Field>
            </fieldset>
          </div>
        );  

        case 'expenses':
        return (
          <div style={{ padding: 18 }}>
            <fieldset style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 14, marginBottom: 18 }}>
              <legend style={{ fontSize: 14, fontWeight: 600, color: '#2563eb', padding: '0 6px'}}>
                Expenses
              </legend>
              <fieldset style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 14, marginBottom: 18 }}>
              <legend style={{ fontSize: 13, fontWeight: 600, color: '#2563eb', padding: '0 6px'}}>
                Billable
              </legend>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <Field label="Toll Fees">
                  {renderInput('b_toll_fees', 'e.g. 1000', 'number')}
                </Field>
                <Field label="Extra Drop">
                  {renderInput('b_extra_drop', 'e.g. 500', 'number')}
                </Field>
                <Field label="Extra Helper">
                  {renderInput('b_extra_helper', 'e.g. 200', 'number')}
                </Field>
                <Field label="Other Expenses/Fees">
                  {renderInput('b_other_fees', 'e.g. 300', 'number')}
                </Field>
                </div>
                </fieldset>
                

                <fieldset style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 14, marginBottom: 18 }}>
                <legend style={{ fontSize: 13, fontWeight: 600, color: '#2563eb', padding: '0 6px'}}>
                  Non-Billable
                </legend>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <Field label="Parking Fees">
                  {renderInput('nb_parking_fees', 'e.g. 100', 'number')}
                </Field>
                <Field label="Toll Fees - Non Billable">
                  {renderInput('nb_toll_fees', 'e.g. 500', 'number')}
                </Field>
                <Field label="Demurrage Fees">
                  {renderInput('nb_demurrage_fees', 'e.g. 200', 'number')}
                </Field>
                <Field label="Backload Fees">
                  {renderInput('nb_backload_fees', 'e.g. 300', 'number')}
                </Field>
                <Field label="Other Deductions">
                  {renderInput('nb_other_deductions', 'e.g. 100', 'number')}
                </Field>
                </div>
                </fieldset>

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
              {viewOnly ? 'View Booking' : <>Update status to DELIVERED -  <span style={{ color: '#2563eb' }}>Booking #:</span>  <span style={{ fontWeight: 400 }}>{editBooking?.booking_no}</span></>}
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
  