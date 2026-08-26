import React, { useEffect, useState } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { customersCrud, lookups } from '../services/api.js';

const DEFAULT_FORM = {
  customer_name: '',
  contact_number: '',
  email: '',
  address_one: '',
  address_two: '',
  contact_person: '',
  depot_id: '',
  tin: '',
  account_code: '',
  rate_type: '',
  status: 'Active',
};

export default function CustomerFormModal({ isOpen, onClose, onSaved, editCustomer }) {
  const isEdit = Boolean(editCustomer);
  const [form, setForm] = useState({ ...DEFAULT_FORM });
  const [depots, setDepots] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState({ type: '', msg: '' });

  useEffect(() => {
    (async () => {
      try {
        const d = await lookups.depots().catch(() => []);
        setDepots(Array.isArray(d) ? d : (d.data || []));
      } catch (e) { /* no-op */ }
    })();
  }, []);

  useEffect(() => {
    if (editCustomer) {
      setForm({
        customer_name: editCustomer.customer_name || '',
        contact_number: editCustomer.contact_number || '',
        email: editCustomer.email || '',
        address_one: editCustomer.address_one || '',
        address_two: editCustomer.address_two || '',
        contact_person: editCustomer.contact_person || '',
        depot_id: editCustomer.depot_id || '',
        tin: editCustomer.tin || '',
        account_code: editCustomer.account_code || '',
        rate_type: editCustomer.rate_type || '',
        status: editCustomer.status || 'Active',
      });
    } else {
      setForm({ ...DEFAULT_FORM });
    }
    setErrors({});
    setToast({ type: '', msg: '' });
  }, [editCustomer, isOpen]);

  const update = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.customer_name.trim()) e.customer_name = 'Customer Name is required';
    if (!form.contact_number.trim()) e.contact_number = 'Contact Number is required';
    if (!form.email.trim()) e.email = 'Email Address is required';
    if (!form.address_one.trim()) e.address_one = 'Address 1 is required';
    if (!form.contact_person.trim()) e.contact_person = 'Contact Person is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setToast({ type: '', msg: '' });

    try {
      const payload = {
        customer_name: form.customer_name.trim(),
        contact_number: form.contact_number.trim(),
        email: form.email.trim(),
        address_one: form.address_one.trim(),
        address_two: form.address_two.trim(),
        contact_person: form.contact_person.trim(),
        depot_id: form.depot_id ? Number(form.depot_id) : null,
        tin: form.tin.trim(),
        account_code: form.account_code.trim(),
        rate_type: form.rate_type || 'Standard',
        status: form.status || 'Active',
      };

      let result;
      if (isEdit) {
        result = await customersCrud.update(editCustomer.customer_id, payload);
      } else {
        result = await customersCrud.create(payload);
      }

      if (result && result.success) {
        setToast({ type: 'success', msg: isEdit ? 'Customer updated successfully.' : 'Customer created successfully.' });
        setTimeout(() => {
          if (onSaved) onSaved(result.data);
          onClose();
        }, 700);
      } else {
        throw new Error(result?.error || 'Failed to save customer.');
      }
    } catch (err) {
      console.error('Customer save error:', err);
      setToast({ type: 'error', msg: err.message || 'Failed to save customer.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEdit ? 'Update Customer' : 'Add Customer'}</h3>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {toast.msg && (
          <div className={`alert alert-${toast.type || 'success'}`} style={{ margin: '0 20px 16px' }}>
            {toast.msg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ maxHeight: '70vh', overflowY: 'auto', padding: '0 20px 20px' }}>
          <div className="bf-section" style={{ border: '1px solid #e5e7eb', borderRadius: 6, marginBottom: 16 }}>
            <div className="bf-section-title" style={{ background: '#d1d5db', color: '#374151', padding: '4px 10px', fontSize: 13, fontWeight: 600, borderTopLeftRadius: 6, borderTopRightRadius: 6 }}>
              Customer Information
            </div>
            <div className="bf-grid" style={{ padding: 16 }}>
              <div className="bf-col-2">
                <div className="bf-field">
                  <label>
                    Customer Name <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.customer_name}
                    onChange={(e) => update('customer_name', e.target.value)}
                    className={errors.customer_name ? 'input-error' : ''}
                  />
                  {errors.customer_name && <div className="field-error">{errors.customer_name}</div>}
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
                  <label>
                    Email Address <span className="req">*</span>
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => update('email', e.target.value)}
                    className={errors.email ? 'input-error' : ''}
                  />
                  {errors.email && <div className="field-error">{errors.email}</div>}
                </div>
              </div>

              <div className="bf-col-2">
                <div className="bf-field">
                  <label>
                    Address 1 <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.address_one}
                    onChange={(e) => update('address_one', e.target.value)}
                    className={errors.address_one ? 'input-error' : ''}
                  />
                  {errors.address_one && <div className="field-error">{errors.address_one}</div>}
                </div>
              </div>

              <div className="bf-col-2">
                <div className="bf-field">
                  <label>Address 2</label>
                  <input
                    type="text"
                    value={form.address_two}
                    onChange={(e) => update('address_two', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bf-section" style={{ border: '1px solid #e5e7eb', borderRadius: 6 }}>
            <div className="bf-section-title" style={{ background: '#d1d5db', color: '#374151', padding: '4px 10px', fontSize: 13, fontWeight: 600, borderTopLeftRadius: 6, borderTopRightRadius: 6 }}>
              Other Information
            </div>
            <div className="bf-grid" style={{ padding: 16 }}>
              <div className="bf-col-1">
                <div className="bf-field">
                  <label>
                    Contact Person <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.contact_person}
                    onChange={(e) => update('contact_person', e.target.value)}
                    className={errors.contact_person ? 'input-error' : ''}
                  />
                  {errors.contact_person && <div className="field-error">{errors.contact_person}</div>}
                </div>
              </div>

              <div className="bf-col-1">
                <div className="bf-field">
                  <label>Depot</label>
                  <select
                    value={form.depot_id}
                    onChange={(e) => update('depot_id', e.target.value)}
                  >
                    <option value="">-Select-</option>
                    {depots.map((d) => (
                      <option key={d.depot_id} value={d.depot_id}>
                        {d.depot_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="bf-col-1">
                <div className="bf-field">
                  <label>TIN</label>
                  <input
                    type="text"
                    value={form.tin}
                    onChange={(e) => update('tin', e.target.value)}
                  />
                </div>
              </div>

              <div className="bf-col-1">
                <div className="bf-field">
                  <label>Account Code</label>
                  <input
                    type="text"
                    value={form.account_code}
                    onChange={(e) => update('account_code', e.target.value)}
                  />
                </div>
              </div>

              <div className="bf-col-2">
                <div className="bf-field">
                  <label>Rate Type</label>
                  <select
                    value={form.rate_type}
                    onChange={(e) => update('rate_type', e.target.value)}
                  >
                    <option value="">-Select-</option>
                    <option value="Standard">Standard</option>
                    <option value="Special">Special</option>
                  </select>
                </div>
              </div>

              <div className="bf-col-2">
                <div className="bf-field">
                  <label>
                    Status <span className="req">*</span>
                  </label>
                  <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginTop: 6 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="status"
                        value="Active"
                        checked={form.status === 'Active'}
                        onChange={(e) => update('status', e.target.value)}
                      />
                      Active
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="status"
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

          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              disabled={submitting}
            >
              <X size={14} /> Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              <Save size={14} /> {submitting ? 'Saving…' : (isEdit ? 'Update' : 'Save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
