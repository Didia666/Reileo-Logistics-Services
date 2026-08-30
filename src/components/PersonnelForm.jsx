import React, { useEffect, useState } from 'react';
import { X, Loader2, Save } from 'lucide-react';
import { personnelCrud, lookups } from '../services/api.js';

const TABS = [
  { key: 'info',      label: 'Personnel Information' },
  { key: 'employ',    label: 'Employment Details' },
  { key: 'benefits',  label: 'Benefits' },
  { key: 'emergency', label: 'Emergency Contact' },
  { key: 'license',   label: 'License' },
  { key: 'dlcodes',   label: 'DL Codes' },
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

export default function PersonnelFormModal({ isOpen, onClose, onSaved, editPersonnel, viewOnly }) {
  const [activeTab, setActiveTab] = useState('info');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ type: '', msg: '' });
  const [lookupsData, setLookupsData] = useState({
    personnelTypes: [],
    depots: [],
    vendors: [],
    dlCodes: [],
  });

  const blankForm = {
    last_name: '', first_name: '', middle_name: '',
    address: '', contact_number: '', email: '',
    birthdate: '', gender: '', status: 'Active',
    employment: {
      personnel_type_id: '', employment_type: 'Direct Hire', vendor_id: '',
      depot_id: '', employee_id_number: '', date_started: '', date_of_separation: '',
      reason_of_separation: '', bank_account: '', daily_rate: '', remarks: '',
    },
    benefits: { philhealth_no: '', sss_no: '', tin_no: '', pag_ibig_no: '' },
    emergency: { contact_person: '', contact_number: '' },
    license: { driver_license_no: '', license_expiry: '' },
    dl_code_ids: [],
  };

  const [form, setForm] = useState(blankForm);
  const [errors, setErrors] = useState({});

  const loadLookups = async () => {
    try {
      const [types, depots, vendors, dlCodes] = await Promise.all([
        fetch('/api/p_types.php', { credentials: 'include' })
          .then(r => r.ok ? r.json() : []).catch(() => []),
        lookups.depots ? lookups.depots().catch(() => []) : Promise.resolve([]),
        lookups.vendors ? lookups.vendors().catch(() => []) : Promise.resolve([]),
        fetch('/api/settings_crud_handler.php?type=dl_codes', { credentials: 'include' })
          .then(r => r.ok ? r.json() : []).catch(() => []),
      ]);
      setLookupsData({
        personnelTypes: Array.isArray(types) ? types : (types?.data || []),
        depots: Array.isArray(depots) ? depots : (depots?.data || []),
        vendors: Array.isArray(vendors) ? vendors : (vendors?.data || []),
        dlCodes: Array.isArray(dlCodes) ? dlCodes : (dlCodes?.data || []),
      });
    } catch {
      /* no-op */
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadLookups();
      if (editPersonnel) {
        if (editPersonnel.benefits || editPersonnel.emergency || editPersonnel.dl_code_ids) {
          setForm({
            last_name: editPersonnel.last_name || '',
            first_name: editPersonnel.first_name || '',
            middle_name: editPersonnel.middle_name || '',
            address: editPersonnel.address || '',
            contact_number: editPersonnel.contact_number || '',
            email: editPersonnel.email || '',
            birthdate: editPersonnel.birthdate || '',
            gender: editPersonnel.gender || '',
            status: editPersonnel.status || 'Active',
            employment: {
              personnel_type_id: editPersonnel.personnel_type_id || editPersonnel.employment?.personnel_type_id || '',
              employment_type: editPersonnel.employment_type || editPersonnel.employment?.employment_type || 'Direct Hire',
              vendor_id: editPersonnel.vendor_id ?? (editPersonnel.employment?.vendor_id ?? ''),
              depot_id: editPersonnel.depot_id || editPersonnel.employment?.depot_id || '',
              employee_id_number: editPersonnel.employee_id_number || editPersonnel.employment?.employee_id_number || '',
              date_started: editPersonnel.date_started || editPersonnel.employment?.date_started || '',
              date_of_separation: editPersonnel.date_of_separation || editPersonnel.employment?.date_of_separation || '',
              reason_of_separation: editPersonnel.reason_of_separation || editPersonnel.employment?.reason_of_separation || '',
              bank_account: editPersonnel.bank_account || editPersonnel.employment?.bank_account || '',
              daily_rate: editPersonnel.daily_rate ?? (editPersonnel.employment?.daily_rate ?? ''),
              remarks: editPersonnel.remarks || editPersonnel.employment?.remarks || '',
            },
            benefits: editPersonnel.benefits || { philhealth_no: '', sss_no: '', tin_no: '', pag_ibig_no: '' },
            emergency: editPersonnel.emergency || { contact_person: '', contact_number: '' },
            license: {
              driver_license_no: editPersonnel.driver_license_no || editPersonnel.license?.driver_license_no || '',
              license_expiry: editPersonnel.license_expiry || editPersonnel.license?.license_expiry || '',
            },
            dl_code_ids: editPersonnel.dl_code_ids || [],
          });
        } else {
          personnelCrud.get(editPersonnel.personnel_id).then(full => {
            setForm({
              last_name: full.last_name || '',
              first_name: full.first_name || '',
              middle_name: full.middle_name || '',
              address: full.address || '',
              contact_number: full.contact_number || '',
              email: full.email || '',
              birthdate: full.birthdate || '',
              gender: full.gender || '',
              status: full.status || 'Active',
              employment: {
                personnel_type_id: full.personnel_type_id || full.employment?.personnel_type_id || '',
                employment_type: full.employment_type || full.employment?.employment_type || 'Direct Hire',
                vendor_id: full.vendor_id ?? (full.employment?.vendor_id ?? ''),
                depot_id: full.depot_id || full.employment?.depot_id || '',
                employee_id_number: full.employee_id_number || full.employment?.employee_id_number || '',
                date_started: full.date_started || full.employment?.date_started || '',
                date_of_separation: full.date_of_separation || full.employment?.date_of_separation || '',
                reason_of_separation: full.reason_of_separation || full.employment?.reason_of_separation || '',
                bank_account: full.bank_account || full.employment?.bank_account || '',
                daily_rate: full.daily_rate ?? (full.employment?.daily_rate ?? ''),
                remarks: full.remarks || full.employment?.remarks || '',
              },
              benefits: full.benefits || { philhealth_no: '', sss_no: '', tin_no: '', pag_ibig_no: '' },
              emergency: full.emergency || { contact_person: '', contact_number: '' },
              license: {
                driver_license_no: full.driver_license_no || full.license?.driver_license_no || '',
                license_expiry: full.license_expiry || full.license?.license_expiry || '',
              },
              dl_code_ids: full.dl_code_ids || [],
            });
          }).catch(() => {});
        }
      } else {
        setForm(blankForm);
        setActiveTab('info');
      }
      setErrors({});
      setToast({ type: '', msg: '' });
    }
  }, [isOpen, editPersonnel]);

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
    if (!form.last_name.trim())  errs.last_name  = 'Required';
    if (!form.first_name.trim()) errs.first_name = 'Required';
    if (!form.status)            errs.status     = 'Required';
    if (!form.employment.personnel_type_id) errs['employment.personnel_type_id'] = 'Required';
    if (!form.employment.depot_id)          errs['employment.depot_id']          = 'Required';
    if (!form.employment.employment_type)   errs['employment.employment_type']   = 'Required';
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
        last_name: form.last_name.trim(),
        first_name: form.first_name.trim(),
        middle_name: form.middle_name.trim(),
        address: form.address.trim() || null,
        contact_number: form.contact_number.trim() || null,
        email: form.email.trim() || null,
        birthdate: form.birthdate || null,
        gender: form.gender || null,
        status: form.status,
        employment: {
          personnel_type_id: form.employment.personnel_type_id ? Number(form.employment.personnel_type_id) : null,
          employment_type: form.employment.employment_type,
          vendor_id: form.employment.vendor_id ? Number(form.employment.vendor_id) : null,
          depot_id: form.employment.depot_id ? Number(form.employment.depot_id) : null,
          employee_id_number: form.employment.employee_id_number.trim() || null,
          date_started: form.employment.date_started || null,
          date_of_separation: form.employment.date_of_separation || null,
          reason_of_separation: form.employment.reason_of_separation.trim() || null,
          bank_account: form.employment.bank_account.trim() || null,
          daily_rate: form.employment.daily_rate !== '' ? Number(form.employment.daily_rate) : 0,
          remarks: form.employment.remarks.trim() || null,
        },
        benefits: {
          philhealth_no: form.benefits.philhealth_no.trim() || null,
          sss_no:        form.benefits.sss_no.trim()        || null,
          tin_no:        form.benefits.tin_no.trim()        || null,
          pag_ibig_no:    form.benefits.pag_ibig_no.trim()    || null,
        },
        emergency: {
          contact_person: form.emergency.contact_person.trim() || null,
          contact_number: form.emergency.contact_number.trim() || null,
        },
        license: {
          driver_license_no: form.license.driver_license_no.trim() || null,
          license_expiry:    form.license.license_expiry         || null,
        },
        dl_code_ids: form.dl_code_ids.map(Number).filter(n => n > 0),
      };

      let saved;
      if (editPersonnel && editPersonnel.personnel_id) {
        saved = await personnelCrud.update(editPersonnel.personnel_id, payload);
      } else {
        saved = await personnelCrud.create(payload);
      }
      setToast({ type: 'success', msg: 'Personnel saved successfully.' });
      setTimeout(() => {
        onSaved(saved);
        onClose();
      }, 800);
    } catch (e) {
      setToast({ type: 'error', msg: e.message || 'Failed to save personnel.' });
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
    return (
      <select
        disabled={viewOnly || disabled}
        style={viewOnly ? readOnlyStyle : inputStyle}
        value={v}
        onChange={(e) => setField(path, e.target.value)}
      >
        <option value="">{placeholder || '- Select -'}</option>
        {options.map(o => (
          <option key={o[valueKey]} value={o[valueKey]}>{o[labelKey]}</option>
        ))}
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

  const selectedCodes = new Set(form.dl_code_ids.map(Number));
  const toggleDLCode = (id) => {
    if (viewOnly) return;
    const nid = Number(id);
    setForm(prev => ({
      ...prev,
      dl_code_ids: selectedCodes.has(nid)
        ? prev.dl_code_ids.filter(c => Number(c) !== nid)
        : [...prev.dl_code_ids, nid],
    }));
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'info':
        return (
          <div style={{ padding: 18 }}>
            <fieldset style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 14, marginBottom: 18 }}>
              <legend style={{ fontSize: 12, fontWeight: 600, color: '#374151', padding: '0 6px', background: '#f3f4f6', borderRadius: 4 }}>
                Personnel Information
              </legend>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 14 }}>
                <Field label="Last Name" required error={errors.last_name}>
                  {renderInput('last_name', 'e.g. Cruz')}
                </Field>
                <Field label="First Name" required error={errors.first_name}>
                  {renderInput('first_name', 'e.g. Patricia Diane')}
                </Field>
                <Field label="Middle Name">
                  {renderInput('middle_name', 'e.g. Ruiz')}
                </Field>
              </div>
              <div style={{ marginBottom: 14 }}>
                <Field label="Home Address">
                  {renderTextarea('address', 'e.g. 123 Main St., Barangay, City')}
                </Field>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <Field label="Contact Number">
                  {renderInput('contact_number', 'e.g. 0923-245-2314')}
                </Field>
                <Field label="Email Address">
                  {renderInput('email', 'e.g. example@email.com', 'email')}
                </Field>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                <Field label="Birthdate">
                  {renderInput('birthdate', '', 'date')}
                </Field>
                <Field label="Gender">
                  <div style={{ display: 'flex', gap: 18, alignItems: 'center', padding: '6px 0' }}>
                    {['Male', 'Female'].map(g => (
                      <label key={g} style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, cursor: viewOnly ? 'default' : 'pointer' }}>
                        <input
                          type="radio"
                          name="gender"
                          disabled={viewOnly}
                          checked={form.gender === g}
                          onChange={() => setField('gender', g)}
                        /> {g}
                      </label>
                    ))}
                  </div>
                </Field>
                <Field label="Status" required error={errors.status}>
                  <div style={{ display: 'flex', gap: 18, alignItems: 'center', padding: '6px 0' }}>
                    {['Active', 'Inactive'].map(s => (
                      <label key={s} style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, cursor: viewOnly ? 'default' : 'pointer' }}>
                        <input
                          type="radio"
                          name="status"
                          disabled={viewOnly}
                          checked={form.status === s}
                          onChange={() => setField('status', s)}
                        /> {s}
                      </label>
                    ))}
                  </div>
                </Field>
              </div>
            </fieldset>
          </div>
        );

      case 'employ':
        return (
          <div style={{ padding: 18 }}>
            <fieldset style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 14, marginBottom: 18 }}>
              <legend style={{ fontSize: 12, fontWeight: 600, color: '#374151', padding: '0 6px', background: '#f3f4f6', borderRadius: 4 }}>
                Employment Details
              </legend>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <Field label="Personnel Type" required error={errors['employment.personnel_type_id']}>
                  {renderSelect('employment.personnel_type_id', lookupsData.personnelTypes,
                    'personnel_type_id', 'personnel_type', '- Select Personnel Type -')}
                </Field>
                <Field label="Employment Type" required error={errors['employment.employment_type']}>
                  <div style={{ display: 'flex', gap: 18, alignItems: 'center', padding: '6px 0' }}>
                    {['Direct Hire', 'Outsourced'].map(t => (
                      <label key={t} style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, cursor: viewOnly ? 'default' : 'pointer' }}>
                        <input
                          type="radio"
                          name="employment_type"
                          disabled={viewOnly}
                          checked={form.employment.employment_type === t}
                          onChange={() => setField('employment.employment_type', t)}
                        /> {t}
                      </label>
                    ))}
                  </div>
                </Field>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <Field label="Employee ID">
                  {renderInput('employment.employee_id_number', 'e.g. 12345')}
                </Field>
                <Field label="Depot" required error={errors['employment.depot_id']}>
                  {renderSelect('employment.depot_id', lookupsData.depots,
                    'depot_id', 'depot_name', '- Select Depot -')}
                </Field>
              </div>
              {form.employment.employment_type === 'Outsourced' && (
                <div style={{ marginBottom: 14 }}>
                  <Field label="Vendor">
                    {renderSelect('employment.vendor_id', lookupsData.vendors,
                      'vendor_id', 'vendor_name', '- Select Vendor -')}
                  </Field>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <Field label="Date Started">
                  {renderInput('employment.date_started', '', 'date')}
                </Field>
                <Field label="Date of Separation">
                  {renderInput('employment.date_of_separation', '', 'date')}
                </Field>
              </div>
              <div style={{ marginBottom: 14 }}>
                <Field label="Reason of Separation">
                  {renderTextarea('employment.reason_of_separation', 'e.g. Resigned')}
                </Field>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <Field label="Bank Account">
                  {renderInput('employment.bank_account', 'e.g. 1234 5678 9012')}
                </Field>
                <Field label="Daily Rate">
                  {renderInput('employment.daily_rate', 'e.g. 750.00', 'number')}
                </Field>
              </div>
              <div>
                <Field label="Remarks">
                  {renderTextarea('employment.remarks', 'Additional notes…')}
                </Field>
              </div>
            </fieldset>
          </div>
        );

      case 'benefits':
        return (
          <div style={{ padding: 18 }}>
            <fieldset style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 14 }}>
              <legend style={{ fontSize: 12, fontWeight: 600, color: '#374151', padding: '0 6px', background: '#f3f4f6', borderRadius: 4 }}>
                Benefits
              </legend>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Field label="Philhealth No.">
                  {renderInput('benefits.philhealth_no', 'e.g. 123456789012')}
                </Field>
                <Field label="SSS No.">
                  {renderInput('benefits.sss_no', 'e.g. 12-3456789-0')}
                </Field>
                <Field label="TIN No.">
                  {renderInput('benefits.tin_no', 'e.g. 123-456-789-000')}
                </Field>
                <Field label="Pag-IBIG No.">
                  {renderInput('benefits.pag_ibig_no', 'e.g. 1234-5678-9012')}
                </Field>
              </div>
            </fieldset>
          </div>
        );

      case 'emergency':
        return (
          <div style={{ padding: 18 }}>
            <fieldset style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 14 }}>
              <legend style={{ fontSize: 12, fontWeight: 600, color: '#374151', padding: '0 6px', background: '#f3f4f6', borderRadius: 4 }}>
                Emergency Contact
              </legend>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Field label="Contact Person Name">
                  {renderInput('emergency.contact_person', 'e.g. Pineda, Karl Louis M.')}
                </Field>
                <Field label="Contact Number">
                  {renderInput('emergency.contact_number', 'e.g. 0968-234-2345')}
                </Field>
              </div>
            </fieldset>
          </div>
        );

      case 'license':
        return (
          <div style={{ padding: 18 }}>
            <fieldset style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 14 }}>
              <legend style={{ fontSize: 12, fontWeight: 600, color: '#374151', padding: '0 6px', background: '#f3f4f6', borderRadius: 4 }}>
                License
              </legend>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Field label="Driver License No.">
                  {renderInput('license.driver_license_no', 'e.g. A123-4567-890123')}
                </Field>
                <Field label="License Expiry">
                  {renderInput('license.license_expiry', '', 'date')}
                </Field>
              </div>
              <div style={{ marginTop: 12, fontSize: 12, color: '#6b7280' }}>
                💡 Go to the <b>DL Codes</b> tab to select the applicable Driver's License restriction codes (A, B, B2, etc.).
              </div>
            </fieldset>
          </div>
        );

      case 'dlcodes':
        return (
          <div style={{ padding: 18 }}>
            <fieldset style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 14 }}>
              <legend style={{ fontSize: 12, fontWeight: 600, color: '#374151', padding: '0 6px', background: '#f3f4f6', borderRadius: 4 }}>
                Driver's License Restriction Codes
              </legend>
              {lookupsData.dlCodes.length === 0 && (
                <div style={{ fontSize: 13, color: '#6b7280', padding: '8px 0' }}>
                  No DL Codes configured. Add them in Settings first.
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
                {lookupsData.dlCodes.map(dc => {
                  const checked = selectedCodes.has(Number(dc.dl_code_id));
                  return (
                    <label
                      key={dc.dl_code_id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '10px 12px', border: checked ? '2px solid #1d4ed8' : '1px solid #e5e7eb',
                        borderRadius: 6, background: checked ? '#eff6ff' : '#fff',
                        cursor: viewOnly ? 'default' : 'pointer', fontSize: 13,
                      }}
                    >
                      <input
                        type="checkbox"
                        disabled={viewOnly}
                        checked={checked}
                        onChange={() => toggleDLCode(dc.dl_code_id)}
                      />
                      <div>
                        <div style={{ fontWeight: 600 }}>{dc.dl_code}</div>
                        {dc.description && <div style={{ fontSize: 11, color: '#6b7280' }}>{dc.description}</div>}
                      </div>
                    </label>
                  );
                })}
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
              {viewOnly ? 'View Personnel' : (editPersonnel ? 'Edit Personnel' : 'New Personnel')}
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
