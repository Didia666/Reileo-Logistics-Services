import React, { useEffect, useMemo, useState } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { settingsCrud } from '../services/api.js';

const TABS = [
  { key: 'vendor-info', label: 'Vendor Information' },
  { key: 'other-info', label: 'Other Information' },
];

const DEFAULT_FORM = {
  vendor_name: '',
  contact_number: '',
  email_address: '',
  address_1: '',
  address_2: '',
  owner_name: '',
  owner_contact_no: '',
  coordinator_name: '',
  coordinator_contact_no: '',
  term: '',
  date_started: '',
  date_separated: '',
  vendor_type_id: '',
  tax_type_id: '',
  status: 'Active',
};

export default function VendorFormModal({ isOpen, onClose, onSaved, editVendor }) {
  const isEdit = Boolean(editVendor);
  const [activeTab, setActiveTab] = useState('vendor-info');
  const [form, setForm] = useState({ ...DEFAULT_FORM });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState({ type: '', msg: '' });
  const [vendorTypes, setVendorTypes] = useState([]);
  const [taxTypes, setTaxTypes] = useState([]);

  const vendorCrud = useMemo(() => settingsCrud('vendors'), []);

  useEffect(() => {
    if (!isOpen) return;

    const loadLookups = async () => {
      try {
        const [vendorTypeRes, taxTypeRes] = await Promise.all([
          fetch('/api/v_types.php', { credentials: 'include' }).then((r) => (r.ok ? r.json() : [])).catch(() => []),
          fetch('/api/tax_types.php', { credentials: 'include' }).then((r) => (r.ok ? r.json() : [])).catch(() => []),
        ]);
        setVendorTypes(Array.isArray(vendorTypeRes) ? vendorTypeRes : (vendorTypeRes?.data || []));
        setTaxTypes(Array.isArray(taxTypeRes) ? taxTypeRes : (taxTypeRes?.data || []));
      } catch {
        setVendorTypes([]);
        setTaxTypes([]);
      }
    };

    loadLookups();

    if (editVendor) {
      setForm({
        vendor_name: editVendor.vendor_name || '',
        contact_number: editVendor.contact_number || '',
        email_address: editVendor.email_address || editVendor.email || '',
        address_1: editVendor.address_one || editVendor.address_1 || '',
        address_2: editVendor.address_two || editVendor.address_2 || '',
        owner_name: editVendor.owner_name || '',
        owner_contact_no: editVendor.owner_contact_no || '',
        coordinator_name: editVendor.coordinator_name || '',
        coordinator_contact_no: editVendor.coordinator_contact_no || '',
        term: editVendor.term || '',
        date_started: editVendor.date_started || '',
        date_separated: editVendor.date_separated || '',
        vendor_type_id: editVendor.vendor_type_id || '',
        tax_type_id: editVendor.tax_type_id || '',
        status: editVendor.status || 'Active',
      });
    } else {
      setForm({ ...DEFAULT_FORM });
    }

    setActiveTab('vendor-info');
    setErrors({});
    setToast({ type: '', msg: '' });
  }, [editVendor, isOpen]);

  const update = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: '' }));
    }
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.vendor_name.trim()) nextErrors.vendor_name = 'Vendor Name is required';
    if (!form.contact_number.trim()) nextErrors.contact_number = 'Contact Number is required';
    if (!form.address_1.trim()) nextErrors.address_1 = 'Address 1 is required';
    if (!form.coordinator_name.trim()) nextErrors.coordinator_name = "Coordinator's Name is required";
    if (!form.coordinator_contact_no.trim()) nextErrors.coordinator_contact_no = "Coordinator's Contact No. is required";
    if (!form.vendor_type_id) nextErrors.vendor_type_id = 'Vendor Type is required';
    if (!form.tax_type_id) nextErrors.tax_type_id = 'Tax Type is required';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setToast({ type: '', msg: '' });

    try {
      const payload = {
        vendor_name: form.vendor_name.trim(),
        contact_number: form.contact_number.trim(),
        email_address: form.email_address.trim(),
        address_one: form.address_1.trim(),
        address_two: form.address_2.trim(),
        owner_name: form.owner_name.trim(),
        owner_contact_no: form.owner_contact_no.trim(),
        coordinator_name: form.coordinator_name.trim(),
        coordinator_contact_no: form.coordinator_contact_no.trim(),
        term: form.term.trim(),
        date_started: form.date_started || null,
        date_separated: form.date_separated || null,
        vendor_type_id: form.vendor_type_id ? Number(form.vendor_type_id) : null,
        tax_type_id: Number(form.tax_type_id),
        status: form.status || 'Active',
      };

      let result;
      if (isEdit) {
        result = await vendorCrud.update(editVendor.vendor_id, payload);
      } else {
        result = await vendorCrud.create(payload);
      }

      if (result && result.success) {
        setToast({ type: 'success', msg: isEdit ? 'Vendor updated successfully.' : 'Vendor created successfully.' });
        setTimeout(() => {
          if (onSaved) onSaved(result.data || { ...payload, ...(isEdit ? { vendor_id: editVendor.vendor_id } : {}) });
          onClose();
        }, 700);
      } else {
        throw new Error(result?.error || 'Failed to save vendor.');
      }
    } catch (error) {
      setToast({ type: 'error', msg: error.message || 'Failed to save vendor.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEdit ? 'Edit Vendor' : 'New Vendor'}</h3>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {toast.msg && (
          <div className={`alert alert-${toast.type || 'success'}`} style={{ margin: '0 20px 16px' }}>
            {toast.msg}
          </div>
        )}

        <div className="tabs" style={{ margin: '0 20px 16px', padding: '6px 8px' }}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={activeTab === tab.key ? 'active' : ''}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ maxHeight: '72vh', overflowY: 'auto', padding: '0 20px 20px' }}>
          {activeTab === 'vendor-info' ? (
            <div className="bf-section" style={{ padding: 0, border: '1px solid #e5e7eb' }}>
              <div className="bf-section-title" style={{ background: '#d1d5db', color: '#374151', padding: '8px 10px', fontSize: 13, margin: 0 }}>
                Vendor Information
              </div>
              <div className="bf-grid" style={{ padding: 16 }}>
                <div className="bf-col-full">
                  <div className="bf-field">
                    <label>
                      Vendor Name <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.vendor_name}
                      onChange={(e) => update('vendor_name', e.target.value)}
                      className={errors.vendor_name ? 'input-error' : ''}
                    />
                    {errors.vendor_name && <div className="field-error">{errors.vendor_name}</div>}
                  </div>
                </div>

                <div className="bf-col-1">
                  <div className="bf-field">
                    <label>
                      Contact Number <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.contact_number}
                      onChange={(e) => update('contact_number', e.target.value)}
                      className={errors.contact_number ? 'input-error' : ''}
                    />
                    {errors.contact_number && <div className="field-error">{errors.contact_number}</div>}
                  </div>
                </div>

                <div className="bf-col-1">
                  <div className="bf-field">
                    <label>Email Address</label>
                    <input
                      type="email"
                      value={form.email_address}
                      onChange={(e) => update('email_address', e.target.value)}
                    />
                  </div>
                </div>

                <div className="bf-col-full">
                  <div className="bf-field">
                    <label>
                      Address 1 <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.address_1}
                      onChange={(e) => update('address_1', e.target.value)}
                      className={errors.address_1 ? 'input-error' : ''}
                    />
                    {errors.address_1 && <div className="field-error">{errors.address_1}</div>}
                  </div>
                </div>

                <div className="bf-col-full">
                  <div className="bf-field">
                    <label>Address 2</label>
                    <input
                      type="text"
                      value={form.address_2}
                      onChange={(e) => update('address_2', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bf-section" style={{ padding: 0, border: '1px solid #e5e7eb' }}>
              <div className="bf-section-title" style={{ background: '#d1d5db', color: '#374151', padding: '8px 10px', fontSize: 13, margin: 0 }}>
                Other Information
              </div>
              <div className="bf-grid" style={{ padding: 16 }}>
                <div className="bf-col-1">
                  <div className="bf-field">
                    <label>Owner's Name</label>
                    <input type="text" value={form.owner_name} onChange={(e) => update('owner_name', e.target.value)} />
                  </div>
                </div>

                <div className="bf-col-1">
                  <div className="bf-field">
                    <label>Owner's Contact No.</label>
                    <input type="text" value={form.owner_contact_no} onChange={(e) => update('owner_contact_no', e.target.value)} />
                  </div>
                </div>

                <div className="bf-col-1">
                  <div className="bf-field">
                    <label>Coordinator's Name <span className="req">*</span></label>
                    <input
                      type="text"
                      value={form.coordinator_name}
                      onChange={(e) => update('coordinator_name', e.target.value)}
                      className={errors.coordinator_name ? 'input-error' : ''}
                    />
                    {errors.coordinator_name && <div className="field-error">{errors.coordinator_name}</div>}
                  </div>
                </div>

                <div className="bf-col-1">
                  <div className="bf-field">
                    <label>Coordinator's Contact No. <span className="req">*</span></label>
                    <input
                      type="text"
                      value={form.coordinator_contact_no}
                      onChange={(e) => update('coordinator_contact_no', e.target.value)}
                      className={errors.coordinator_contact_no ? 'input-error' : ''}
                    />
                    {errors.coordinator_contact_no && <div className="field-error">{errors.coordinator_contact_no}</div>}
                  </div>
                </div>

                <div className="bf-col-1">
                  <div className="bf-field">
                    <label>Term</label>
                    <input type="text" value={form.term} onChange={(e) => update('term', e.target.value)} />
                  </div>
                </div>

                <div className="bf-col-1">
                  <div className="bf-field">
                    <label>Date Started</label>
                    <input type="date" value={form.date_started} onChange={(e) => update('date_started', e.target.value)} />
                  </div>
                </div>

                <div className="bf-col-1">
                  <div className="bf-field">
                    <label>Date Separated</label>
                    <input type="date" value={form.date_separated} onChange={(e) => update('date_separated', e.target.value)} />
                  </div>
                </div>

                <div className="bf-col-1">
                  <div className="bf-field">
                    <label>
                      Vendor Type <span className="req">*</span>
                    </label>
                    <select
                      value={form.vendor_type_id}
                      onChange={(e) => update('vendor_type_id', e.target.value)}
                      className={errors.vendor_type_id ? 'input-error' : ''}
                    >
                      <option value="">-Select-</option>
                      {vendorTypes.map((item) => (
                        <option key={item.vendor_type_id} value={item.vendor_type_id}>{item.vendor_type}</option>
                      ))}
                    </select>
                    {errors.vendor_type_id && <div className="field-error">{errors.vendor_type_id}</div>}
                  </div>
                </div>

                <div className="bf-col-1">
                  <div className="bf-field">
                    <label>Tax Type <span className="req">*</span></label>
                    <select
                      value={form.tax_type_id}
                      onChange={(e) => update('tax_type_id', e.target.value)}
                      className={errors.tax_type_id ? 'input-error' : ''}
                    >
                      <option value="">-Select-</option>
                      {taxTypes.map((item) => (
                        <option key={item.tax_type_id} value={item.tax_type_id}>{item.tax_type}</option>
                      ))}
                    </select>
                    {errors.tax_type_id && <div className="field-error">{errors.tax_type_id}</div>}
                  </div>
                </div>

                <div className="bf-col-full">
                  <div className="bf-field">
                    <label>Status</label>
                    <div className="bf-radio-row">
                      <label className="bf-radio">
                        <input
                          type="radio"
                          name="vendor_status"
                          value="Active"
                          checked={form.status === 'Active'}
                          onChange={(e) => update('status', e.target.value)}
                        />
                        Active
                      </label>
                      <label className="bf-radio">
                        <input
                          type="radio"
                          name="vendor_status"
                          value="Inactive"
                          checked={form.status === 'Inactive'}
                          onChange={(e) => update('status', e.target.value)}
                        />
                        Inactive
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={submitting}>
              <X size={14} /> Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting && <Loader2 size={14} className="animate-spin" />}
              <Save size={14} /> {submitting ? 'Saving…' : (isEdit ? 'Update' : 'Save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
