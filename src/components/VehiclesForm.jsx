import React, { useEffect, useState } from 'react';
import { X, Loader2, Save } from 'lucide-react';
import { personnelCrud, lookups } from '../services/api.js';
import { vehicleCrud } from '../services/api.js';

const TABS = [
  { key: 'vehicleinfo',      label: 'Vehicle Information' },
  { key: 'location',         label: 'Vehicle Location' },
  { key: 'specifications',    label: 'Vehicle Specifications' },
  { key: 'registration',  label: 'Registration and Compliance' },
  { key: 'insurance', label: 'Insurance' },
  { key: 'acquisition',   label: 'Acquisition and Condition' },
  { key: 'photoanddocuments', label: 'Photos and Documents' },
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
export default function VehiclesFormModal({ isOpen, onClose, onSaved, editVehicle, viewOnly }) {
  const [activeTab, setActiveTab] = useState('vehicleinfo');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ type: '', msg: '' });
  const [lookupsData, setLookupsData] = useState({
    depots: [],
    origins: [],
    vehicle_statuses: [],
    vh_types: [],
    vh_manufacturers: [],
    vh_models: [],
    commodity_type: [],
    category_types: [],
    vendors: [],
  });

  const blankForm = {
    // last_name: '', first_name: '', middle_name: '',
    // address: '', contact_number: '', email: '',
    // birthdate: '', gender: '', status: 'Active',
    // employment: {
    //   personnel_type_id: '', employment_type: 'Direct Hire', vendor_id: '',
    //   depot_id: '', employee_id_number: '', date_started: '', date_of_separation: '',
    //   reason_of_separation: '', bank_account: '', daily_rate: '', remarks: '',
    // },
    // benefits: { philhealth_no: '', sss_no: '', tin_no: '', pag_ibig_no: '' },
    // emergency: { contact_person: '', contact_number: '' },
    // license: { driver_license_no: '', license_expiry: '' },
    // dl_code_ids: [],

    vh_documents: [{ document_name: '', document_path: '' }],
    vh_photos: [{ photo_name: '', photo_path: '' }],
    // Vehicle information
    status_id: '',
    vehicle_type_id: '',
    vehicle_manufacturer_id: '',
    vehicle_model_id: '',
    commodity_type_id: '',
    year_model: '',
    plate_no: '',
    body_no: '',
    asset_no: '',
    category_type_id: '',
    
    // Vehicle locations
    origin_id: '',
    depot_id: '',
    vendor_id: '',
    GPS: '',

    // Vehicle specifications
    chassis_no: '',
    engine_no: '',
    engine_size: '',
    color: '',
    fuel_type: '',
    transmission: '',

    // Vehicle Registration and Compliance
    or_date: '',
    or_number: '',
    cr_date: '',
    cr_number: '',
    ltfrb_case_no: '',
    ltfrb_expiry: '',
    mv_file_no: '',
    pa_expiry: '',
    late_renewal_date: '',
    registration_type: '',
    registration_date: '',
    rfid_type: '',
    rfid_account_no: '',

    // Vehicle Insurance
    insurance_provider: '',
    insurance_policy_no: '',
    insurance_expiry: '',
    inland_marine_policy_no: '',
    inland_marine_expiry: '',

    // Vehicle Acquisition and Condition
    acquisition_date: '',
    acquisition_price: '',
    breakdown_date: '',
    breakdown_remarks: '',
    remarks: '',

    // Vehicle Photos and Documents

    
  };

  const [form, setForm] = useState(blankForm);
  const [companyOwned, setCompanyOwned] = useState(true);
  const [errors, setErrors] = useState({});

  const loadLookups = async () => {
    try {
      const [
        depots,
        origins,
        vehicleStatuses,
        vhTypes,
        vhManufacturers,
        vhModels,
        commodityTypes,
        categoryTypes,
        vendors,
      ] = await Promise.all([
        lookups.depots ? lookups.depots().catch(() => []) : Promise.resolve([]),
        lookups.origins ? lookups.origins().catch(() => []) : Promise.resolve([]),
        lookups.vehicle_statuses ? lookups.vehicle_statuses().catch(() => []) : Promise.resolve([]),
        lookups.vh_types ? lookups.vh_types().catch(() => []) : Promise.resolve([]),
        lookups.vh_manufacturers ? lookups.vh_manufacturers().catch(() => []) : Promise.resolve([]),
        lookups.vh_models ? lookups.vh_models().catch(() => []) : Promise.resolve([]),
        lookups.commodity_type ? lookups.commodity_type().catch(() => []) : Promise.resolve([]),
        lookups.category_types ? lookups.category_types().catch(() => []) : Promise.resolve([]),
        lookups.vendors ? lookups.vendors().catch(() => []) : Promise.resolve([]),
      ]);

      const normalize = (data) => (Array.isArray(data) ? data : (data?.data || []));

      setLookupsData({
        depots: normalize(depots),
        origins: normalize(origins),
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
      if (editVehicle) {
        setCompanyOwned(!editVehicle.vendor_id);
        if (editVehicle.vh_documents && editVehicle.vh_photos) {
          setForm({
            // last_name: editVehicle.last_name || '',
            // first_name: editVehicle.first_name || '',
            // middle_name: editVehicle.middle_name || '',
            // address: editVehicle.address || '',
            // contact_number: editVehicle.contact_number || '',
            // email: editVehicle.email || '',
            // birthdate: editVehicle.birthdate || '',
            // gender: editVehicle.gender || '',
            // status: editVehicle.status || 'Active',
            // employment: {
            //   personnel_type_id: editVehicle.personnel_type_id || editVehicle.employment?.personnel_type_id || '',
            //   employment_type: editVehicle.employment_type || editVehicle.employment?.employment_type || 'Direct Hire',
            //   vendor_id: editVehicle.vendor_id ?? (editVehicle.employment?.vendor_id ?? ''),
            //   depot_id: editVehicle.depot_id || editVehicle.employment?.depot_id || '',
            //   employee_id_number: editVehicle.employee_id_number || editVehicle.employment?.employee_id_number || '',
            //   date_started: editVehicle.date_started || editVehicle.employment?.date_started || '',
            //   date_of_separation: editVehicle.date_of_separation || editVehicle.employment?.date_of_separation || '',
            //   reason_of_separation: editVehicle.reason_of_separation || editVehicle.employment?.reason_of_separation || '',
            //   bank_account: editVehicle.bank_account || editVehicle.employment?.bank_account || '',
            //   daily_rate: editVehicle.daily_rate ?? (editVehicle.employment?.daily_rate ?? ''),
            //   remarks: editVehicle.remarks || editVehicle.employment?.remarks || '',
            // },
            // benefits: editVehicle.benefits || { philhealth_no: '', sss_no: '', tin_no: '', pag_ibig_no: '' },
            // emergency: editVehicle.emergency || { contact_person: '', contact_number: '' },
            // license: {
            //   driver_license_no: editVehicle.driver_license_no || editVehicle.license?.driver_license_no || '',
            //   license_expiry: editVehicle.license_expiry || editVehicle.license?.license_expiry || '',
            // },
            // dl_code_ids: editVehicle.dl_code_ids || [],
            vh_documents: Array.isArray(editVehicle.vh_documents) && editVehicle.vh_documents.length
              ? editVehicle.vh_documents.map(doc => ({
                  document_name: doc.document_name || '',
                  document_path: doc.document_path || '',
                }))
              : [{ document_name: '', document_path: '' }],
            vh_photos: Array.isArray(editVehicle.vh_photos) && editVehicle.vh_photos.length
              ? editVehicle.vh_photos.map(photo => ({
                  photo_name: photo.photo_name || '',
                  photo_path: photo.photo_path || '',
                }))
              : [{ photo_name: '', photo_path: '' }],
            // vehicle info
            status_id: editVehicle.status_id ?? editVehicle.vehicle_status_id ?? '',
            vehicle_type_id: editVehicle.vehicle_type_id ?? editVehicle.vh_types_id ?? '',
            vehicle_manufacturer_id: editVehicle.manufacturer_id ?? editVehicle.vehicle_manufacturer_id ?? '',
            vehicle_model_id: editVehicle.model_id ?? editVehicle.vehicle_model_id ?? '',
            commodity_type_id: editVehicle.commodity_type_id ?? editVehicle.commodity_type_id ?? '',
            year_model: editVehicle.year_model ?? '',
            plate_no: editVehicle.plate_no ?? '',
            body_no: editVehicle.body_no ?? '',
            asset_no: editVehicle.asset_no ?? '',
            category_type_id: editVehicle.category_type_id ?? '',
            vendor_id: editVehicle.vendor_id ?? '',
            //vehicle location

            origin_id: editVehicle.origin_id ?? '',
            depot_id: editVehicle.depot_id ?? '',
            GPS: editVehicle.GPS === null || editVehicle.GPS === undefined ? '' : String(editVehicle.GPS),

            //vehicle specfications
            chassis_no: editVehicle.chassis_no ?? '',
            engine_no: editVehicle.engine_no ?? '',
            engine_size: editVehicle.engine_size ?? '',
            color: editVehicle.color ?? '',
            fuel_type: editVehicle.fuel_type ?? editVehicle.fuel_type ?? '',
            transmission: editVehicle.transmission ?? editVehicle.transmission_type ?? '',

            // Vehicle Registration and Compliance
            or_date: editVehicle.or_date ?? '',
            or_number: editVehicle.or_number ?? '',
            cr_date: editVehicle.cr_date ?? '',
            cr_number: editVehicle.cr_number ?? '',
            ltfrb_case_no: editVehicle.ltfrb_case_no ?? '',
            ltfrb_expiry: editVehicle.ltfrb_expiry ?? '',
            mv_file_no: editVehicle.mv_file_no ?? '',
            pa_expiry: editVehicle.pa_expiry ?? '',
            late_renewal_date: editVehicle.late_renewal_date ?? '',
            registration_type: editVehicle.registration_type ?? '',
            registration_date: editVehicle.registration_date ?? '',
            rfid_type: editVehicle.rfid_type ?? '',
            rfid_account_no: editVehicle.rfid_account_no ?? '',
            
            // Vehicle Insurance
            insurance_provider: editVehicle.insurance_provider ?? '',
            insurance_policy_no: editVehicle.insurance_policy_no ?? '',
            insurance_expiry: editVehicle.insurance_expiry ?? '',
            inland_marine_policy_no: editVehicle.inland_marine_policy_no ?? '',
            inland_marine_expiry: editVehicle.inland_marine_expiry ?? '',

            // Vehicle Acquisition and Condition
            acquisition_date: editVehicle.acquisition_date ?? '',
            acquisition_price: editVehicle.acquisition_price ?? '',
            breakdown_date: editVehicle.breakdown_date ?? '',
            breakdown_remarks: editVehicle.breakdown_remarks ?? '',
            remarks: editVehicle.remarks ?? '',
          
          });

        } else {
          vehicleCrud.get(editVehicle.vehicle_id).then(full => {
            setForm({
              // last_name: full.last_name || '',
              // first_name: full.first_name || '',
              // middle_name: full.middle_name || '',
              // address: full.address || '',
              // contact_number: full.contact_number || '',
              // email: full.email || '',
              // birthdate: full.birthdate || '',
              // gender: full.gender || '',
              // status: full.status || 'Active',
              // employment: {
              //   personnel_type_id: full.personnel_type_id || full.employment?.personnel_type_id || '',
              //   employment_type: full.employment_type || full.employment?.employment_type || 'Direct Hire',
              //   vendor_id: full.vendor_id ?? (full.employment?.vendor_id ?? ''),
              //   depot_id: full.depot_id || full.employment?.depot_id || '',
              //   employee_id_number: full.employee_id_number || full.employment?.employee_id_number || '',
              //   date_started: full.date_started || full.employment?.date_started || '',
              //   date_of_separation: full.date_of_separation || full.employment?.date_of_separation || '',
              //   reason_of_separation: full.reason_of_separation || full.employment?.reason_of_separation || '',
              //   bank_account: full.bank_account || full.employment?.bank_account || '',
              //   daily_rate: full.daily_rate ?? (full.employment?.daily_rate ?? ''),
              //   remarks: full.remarks || full.employment?.remarks || '',
              // },
              // benefits: full.benefits || { philhealth_no: '', sss_no: '', tin_no: '', pag_ibig_no: '' },
              // emergency: full.emergency || { contact_person: '', contact_number: '' },
              // license: {
              //   driver_license_no: full.driver_license_no || full.license?.driver_license_no || '',
              //   license_expiry: full.license_expiry || full.license?.license_expiry || '',
              // },
              // dl_code_ids: full.dl_code_ids || [],
              vh_documents: Array.isArray(full.vh_documents) && full.vh_documents.length
                ? full.vh_documents.map(doc => ({
                    document_name: doc.document_name || '',
                    document_path: doc.document_path || '',
                  }))
                : [{ document_name: '', document_path: '' }],
              vh_photos: Array.isArray(full.vh_photos) && full.vh_photos.length
                ? full.vh_photos.map(photo => ({
                    photo_name: photo.photo_name || '',
                    photo_path: photo.photo_path || '',
                  }))
                : [{ photo_name: '', photo_path: '' }],
              vendor_id: full.vendor_id ?? '',
              // vehicle info
              status_id: full.status_id ?? full.vehicle_status_id ?? '',
              vehicle_type_id: full.vehicle_type_id ?? full.vh_types_id ?? '',
              vehicle_manufacturer_id: full.vehicle_manufacturer_id ?? full.manufacturer_id ?? '',
              vehicle_model_id: full.vehicle_model_id ?? full.model_id ?? '',
              commodity_type_id: full.commodity_type_id ?? full.commodity_type_id ?? '',
              year_model: full.year_model ?? '',
              plate_no: full.plate_no ?? '',
              body_no: full.body_no ?? '',
              asset_no: full.asset_no ?? '',
              category_type_id: full.category_type_id ?? '',

              //vehicle location
              origin_id: full.origin_id ?? '',
              depot_id: full.depot_id ?? '',
              GPS: full.GPS === null || full.GPS === undefined ? '' : String(full.GPS),

              //vehicle specfications
              chassis_no: full.chassis_no ?? '',
              engine_no: full.engine_no ?? '',
              engine_size: full.engine_size ?? '',
              color: full.color ?? '',
              fuel_type: full.fuel_type ?? full.fuel_type ?? '',
              transmission: full.transmission ?? full.transmission_type ?? '',

            // Vehicle Registration and Compliance
            or_date: full.or_date ?? '',
            or_number: full.or_number ?? '',
            cr_date: full.cr_date ?? '',
            cr_number: full.cr_number ?? '',
            ltfrb_case_no: full.ltfrb_case_no ?? '',
            ltfrb_expiry: full.ltfrb_expiry ?? '',
            mv_file_no: full.mv_file_no ?? '',
            pa_expiry: full.pa_expiry ?? '',
            late_renewal_date: full.late_renewal_date ?? '',
            registration_type: full.registration_type ?? '',
            registration_date: full.registration_date ?? '',
            rfid_type: full.rfid_type ?? '',
            rfid_account_no: full.rfid_account_no ?? '',

            // Vehicle Insurance
            insurance_provider: full.insurance_provider ?? '',
            insurance_policy_no: full.insurance_policy_no ?? '',
            insurance_expiry: full.insurance_expiry ?? '',
            inland_marine_policy_no: full.inland_marine_policy_no ?? '',
            inland_marine_expiry: full.inland_marine_expiry ?? '',

            // Vehicle Acquisition and Condition
            acquisition_date: full.acquisition_date ?? '',
            acquisition_price: full.acquisition_price ?? '',
            breakdown_date: full.breakdown_date ?? '',
            breakdown_remarks: full.breakdown_remarks ?? '',
            remarks: full.remarks ?? '',

            });
          }).catch(() => {});
        }
      } else {
        setForm(blankForm);
        setCompanyOwned(true);
        setActiveTab('vehicleinfo');
      }
      setErrors({});
      setToast({ type: '', msg: '' });
    }
  }, [isOpen, editVehicle]);

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
        // Vehicle information
        vehicle_info: {
          plate_no: form.plate_no.trim() || null,
          body_no: form.body_no.trim() || null,
          status_id: form.status_id ? Number(form.status_id) : null,
          vehicle_type_id: form.vehicle_type_id ? Number(form.vehicle_type_id) : null,
          vehicle_manufacturer_id: form.vehicle_manufacturer_id ? Number(form.vehicle_manufacturer_id) : null,
          vehicle_model_id: form.vehicle_model_id ? Number(form.vehicle_model_id) : null,
          year_model: form.year_model.trim() || null,
          commodity_type_id: form.commodity_type_id ? Number(form.commodity_type_id) : null,
          asset_no: form.asset_no.trim() || null,
          category_type_id: form.category_type_id ? Number(form.category_type_id) : null,
        },
        vehicle_location: {
          vendor_id: form.vendor_id ? Number(form.vendor_id) : null, 
          origin_id: form.origin_id ? Number(form.origin_id) : null,
          depot_id: form.depot_id ? Number(form.depot_id) : null,
          GPS: String(form.GPS ?? '').trim() || null,
        },
        vehicle_specifications: {
          chassis_no: form.chassis_no.trim() || null,
          color: form.color.trim() || null,
          engine_no: form.engine_no.trim() || null,
          engine_size: form.engine_size.trim() || null,
          fuel_type: form.fuel_type.trim() || null,
          transmission: form.transmission.trim() || null,
        },
        vehicle_regist_compli: {
          or_date: form.or_date.trim() || null,
          or_number: form.or_number.trim() || null,
          cr_date: form.cr_date.trim() || null,
          cr_number: form.cr_number.trim() || null,
          ltfrb_case_no: form.ltfrb_case_no.trim() || null,
          ltfrb_expiry: form.ltfrb_expiry.trim() || null,
          mv_file_no: form.mv_file_no.trim() || null,
          pa_expiry: form.pa_expiry.trim() || null,
          late_renewal_date: form.late_renewal_date.trim() || null,
          registration_type: form.registration_type.trim() || null,
          registration_date: form.registration_date.trim() || null,
          rfid_type: form.rfid_type.trim() || null,
          rfid_account_no: form.rfid_account_no.trim() || null,
        },
        vehicle_insurance: {
          insurance_provider: form.insurance_provider.trim() || null,
          insurance_policy_no: form.insurance_policy_no.trim() || null,
          insurance_expiry: form.insurance_expiry.trim() || null,
          inland_marine_policy_no: form.inland_marine_policy_no.trim() || null,
          inland_marine_expiry: form.inland_marine_expiry.trim() || null,
        },
        vehicle_acquisition: {
          acquisition_date: form.acquisition_date.trim() || null,
          acquisition_price: form.acquisition_price.trim() || null,
          breakdown_date: form.breakdown_date.trim() || null,
          breakdown_remarks: form.breakdown_remarks.trim() || null,
          remarks: form.remarks.trim() || null,
        },
        vh_documents: (form.vh_documents || [])
          .filter(row => row.document_name.trim() || row.document_path.trim())
          .map(row => ({
            document_name: row.document_name.trim() || null,
            document_path: row.document_path.trim() || null,
          })),
        vh_photos: (form.vh_photos || [])
          .filter(row => row.photo_name.trim() || row.photo_path.trim())
          .map(row => ({
            photo_name: row.photo_name.trim() || null,
            photo_path: row.photo_path.trim() || null,
          })),
      };

      let saved;
      if (editVehicle && editVehicle.vehicle_id) {
        saved = await vehicleCrud.update(editVehicle.vehicle_id, payload);
      } else {
        saved = await vehicleCrud.create(payload);
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

  const renderSelect = (path, options, valueKey, labelKey, placeholder, disabled = false) => {
    const v = path.split('.').reduce((o, k) => (o || {})[k], form) ?? '';
    const safeOptions = Array.isArray(options) ? options : [];

    return (
      <select
        disabled={viewOnly || disabled}
        style={viewOnly ? readOnlyStyle : inputStyle}
        value={v}
        onChange={(e) => setField(path, e.target.value)}
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

  // const selectedCodes = new Set(form.dl_code_ids.map(Number));
  // const toggleDLCode = (id) => {
  //   if (viewOnly) return;
  //   const nid = Number(id);
  //   setForm(prev => ({
  //     ...prev,
  //     dl_code_ids: selectedCodes.has(nid)
  //       ? prev.dl_code_ids.filter(c => Number(c) !== nid)
  //       : [...prev.dl_code_ids, nid],
  //   }));
  // };

  const renderTab = () => {
    switch (activeTab) {
      // case 'info':
      //   return (
      //     <div style={{ padding: 18 }}>
      //       <fieldset style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 14, marginBottom: 18 }}>
      //         <legend style={{ fontSize: 12, fontWeight: 600, color: '#374151', padding: '0 6px', background: '#f3f4f6', borderRadius: 4 }}>
      //           Personnel Information
      //         </legend>
      //         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 14 }}>
      //           <Field label="Last Name" required error={errors.last_name}>
      //             {renderInput('last_name', 'e.g. Cruz')}
      //           </Field>
      //           <Field label="First Name" required error={errors.first_name}>
      //             {renderInput('first_name', 'e.g. Patricia Diane')}
      //           </Field>
      //           <Field label="Middle Name">
      //             {renderInput('middle_name', 'e.g. Ruiz')}
      //           </Field>
      //         </div>
      //         <div style={{ marginBottom: 14 }}>
      //           <Field label="Home Address">
      //             {renderTextarea('address', 'e.g. 123 Main St., Barangay, City')}
      //           </Field>
      //         </div>
      //         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
      //           <Field label="Contact Number">
      //             {renderInput('contact_number', 'e.g. 0923-245-2314')}
      //           </Field>
      //           <Field label="Email Address">
      //             {renderInput('email', 'e.g. example@email.com', 'email')}
      //           </Field>
      //         </div>
      //         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
      //           <Field label="Birthdate">
      //             {renderInput('birthdate', '', 'date')}
      //           </Field>
      //           <Field label="Gender">
      //             <div style={{ display: 'flex', gap: 18, alignItems: 'center', padding: '6px 0' }}>
      //               {['Male', 'Female'].map(g => (
      //                 <label key={g} style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, cursor: viewOnly ? 'default' : 'pointer' }}>
      //                   <input
      //                     type="radio"
      //                     name="gender"
      //                     disabled={viewOnly}
      //                     checked={form.gender === g}
      //                     onChange={() => setField('gender', g)}
      //                   /> {g}
      //                 </label>
      //               ))}
      //             </div>
      //           </Field>
      //           <Field label="Status" required error={errors.status}>
      //             <div style={{ display: 'flex', gap: 18, alignItems: 'center', padding: '6px 0' }}>
      //               {['Active', 'Inactive'].map(s => (
      //                 <label key={s} style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, cursor: viewOnly ? 'default' : 'pointer' }}>
      //                   <input
      //                     type="radio"
      //                     name="status"
      //                     disabled={viewOnly}
      //                     checked={form.status === s}
      //                     onChange={() => setField('status', s)}
      //                   /> {s}
      //                 </label>
      //               ))}
      //             </div>
      //           </Field>
      //         </div>
      //       </fieldset>
      //     </div>
      //   );

      case 'vehicleinfo':
        return (
          <div style={{ padding: 18 }}>
            <fieldset style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 14, marginBottom: 18 }}>
              <legend style={{ fontSize: 12, fontWeight: 600, color: '#374151', padding: '0 6px', background: '#f3f4f6', borderRadius: 4 }}>
                Vehicle Information
              </legend>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <Field label="Plate No." required error={errors.plate_no}>
                  {renderInput('plate_no', 'e.g. ABC-123')}
                </Field>
                <Field label="Body No." required error={errors.body_no}>
                  {renderInput('body_no', 'e.g. 456789')}
                </Field>
                <Field label="Status" required error={errors.status_id}>
                  {renderSelect('status_id', lookupsData.vehicle_statuses, 'status_id', 'status_name', '- Select Status -')}
                </Field>
                <Field label="Vehicle Type" required error={errors.vehicle_type_id}>
                  {renderSelect('vehicle_type_id', lookupsData.vh_types, 'vehicle_type_id', 'vehicle_type', '- Select Vehicle Type -')}
                </Field>
                <Field label="Maker/Manufacturer" required error={errors.vehicle_manufacturer_id}>
                  {renderSelect('vehicle_manufacturer_id', lookupsData.vh_manufacturers, 'vehicle_manufacturer_id', 'vehicle_manufacturer', '- Select Manufacturer -')}
                </Field>
                <Field label="Model" required error={errors.vehicle_model_id}>
                  {renderSelect('vehicle_model_id', lookupsData.vh_models, 'vehicle_model_id', 'vehicle_model', '- Select Model -')}
                </Field>
                <Field label="Year">
                  {renderInput('year_model', 'e.g. 2020')}
                </Field>
                <Field label="Commodity">
                  {renderSelect('commodity_type_id', lookupsData.commodity_type, 'commodity_type_id', 'commodity_type', '- Select Commodity -')}
                </Field>
                <Field label="Asset No.">
                  {renderInput('asset_no', 'e.g. 123456')}
                </Field>
                <Field label="Category Type">
                  {renderSelect('category_type_id', lookupsData.category_types, 'category_type_id', 'category_type', '- Select Category Type -')}
                </Field> 
                
              </div>
            </fieldset>
          </div>
        );

      case 'location':
        return (
          <div style={{ padding: 18 }}>
            <fieldset style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 14, marginBottom: 18 }}>
              <legend style={{ fontSize: 12, fontWeight: 600, color: '#374151', padding: '0 6px', background: '#f3f4f6', borderRadius: 4 }}>
                Vehicle Location
              </legend>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 34 }}>
                  <label style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>
                    Company Owned?
                  </label>
                  <input
                    type="checkbox"
                    disabled={viewOnly}
                    checked={companyOwned}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setCompanyOwned(checked);

                      if (checked) {
                        setField('vendor_id', '');
                      }
                    }}
                  />
                </div>

                {!companyOwned && (
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
                <Field label="Origin">
                  {renderSelect('origin_id', lookupsData.origins, 'origin_id', 'origin_name', '- Select Origin -')}
                </Field>
                <Field label="Depot">
                  {renderSelect('depot_id', lookupsData.depots, 'depot_id', 'depot_name', '- Select Depot -')}
                </Field>
                <Field label="With GPS?">
                  {renderSelect('GPS', [{ value: '1', label: 'Yes' }, { value: '0', label: 'No' }], 'value', 'label', '- Select -')}
                </Field>
              </div>
            </fieldset>
          </div>
        );
      
      case 'specifications':
        return (
          <div style={{ padding: 18 }}>
            <fieldset style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 14, marginBottom: 18 }}>
              <legend style={{ fontSize: 12, fontWeight: 600, color: '#374151', padding: '0 6px', background: '#f3f4f6', borderRadius: 4 }}>
                Vehicle Specifications
              </legend>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <Field label="Chassis No." >
                  {renderInput('chassis_no', 'e.g. ABC123')}
                </Field>
                <Field label="Color" >
                  {renderInput('color', 'e.g. Red')}
                </Field>
                <Field label="Engine No." >
                  {renderInput('engine_no', 'e.g. 123456789')}
                </Field>
                <Field label="Engine Size" >
                  {renderInput('engine_size', 'e.g. 2.0L')}
                </Field>
                <Field label="Fuel Type" >
                  {renderSelect('fuel_type', [{
                    value: 'Gasoline', label: 'Gasoline'},
                    { value: 'Diesel', label: 'Diesel'}],
                    'value', 'label', '- Select Fuel Type -')}
                </Field>
                <Field label="Transmission">
                  {renderSelect('transmission', [{ 
                    value: 'Automatic', label: 'Automatic' }, 
                    { value: 'Manual', label: 'Manual' }], 
                    'value', 'label', '- Select Transmission -')}
                </Field>
              </div>
            </fieldset>
          </div>
        );

      case 'registration':
        return (
          <div style={{ padding: 18 }}>
            <fieldset style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 14, marginBottom: 18 }}>
              <legend style={{ fontSize: 12, fontWeight: 600, color: '#374151', padding: '0 6px', background: '#f3f4f6', borderRadius: 4 }}>
                Vehicle Specifications
              </legend>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <Field label="OR Date">
                  {renderInput('or_date', '', 'date')}
                </Field>
                <Field label="OR Number">
                  {renderInput('or_number', 'e.g. OR-12345')}
                </Field>
                <Field label="CR Date">
                  {renderInput('cr_date', '', 'date')}
                </Field>
                <Field label="CR Number">
                  {renderInput('cr_number', 'e.g. CR-12345')}
                </Field>
                <Field label="LTFRB Case No.">
                  {renderInput('ltfrb_case_no', 'e.g. LTFRB-12345')}
                </Field>
                <Field label="LTFRB Expiry Date">
                  {renderInput('ltfrb_expiry', '', 'date')}
                </Field>
                <Field label="M.V. File No.">
                  {renderInput('mv_file_no', 'e.g. MV-12345')}
                </Field>
                <Field label="P.A. Expiry Date">
                  {renderInput('pa_expiry', '', 'date')}
                </Field>
                <Field label="Late Renewal Date">
                  {renderInput('late_renewal_date', '', 'date')}
                </Field>
                <Field label="Registration Type">
                  {renderSelect('registration_type', [{ value: 'For hire', label: 'For hire' }, { value: 'Private', label: 'Private' }], 'value', 'label', '- Select Registration Type -')}
                </Field>
                <Field label="Registration Date">
                  {renderInput('registration_date', '', 'date')}
                </Field>
                <Field label="RFID Type">
                  {renderSelect('rfid_type', [{ value: 'Auto Sweep', label: 'Auto Sweep' }, { value: 'Easy Trip', label: 'Easy Trip' }, {value: 'None', label: 'None' }], 'value', 'label', '- Select RFID Type -')}
                </Field>
                <Field label="RFID Account No.">
                  {renderInput('rfid_account_no', 'e.g. RFID-12345')}
                </Field>
              </div>
            </fieldset>
          </div>
        );

      case 'insurance':
        return (
          <div style={{ padding: 18 }}>
            <fieldset style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 14, marginBottom: 18 }}>
              <legend style={{ fontSize: 12, fontWeight: 600, color: '#374151', padding: '0 6px', background: '#f3f4f6', borderRadius: 4 }}>
                Vehicle Specifications
              </legend>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <Field label="Insurance Provider">
                  {renderInput('insurance_provider', 'e.g. ABC Insurance')}
                </Field>
                <Field label="Insurance Policy No.">
                  {renderInput('insurance_policy_no', 'e.g. INS-12345')}
                </Field>
                <Field label="Insurance Expiry Date">
                  {renderInput('insurance_expiry', '', 'date')}
                </Field>
                <Field label="Inland Marine Policy No.">
                  {renderInput('inland_marine_policy_no', 'e.g. IMP-12345')}
                </Field>
                <Field label="Inland Marine Expiry Date">
                  {renderInput('inland_marine_expiry', '', 'date')}
                </Field>
              </div>
            </fieldset>
          </div>
        );  

      case 'acquisition':
        return (
          <div style={{ padding: 18 }}>
            <fieldset style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 14, marginBottom: 18 }}>
              <legend style={{ fontSize: 12, fontWeight: 600, color: '#374151', padding: '0 6px', background: '#f3f4f6', borderRadius: 4 }}>
                Vehicle Specifications
              </legend>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <Field label="Acquisition Date">
                  {renderInput('acquisition_date', '', 'date')}
                </Field>
                <Field label="Acquisition Price">
                  {renderInput('acquisition_price', 'e.g. 1000000', 'number')}
                </Field>
                <Field label="Breakdown Date">
                  {renderInput('breakdown_date', '', 'date')}
                </Field>
                <Field label="Breakdown Remarks">
                  {renderTextarea('breakdown_remarks', 'e.g. Engine failure')}
                </Field>
                <Field label="Remarks">
                  {renderTextarea('remarks', 'Additional notes…')}
                </Field>
              </div>
            </fieldset>
          </div>
        );

      case 'photoanddocuments':
        return (
          <div style={{ padding: 18 }}>
            <fieldset style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 14, marginBottom: 18 }}>
              <legend style={{ fontSize: 12, fontWeight: 600, color: '#374151', padding: '0 6px', background: '#f3f4f6', borderRadius: 4 }}>
                Photos and Documents
              </legend>

              <div style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Documents</div>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => addAttachmentRow('vh_documents')}
                    style={{ fontSize: 12 }}
                  >
                    + Add Document
                  </button>
                </div>

                {(form.vh_documents || []).map((doc, index) => (
                  <div key={`doc-${index}`} style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr auto', gap: 10, alignItems: 'end', marginBottom: 10 }}>
                    <Field label="Document Name">
                      <input
                        type="text"
                        disabled={viewOnly}
                        style={viewOnly ? readOnlyStyle : inputStyle}
                        value={doc.document_name}
                        placeholder="e.g. OR copy"
                        onChange={(e) => updateAttachmentRow('vh_documents', index, 'document_name', e.target.value)}
                      />
                    </Field>
                    <Field label="Document Path / File Name">
                      <input
                        type="text"
                        disabled={viewOnly}
                        style={viewOnly ? readOnlyStyle : inputStyle}
                        value={doc.document_path}
                        placeholder="e.g. uploads/or-copy.pdf"
                        onChange={(e) => updateAttachmentRow('vh_documents', index, 'document_path', e.target.value)}
                      />
                    </Field>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      disabled={viewOnly || (form.vh_documents || []).length === 1}
                      onClick={() => removeAttachmentRow('vh_documents', index)}
                      style={{ height: 34, alignSelf: 'flex-end' }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Photos</div>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => addAttachmentRow('vh_photos')}
                    style={{ fontSize: 12 }}
                  >
                    + Add Photo
                  </button>
                </div>

                {(form.vh_photos || []).map((photo, index) => (
                  <div key={`photo-${index}`} style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr auto', gap: 10, alignItems: 'end', marginBottom: 10 }}>
                    <Field label="Photo Name">
                      <input
                        type="text"
                        disabled={viewOnly}
                        style={viewOnly ? readOnlyStyle : inputStyle}
                        value={photo.photo_name}
                        placeholder="e.g. Front view"
                        onChange={(e) => updateAttachmentRow('vh_photos', index, 'photo_name', e.target.value)}
                      />
                    </Field>
                    <Field label="Photo Path / File Name">
                      <input
                        type="text"
                        disabled={viewOnly}
                        style={viewOnly ? readOnlyStyle : inputStyle}
                        value={photo.photo_path}
                        placeholder="e.g. uploads/front-view.jpg"
                        onChange={(e) => updateAttachmentRow('vh_photos', index, 'photo_path', e.target.value)}
                      />
                    </Field>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      disabled={viewOnly || (form.vh_photos || []).length === 1}
                      onClick={() => removeAttachmentRow('vh_photos', index)}
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
        
      // case 'employ':
      //   return (
      //     <div style={{ padding: 18 }}>
      //       <fieldset style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 14, marginBottom: 18 }}>
      //         <legend style={{ fontSize: 12, fontWeight: 600, color: '#374151', padding: '0 6px', background: '#f3f4f6', borderRadius: 4 }}>
      //           Employment Details
      //         </legend>
      //         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
      //           <Field label="Personnel Type" required error={errors['employment.personnel_type_id']}>
      //             {renderSelect('employment.personnel_type_id', lookupsData.personnelTypes,
      //               'personnel_type_id', 'personnel_type', '- Select Personnel Type -')}
      //           </Field>
      //           <Field label="Employment Type" required error={errors['employment.employment_type']}>
      //             <div style={{ display: 'flex', gap: 18, alignItems: 'center', padding: '6px 0' }}>
      //               {['Direct Hire', 'Outsourced'].map(t => (
      //                 <label key={t} style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, cursor: viewOnly ? 'default' : 'pointer' }}>
      //                   <input
      //                     type="radio"
      //                     name="employment_type"
      //                     disabled={viewOnly}
      //                     checked={form.employment.employment_type === t}
      //                     onChange={() => setField('employment.employment_type', t)}
      //                   /> {t}
      //                 </label>
      //               ))}
      //             </div>
      //           </Field>
      //         </div>
      //         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
      //           <Field label="Employee ID">
      //             {renderInput('employment.employee_id_number', 'e.g. 12345')}
      //           </Field>
      //           <Field label="Depot" required error={errors['employment.depot_id']}>
      //             {renderSelect('employment.depot_id', lookupsData.depots,
      //               'depot_id', 'depot_name', '- Select Depot -')}
      //           </Field>
      //         </div>
      //         {form.employment.employment_type === 'Outsourced' && (
      //           <div style={{ marginBottom: 14 }}>
      //             <Field label="Vendor">
      //               {renderSelect('employment.vendor_id', lookupsData.vendors,
      //                 'vendor_id', 'vendor_name', '- Select Vendor -')}
      //             </Field>
      //           </div>
      //         )}
      //         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
      //           <Field label="Date Started">
      //             {renderInput('employment.date_started', '', 'date')}
      //           </Field>
      //           <Field label="Date of Separation">
      //             {renderInput('employment.date_of_separation', '', 'date')}
      //           </Field>
      //         </div>
      //         <div style={{ marginBottom: 14 }}>
      //           <Field label="Reason of Separation">
      //             {renderTextarea('employment.reason_of_separation', 'e.g. Resigned')}
      //           </Field>
      //         </div>
      //         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
      //           <Field label="Bank Account">
      //             {renderInput('employment.bank_account', 'e.g. 1234 5678 9012')}
      //           </Field>
      //           <Field label="Daily Rate">
      //             {renderInput('employment.daily_rate', 'e.g. 750.00', 'number')}
      //           </Field>
      //         </div>
      //         <div>
      //           <Field label="Remarks">
      //             {renderTextarea('employment.remarks', 'Additional notes…')}
      //           </Field>
      //         </div>
      //       </fieldset>
      //     </div>
      //   );

      // case 'benefits':
      //   return (
      //     <div style={{ padding: 18 }}>
      //       <fieldset style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 14 }}>
      //         <legend style={{ fontSize: 12, fontWeight: 600, color: '#374151', padding: '0 6px', background: '#f3f4f6', borderRadius: 4 }}>
      //           Benefits
      //         </legend>
      //         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
      //           <Field label="Philhealth No.">
      //             {renderInput('benefits.philhealth_no', 'e.g. 123456789012')}
      //           </Field>
      //           <Field label="SSS No.">
      //             {renderInput('benefits.sss_no', 'e.g. 12-3456789-0')}
      //           </Field>
      //           <Field label="TIN No.">
      //             {renderInput('benefits.tin_no', 'e.g. 123-456-789-000')}
      //           </Field>
      //           <Field label="Pag-IBIG No.">
      //             {renderInput('benefits.pag_ibig_no', 'e.g. 1234-5678-9012')}
      //           </Field>
      //         </div>
      //       </fieldset>
      //     </div>
      //   );

      // case 'emergency':
      //   return (
      //     <div style={{ padding: 18 }}>
      //       <fieldset style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 14 }}>
      //         <legend style={{ fontSize: 12, fontWeight: 600, color: '#374151', padding: '0 6px', background: '#f3f4f6', borderRadius: 4 }}>
      //           Emergency Contact
      //         </legend>
      //         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
      //           <Field label="Contact Person Name">
      //             {renderInput('emergency.contact_person', 'e.g. Pineda, Karl Louis M.')}
      //           </Field>
      //           <Field label="Contact Number">
      //             {renderInput('emergency.contact_number', 'e.g. 0968-234-2345')}
      //           </Field>
      //         </div>
      //       </fieldset>
      //     </div>
      //   );

      // case 'license':
      //   return (
      //     <div style={{ padding: 18 }}>
      //       <fieldset style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 14 }}>
      //         <legend style={{ fontSize: 12, fontWeight: 600, color: '#374151', padding: '0 6px', background: '#f3f4f6', borderRadius: 4 }}>
      //           License
      //         </legend>
      //         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
      //           <Field label="Driver License No.">
      //             {renderInput('license.driver_license_no', 'e.g. A123-4567-890123')}
      //           </Field>
      //           <Field label="License Expiry">
      //             {renderInput('license.license_expiry', '', 'date')}
      //           </Field>
      //         </div>
      //         <div style={{ marginTop: 12, fontSize: 12, color: '#6b7280' }}>
      //           💡 Go to the <b>DL Codes</b> tab to select the applicable Driver's License restriction codes (A, B, B2, etc.).
      //         </div>
      //       </fieldset>
      //     </div>
      //   );

      // case 'dlcodes':
      //   return (
      //     <div style={{ padding: 18 }}>
      //       <fieldset style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 14 }}>
      //         <legend style={{ fontSize: 12, fontWeight: 600, color: '#374151', padding: '0 6px', background: '#f3f4f6', borderRadius: 4 }}>
      //           Driver's License Restriction Codes
      //         </legend>
      //         {lookupsData.dlCodes.length === 0 && (
      //           <div style={{ fontSize: 13, color: '#6b7280', padding: '8px 0' }}>
      //             No DL Codes configured. Add them in Settings first.
      //           </div>
      //         )}
      //         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
      //           {lookupsData.dlCodes.map(dc => {
      //             const checked = selectedCodes.has(Number(dc.dl_code_id));
      //             return (
      //               <label
      //                 key={dc.dl_code_id}
      //                 style={{
      //                   display: 'flex', alignItems: 'center', gap: 8,
      //                   padding: '10px 12px', border: checked ? '2px solid #1d4ed8' : '1px solid #e5e7eb',
      //                   borderRadius: 6, background: checked ? '#eff6ff' : '#fff',
      //                   cursor: viewOnly ? 'default' : 'pointer', fontSize: 13,
      //                 }}
      //               >
      //                 <input
      //                   type="checkbox"
      //                   disabled={viewOnly}
      //                   checked={checked}
      //                   onChange={() => toggleDLCode(dc.dl_code_id)}
      //                 />
      //                 <div>
      //                   <div style={{ fontWeight: 600 }}>{dc.dl_code}</div>
      //                   {dc.description && <div style={{ fontSize: 11, color: '#6b7280' }}>{dc.description}</div>}
      //                 </div>
      //               </label>
      //             );
      //           })}
      //         </div>
      //       </fieldset>
      //     </div>
      //   );

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
              {viewOnly ? 'View Vehicle' : (editVehicle ? 'Edit Vehicle' : 'New Vehicle')}
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
  