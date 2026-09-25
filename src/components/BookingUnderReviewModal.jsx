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
    customers: [],
    booking_types: [],
    depots: [],
    commodity_type: [],
    origins: [],
    destination: [],
    vehicles: [],
    personnel:[],
    vehicle_statuses: [],
    item_types: [],
    vh_types: [],
    vh_manufacturers: [],
    vh_models: [],
    category_types: [],
    vendors: [],
  });
  
  const createBlankItem = () => ({
    item_type_id: '',
    item_description: '',
    length: '',
    width: '',
    height: '',
    weight: '',
  });

  const personnelIdForRole = (assignments, role) => {
    const assignment = Array.isArray(assignments)
      ? assignments.find((item) => item.assignment_role === role)
      : null;
    return assignment?.personnel_id ?? '';
  };
  

  const blankForm = {
    item_details: [createBlankItem()],

    customer_id: '',
    booking_type_id: '',
    delivery_date: '',
    depot_id: '',
    commodity_type_id: '',
    route_code: '',
    trips_number: '',
    drops_number: '',
    origin_id: '',
    destination_id: '',

    // Vehicle Assignment
    vehicle_id: '',
    plate_no: '',
    vehicle_type_id: '',
    commodity_type: '',

    // Fuel and Trip Allowance
    area: '',
    trip_allowance: '',
    fuel: '',
    fuel_po: '',
    fuel_amount: '',

    // Personnel assignment
    driver_id: '',
    driver_source: 'direct',
    driver_vendor_id: '',
    helper1_id: '',
    helper1_source: 'direct',
    helper1_vendor_id: '',
    driver_included_h1: false,
    helper2_id: '',
    helper2_source: 'direct',
    helper2_vendor_id: '',
    driver_included_h2: false,

    // References
    client_ref_no: '',
    other_ref_no: '',
    remarks: '',

    // Item Details
    item_type_id: '',
    item_description: '',
    length: '',
    width: '',
    height: '',
    weight: '',

    // Vehicle Photos and Documents
    bk_photos: [{ photo_name: '', photo_path: '' }],


    
  };

  const [form, setForm] = useState(blankForm);
  const [companyOwned, setCompanyOwned] = useState(false);
  const [errors, setErrors] = useState({});

  const loadLookups = async () => {   
    try {
      const [
        customers,
        bookingTypes,
        depots,
        commodityTypes,
        origins,
        destination,
        vehicles,
        personnel,
        itemTypes,
        vehicleStatuses,
        vhTypes,
        vhManufacturers,
        vhModels,
        categoryTypes,
        vendors,
      ] = await Promise.all([
        lookups.customers ? lookups.customers().catch(() => []) : Promise.resolve([]),
        lookups.bookingTypes ? lookups.bookingTypes().catch(() => []) : Promise.resolve([]),
        lookups.depots ? lookups.depots().catch(() => []) : Promise.resolve([]),
        lookups.commodity_type ? lookups.commodity_type().catch(() => []) : Promise.resolve([]),
        lookups.origins ? lookups.origins().catch(() => []) : Promise.resolve([]),
        lookups.destination ? lookups.destination().catch(() => []) : Promise.resolve([]),
        lookups.vehicles ? lookups.vehicles().catch(() => []) : Promise.resolve([]),
        lookups.personnel ? lookups.personnel().catch(() => []) : Promise.resolve([]),
        lookups.item_types ? lookups.item_types().catch(() => []) : Promise.resolve([]),
        lookups.vehicle_statuses ? lookups.vehicle_statuses().catch(() => []) : Promise.resolve([]),
        lookups.vh_types ? lookups.vh_types().catch(() => []) : Promise.resolve([]),
        lookups.vh_manufacturers ? lookups.vh_manufacturers().catch(() => []) : Promise.resolve([]),
        lookups.vh_models ? lookups.vh_models().catch(() => []) : Promise.resolve([]),
        lookups.category_types ? lookups.category_types().catch(() => []) : Promise.resolve([]),
        lookups.vendors ? lookups.vendors().catch(() => []) : Promise.resolve([]),
      ]);

      const normalize = (data) => (Array.isArray(data) ? data : (data?.data || []));

      setLookupsData({
        customers: normalize(customers),
        bookingTypes: normalize(bookingTypes),
        depots: normalize(depots),
        origins: normalize(origins),
        destination: normalize(destination),
        booking_types: normalize(bookingTypes),
        vehicles: normalize(vehicles),
        personnel: normalize(personnel),
        item_types: normalize(itemTypes),
        vehicle_statuses: normalize(vehicleStatuses),
        vh_types: normalize(vhTypes),
        vh_manufacturers: normalize(vhManufacturers),
        vh_models: normalize(vhModels),
        commodity_type: normalize(commodityTypes),
        category_types: normalize(categoryTypes),
        vendors: normalize(vendors),
      });
    } catch {
      /* no-op */
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadLookups();
      setForm({
        delivery_date: editBooking?.delivery_date ?? '',
        plate_no: editBooking?.plate_no ?? '',
      });
      setCompanyOwned(false);
      setActiveTab('bookinginfo');
      setErrors({});
      setToast({ type: '', msg: '' });
    }
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

  const addAttachmentRow = (type) => {
    setForm(prev => ({
      ...prev,
      [type]: [
        ...(prev[type] || []),
        type === 'vh_documents'
          ? { document_name: '', document_path: '' }
          : { photo_name: '', photo_path: '' },
      ],
    }));
  };

  const removeAttachmentRow = (type, index) => {
    setForm(prev => ({
      ...prev,
      [type]: (prev[type] || []).filter((_, i) => i !== index),
    }));
  };

  const updateAttachmentRow = (type, index, field, value) => {
    setForm(prev => ({
      ...prev,
      [type]: (prev[type] || []).map((row, i) => i === index ? { ...row, [field]: value } : row),
    }));
  };

  const updateItem = (index, field, value) => {
    setForm(prev => ({
      ...prev,
      item_details: (prev.item_details || []).map((item, itemIndex) => (
        itemIndex === index ? { ...item, [field]: value } : item
      )),
    }));
  };

  const addItem = (index) => {
    setForm(prev => {
      const items = prev.item_details || [];
      const currentItem = items[index];

      if (!currentItem?.item_type_id || !String(currentItem.weight || '').trim()) {
        return prev;
      }

      return {
        ...prev,
        item_details: [
          ...items.slice(0, index + 1),
          createBlankItem(),
          ...items.slice(index + 1),
        ],
      };
    });
  };

  const validate = () => {
    const errs = {};
    // if (!form.last_name.trim())  errs.last_name  = 'Required';
    // if (!form.first_name.trim()) errs.first_name = 'Required';
    // if (!form.status)            errs.status     = 'Required';
    // if (!form.employment.personnel_type_id) errs['employment.personnel_type_id'] = 'Required';
    // if (!form.employment.depot_id)          errs['employment.depot_id']          = 'Required';
    // if (!form.employment.employment_type)   errs['employment.employment_type']   = 'Required';
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
      const payload = {
        // Under Review
        underreview: {
          delivery_date: form.delivery_date.trim() || null,
          plate_no: form.plate_no.trim() || null,
          delivery_datetime: form.delivery_datetime.trim() || null,
          fuel_po: form.fuel_po.trim() || null,
          odometer: form.odometer ? Number(form.odometer) : null,
          remarks: form.remarks.trim() || null,
        },
        
        // Booking Info
        // booking_info: {
        //   customer_id: form.customer_id ? Number(form.customer_id) : null,
        //   booking_type_id: form.booking_type_id ? Number(form.booking_type_id) : null,
        //   delivery_date: form.delivery_date.trim() || null,
        //   depot_id: form.depot_id ? Number(form.depot_id) : null,
        //   commodity_type_id: form.commodity_type_id ? Number(form.commodity_type_id) : null,
        //   route_code: form.route_code.trim() || null,
        //   trips_number: form.trips_number ? Number(form.trips_number) : null, 
        //   drops_number: form.drops_number ? Number(form.drops_number) : null, 
        //   origin_id: form.origin_id ? Number(form.origin_id) : null,
        //   destination_id: form.destination_id ? Number(form.destination_id) : null,
        // },
        // // Vehicle Assignment
        // vehicle_assignment: {
        //   vehicle_id: form.vehicle_id ? Number(form.vehicle_id) : null,
        //   plate_no: form.plate_no.trim() || null,
        //   vehicle_type_id: form.vehicle_type_id ? Number(form.vehicle_type_id) : null,
        //   commodity_type_id: form.commodity_type_id ? Number(form.commodity_type_id) : null,
        //   vendor_id: form.vendor_id ? Number(form.vendor_id) : null, 
        // },
        // // Personnel Assignment
        // personnel_assignment: {
        //   driver_id: form.driver_id ? Number(form.driver_id) : null,
        //   driver_source: form.driver_source || 'direct',
        //   driver_vendor_id: form.driver_vendor_id ? Number(form.driver_vendor_id) : null,
        //   helper1_id: form.helper1_id ? Number(form.helper1_id) : null,
        //   helper1_source: form.helper1_source || 'direct',
        //   helper1_vendor_id: form.helper1_vendor_id ? Number(form.helper1_vendor_id) : null,
        //   helper2_id: form.helper2_id ? Number(form.helper2_id) : null,
        //   helper2_source: form.helper2_source || 'direct',
        //   helper2_vendor_id: form.helper2_vendor_id ? Number(form.helper2_vendor_id) : null,
        //   driver_included_h1: Boolean(form.driver_included_h1),
        //   driver_included_h2: Boolean(form.driver_included_h2),
        // },

        // references: {
        //   client_ref_no: form.client_ref_no.trim() || null,
        //   other_ref_no: form.other_ref_no.trim() || null,
        //   remarks: form.remarks.trim() || null,
        // },
        
        // item_details: (form.item_details || []).map((item) => ({
        //   item_type_id: item.item_type_id || null,
        //   item_description: item.item_description?.trim() || null,
        //   length: item.length || null,
        //   width: item.width || null,
        //   height: item.height || null,
        //   weight: item.weight || null,
        // })),

        // bk_photos: (form.bk_photos || [])
        //   .filter(row => row.photo_name.trim() || row.photo_path.trim())
        //   .map(row => ({
        //     photo_name: row.photo_name.trim() || null,
        //     photo_path: row.photo_path.trim() || null,
        //   })),
      };

      const saved = await bookingUnderReviewCrud.create(payload);
      setToast({ type: 'success', msg: 'Vehicles saved successfully.' });
      setTimeout(() => {
        onSaved(saved);
        onClose();
      }, 800);
    } catch (e) {
      setToast({ type: 'error', msg: e.message || 'Failed to save vehicles.' });
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
        style={viewOnly ? readOnlyStyle : inputStyle}
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
        style={viewOnly ? readOnlyStyle : inputStyle}
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

  const setPersonnelSource = (role, source) => {
    setField(`${role}_source`, source);
    if (source === 'direct') {
      setField(`${role}_vendor_id`, '');
    }
  };

  const renderPersonnelField = (role, label) => {
    const source = form[`${role}_source`] || 'direct';
    const driverIncluded = role === 'helper1'
      ? Boolean(form.driver_included_h1)
      : role === 'helper2'
        ? Boolean(form.driver_included_h2)
        : false;
    const personnelOptions = lookupsData.personnel.filter((person) => {
      const personnelType = String(person.personnel_type || '').toLowerCase();
      const hasVendor = person.vendor_id !== null && person.vendor_id !== undefined && person.vendor_id !== '' && String(person.vendor_id) !== '0';

      if (role === 'driver') {
        if (source === 'direct') {
          return personnelType.includes('driver') && !hasVendor;
        }
        return personnelType.includes('driver') && hasVendor;
      }

      if (source === 'direct') {
        return !hasVendor && (driverIncluded || !personnelType.includes('driver'));
      }

      return hasVendor && (driverIncluded || !personnelType.includes('driver'));
    });

  };

  //   const handlePersonnelSelection = (e) => {
  //     const selectedId = e.target.value;
  //     const matchedPerson = lookupsData.personnel.find((person) => String(person.personnel_id) === String(selectedId));

  //     setField(`${role}_id`, selectedId);
  //     if (matchedPerson) {
  //       setField(`${role}_vendor_id`, matchedPerson.vendor_id ?? '');
  //     }
  //   };

  //   return (
  //     <Field label={label} required error={errors[`${role}_id`]}>
  //       <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 12, color: '#374151' }}>
  //         <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
  //           <input
  //             type="checkbox"
  //             disabled={viewOnly}
  //             checked={source === 'direct'}
  //             onChange={() => setPersonnelSource(role, 'direct')}
  //           />
  //           Direct Hired
  //         </label>
  //         <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
  //           <input
  //             type="checkbox"
  //             disabled={viewOnly}
  //             checked={source === 'outsource'}
  //             onChange={() => setPersonnelSource(role, 'outsource')}
  //           />
  //           Outsourced
  //         </label>
  //       </div>
  //       {source === 'outsource' && (
  //         <Field label="Outsourced Vendor">
  //           {renderSelect(`${role}_vendor_id`, lookupsData.vendors, 'vendor_id', 'vendor_name', '- Select Vendor -')}
  //         </Field>
  //       )}
  //       {renderSelect(`${role}_id`, personnelOptions, 'personnel_id', 'full_name', `- Select ${label} -`, false, handlePersonnelSelection)}
  //       {role !== 'driver' && (
  //         <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 4, fontSize: 12, color: '#374151' }}>
  //           <input
  //             type="checkbox"
  //             disabled={viewOnly}
  //             checked={driverIncluded}
  //             onChange={(e) => setField(
  //               role === 'helper1' ? 'driver_included_h1' : 'driver_included_h2',
  //               e.target.checked
  //             )}
  //           />
  //           Driver Included
  //         </label>
  //       )}
  //     </Field>
  //   );
  // };

    



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

    // const handleCommoditySelection = (e) => {
    //   const nextCommodity = e.target.value;
    //   setField('commodity_type_id', nextCommodity);

    //   const currentPlate = form.plate_no;
    //   const plateStillValid = !nextCommodity || vehicleOptions.some((vehicle) => vehicle.plate_no === currentPlate);
    //   if (!plateStillValid) {
    //     setField('plate_no', '');
    //     setField('vehicle_id', '');
    //     setField('vehicle_type_id', '');
    //   }
    // };

    switch (activeTab) {
      case 'bookinginfo':
        return (
          <div style={{ padding: 18 }}>
            <fieldset style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 14, marginBottom: 18 }}>
              <legend style={{ fontSize: 12, fontWeight: 600, color: '#374151', padding: '0 6px', background: '#f3f4f6', borderRadius: 4 }}>
                Booking Information
              </legend>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <Field label="Delivery Date" required error={errors.delivery_date}>
                  {renderInput('delivery_date', '', 'date')}
                </Field>
                <Field label="Vehicle No." required error={errors.plate_no}>
                  {renderSelect(
                    'plate_no',
                    vehicleOptions,
                    'plate_no',
                    'plate_no',
                    '- Select Plate No. -',
                    false,
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
                <Field label="Odometer Reading" required error={errors.odometer}>
                  {renderInput('odometer', '', 'number')}
                </Field>
                <Field label="Remarks">
                  {renderTextarea('remarks', 'Additional notes…')}
                </Field>
             
              </div>
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
              {viewOnly ? 'View Booking' : 'New Booking'}
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

        <div style={{
          display: 'flex', borderBottom: '1px solid #e5e7eb',
          background: '#fafafa', padding: '0 10px', overflowX: 'auto',
        }}>
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{
                padding: '12px 14px', fontSize: 13, whiteSpace: 'nowrap',
                fontWeight: activeTab === t.key ? 600 : 400,
                color: activeTab === t.key ? '#1d4ed8' : '#4b5563',
                background: 'transparent', border: 'none', borderBottom: activeTab === t.key ? '2px solid #1d4ed8' : '2px solid transparent',
                marginBottom: -1, cursor: 'pointer',
              }}
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
