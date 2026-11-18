import React, { useEffect, useState } from 'react';
import { X, Loader2, Save } from 'lucide-react';
import { lookups as lookupApi } from '../services/api.js';


const TABS = [
  { key: 'bookinginfo', label: 'Booking Information' },
  { key: 'clientcost', label: 'Client Cost' },
  { key: 'expenses', label: 'Expenses' },
  { key: 'personnelfee', label: 'Personnel Fee' },
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

export default function CompleteBookingModal({
  isOpen = true,
  booking,
  bookingDetail,
  onClose,
  onConfirm,
  saving = false,
  viewOnly = false,
}) {
  const [activeTab, setActiveTab] = useState('bookinginfo');
  const [expenseTab, setExpenseTab] = useState('b_expenses');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({type: '',msg: ''});
  const [lookupsData, setLookupsData] = useState({
    customers: [], bookingTypes: [], depots: [], vehicles: [],
    vehicleTypes: [], commodityTypes: [], origins: [], destination: [], personnel: [],
  });

  const blankForm = {
    // =========================================================
    // BOOKING INFORMATION
    // =========================================================
    booking_no: '',
    delivery_date: '',
    completed_at: '',
    customer_name: '',
    customer_id: '',
    booking_type: '',
    booking_type_id: '',
    depot_name: '',
    depot_id: '',
    vehicle_id: '',
    plate_no: '',
    vehicle_type: '',
    vehicle_type_id: '',
    commodity_type: '',
    commodity_type_id: '',

    // =========================================================
    // CLIENT COST
    // =========================================================
    origin_id: '',
    farthest_destination_id: '',
    client_rate: '',
    no_of_trips: '1',
    subcon_rate: '',

    // =========================================================
    // EXPENSES - BILLABLE
    // =========================================================
    b_gas: '0.00',
    b_parking_fee: '0.00',
    b_toll_fee: '0.00',
    b_entrance_fee: '0.00',
    b_mano: '0.00',
    b_SOP: '0.00',
    b_demurrage_fee: '0.00',
    b_extra_drop_fee: '0.00',

    // =========================================================
    // EXPENSES - NON-BILLABLE
    // =========================================================
    nb_gas: '0.00',
    nb_parking_fee: '0.00',
    nb_toll_fee: '0.00',
    nb_entrance_fee: '0.00',
    nb_mano: '0.00',
    nb_SOP: '0.00',
    nb_demurrage_fee: '0.00',
    nb_extra_drop_fee: '0.00',
    travel_fund: '',
    // =========================================================
    // PERSONNEL
    // =========================================================
    driver_id: '',
    helper1_id: '',
    helper2_id: '',

    driver_rate: '',
    driver_allowance: '0.00',

    helper1_rate: '',
    helper1_allowance: '0.00',

    helper2_rate: '',
    helper2_allowance: '0.00',
  };

  const [form, setForm] = useState({ ...blankForm });
  const [errors, setErrors] = useState({});
  // =========================================================
  // DATE/TIME HELPER
  // =========================================================
  const getLocalDateTime = () => {
    const now = new Date();
    const pad = (value) => String(value).padStart(2, '0');
    return (
      `${now.getFullYear()}-` +
      `${pad(now.getMonth() + 1)}-` +
      `${pad(now.getDate())}T` +
      `${pad(now.getHours())}:` +
      `${pad(now.getMinutes())}`
    );
  };

  const normalizeDateTime = (value) => {
    if (!value) return '';
    return String(value).replace(' ', 'T').slice(0, 16);
  };

  // =========================================================
  // LOOKUPS
  // =========================================================

  const loadLookups = async () => {
    try {
      const [
        customers, bookingTypes, depots, vehicles, vehicleTypes,
        commodityTypes, origins, destination, personnel,
      ] = await Promise.all([
        lookupApi.customers ? lookupApi.customers().catch(() => []) : Promise.resolve([]),
        lookupApi.bookingTypes ? lookupApi.bookingTypes().catch(() => []) : Promise.resolve([]),
        lookupApi.depots ? lookupApi.depots().catch(() => []) : Promise.resolve([]),
        lookupApi.vehicles ? lookupApi.vehicles().catch(() => []) : Promise.resolve([]),
        lookupApi.vh_types ? lookupApi.vh_types().catch(() => []) : Promise.resolve([]),
        lookupApi.commodity_type ? lookupApi.commodity_type().catch(() => []) : Promise.resolve([]),
        lookupApi.origins ? lookupApi.origins().catch(() => []) : Promise.resolve([]),
        lookupApi.destination ? lookupApi.destination().catch(() => []) : Promise.resolve([]),
        lookupApi.personnel ? lookupApi.personnel().catch(() => []) : Promise.resolve([]),
      ]);
      const normalize = (data) => Array.isArray(data) ? data : (data?.data || []);
      setLookupsData({
        customers: normalize(customers),
        bookingTypes: normalize(bookingTypes),
        depots: normalize(depots),
        vehicles: normalize(vehicles),
        vehicleTypes: normalize(vehicleTypes),
        commodityTypes: normalize(commodityTypes),
        origins: normalize(origins),
        destination: normalize(destination),
        personnel: normalize(personnel),
      });
    } catch {
      setLookupsData({
        customers: [], bookingTypes: [], depots: [], vehicles: [],
        vehicleTypes: [], commodityTypes: [], origins: [], destination: [], personnel: [],
      });
    }
  };

  // =========================================================
  // PERSONNEL ASSIGNMENT HELPER
  // =========================================================

  const personnelIdForRole = (assignments, role) => {
    const assignment = Array.isArray(assignments)
      ? assignments.find(
          (item) => item.assignment_role === role
        )
      : null;

    return assignment?.personnel_id ?? '';
  };

  // =========================================================
  // LOAD BOOKING
  // =========================================================

  useEffect(() => {
    if (!isOpen) return undefined;
    let cancelled = false;
    loadLookups();
    setActiveTab('bookinginfo');
    setErrors({});
    setToast({
      type: '',
      msg: '',
    });
    const detail = bookingDetail || {};
    const assignments = Array.isArray(detail.personnel_assignments)
      ? detail.personnel_assignments
      : [];
    const assignmentForRole = (role) =>
      assignments.find((assignment) => assignment.assignment_role === role);
    const bookingDestinations = Array.isArray(detail.booking_destinations)
      ? detail.booking_destinations
      : Array.isArray(detail.destinations)
        ? detail.destinations
        : [];
    const latestBookingDestination = bookingDestinations[bookingDestinations.length - 1];
    const nextForm = {
      ...blankForm,

      // Booking Information
      booking_no: detail.booking_no || booking?.booking_no || '',
      delivery_date: detail.delivery_date || booking?.delivery_date || '',
      completed_at: normalizeDateTime(detail.completed_at) || getLocalDateTime(),
      customer_name: detail.customer_name || booking?.customer_name || '',
      customer_id: detail.customer_id ?? booking?.customer_id ?? '',
      booking_type: detail.book_type || detail.booking_type || booking?.booking_type || '',
      booking_type_id: detail.booking_type_id ?? booking?.booking_type_id ?? '',
      depot_name: detail.depot_name || booking?.depot_name || '',
      depot_id: detail.depot_id ?? booking?.depot_id ?? '',
      vehicle_id: detail.vehicle_id || booking?.vehicle_id || '',
      plate_no: detail.plate_no || booking?.plate_no || '',
      vehicle_type: detail.vehicle_type || detail.truck_type || '',
      vehicle_type_id: detail.vehicle_type_id ?? booking?.vehicle_type_id ?? '',
      commodity_type: detail.commodity_type || '',
      commodity_type_id: detail.commodity_type_id ?? booking?.commodity_type_id ?? '',

      // Client Cost
      origin_id: detail.origin_id || '',
      farthest_destination_id: detail.farthest_destination_id ?? latestBookingDestination?.destination_id ?? '',
      client_rate: detail.client_rate ?? '',
      no_of_trips: detail.no_of_trips ?? detail.trips_number ?? '1',
      subcon_rate: detail.subcon_rate ?? '',

      // billable expenses
      b_gas: detail.b_gas ?? booking?.b_gas ?? '',
      b_parking_fee: detail.b_parking_fee ?? booking?.b_parking_fee ?? '',
      b_toll_fee: detail.b_toll_fee ?? booking?.b_toll_fee ?? '',
      b_entrance_fee: detail.b_entrance_fee ?? booking?.b_entrance_fee ?? '',
      b_mano: detail.b_mano ?? booking?.b_mano ?? '',
      b_SOP: detail.b_SOP ?? booking?.b_SOP ?? '',
      b_demurrage_fee: detail.b_demurrage_fee ?? booking?.b_demurrage_fee ?? '',
      b_extra_drop_fee: detail.b_extra_drop_fee ?? booking?.b_extra_drop_fee ?? '',
      b_backload_fee: detail.b_backload_fee ?? booking?.b_backload_fee ?? '',

      nb_gas: detail.nb_gas ?? booking?.nb_gas ?? '',
      nb_parking_fee: detail.nb_parking_fee ?? booking?.nb_parking_fee ?? '',
      nb_toll_fee: detail.nb_toll_fee ?? booking?.nb_toll_fee ?? '',
      nb_entrance_fee: detail.nb_entrance_fee ?? booking?.nb_entrance_fee ?? '',
      nb_mano: detail.nb_mano ?? booking?.nb_mano ?? '',
      nb_SOP: detail.nb_SOP ?? booking?.nb_SOP ?? '',
      nb_demurrage_fee: detail.nb_demurrage_fee ?? booking?.nb_demurrage_fee ?? '',
      nb_extra_drop_fee: detail.nb_extra_drop_fee ?? booking?.nb_extra_drop_fee ?? '',
      nb_backload_fee: detail.nb_backload_fee ?? booking?.nb_backload_fee ?? '',
      travel_fund: detail.travel_fund ?? '',

      // Personnel
      driver_id: detail.driver_id || personnelIdForRole(assignments, 'driver'),
      helper1_id: detail.helper1_id || personnelIdForRole(assignments, 'helper1'),
      helper2_id: detail.helper2_id || personnelIdForRole(assignments, 'helper2'),
      driver_rate: detail.driver_rate
        ?? assignmentForRole('driver')?.gross_rate
        ?? assignmentForRole('driver')?.rate
        ?? '',
      driver_allowance: detail.driver_allowance ?? '0.00',
      helper1_rate: detail.helper1_rate
        ?? detail.helper_rate
        ?? assignmentForRole('helper1')?.gross_rate
        ?? assignmentForRole('helper1')?.rate
        ?? '',
      helper1_allowance: detail.helper1_allowance ?? detail.helper_allowance ?? '0.00',
      helper2_rate: detail.helper2_rate
        ?? assignmentForRole('helper2')?.gross_rate
        ?? assignmentForRole('helper2')?.rate
        ?? '',
      helper2_allowance: detail.helper2_allowance ?? '0.00',
    };

    if (!cancelled) {
      setForm(nextForm);
    }

    return () => {
      cancelled = true;
    };
  }, [isOpen, booking, bookingDetail]);

  useEffect(() => {
    if (!isOpen || lookupsData.personnel.length === 0) return;

    const dailyRateFor = (personnelId) => {
      if (!personnelId) return null;
      const personnel = lookupsData.personnel.find(
        (person) => String(person.personnel_id) === String(personnelId)
      );
      const dailyRate = personnel?.daily_rate;
      return dailyRate !== null && dailyRate !== undefined && dailyRate !== ''
        && Number.isFinite(Number(dailyRate))
        ? Number(dailyRate).toFixed(2)
        : null;
    };

    setForm((previous) => {
      const next = { ...previous };
      let changed = false;
      [
        ['driver_id', 'driver_rate'],
        ['helper1_id', 'helper1_rate'],
        ['helper2_id', 'helper2_rate'],
      ].forEach(([personnelField, rateField]) => {
        if (next[rateField] !== '') return;
        const dailyRate = dailyRateFor(next[personnelField]);
        if (dailyRate === null) return;
        next[rateField] = dailyRate;
        changed = true;
      });
      return changed ? next : previous;
    });
  }, [
    isOpen,
    lookupsData.personnel,
    form.driver_id,
    form.helper1_id,
    form.helper2_id,
  ]);

  // =========================================================
  // SET FIELD
  // =========================================================

  const setField = (path, value) => {
    setForm((prev) => {
      const next = { ...prev };

      const parts = path.split('.');

      if (parts.length === 1) {
        next[parts[0]] = value;
      } else {
        next[parts[0]] = {
          ...(next[parts[0]] || {}),
        };

        next[parts[0]][parts[1]] = value;
      }

      return next;
    });

    setErrors((prev) => ({
      ...prev,
      [path]: '',
    }));
  };

  const handleCommodityTypeChange = (event) => {
    const commodityTypeId = event.target.value;
    setField('commodity_type_id', commodityTypeId);
    const selectedVehicle = lookupsData.vehicles.find(
      (vehicle) => String(vehicle.vehicle_id) === String(form.vehicle_id)
    );

    if (
      form.vehicle_id &&
      (!selectedVehicle || (
        commodityTypeId &&
        String(selectedVehicle.commodity_type_id ?? '') !== String(commodityTypeId)
      ))
    ) {
      setField('vehicle_id', '');
      setField('plate_no', '');
    }
  };

  const handleVehicleTypeChange = (event) => {
    const vehicleTypeId = event.target.value;
    setField('vehicle_type_id', vehicleTypeId);
    const selectedType = lookupsData.vehicleTypes.find(
      (vehicleType) => String(vehicleType.vehicle_type_id) === String(vehicleTypeId)
    );
    setField('vehicle_type', selectedType?.vehicle_type || '');

    const selectedVehicle = lookupsData.vehicles.find(
      (vehicle) => String(vehicle.vehicle_id) === String(form.vehicle_id)
    );
    if (
      !vehicleTypeId ||
      !selectedVehicle ||
      String(selectedVehicle.vehicle_type_id) !== String(vehicleTypeId)
    ) {
      setField('vehicle_id', '');
      setField('plate_no', '');
    }
  };

  const handleVehicleChange = (event) => {
    const vehicleId = event.target.value;
    const selectedVehicle = lookupsData.vehicles.find(
      (vehicle) => String(vehicle.vehicle_id) === String(vehicleId)
    );

    setField('vehicle_id', vehicleId);
    setField('plate_no', selectedVehicle?.plate_no || '');
    setField('vehicle_type_id', selectedVehicle?.vehicle_type_id ?? '');
    setField('vehicle_type', selectedVehicle?.vehicle_type || '');
  };

  // =========================================================
  // TOTAL AMOUNT
  // =========================================================

  const clientRate = Number(form.client_rate) || 0;
  const numberOfTrips = Number(form.no_of_trips) || 0;
  const totalAmount = (clientRate * numberOfTrips).toFixed(2);
  const totalExpensesCents = [
    form.b_gas,
    form.b_parking_fee,
    form.b_toll_fee,
    form.b_entrance_fee,
    form.b_mano,
    form.b_SOP,
    form.b_demurrage_fee,
    form.b_extra_drop_fee,
    form.b_backload_fee,
    form.nb_gas,
    form.nb_parking_fee,
    form.nb_toll_fee,
    form.nb_entrance_fee,
    form.nb_mano,
    form.nb_SOP,
    form.nb_demurrage_fee,
    form.nb_extra_drop_fee,
    form.nb_backload_fee,
  ].reduce((total, expense) => total + Math.round((Number(expense) || 0) * 100), 0);
  const totalExpenses = (totalExpensesCents / 100).toFixed(2);
  const returnFund = (
    (Math.round((Number(form.travel_fund) || 0) * 100) - totalExpensesCents) / 100
  ).toFixed(2);
  const netRate = (grossRate, cashAdvance) =>
    ((Number(grossRate) || 0) - (Number(cashAdvance) || 0)).toFixed(2);

  // =========================================================
  // VALIDATION
  // =========================================================

  const validate = () => {
    const errs = {};

    // Booking Information
    if (!form.customer_id) errs.customer_id = 'Customer is required.';
    if (!form.booking_type_id) errs.booking_type_id = 'Booking type is required.';
    if (!form.depot_id) errs.depot_id = 'Depot is required.';
    if (!form.commodity_type_id) errs.commodity_type_id = 'Commodity type is required.';
    if (!form.vehicle_type_id) errs.vehicle_type_id = 'Truck type is required.';
    if (!form.vehicle_id) errs.vehicle_id = 'Vehicle number is required.';
    if (!String(form.completed_at || '').trim()) {
      errs.completed_at =
        'Completed date & time is required.';
    }

    // Client Cost
    if (!form.farthest_destination_id) {
      errs.farthest_destination_id =
        'Farthest destination is required.';
    }

    if (
      form.client_rate === '' ||
      Number.isNaN(Number(form.client_rate))
    ) {
      errs.client_rate =
        'Client rate is required and must be a number.';
    }

    if (
      !form.no_of_trips ||
      Number.isNaN(Number(form.no_of_trips)) ||
      Number(form.no_of_trips) <= 0
    ) {
      errs.no_of_trips =
        'No. of trips is required and must be greater than 0.';
    }

    // Personnel Fee
    if (
      form.helper1_id &&
      (
        form.helper1_rate === '' ||
        Number.isNaN(Number(form.helper1_rate)) ||
        Number(form.helper1_rate) <= 0
      )
    ) {
      errs.helper1_rate =
        'Helper 1 rate must be greater than 0.';
    }

    if (
      form.helper2_id &&
      form.helper2_rate !== '' &&
      (
        Number.isNaN(Number(form.helper2_rate)) ||
        Number(form.helper2_rate) < 0
      )
    ) {
      errs.helper2_rate =
        'Helper 2 rate must be a valid number.';
    }

    setErrors(errs);

    if (Object.keys(errs).length) {
      if (
        errs.customer_id ||
        errs.booking_type_id ||
        errs.depot_id ||
        errs.commodity_type_id ||
        errs.vehicle_type_id ||
        errs.vehicle_id ||
        errs.completed_at
      ) {
        setActiveTab('bookinginfo');
      } else if (
        errs.farthest_destination_id ||
        errs.client_rate ||
        errs.no_of_trips
      ) {
        setActiveTab('clientcost');
      } else if (
        errs.driver_rate ||
        errs.helper1_rate ||
        errs.helper2_rate
      ) {
        setActiveTab('personnelfee');
      }

      setToast({
        type: 'error',
        msg: 'Please fill in all required fields.',
      });

      setTimeout(() => {
        setToast({
          type: '',
          msg: '',
        });
      }, 4000);

      return false;
    }

    return true;
  };

  // =========================================================
  // SAVE
  // =========================================================

  const handleSave = async () => {
    if (viewOnly) return;
    if (!validate()) return;
    setSubmitting(true);

    try {
      /* Keep the completed payload compatible with the existing CompleteBookingModal/onConfirm flow.
         Normalize values here before sending them back to the parent. */
      const payload = {
        completed_at: form.completed_at.trim() || null,
        booking_info: {
          customer_id: Number(form.customer_id),
          booking_type_id: Number(form.booking_type_id),
          depot_id: Number(form.depot_id),
          commodity_type_id: Number(form.commodity_type_id),
        },
        vehicle_assignment: {
          vehicle_id: Number(form.vehicle_id),
          vehicle_type_id: Number(form.vehicle_type_id),
        },
        client_cost: {
          origin_id: form.origin_id ? Number(form.origin_id) : null,
          farthest_destination_id: form.farthest_destination_id ? Number(form.farthest_destination_id) : null,
          client_rate: form.client_rate !== '' ? Number(form.client_rate) : null,
          no_of_trips: form.no_of_trips ? Number(form.no_of_trips) : null,
          total_amount: Number(totalAmount),
          subcon_rate: form.subcon_rate !== '' ? Number(form.subcon_rate) : null,
        },
        b_expenses: {
          travel_fund: form.travel_fund !== '' ? Number(form.travel_fund) : 0,
          b_gas: form.b_gas ? Number(form.b_gas) : null,
          b_parking_fee: form.b_parking_fee ? Number(form.b_parking_fee) : null,
          b_toll_fee: form.b_toll_fee ? Number(form.b_toll_fee) : null,
          b_entrance_fee: form.b_entrance_fee ? Number(form.b_entrance_fee) : null,
          b_mano: form.b_mano ? Number(form.b_mano) : null,
          b_SOP: form.b_SOP ? Number(form.b_SOP) : null,
          b_demurrage_fee: form.b_demurrage_fee ? Number(form.b_demurrage_fee) : null,
          b_extra_drop_fee: form.b_extra_drop_fee ? Number(form.b_extra_drop_fee) : null,
          b_backload_fee: form.b_backload_fee ? Number(form.b_backload_fee) : null,
        },

        nb_expenses: {
          nb_gas: form.nb_gas ? Number(form.nb_gas) : null,
          nb_parking_fee: form.nb_parking_fee ? Number(form.nb_parking_fee) : null,
          nb_toll_fee: form.nb_toll_fee ? Number(form.nb_toll_fee) : null,
          nb_entrance_fee: form.nb_entrance_fee ? Number(form.nb_entrance_fee) : null,
          nb_mano: form.nb_mano ? Number(form.nb_mano) : null,
          nb_SOP: form.nb_SOP ? Number(form.nb_SOP) : null,
          nb_demurrage_fee: form.nb_demurrage_fee ? Number(form.nb_demurrage_fee) : null,
          nb_extra_drop_fee: form.nb_extra_drop_fee ? Number(form.nb_extra_drop_fee) : null,
          nb_backload_fee: form.nb_backload_fee ? Number(form.nb_backload_fee) : null,
        },
        
        personnel: [
          {
            personnel_id: form.driver_id ? Number(form.driver_id) : null,
            assignment_role: 'driver',
            rate: form.driver_rate !== '' ? Number(form.driver_rate) : null,
            allowance: form.driver_allowance !== '' ? Number(form.driver_allowance) : null,
          },
          {
            personnel_id: form.helper1_id ? Number(form.helper1_id) : null,
            assignment_role: 'helper1',
            rate: form.helper1_rate !== '' ? Number(form.helper1_rate) : null,
            allowance: form.helper1_allowance !== '' ? Number(form.helper1_allowance) : null,
          },
          {
            personnel_id: form.helper2_id ? Number(form.helper2_id) : null,
            assignment_role: 'helper2',
            rate: form.helper2_rate !== '' ? Number(form.helper2_rate) : null,
            allowance: form.helper2_allowance !== '' ? Number(form.helper2_allowance) : null,
          },
        ],
      };

      if (typeof onConfirm !== 'function') {
        throw new Error('Booking completion is unavailable.');
      }
      await onConfirm(payload);
    } catch (error) {
      setToast({ type: 'error', msg: error?.message || 'Failed to complete booking.' });
    } finally {
      setSubmitting(false);
    }
  };

  // =========================================================
  // RENDER INPUT
  // =========================================================

  const renderInput = (path, placeholder = '', type = 'text', disabled = false) => {
    const v = path.split('.').reduce((o, k) => (o || {})[k], form) ?? '';
    const isNumberInput = type === 'number';
    return (
      <input
        type={isNumberInput ? 'text' : type}
        step={type === 'number' ? '0.01' : undefined}
        inputMode={isNumberInput? 'decimal' : undefined}
        disabled={viewOnly || disabled}
        style={viewOnly || disabled ? readOnlyStyle : inputStyle}
        value={v}
        placeholder={placeholder}
        onChange={(e) => {
          const next = e.target.value;
          if (!isNumberInput || /^\d*\.?\d*$/.test(next)) {
            setField(path, next);
          }
        }}
      />
    );
  };

  // =========================================================
  // RENDER SELECT
  // =========================================================

  const renderSelect = (path, options, valueKey, labelKey, placeholder = '- Select -', disabled = false, onChange = null) => {
    const value = path.split('.').reduce((object, key) => (object || {})[key], form) ?? '';
    const safeOptions = Array.isArray(options) ? options : [];
    return (
      <select
        disabled={viewOnly || disabled || submitting || saving}
        style={viewOnly || disabled ? readOnlyStyle : inputStyle}
        value={value}
        onChange={(event) => {
          if (onChange) onChange(event);
          else setField(path, event.target.value);
        }}
      >
        <option value="">{placeholder}</option>
        {safeOptions.map((option, index) => {
          const optionValue = option[valueKey];
          const optionKey = optionValue !== undefined && optionValue !== null && optionValue !== ''
            ? `${optionValue}-${index}`
            : `option-${index}`;
          return <option key={optionKey} value={optionValue ?? ''}>{option[labelKey]}</option>;
        })}
      </select>
    );
  };

  // =========================================================
  // RENDER TEXTAREA
  // =========================================================

  const renderTextarea = (path, placeholder = '', rows = 3, disabled = false) => {
    const value = path.split('.').reduce((object, key) => (object || {})[key], form) ?? '';
    return (
      <textarea
        disabled={viewOnly || disabled || submitting || saving}
        style={{ ...(viewOnly || disabled ? readOnlyStyle : inputStyle), resize: 'vertical' }}
        value={value}
        rows={rows}
        placeholder={placeholder}
        onChange={(event) => setField(path, event.target.value)}
      />
    );
  };

  // renderTextarea is intentionally kept here to follow
  // the same reusable form structure as the Delivered modal.
  void renderTextarea;

  // =========================================================
  // READ-ONLY DISPLAY
  // =========================================================

  const renderReadOnly = (value, placeholder = '—') => (
    <input
      type="text"
      value={value !== null && value !== undefined && value !== '' ? value : placeholder}
      disabled
      style={readOnlyStyle}
    />
  );

  // =========================================================
  // DATE FORMAT
  // =========================================================

  const formatDisplayDate = (value) => {
    if (!value) return '—';

    const date = new Date(`${value}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  // =========================================================
  // PERSONNEL NAME
  // =========================================================

  const getPersonnelName = (personnelId) => {
    if (!personnelId) return '—';

    const person = lookupsData.personnel.find(
      (item) => String(item.personnel_id) === String(personnelId)
    );
    if (!person) return '—';

    if (person.last_name || person.first_name) return [person.last_name, person.first_name].filter(Boolean).join(', ');
    return person.personnel_name || person.name || '—';
  };

  // =========================================================
  // RENDER TAB
  // =========================================================

  const renderTab = () => {
    const vehicleOptions = lookupsData.vehicles.filter((vehicle) => {
      const matchesCommodity = !form.commodity_type_id ||
        String(vehicle.commodity_type_id ?? '') === String(form.commodity_type_id);
      const matchesType = !form.vehicle_type_id ||
        String(vehicle.vehicle_type_id ?? '') === String(form.vehicle_type_id);
      return matchesCommodity && matchesType;
    });

    switch (activeTab) {
      // =====================================================
      // BOOKING INFORMATION
      // =====================================================

      case 'bookinginfo':
        return (
          <div style={{ padding: 18 }}>
            <fieldset style={{ border: '1px dashed #cbd5e1', borderRadius: 4, padding: 20, margin: 0 }}>
              <legend style={{ fontSize: 12, fontWeight: 500, color: '#2563eb', padding: '0 6px' }}>
                Booking #: <strong style={{ color: '#0f172a', fontSize: 13 }}>{form.booking_no || '—'}</strong>
              </legend>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 18 }}>
                <Field label="Delivery Date">
                  {renderReadOnly(formatDisplayDate(form.delivery_date))}
                </Field>
                <Field label="Completed Date & Time" required error={errors.completed_at}
                  style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0, gridColumn: '1 / -1' }}>
                  {renderInput('completed_at', '', 'datetime-local')}
                </Field>
                <Field label="Customer" required error={errors.customer_id}>
                  {renderSelect('customer_id', lookupsData.customers, 'customer_id', 'customer_name', '- Select Customer -', false)}
                </Field>
                <Field label="Booking Type" required error={errors.booking_type_id}>
                  {renderSelect('booking_type_id', lookupsData.bookingTypes, 'booking_type_id', 'book_type', '- Select Booking Type -')}
                </Field>
                <Field label="Depot" required error={errors.depot_id}>
                  {renderSelect('depot_id', lookupsData.depots, 'depot_id', 'depot_name', '- Select Depot -')}
                </Field>
                <Field label="Vehicle No." required error={errors.vehicle_id}>
                  {renderSelect('vehicle_id', vehicleOptions, 'vehicle_id', 'plate_no', '- Select Vehicle -', false, handleVehicleChange)}
                </Field>
                <Field label="Truck Type" required error={errors.vehicle_type_id}>
                  {renderSelect('vehicle_type_id', lookupsData.vehicleTypes, 'vehicle_type_id', 'vehicle_type', '- Select Truck Type -', false, handleVehicleTypeChange)}
                </Field>
                <Field label="Commodity Type" required error={errors.commodity_type_id}>
                  {renderSelect('commodity_type_id', lookupsData.commodityTypes, 'commodity_type_id', 'commodity_type', '- Select Commodity Type -', false, handleCommodityTypeChange)}
                </Field>
                <Field label="Travel Fund">
                  {renderInput('travel_fund', '0.00', 'number')}
                </Field>
                <Field label="Total Expenses">
                  <input type="text" value={totalExpenses} disabled style={readOnlyStyle} />
                </Field>
                <Field label="Return Fund">
                  <input type="text" value={returnFund} disabled style={readOnlyStyle} />
                </Field>
              </div>
            </fieldset>
          </div>
        );

      // =====================================================
      // CLIENT COST
      // =====================================================

      case 'clientcost':
        return (
          <div style={{ padding: 18 }}>
            <fieldset style={{ border: '1px dashed #cbd5e1', borderRadius: 4, padding: 20, margin: 0 }}>
              <legend style={{ fontSize: 12, fontWeight: 500, color: '#2563eb', padding: '0 6px' }}>
                Client Cost
              </legend>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 18 }}>
                <Field label="Origin" style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0, gridColumn: '1 / -1' }}>
                  {renderSelect('origin_id', lookupsData.origins, 'origin_id', 'origin_name', '- Select -', true)}
                </Field>
                <Field label="Farthest destination" required error={errors.farthest_destination_id}
                  style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0, gridColumn: '1 / -1' }}>
                  {renderSelect('farthest_destination_id', Array.isArray(bookingDetail?.booking_destinations)
                    ? bookingDetail.booking_destinations
                    : Array.isArray(bookingDetail?.destinations)
                      ? bookingDetail.destinations
                      : [], 'destination_id', 'destination_name', '- Select -')}
                </Field>
                <Field label="Client Rate" required error={errors.client_rate}>
                  {renderInput('client_rate', '0.00', 'number')}
                </Field>
                <Field label="No. of Trips" required error={errors.no_of_trips}>
                  {renderInput('no_of_trips', '1', 'number')}
                </Field>
                <Field label={<span>Total Amount <span title="Client Rate × No. of Trips" style={{ cursor: 'help', color: '#64748b' }}>ⓘ</span></span>}>
                  <input type="text" value={`₱ ${totalAmount}`} disabled style={{ ...readOnlyStyle, color: '#0f172a', fontWeight: 600 }} />
                </Field>
                <Field label="Subcon Rate" style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0, gridColumn: '1 / -1' }}>
                  {renderInput('subcon_rate', '0.00', 'number')}
                </Field>
              </div>
            </fieldset>
          </div>
        );

      // =====================================================
      // EXPENSES
      // =====================================================
      case 'expenses':
        return (
          <div>
            <button type="button" onClick={() => setExpenseTab('b_expenses')} style={{ marginRight: 10, padding: '12px 12px', marginLeft: 23, borderRadius: 6, border: '1px solid #000000', background: expenseTab === 'b_expenses' ? '#0a8533' : '#0fb145', color: expenseTab === 'b_expenses' ? '#fff' : '#ffffff', cursor: 'pointer' }}>
              Billable Expenses
            </button>
            <button type="button" onClick={() => setExpenseTab('nb_expenses')} style={{ marginRight: 10, padding: '12px 12px', borderRadius: 6, border: '1px solid #000000', background: expenseTab === 'nb_expenses' ? '#7e1515' : '#ff0000', color: expenseTab === 'nb_expenses' ? '#fff' : '#ffffff', cursor: 'pointer' }}>
              Non-Billable Expenses
            </button>
            {expenseTab === 'b_expenses' && (
              <div>
                <div style={{ padding: 18 }}>
                  <fieldset style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 14, marginBottom: 18 }}>
                    <legend style={{ fontSize: 13, fontWeight: 600, color: '#2563eb', padding: '0 6px' }}>
                      Billable Expenses
                    </legend>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                      <Field label="Gas">
                        {renderInput('b_gas', 'e.g. 1000', 'number')}
                      </Field>
                      <Field label="Parking Fee">
                        {renderInput('b_parking_fee', 'e.g. 500', 'number')}
                      </Field>
                      <Field label="Toll Fee">
                        {renderInput('b_toll_fee', 'e.g. 200', 'number')}
                      </Field>
                      <Field label="Entrance Fee">
                        {renderInput('b_entrance_fee', 'e.g. 300', 'number')}
                      </Field>
                      <Field label="Mano">
                        {renderInput('b_mano', 'e.g. 300', 'number')}
                      </Field>
                      <Field label="Standard Operating Procedure (SOP)">
                        {renderInput('b_SOP', 'e.g. 300', 'number')}
                      </Field>
                      <Field label="Demurrage Fee">
                        {renderInput('b_demurrage_fee', 'e.g. 300', 'number')}
                      </Field>
                      <Field label="Extra Drop Fee">
                        {renderInput('b_extra_drop_fee', 'e.g. 500', 'number')}
                      </Field>
                      <Field label="Backload Fee">
                        {renderInput('b_backload_fee', 'e.g. 500', 'number')}
                      </Field>
                      </div>
                    </fieldset>
                </div>
              </div>
            )}
            {expenseTab === 'nb_expenses' && (
              <div>
                <div style={{ padding: 18 }}>
                  <fieldset style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 14, marginBottom: 18 }}>
                    <legend style={{ fontSize: 13, fontWeight: 600, color: '#2563eb', padding: '0 6px' }}>
                      Non-Billable Expenses
                    </legend>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                     <Field label="Gas">
                        {renderInput('nb_gas', 'e.g. 1000', 'number')}
                      </Field>
                      <Field label="Parking Fee">
                        {renderInput('nb_parking_fee', 'e.g. 500', 'number')}
                      </Field>
                      <Field label="Toll Fee">
                        {renderInput('nb_toll_fee', 'e.g. 200', 'number')}
                      </Field>
                      <Field label="Entrance Fee">
                        {renderInput('nb_entrance_fee', 'e.g. 300', 'number')}
                      </Field>
                      <Field label="Mano">
                        {renderInput('nb_mano', 'e.g. 300', 'number')}
                      </Field>
                      <Field label="Standard Operating Procedure (SOP)">
                        {renderInput('nb_SOP', 'e.g. 300', 'number')}
                      </Field>
                      <Field label="Demurrage Fee">
                        {renderInput('nb_demurrage_fee', 'e.g. 300', 'number')}
                      </Field>
                      <Field label="Extra Drop Fee">
                        {renderInput('nb_extra_drop_fee', 'e.g. 500', 'number')}
                      </Field>
                      <Field label="Backload Fee">
                        {renderInput('nb_backload_fee', 'e.g. 500', 'number')}
                      </Field>
                    </div>
                  </fieldset>
                </div>
              </div>
            )}
          </div>
        );

      // =====================================================
      // PERSONNEL FEE
      // =====================================================

      case 'personnelfee':
        return (
          <div style={{ padding: 18 }}>
            <fieldset style={{ border: '1px dashed #cbd5e1', borderRadius: 4, padding: 20, margin: 0 }}>
              <legend style={{ fontSize: 12, fontWeight: 500, color: '#2563eb', padding: '0 6px' }}>
                Personnel Fee
              </legend>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 18 }}>
                <Field label="Driver">{renderReadOnly(getPersonnelName(form.driver_id))}</Field>
                <Field label="Driver Gross Rate" error={errors.driver_rate}>
                  {renderInput('driver_rate', '0.00', 'number')}
                </Field>
                <Field label="Driver Cash Advance">
                  {renderInput('driver_allowance', '0.00', 'number')}
                </Field>
                <Field label="Driver Net Rate">
                  {renderReadOnly(netRate(form.driver_rate, form.driver_allowance))}
                </Field>
                {form.helper1_id && (
                  <>
                    <Field label="Helper 1">{renderReadOnly(getPersonnelName(form.helper1_id))}</Field>
                    <Field label="Helper 1 Gross Rate" required error={errors.helper1_rate}>
                      {renderInput('helper1_rate', '0.00', 'number')}
                    </Field>
                    <Field label="Helper 1 Cash Advance">
                      {renderInput('helper1_allowance', '0.00', 'number')}
                    </Field>
                    <Field label="Helper 1 Net Rate">
                      {renderReadOnly(netRate(form.helper1_rate, form.helper1_allowance))}
                    </Field>
                  </>
                )}
                {form.helper2_id && (
                  <>
                    <Field label="Helper 2">{renderReadOnly(getPersonnelName(form.helper2_id))}</Field>
                    <Field label="Helper 2 Gross Rate" error={errors.helper2_rate}>
                      {renderInput('helper2_rate', '0.00', 'number')}
                    </Field>
                    <Field label="Helper 2 Cash Advance">
                      {renderInput('helper2_allowance', '0.00', 'number')}
                    </Field>
                    <Field label="Helper 2 Net Rate">
                      {renderReadOnly(netRate(form.helper2_rate, form.helper2_allowance))}
                    </Field>
                  </>
                )}
              </div>
            </fieldset>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  const busy = submitting || saving;

  return (
    <div
      className="modal-overlay"
      onClick={() => { if (!busy) onClose(); }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(17, 24, 39, 0.5)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '2vh 2vw',
        overflow: 'auto',
      }}
    >
      <div
        className="modal"
        style={{
          background: '#fff',
          borderRadius: 10,
          width: '100%',
          maxWidth: 1100,
          maxHeight: '96vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          overflow: 'hidden',
        }}
        onClick={(event) => event.stopPropagation()}
      >
        {/* HEADER */}
        <div className="modal-header">
          <h3 style={{ fontSize: 18 }}>Update status to COMPLETED</h3>
          <button type="button" className="modal-close" onClick={onClose} disabled={busy}>
            <X size={18} />
          </button>
        </div>

        {/* BODY HEADER */}
        <div style={{ padding: '14px 20px 0' }}>
          {/* IMPORTANT BANNER */}
          <div className="reminder-banner" style={{
            background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca',
            borderRadius: 4, fontSize: 13, marginBottom: 14, padding: '12px 16px', lineHeight: 1.5,
          }}>
            <strong>⚠ IMPORTANT!</strong><br />
            Please review the associated rates for this shipment before pressing{' '}
            <strong>'Submit'</strong>{' '}
            button. Make sure to check the farthest destination of the shipment.
          </div>

          {/* TOAST */}
          {toast.msg && (
            <div style={{
              marginBottom: 14, padding: '10px 12px', borderRadius: 6, fontSize: 13,
              background: toast.type === 'error' ? '#fef2f2' : '#f0fdf4',
              border: toast.type === 'error' ? '1px solid #fecaca' : '1px solid #bbf7d0',
              color: toast.type === 'error' ? '#991b1b' : '#166534',
            }}>
              {toast.msg}
            </div>
          )}

          {/* TABS */}
          <div className="tabs" style={{ marginBottom: 0 }}>
            {TABS.map((tab) => (
              <button key={tab.key} type="button" className={activeTab === tab.key ? 'active' : ''}
                onClick={() => setActiveTab(tab.key)} disabled={busy}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* FORM */}
        <form style={{ display: 'flex', flex: 1, flexDirection: 'column', minHeight: 0 }}
          onSubmit={(event) => { event.preventDefault(); handleSave(); }}>
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 20px 0' }}>
            {renderTab()}
          </div>

          {/* FOOTER */}
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>
              <X size={14} /> Cancel
            </button>
            {!viewOnly && (
              <button type="submit" className="btn btn-primary" disabled={busy}>
                {busy ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Save size={14} />
                )}
                {busy ? 'Saving…' : 'Confirm'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}