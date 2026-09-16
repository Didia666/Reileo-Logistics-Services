import React, { useEffect, useState } from 'react';
import { X, Loader2, Save } from 'lucide-react';
import { bookingCrud, lookups } from '../services/api.js';

const TABS = [
  { key: 'bookinginfo',      label: 'Booking Information' },
  { key: 'vehicleassignment',         label: 'Vehicle Assignment' },
  { key: 'fueltripallowance',    label: 'Fuel and Trip Allowance' },
  { key: 'personnelassignment',  label: 'Personnel Assignment' },
  { key: 'references', label: 'References' },
  { key: 'itemdetails',   label: 'Item Details' },
  { key: 'bookingphotos', label: 'Booking Photos' },
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
export default function BookingFormModal({ isOpen, onClose, onSaved, editBooking, viewOnly }) {
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

    // vh_documents: [{ document_name: '', document_path: '' }],
    // bk_photos: [{ photo_name: '', photo_path: '' }],
    // // Vehicle information
    // status_id: '',
    // vehicle_type_id: '',
    // vehicle_manufacturer_id: '',
    // vehicle_model_id: '',
    // commodity_type_id: '',
    // year_model: '',
    // plate_no: '',
    // body_no: '',
    // asset_no: '',
    // category_type_id: '',
    
    // // Vehicle locations
    // origin_id: '',
    // depot_id: '',
    // vendor_id: '',
    // GPS: '',

    // // Vehicle specifications
    // chassis_no: '',
    // engine_no: '',
    // engine_size: '',
    // color: '',
    // fuel_type: '',
    // transmission: '',

    // // Vehicle Registration and Compliance
    // or_date: '',
    // or_number: '',
    item_details: [createBlankItem()],
    // late_renewal_date: '',
    // registration_type: '',
    // registration_date: '',
    // rfid_type: '',
    // rfid_account_no: '',

    // // Vehicle Insurance
    // insurance_provider: '',
    // insurance_policy_no: '',
    // insurance_expiry: '',
    // inland_marine_policy_no: '',
    // inland_marine_expiry: '',

    // // Vehicle Acquisition and Condition
    // acquisition_date: '',
    // acquisition_price: '',
    // breakdown_date: '',
    // breakdown_remarks: '',
    // remarks: '',

    // Booking Info

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
      if (editBooking) {
        setCompanyOwned(Boolean(editBooking.vendor_id));
        if (Array.isArray(editBooking.bk_photos) && editBooking.bk_photos.length > 0) {
          setForm({
            // vh_documents: Array.isArray(editBooking.vh_documents) && editBooking.vh_documents.length
            //   ? editBooking.vh_documents.map(doc => ({
            //       document_name: doc.document_name || '',
            //       document_path: doc.document_path || '',
            //     }))
            //   : [{ document_name: '', document_path: '' }],
            // bk_photos: Array.isArray(editBooking.bk_photos) && editBooking.bk_photos.length
            //   ? editBooking.bk_photos.map(photo => ({
            //       photo_name: photo.photo_name || '',
            //       photo_path: photo.photo_path || '',
            //     }))
            //   : [{ photo_name: '', photo_path: '' }],
            // // vehicle info
            // status_id: editBooking.status_id ?? editBooking.vehicle_status_id ?? '',
            // vehicle_type_id: editBooking.vehicle_type_id ?? editBooking.vh_types_id ?? '',
            // vehicle_manufacturer_id: editBooking.manufacturer_id ?? editBooking.vehicle_manufacturer_id ?? '',
            // vehicle_model_id: editBooking.model_id ?? editBooking.vehicle_model_id ?? '',
            // commodity_type_id: editBooking.commodity_type_id ?? editBooking.commodity_type_id ?? '',
            // year_model: editBooking.year_model ?? '',
            // plate_no: editBooking.plate_no ?? '',
            // body_no: editBooking.body_no ?? '',
            // asset_no: editBooking.asset_no ?? '',
            // category_type_id: editBooking.category_type_id ?? '',
            // vendor_id: editBooking.vendor_id ?? '',
            // //vehicle location

            // origin_id: editBooking.origin_id ?? '',
            // depot_id: editBooking.depot_id ?? '',
            // GPS: editBooking.GPS === null || editBooking.GPS === undefined ? '' : String(editBooking.GPS),

            // //vehicle specfications
            // chassis_no: editBooking.chassis_no ?? '',
            // engine_no: editBooking.engine_no ?? '',
            // engine_size: editBooking.engine_size ?? '',
            // color: editBooking.color ?? '',
            // fuel_type: editBooking.fuel_type ?? editBooking.fuel_type ?? '',
            // transmission: editBooking.transmission ?? editBooking.transmission_type ?? '',

            // // Vehicle Registration and Compliance
            // or_date: editBooking.or_date ?? '',
            // or_number: editBooking.or_number ?? '',
            // cr_date: editBooking.cr_date ?? '',
            // cr_number: editBooking.cr_number ?? '',
            // ltfrb_case_no: editBooking.ltfrb_case_no ?? '',
            // ltfrb_expiry: editBooking.ltfrb_expiry ?? '',
            // mv_file_no: editBooking.mv_file_no ?? '',
            // pa_expiry: editBooking.pa_expiry ?? '',
            // late_renewal_date: editBooking.late_renewal_date ?? '',
            // registration_type: editBooking.registration_type ?? '',
            // registration_date: editBooking.registration_date ?? '',
            // rfid_type: editBooking.rfid_type ?? '',
            // rfid_account_no: editBooking.rfid_account_no ?? '',
            
            // // Vehicle Insurance
            // insurance_provider: editBooking.insurance_provider ?? '',
            // insurance_policy_no: editBooking.insurance_policy_no ?? '',
            // insurance_expiry: editBooking.insurance_expiry ?? '',
            // inland_marine_policy_no: editBooking.inland_marine_policy_no ?? '',
            // inland_marine_expiry: editBooking.inland_marine_expiry ?? '',

            // // Vehicle Acquisition and Condition
            // acquisition_date: editBooking.acquisition_date ?? '',
            // acquisition_price: editBooking.acquisition_price ?? '',
            // breakdown_date: editBooking.breakdown_date ?? '',
            // breakdown_remarks: editBooking.breakdown_remarks ?? '',
            // remarks: editBooking.remarks ?? '',

            // Booking Info
            customer_id: editBooking.customer_id ?? '',
            booking_type_id: editBooking.booking_type_id ?? '',
            delivery_date: editBooking.delivery_date ?? '',
            depot_id: editBooking.depot_id ?? '',
            commodity_type_id: editBooking.commodity_type_id ?? '',
            route_code: editBooking.route_code ?? '',
            trips_number: editBooking.trips_number ?? '',
            drops_number: editBooking.drops_number ?? '',
            origin_id: editBooking.origin_id ?? '',
            destination_id: editBooking.destination_id ?? '',

            // Vehicle Assignment
            vehicle_id: editBooking.vehicle_id ?? '',
            plate_no: editBooking.plate_no ?? '',
            vehicle_type_id: editBooking.vehicle_type_id ?? '',
            vendor_id: editBooking.vendor_id ?? '',

            // Fuel and Trip Allowance
            area: editBooking.area ?? '',
            trip_allowance: editBooking.trip_allowance ?? '',
            fuel: editBooking.fuel ?? '',
            fuel_po: editBooking.fuel_po ?? '',
            fuel_amount: editBooking.fuel_amount ?? '',

            // Personnel Assignment
            driver_id: personnelIdForRole(editBooking.personnel_assignments, 'driver') || editBooking.driver_id || '',
            driver_source: editBooking.driver_source ?? 'direct',
            driver_vendor_id: editBooking.driver_vendor_id ?? '',
            helper1_id: personnelIdForRole(editBooking.personnel_assignments, 'helper1') || editBooking.helper1_id || '',
            helper1_source: editBooking.helper1_source ?? 'direct',
            helper1_vendor_id: editBooking.helper1_vendor_id ?? '',
            helper2_id: personnelIdForRole(editBooking.personnel_assignments, 'helper2') || editBooking.helper2_id || '',
            helper2_source: editBooking.helper2_source ?? 'direct',
            helper2_vendor_id: editBooking.helper2_vendor_id ?? '',

            // References
            client_ref_no: editBooking.client_ref_no ?? '',
            other_ref_no: editBooking.other_ref_no ?? '',
            remarks: editBooking.remarks ?? '',

            // Item Details
            item_details: Array.isArray(editBooking.item_details) && editBooking.item_details.length
              ? editBooking.item_details.map((item) => ({
                  item_type_id: item.item_type_id ?? '',
                  item_description: item.item_description ?? '',
                  length: item.length ?? '',
                  width: item.width ?? '',
                  height: item.height ?? '',
                  weight: item.weight ?? '',
                }))
              : [createBlankItem()],

            // Booking Photos
            bk_photos: Array.isArray(editBooking.bk_photos) && editBooking.bk_photos.length
              ? editBooking.bk_photos.map(photo => ({
                    photo_name: photo.photo_name || '',
                    photo_path: photo.photo_path || '',
                  }))
                : [{ photo_name: '', photo_path: '' }],
          });

        } else {
          bookingCrud.get(editBooking.booking_id).then(full => {
            setForm({
              // Booking Info
              customer_id: full.customer_id ?? '',
              booking_type_id: full.booking_type_id ?? '',
              delivery_date: full.delivery_date ?? '',
              depot_id: full.depot_id ?? '',
              commodity_type_id: full.commodity_type_id ?? '',
              route_code: full.route_code ?? '',
              trips_number: full.trips_number ?? '',
              drops_number: full.drops_number ?? '',
              origin_id: full.origin_id ?? '',
              destination_id: full.destination_id ?? '',

              // Vehicle Assignment
              vehicle_id: full.vehicle_id ?? '',
              plate_no: full.plate_no ?? '',
              vehicle_type_id: full.vehicle_type_id ?? '',
              vendor_id: full.vendor_id ?? '',

              // Fuel and Trip Allowance
              area: full.area ?? '',
              trip_allowance: full.trip_allowance ?? '',
              fuel: full.fuel ?? '',
              fuel_po: full.fuel_po ?? '',
              fuel_amount: full.fuel_amount ?? '',

              // Personnel Assignment
              driver_id: personnelIdForRole(full.personnel_assignments, 'driver') || full.driver_id || '',
              driver_source: full.driver_source ?? 'direct',
              driver_vendor_id: full.driver_vendor_id ?? '',

              helper1_id: personnelIdForRole(full.personnel_assignments, 'helper1') || full.helper1_id || '',
              helper1_source: full.helper1_source ?? 'direct',
              helper1_vendor_id: full.helper1_vendor_id ?? '',

              helper2_id: personnelIdForRole(full.personnel_assignments, 'helper2') || full.helper2_id || '',
              helper2_source: full.helper2_source ?? 'direct',
              helper2_vendor_id: full.helper2_vendor_id ?? '',
              
              driver_included_h1: Boolean(full.driver_included_h1),
              driver_included_h2: Boolean(full.driver_included_h2),
              
              // References
              client_ref_no: full.client_ref_no ?? '',
              other_ref_no: full.other_ref_no ?? '',
              remarks: full.remarks ?? '',

              // Item Details
              item_details: Array.isArray(full.item_details) && full.item_details.length
                ? full.item_details.map((item) => ({
                    item_type_id: item.item_type_id ?? '',
                    item_description: item.item_description ?? '',
                    length: item.length ?? '',
                    width: item.width ?? '',
                    height: item.height ?? '',
                    weight: item.weight ?? '',
                  }))
                : [createBlankItem()],

              // Booking Photos
              bk_photos: Array.isArray(full.bk_photos) && full.bk_photos.length
                  ? full.bk_photos.map(photo => ({
                      photo_name: photo.photo_name || '',
                      photo_path: photo.photo_path || '',
                    }))
                  : [{ photo_name: '', photo_path: '' }],
            });
          }).catch(() => {});
        }
      } else {
        setForm(blankForm);
        setCompanyOwned(false);
        setActiveTab('bookinginfo');
      }
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
        // Booking Info
        booking_info: {
          customer_id: form.customer_id ? Number(form.customer_id) : null,
          booking_type_id: form.booking_type_id ? Number(form.booking_type_id) : null,
          delivery_date: form.delivery_date.trim() || null,
          depot_id: form.depot_id ? Number(form.depot_id) : null,
          commodity_type_id: form.commodity_type_id ? Number(form.commodity_type_id) : null,
          route_code: form.route_code.trim() || null,
          trips_number: form.trips_number ? Number(form.trips_number) : null, 
          drops_number: form.drops_number ? Number(form.drops_number) : null, 
          origin_id: form.origin_id ? Number(form.origin_id) : null,
          destination_id: form.destination_id ? Number(form.destination_id) : null,
        },
        // Vehicle Assignment
        vehicle_assignment: {
          vehicle_id: form.vehicle_id ? Number(form.vehicle_id) : null,
          plate_no: form.plate_no.trim() || null,
          vehicle_type_id: form.vehicle_type_id ? Number(form.vehicle_type_id) : null,
          commodity_type_id: form.commodity_type_id ? Number(form.commodity_type_id) : null,
          vendor_id: form.vendor_id ? Number(form.vendor_id) : null, 
        },
        // Fuel and Trip Allowance
        fueltrip_allowance: {
          area: form.area.trim() || null,
          trip_allowance: form.trip_allowance.trim() || null,
          fuel: form.fuel ? Number(form.fuel) : null,
          fuel_po: form.fuel_po ? Number(form.fuel_po) : null, 
          fuel_amount: form.fuel_amount ? Number(form.fuel_amount) : null, 
        },
        // Personnel Assignment
        personnel_assignment: {
          driver_id: form.driver_id ? Number(form.driver_id) : null,
          driver_source: form.driver_source || 'direct',
          driver_vendor_id: form.driver_vendor_id ? Number(form.driver_vendor_id) : null,
          helper1_id: form.helper1_id ? Number(form.helper1_id) : null,
          helper1_source: form.helper1_source || 'direct',
          helper1_vendor_id: form.helper1_vendor_id ? Number(form.helper1_vendor_id) : null,
          helper2_id: form.helper2_id ? Number(form.helper2_id) : null,
          helper2_source: form.helper2_source || 'direct',
          helper2_vendor_id: form.helper2_vendor_id ? Number(form.helper2_vendor_id) : null,
          driver_included_h1: Boolean(form.driver_included_h1),
          driver_included_h2: Boolean(form.driver_included_h2),
        },

        references: {
          client_ref_no: form.client_ref_no.trim() || null,
          other_ref_no: form.other_ref_no.trim() || null,
          remarks: form.remarks.trim() || null,
        },
        
        item_details: (form.item_details || []).map((item) => ({
          item_type_id: item.item_type_id || null,
          item_description: item.item_description?.trim() || null,
          length: item.length || null,
          width: item.width || null,
          height: item.height || null,
          weight: item.weight || null,
        })),

        bk_photos: (form.bk_photos || [])
          .filter(row => row.photo_name.trim() || row.photo_path.trim())
          .map(row => ({
            photo_name: row.photo_name.trim() || null,
            photo_path: row.photo_path.trim() || null,
          })),
      };

      let saved;
      if (editBooking && editBooking.booking_id) {
        saved = await bookingCrud.update(editBooking.booking_id, payload);
      } else {
        saved = await bookingCrud.create(payload);
      }
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

    const handlePersonnelSelection = (e) => {
      const selectedId = e.target.value;
      const matchedPerson = lookupsData.personnel.find((person) => String(person.personnel_id) === String(selectedId));

      setField(`${role}_id`, selectedId);
      if (matchedPerson) {
        setField(`${role}_vendor_id`, matchedPerson.vendor_id ?? '');
      }
    };

    return (
      <Field label={label} required error={errors[`${role}_id`]}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 12, color: '#374151' }}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <input
              type="checkbox"
              disabled={viewOnly}
              checked={source === 'direct'}
              onChange={() => setPersonnelSource(role, 'direct')}
            />
            Direct Hired
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <input
              type="checkbox"
              disabled={viewOnly}
              checked={source === 'outsource'}
              onChange={() => setPersonnelSource(role, 'outsource')}
            />
            Outsourced
          </label>
        </div>
        {source === 'outsource' && (
          <Field label="Outsourced Vendor">
            {renderSelect(`${role}_vendor_id`, lookupsData.vendors, 'vendor_id', 'vendor_name', '- Select Vendor -')}
          </Field>
        )}
        {renderSelect(`${role}_id`, personnelOptions, 'personnel_id', 'full_name', `- Select ${label} -`, false, handlePersonnelSelection)}
        {role !== 'driver' && (
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 4, fontSize: 12, color: '#374151' }}>
            <input
              type="checkbox"
              disabled={viewOnly}
              checked={driverIncluded}
              onChange={(e) => setField(
                role === 'helper1' ? 'driver_included_h1' : 'driver_included_h2',
                e.target.checked
              )}
            />
            Driver Included
          </label>
        )}
      </Field>
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
              <legend style={{ fontSize: 12, fontWeight: 600, color: '#374151', padding: '0 6px', background: '#f3f4f6', borderRadius: 4 }}>
                Booking Information
              </legend>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <Field label="Customer" required error={errors.customer_id}>
                  {renderSelect('customer_id', lookupsData.customers, 'customer_id', 'customer_name', '- Select Customer -')}
                </Field>
                <Field label="Booking Type." required error={errors.booking_type_id}>
                  {renderSelect('booking_type_id', lookupsData.booking_types, 'booking_type_id', 'booking_type', '- Select Booking Type -')}
                </Field>
                <Field label="Delivery Date" required error={errors.delivery_date}>
                  {renderInput('delivery_date', '', 'date')}
                </Field>
                <Field label="Depot"  required error={errors.depot_id}>
                  {renderSelect('depot_id', lookupsData.depots, 'depot_id', 'depot_name', '- Select Depot -')}
                </Field>
                <Field label="Commodity"  required error={errors.commodity_type_id}>
                  {renderSelect(
                    'commodity_type_id',
                    lookupsData.commodity_type,
                    'commodity_type_id',
                    'commodity_type',
                    '- Select Commodity -',
                    false,
                    handleCommoditySelection
                  )}
                </Field>
                <Field label="Route Code">
                  {renderInput('route_code', 'e.g. 123456')}
                </Field>
                <Field label="Number of Trips">
                  {renderInput('trips_number', 'e.g. 5', 'number')}
                </Field>
               <Field label="Number of drops">
                  {renderInput('drops_number', 'e.g. 5', 'number')}
                </Field>
                <Field label="Origin"  required error={errors.origin_id}>
                  {renderSelect('origin_id', lookupsData.origins, 'origin_id', 'origin_name', '- Select Origin -')}
                </Field>
                <Field label="Destination">
                  {renderSelect('destination_id', lookupsData.destination, 'destination_id', 'destination_name', '- Select Destination -')}
                </Field>
                
          
              </div>
            </fieldset>
          </div>
        );

      case 'vehicleassignment':
        return (
          <div style={{ padding: 18 }}>
            <fieldset style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 14, marginBottom: 18 }}>
              <legend style={{ fontSize: 12, fontWeight: 600, color: '#374151', padding: '0 6px', background: '#f3f4f6', borderRadius: 4 }}>
                Vehicle Assignment
              </legend>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <Field label="Plate No."  required error={errors.plate_no}>
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
                <Field label="Vehicle Type" required error={errors.vehicle_type_id}>
                  {renderSelect('vehicle_type_id', lookupsData.vh_types, 'vehicle_type_id', 'vehicle_type', '- Select Vehicle Type -')}
                </Field>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 34 }}>
                  <label style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>
                    Subcon
                  </label>
                  <input
                    type="checkbox"
                    disabled={viewOnly}
                    checked={companyOwned}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setCompanyOwned(checked);

                      if (!checked) {
                        setField('vendor_id', '');
                      }
                    }}
                  />
                </div>

                {companyOwned && (
                  <Field label="Subcon (Tracker)">
                    {renderSelect(
                      'vendor_id',
                      lookupsData.vendors,
                      'vendor_id',
                      'vendor_name',
                      '- Select Vendor -'
                    )}
                  </Field>
                )}

              </div>
            </fieldset>
          </div>
        );
      
      case 'fueltripallowance':
        return (
          <div style={{ padding: 18 }}>
            <fieldset style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 14, marginBottom: 18 }}>
              <legend style={{ fontSize: 12, fontWeight: 600, color: '#374151', padding: '0 6px', background: '#f3f4f6', borderRadius: 4 }}>
                Fuel and Trip Allowance
              </legend>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <Field label="Area" >
                  {renderInput('area', 'e.g. Pasig')}
                </Field>
                <Field label="Trip Allowance" >
                  {renderInput('trip_allowance', 'e.g. 1000')}
                </Field>
                <Field label="Fuel (L)" >
                  {renderInput('fuel', 'e.g. 50')}
                </Field>
                <Field label="Fuel Po." >
                  {renderInput('fuel_po', 'e.g. 12')}
                </Field>
                <Field label="Fuel Amount" >
                  {renderInput('fuel_amount', 'e.g. 100')}
                </Field>
              </div>
            </fieldset>
          </div>
        );

      case 'personnelassignment':
        return (
          <div style={{ padding: 18 }}>
            <fieldset style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 14, marginBottom: 18 }}>
              <legend style={{ fontSize: 12, fontWeight: 600, color: '#374151', padding: '0 6px', background: '#f3f4f6', borderRadius: 4 }}>
                Personnel Assignment
              </legend>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
                {renderPersonnelField('driver', 'Assigned Personnel - Driver')}
                {renderPersonnelField('helper1', 'Assigned Personnel - Helper 1')}
                {renderPersonnelField('helper2', 'Assigned Personnel - Helper 2')}
              </div>
            </fieldset>
          </div>
        );

      case 'references':
        return (
          <div style={{ padding: 18 }}>
            <fieldset style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 14, marginBottom: 18 }}>
              <legend style={{ fontSize: 12, fontWeight: 600, color: '#374151', padding: '0 6px', background: '#f3f4f6', borderRadius: 4 }}>
                References
              </legend>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <Field label="Client Reference No.">
                  {renderInput('client_ref_no', 'e.g. CL-12345')}
                </Field>
                <Field label="Other Reference No.">
                  {renderInput('other_ref_no', 'e.g. OTHER-12345')}
                </Field>
              </div>
              <Field label="Remarks">
                {renderTextarea('remarks', 'Additional notes…')}
              </Field>
            </fieldset>
          </div>
        );  

      case 'itemdetails':
        return (
          <div style={{ padding: 18 }}>
            <fieldset style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 14, marginBottom: 18 }}>
              <legend style={{ fontSize: 12, fontWeight: 600, color: '#374151', padding: '0 6px', background: '#f3f4f6', borderRadius: 4 }}>
                Item Details
              </legend>
              {(form.item_details || []).map((item, index) => (
                <div
                  key={`item-${index}`}
                  style={{
                    borderBottom: index < form.item_details.length - 1 ? '1px solid #e5e7eb' : 'none',
                    paddingBottom: 14,
                    marginBottom: 14,
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 10 }}>
                    Item {index + 1}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
                    <Field label="Item Type">
                      <select
                        disabled={viewOnly}
                        style={viewOnly ? readOnlyStyle : inputStyle}
                        value={item.item_type_id}
                        onChange={(e) => updateItem(index, 'item_type_id', e.target.value)}
                      >
                        <option value="">- Select Item -</option>
                        {(Array.isArray(lookupsData.item_types) ? lookupsData.item_types : []).map((option, optionIndex) => (
                          <option key={`${option.item_type_id}-${optionIndex}`} value={option.item_type_id ?? ''}>
                            {option.item_type || option.item_type_id}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Item Description">
                      <input
                        type="text"
                        disabled={viewOnly}
                        style={viewOnly ? readOnlyStyle : inputStyle}
                        value={item.item_description}
                        placeholder="e.g. High-quality item"
                        onChange={(e) => updateItem(index, 'item_description', e.target.value)}
                      />
                    </Field>
                    <Field label="Length (cm)">
                      <input
                        type="number"
                        disabled={viewOnly}
                        style={viewOnly ? readOnlyStyle : inputStyle}
                        value={item.length}
                        placeholder="e.g. 100"
                        onChange={(e) => updateItem(index, 'length', e.target.value)}
                      />
                    </Field>
                    <Field label="Width (cm)">
                      <input
                        type="number"
                        disabled={viewOnly}
                        style={viewOnly ? readOnlyStyle : inputStyle}
                        value={item.width}
                        placeholder="e.g. 100"
                        onChange={(e) => updateItem(index, 'width', e.target.value)}
                      />
                    </Field>
                    <Field label="Height (cm)">
                      <input
                        type="number"
                        disabled={viewOnly}
                        style={viewOnly ? readOnlyStyle : inputStyle}
                        value={item.height}
                        placeholder="e.g. 100"
                        onChange={(e) => updateItem(index, 'height', e.target.value)}
                      />
                    </Field>
                    <Field label="Weight (kg)">
                      <input
                        type="number"
                        disabled={viewOnly}
                        style={viewOnly ? readOnlyStyle : inputStyle}
                        value={item.weight}
                        placeholder="e.g. 100"
                        onChange={(e) => updateItem(index, 'weight', e.target.value)}
                      />
                    </Field>
                  </div>
                  {!viewOnly && (
                    <button
                      type="button"
                      className="btn btn-ghost"
                      disabled={!item.item_type_id || !String(item.weight || '').trim()}
                      onClick={() => addItem(index)}
                      style={{
                        color: '#fff',
                        background: item.item_type_id && String(item.weight || '').trim()
                          ? '#16a34a'
                          : '#166534',
                        borderColor: item.item_type_id && String(item.weight || '').trim()
                          ? '#16a34a'
                          : '#166534',
                        cursor: item.item_type_id && String(item.weight || '').trim()
                          ? 'pointer'
                          : 'not-allowed',
                        opacity: 1,
                      }}
                    >
                      + New Item
                    </button>
                  )}
                </div>
              ))}
            </fieldset>
          </div>
        );

      case 'bookingphotos':
        return (
          <div style={{ padding: 18 }}>
            <fieldset style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 14, marginBottom: 18 }}>
              <legend style={{ fontSize: 12, fontWeight: 600, color: '#374151', padding: '0 6px', background: '#f3f4f6', borderRadius: 4 }}>
                Booking Photos
              </legend>

              

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Photos</div>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => addAttachmentRow('bk_photos')}
                    style={{ fontSize: 12 }}
                  >
                    + Add Photo
                  </button>
                </div>

                {(form.bk_photos || []).map((photo, index) => (
                  <div key={`photo-${index}`} style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr auto', gap: 10, alignItems: 'end', marginBottom: 10 }}>
                    <Field label="Photo Name">
                      <input
                        type="text"
                        disabled={viewOnly}
                        style={viewOnly ? readOnlyStyle : inputStyle}
                        value={photo.photo_name}
                        placeholder="e.g. Front view"
                        onChange={(e) => updateAttachmentRow('bk_photos', index, 'photo_name', e.target.value)}
                      />
                    </Field>
                    <Field label="Photo Path / File Name">
                      <input
                        type="text"
                        disabled={viewOnly}
                        style={viewOnly ? readOnlyStyle : inputStyle}
                        value={photo.photo_path}
                        placeholder="e.g. uploads/front-view.jpg"
                        onChange={(e) => updateAttachmentRow('bk_photos', index, 'photo_path', e.target.value)}
                      />
                    </Field>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      disabled={viewOnly || (form.bk_photos || []).length === 1}
                      onClick={() => removeAttachmentRow('bk_photos', index)}
                      style={{ height: 34, alignSelf: 'flex-end' }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
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
              {viewOnly ? 'View Booking' : (editBooking ? 'Edit Booking' : 'New Booking')}
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
  