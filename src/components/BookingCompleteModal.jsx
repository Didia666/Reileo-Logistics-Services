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
    <div
      style={
        style || {
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          minWidth: 0,
        }
      }
    >
      <label
        style={{
          fontSize: 13,
          color: '#374151',
          fontWeight: 500,
        }}
      >
        {label}
        {required && (
          <span
            style={{
              color: '#dc2626',
              marginLeft: 2,
            }}
          >
            *
          </span>
        )}
      </label>

      {children}

      {hint && !error && (
        <div
          style={{
            fontSize: 11,
            color: '#6b7280',
          }}
        >
          {hint}
        </div>
      )}

      {error && (
        <div
          style={{
            fontSize: 12,
            color: '#dc2626',
          }}
        >
          {error}
        </div>
      )}
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

  const [submitting, setSubmitting] = useState(false);

  const [toast, setToast] = useState({
    type: '',
    msg: '',
  });

  const [lookupsData, setLookupsData] = useState({
    customers: [],
    bookingTypes: [],
    depots: [],
    vehicles: [],
    vehicleTypes: [],
    commodityTypes: [],
    origins: [],
    destination: [],
    personnel: [],
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
    toll_fees: '0.00',
    extra_drop: '0.00',
    extra_helper: '0.00',
    other_expenses: '0.00',


    // =========================================================
    // EXPENSES - NON-BILLABLE
    // =========================================================
    parking_fees: '0.00',
    toll_fees_non_billable: '0.00',
    demurrage_fees: '0.00',
    backload_fees: '0.00',
    other_deductions: '0.00',


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

    return String(value)
      .replace(' ', 'T')
      .slice(0, 16);
  };


  // =========================================================
  // LOOKUPS
  // =========================================================

  const loadLookups = async () => {
    try {
      const [
        customers,
        bookingTypes,
        depots,
        vehicles,
        vehicleTypes,
        commodityTypes,
        origins,
        destination,
        personnel,
      ] = await Promise.all([
        lookupApi.customers
          ? lookupApi.customers().catch(() => [])
          : Promise.resolve([]),

        lookupApi.bookingTypes
          ? lookupApi.bookingTypes().catch(() => [])
          : Promise.resolve([]),

        lookupApi.depots
          ? lookupApi.depots().catch(() => [])
          : Promise.resolve([]),

        lookupApi.vehicles
          ? lookupApi.vehicles().catch(() => [])
          : Promise.resolve([]),

        lookupApi.vh_types
          ? lookupApi.vh_types().catch(() => [])
          : Promise.resolve([]),

        lookupApi.commodity_type
          ? lookupApi.commodity_type().catch(() => [])
          : Promise.resolve([]),

        lookupApi.origins
          ? lookupApi.origins().catch(() => [])
          : Promise.resolve([]),

        lookupApi.destination
          ? lookupApi.destination().catch(() => [])
          : Promise.resolve([]),

        lookupApi.personnel
          ? lookupApi.personnel().catch(() => [])
          : Promise.resolve([]),
      ]);


      const normalize = (data) =>
        Array.isArray(data)
          ? data
          : (data?.data || []);


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
        customers: [],
        bookingTypes: [],
        depots: [],
        vehicles: [],
        vehicleTypes: [],
        commodityTypes: [],
        origins: [],
        destination: [],
        personnel: [],
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
    const assignments = detail.personnel_assignments || [];


    const nextForm = {
      ...blankForm,


      // =====================================================
      // BOOKING INFORMATION
      // =====================================================

      booking_no:
        detail.booking_no ||
        booking?.booking_no ||
        '',

      delivery_date:
        detail.delivery_date ||
        booking?.delivery_date ||
        '',

      completed_at:
        normalizeDateTime(detail.completed_at) ||
        getLocalDateTime(),

      customer_name:
        detail.customer_name ||
        booking?.customer_name ||
        '',

      customer_id:
        detail.customer_id ??
        booking?.customer_id ??
        '',

      booking_type:
        detail.book_type ||
        detail.booking_type ||
        booking?.booking_type ||
        '',

      booking_type_id:
        detail.booking_type_id ??
        booking?.booking_type_id ??
        '',

      depot_name:
        detail.depot_name ||
        booking?.depot_name ||
        '',

      depot_id:
        detail.depot_id ??
        booking?.depot_id ??
        '',

      vehicle_id:
        detail.vehicle_id ||
        booking?.vehicle_id ||
        '',

      plate_no:
        detail.plate_no ||
        booking?.plate_no ||
        '',

      vehicle_type:
        detail.vehicle_type ||
        detail.truck_type ||
        '',

      vehicle_type_id:
        detail.vehicle_type_id ??
        booking?.vehicle_type_id ??
        '',

      commodity_type:
        detail.commodity_type ||
        '',

      commodity_type_id:
        detail.commodity_type_id ??
        booking?.commodity_type_id ??
        '',


      // =====================================================
      // CLIENT COST
      // =====================================================

      origin_id:
        detail.origin_id ||
        '',

      farthest_destination_id:
        detail.farthest_destination_id ||
        detail.destination_id ||
        '',

      client_rate:
        detail.client_rate ?? '',

      no_of_trips:
        detail.no_of_trips ??
        detail.trips_number ??
        '1',

      subcon_rate:
        detail.subcon_rate ?? '',


      // =====================================================
      // EXPENSES - BILLABLE
      // =====================================================

      toll_fees:
        detail.toll_fees ??
        detail.b_toll_fees ??
        '0.00',

      extra_drop:
        detail.extra_drop ??
        detail.b_extra_drop ??
        '0.00',

      extra_helper:
        detail.extra_helper ??
        detail.b_extra_helper ??
        '0.00',

      other_expenses:
        detail.other_expenses ??
        detail.b_other_fees ??
        '0.00',


      // =====================================================
      // EXPENSES - NON-BILLABLE
      // =====================================================

      parking_fees:
        detail.parking_fees ??
        detail.nb_parking_fees ??
        '0.00',

      toll_fees_non_billable:
        detail.toll_fees_non_billable ??
        detail.nb_toll_fees ??
        '0.00',

      demurrage_fees:
        detail.demurrage_fees ??
        detail.nb_demurrage_fees ??
        '0.00',

      backload_fees:
        detail.backload_fees ??
        detail.nb_backload_fees ??
        '0.00',

      other_deductions:
        detail.other_deductions ??
        detail.nb_other_deduction ??
        '0.00',


      // =====================================================
      // PERSONNEL
      // =====================================================

      driver_id:
        detail.driver_id ||
        personnelIdForRole(assignments, 'driver'),

      helper1_id:
        detail.helper1_id ||
        personnelIdForRole(assignments, 'helper1'),

      helper2_id:
        detail.helper2_id ||
        personnelIdForRole(assignments, 'helper2'),

      driver_rate:
        detail.driver_rate ?? '',

      driver_allowance:
        detail.driver_allowance ?? '0.00',

      helper1_rate:
        detail.helper1_rate ??
        detail.helper_rate ??
        '',

      helper1_allowance:
        detail.helper1_allowance ??
        detail.helper_allowance ??
        '0.00',

      helper2_rate:
        detail.helper2_rate ?? '',

      helper2_allowance:
        detail.helper2_allowance ?? '0.00',
    };


    if (!cancelled) {
      setForm(nextForm);
    }


    return () => {
      cancelled = true;
    };
  }, [isOpen, booking, bookingDetail]);


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

  const totalAmount = (
    clientRate * numberOfTrips
  ).toFixed(2);


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
      /*
       * Keep the completed payload compatible with the
       * existing CompleteBookingModal/onConfirm flow.
       *
       * The values are normalized here before being sent
       * back to the parent.
       */
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
        origin_id: form.origin_id
          ? Number(form.origin_id)
          : null,

        farthest_destination_id: form.farthest_destination_id
          ? Number(form.farthest_destination_id)
          : null,

        client_rate: form.client_rate !== ''
          ? Number(form.client_rate)
          : null,

        no_of_trips: form.no_of_trips
          ? Number(form.no_of_trips)
          : null,

        total_amount: Number(totalAmount),

        subcon_rate: form.subcon_rate !== ''
          ? Number(form.subcon_rate)
          : null,
      },

      expenses: {
        toll_fees: form.toll_fees !== ''
          ? Number(form.toll_fees)
          : 0,

        extra_drop: form.extra_drop !== ''
          ? Number(form.extra_drop)
          : 0,

        extra_helper: form.extra_helper !== ''
          ? Number(form.extra_helper)
          : 0,

        other_expenses: form.other_expenses !== ''
          ? Number(form.other_expenses)
          : 0,

        parking_fees: form.parking_fees !== ''
          ? Number(form.parking_fees)
          : 0,

        toll_fees_non_billable: form.toll_fees_non_billable !== ''
          ? Number(form.toll_fees_non_billable)
          : 0,

        demurrage_fees: form.demurrage_fees !== ''
          ? Number(form.demurrage_fees)
          : 0,

        backload_fees: form.backload_fees !== ''
          ? Number(form.backload_fees)
          : 0,

        other_deductions: form.other_deductions !== ''
          ? Number(form.other_deductions)
          : 0,
      },

      personnel: [
        {
          personnel_id: form.driver_id
            ? Number(form.driver_id)
            : null,
          assignment_role: 'driver',
          rate: form.driver_rate !== ''
            ? Number(form.driver_rate)
            : null,
          allowance: form.driver_allowance !== ''
            ? Number(form.driver_allowance)
            : null,
        },
        {
          personnel_id: form.helper1_id
            ? Number(form.helper1_id)
            : null,
          assignment_role: 'helper1',
          rate: form.helper1_rate !== ''
            ? Number(form.helper1_rate)
            : null,
          allowance: form.helper1_allowance !== ''
            ? Number(form.helper1_allowance)
            : null,
        },
        {
          personnel_id: form.helper2_id
            ? Number(form.helper2_id)
            : null,
          assignment_role: 'helper2',
          rate: form.helper2_rate !== ''
            ? Number(form.helper2_rate)
            : null,
          allowance: form.helper2_allowance !== ''
            ? Number(form.helper2_allowance)
            : null,
        },
      ],
    };


      if (typeof onConfirm === 'function') {
        await onConfirm(payload);
      }


      setToast({
        type: 'success',
        msg: 'Booking completed successfully.',
      });
    } catch (error) {
      setToast({
        type: 'error',
        msg:
          error?.message ||
          'Failed to complete booking.',
      });
    } finally {
      setSubmitting(false);
    }
  };


  // =========================================================
  // RENDER INPUT
  // =========================================================

  const renderInput = (
    path,
    placeholder = '',
    type = 'text',
    disabled = false
  ) => {
    const value =
      path
        .split('.')
        .reduce(
          (object, key) => (object || {})[key],
          form
        ) ?? '';


    return (
      <input
        type={type}
        disabled={
          viewOnly ||
          disabled ||
          submitting ||
          saving
        }
        style={
          viewOnly || disabled
            ? readOnlyStyle
            : inputStyle
        }
        value={value}
        placeholder={placeholder}
        step={type === 'number' ? '0.01' : undefined}
        min={type === 'number' ? '0' : undefined}
        onChange={(event) =>
          setField(path, event.target.value)
        }
      />
    );
  };


  // =========================================================
  // RENDER SELECT
  // =========================================================

  const renderSelect = (
    path,
    options,
    valueKey,
    labelKey,
    placeholder = '- Select -',
    disabled = false,
    onChange = null
  ) => {
    const value =
      path
        .split('.')
        .reduce(
          (object, key) => (object || {})[key],
          form
        ) ?? '';


    const safeOptions =
      Array.isArray(options)
        ? options
        : [];


    return (
      <select
        disabled={
          viewOnly ||
          disabled ||
          submitting ||
          saving
        }
        style={
          viewOnly || disabled
            ? readOnlyStyle
            : inputStyle
        }
        value={value}
        onChange={(event) => {
          if (onChange) {
            onChange(event);
          } else {
            setField(
              path,
              event.target.value
            );
          }
        }}
      >
        <option value="">
          {placeholder}
        </option>

        {safeOptions.map(
          (option, index) => {
            const optionValue =
              option[valueKey];

            const optionKey =
              optionValue !== undefined &&
              optionValue !== null &&
              optionValue !== ''
                ? `${optionValue}-${index}`
                : `option-${index}`;


            return (
              <option
                key={optionKey}
                value={optionValue ?? ''}
              >
                {option[labelKey]}
              </option>
            );
          }
        )}
      </select>
    );
  };


  // =========================================================
  // RENDER TEXTAREA
  // =========================================================

  const renderTextarea = (
    path,
    placeholder = '',
    rows = 3,
    disabled = false
  ) => {
    const value =
      path
        .split('.')
        .reduce(
          (object, key) => (object || {})[key],
          form
        ) ?? '';


    return (
      <textarea
        disabled={
          viewOnly ||
          disabled ||
          submitting ||
          saving
        }
        style={{
          ...(viewOnly || disabled
            ? readOnlyStyle
            : inputStyle),
          resize: 'vertical',
        }}
        value={value}
        rows={rows}
        placeholder={placeholder}
        onChange={(event) =>
          setField(
            path,
            event.target.value
          )
        }
      />
    );
  };


  // renderTextarea is intentionally kept here to follow
  // the same reusable form structure as the Delivered modal.
  void renderTextarea;


  // =========================================================
  // READ-ONLY DISPLAY
  // =========================================================

  const renderReadOnly = (
    value,
    placeholder = '—'
  ) => (
    <input
      type="text"
      value={
        value !== null &&
        value !== undefined &&
        value !== ''
          ? value
          : placeholder
      }
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


    return date.toLocaleDateString(
      'en-US',
      {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }
    );
  };


  // =========================================================
  // PERSONNEL NAME
  // =========================================================

  const getPersonnelName = (personnelId) => {
    if (!personnelId) return '—';


    const person =
      lookupsData.personnel.find(
        (item) =>
          String(item.personnel_id) ===
          String(personnelId)
      );


    if (!person) return '—';


    if (
      person.last_name ||
      person.first_name
    ) {
      return [
        person.last_name,
        person.first_name,
      ]
        .filter(Boolean)
        .join(', ');
    }


    return (
      person.personnel_name ||
      person.name ||
      '—'
    );
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
          <div
            style={{
              padding: 18,
            }}
          >
            <fieldset
              style={{
                border:
                  '1px dashed #cbd5e1',
                borderRadius: 4,
                padding: 20,
                margin: 0,
              }}
            >
              <legend
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: '#2563eb',
                  padding: '0 6px',
                }}
              >
                Booking #:{' '}
                <strong
                  style={{
                    color: '#0f172a',
                    fontSize: 13,
                  }}
                >
                  {form.booking_no || '—'}
                </strong>
              </legend>


              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    '1fr 1fr 1fr',
                  gap: 18,
                }}
              >
                <Field label="Delivery Date">
                  {renderReadOnly(
                    formatDisplayDate(
                      form.delivery_date
                    )
                  )}
                </Field>


                <Field
                  label="Completed Date & Time"
                  required
                  error={errors.completed_at}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    minWidth: 0,
                    gridColumn: '1 / -1',
                  }}
                >
                  {renderInput(
                    'completed_at',
                    '',
                    'datetime-local'
                  )}
                </Field>


                <Field label="Customer" required error={errors.customer_id}>
                  {renderSelect(
                    'customer_id',
                    lookupsData.customers,
                    'customer_id',
                    'customer_name',
                    '- Select Customer -',
                    false
                  )}
                </Field>


                <div />


                <Field label="Booking Type" required error={errors.booking_type_id}>
                  {renderSelect(
                    'booking_type_id',
                    lookupsData.bookingTypes,
                    'booking_type_id',
                    'book_type',
                    '- Select Booking Type -'
                  )}
                </Field>


                <Field label="Depot" required error={errors.depot_id}>
                  {renderSelect(
                    'depot_id',
                    lookupsData.depots,
                    'depot_id',
                    'depot_name',
                    '- Select Depot -'
                  )}
                </Field>


                <Field label="Vehicle No." required error={errors.vehicle_id}>
                  {renderSelect(
                    'vehicle_id',
                    vehicleOptions,
                    'vehicle_id',
                    'plate_no',
                    '- Select Vehicle -',
                    false,
                    handleVehicleChange
                  )}
                </Field>


                <Field label="Truck Type" required error={errors.vehicle_type_id}>
                  {renderSelect(
                    'vehicle_type_id',
                    lookupsData.vehicleTypes,
                    'vehicle_type_id',
                    'vehicle_type',
                    '- Select Truck Type -',
                    false,
                    handleVehicleTypeChange
                  )}
                </Field>


                <Field label="Commodity Type" required error={errors.commodity_type_id}>
                  {renderSelect(
                    'commodity_type_id',
                    lookupsData.commodityTypes,
                    'commodity_type_id',
                    'commodity_type',
                    '- Select Commodity Type -',
                    false,
                    handleCommodityTypeChange
                  )}
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
          <div
            style={{
              padding: 18,
            }}
          >
            <fieldset
              style={{
                border:
                  '1px dashed #cbd5e1',
                borderRadius: 4,
                padding: 20,
                margin: 0,
              }}
            >
              <legend
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: '#2563eb',
                  padding: '0 6px',
                }}
              >
                Client Cost
              </legend>


              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    '1fr 1fr 1fr',
                  gap: 18,
                }}
              >
                <Field
                  label="Origin"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    minWidth: 0,
                    gridColumn: '1 / -1',
                  }}
                >
                  {renderSelect(
                    'origin_id',
                    lookupsData.origins,
                    'origin_id',
                    'origin_name',
                    '- Select -',
                    true
                  )}
                </Field>


                <Field
                  label="Farthest destination"
                  required
                  error={
                    errors.farthest_destination_id
                  }
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    minWidth: 0,
                    gridColumn: '1 / -1',
                  }}
                >
                  {renderSelect(
                    'farthest_destination_id',
                    lookupsData.destination,
                    'destination_id',
                    'destination_name',
                    '- Select -'
                  )}
                </Field>


                <Field
                  label="Client Rate"
                  required
                  error={errors.client_rate}
                >
                  {renderInput(
                    'client_rate',
                    '0.00',
                    'number'
                  )}
                </Field>


                <Field
                  label="No. of Trips"
                  required
                  error={errors.no_of_trips}
                >
                  {renderInput(
                    'no_of_trips',
                    '1',
                    'number'
                  )}
                </Field>


                <Field
                  label={
                    <span>
                      Total Amount{' '}
                      <span
                        title="Client Rate × No. of Trips"
                        style={{
                          cursor: 'help',
                          color: '#64748b',
                        }}
                      >
                        ⓘ
                      </span>
                    </span>
                  }
                >
                  <input
                    type="text"
                    value={`₱ ${totalAmount}`}
                    disabled
                    style={{
                      ...readOnlyStyle,
                      color: '#0f172a',
                      fontWeight: 600,
                    }}
                  />
                </Field>


                <Field
                  label="Subcon Rate"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    minWidth: 0,
                    gridColumn: '1 / -1',
                  }}
                >
                  {renderInput(
                    'subcon_rate',
                    '0.00',
                    'number'
                  )}
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
          <div
            style={{
              padding: 18,
            }}
          >
            <fieldset
              style={{
                border:
                  '1px dashed #cbd5e1',
                borderRadius: 4,
                padding: 20,
                margin: 0,
              }}
            >
              <legend
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: '#2563eb',
                  padding: '0 6px',
                }}
              >
                Expenses
              </legend>


              {/* BILLABLE */}
              <fieldset
                style={{
                  border:
                    '1px dashed #cbd5e1',
                  borderRadius: 4,
                  padding: 14,
                  marginBottom: 14,
                }}
              >
                <legend
                  style={{
                    fontSize: 12,
                    color: '#3b82f6',
                    padding: '0 6px',
                  }}
                >
                  Billable
                </legend>


                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      '1fr 1fr 1fr',
                    gap: 18,
                  }}
                >
                  <Field label="Toll Fees">
                    {renderInput(
                      'toll_fees',
                      '0.00',
                      'number'
                    )}
                  </Field>


                  <Field label="Extra Drop">
                    {renderInput(
                      'extra_drop',
                      '0.00',
                      'number'
                    )}
                  </Field>


                  <Field label="Extra Helper">
                    {renderInput(
                      'extra_helper',
                      '0.00',
                      'number'
                    )}
                  </Field>


                  <Field label="Other Expenses/Fees">
                    {renderInput(
                      'other_expenses',
                      '0.00',
                      'number'
                    )}
                  </Field>
                </div>
              </fieldset>


              {/* NON-BILLABLE */}
              <fieldset
                style={{
                  border:
                    '1px dashed #cbd5e1',
                  borderRadius: 4,
                  padding: 14,
                  margin: 0,
                }}
              >
                <legend
                  style={{
                    fontSize: 12,
                    color: '#64748b',
                    padding: '0 6px',
                  }}
                >
                  Non-Billable
                </legend>


                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      '1fr 1fr 1fr',
                    gap: 18,
                  }}
                >
                  <Field label="Parking Fees">
                    {renderInput(
                      'parking_fees',
                      '0.00',
                      'number'
                    )}
                  </Field>


                  <Field label="Toll Fees-Non Billable">
                    {renderInput(
                      'toll_fees_non_billable',
                      '0.00',
                      'number'
                    )}
                  </Field>


                  <Field label="Demurrage Fees">
                    {renderInput(
                      'demurrage_fees',
                      '0.00',
                      'number'
                    )}
                  </Field>


                  <Field label="Backload Fees">
                    {renderInput(
                      'backload_fees',
                      '0.00',
                      'number'
                    )}
                  </Field>


                  <Field label="Other Deductions">
                    {renderInput(
                      'other_deductions',
                      '0.00',
                      'number'
                    )}
                  </Field>
                </div>
              </fieldset>
            </fieldset>
          </div>
        );


      // =====================================================
      // PERSONNEL FEE
      // =====================================================

      case 'personnelfee':
        return (
          <div
            style={{
              padding: 18,
            }}
          >
            <fieldset
              style={{
                border:
                  '1px dashed #cbd5e1',
                borderRadius: 4,
                padding: 20,
                margin: 0,
              }}
            >
              <legend
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: '#2563eb',
                  padding: '0 6px',
                }}
              >
                Personnel Fee
              </legend>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: 18,
                }}
              >
                <Field label="Driver">
                  {renderReadOnly(getPersonnelName(form.driver_id))}
                </Field>
                <Field label="Driver Rate" error={errors.driver_rate}>
                  {renderInput('driver_rate', '0.00', 'number')}
                </Field>
                <Field label="Driver Allowance">
                  {renderInput('driver_allowance', '0.00', 'number')}
                </Field>

                {form.helper1_id && (
                  <>
                    <Field label="Helper 1">
                      {renderReadOnly(getPersonnelName(form.helper1_id))}
                    </Field>
                    <Field
                      label="Helper 1 Rate"
                      required
                      error={errors.helper1_rate}
                    >
                      {renderInput('helper1_rate', '0.00', 'number')}
                    </Field>
                    <Field label="Helper 1 Allowance">
                      {renderInput('helper1_allowance', '0.00', 'number')}
                    </Field>
                  </>
                )}

                {form.helper2_id && (
                  <>
                    <Field label="Helper 2">
                      {renderReadOnly(getPersonnelName(form.helper2_id))}
                    </Field>
                    <Field label="Helper 2 Rate" error={errors.helper2_rate}>
                      {renderInput('helper2_rate', '0.00', 'number')}
                    </Field>
                    <Field label="Helper 2 Allowance">
                      {renderInput('helper2_allowance', '0.00', 'number')}
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
      onClick={() => {
        if (!busy) onClose();
      }}
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
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        {/* ===================================================
            HEADER
        =================================================== */}
        <div className="modal-header">
          <h3 style={{ fontSize: 18 }}>
            Update status to COMPLETED
          </h3>

          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            disabled={busy}
          >
            <X size={18} />
          </button>
        </div>


        {/* ===================================================
            BODY HEADER
        =================================================== */}
        <div
          style={{
            padding: '14px 20px 0',
          }}
        >
          {/* IMPORTANT BANNER */}
          <div
            className="reminder-banner"
            style={{
              background: '#fef2f2',
              color: '#991b1b',
              border: '1px solid #fecaca',
              borderRadius: 4,
              fontSize: 13,
              marginBottom: 14,
              padding: '12px 16px',
              lineHeight: 1.5,
            }}
          >
            <strong>
              ⚠ IMPORTANT!
            </strong>

            <br />

            Please review the associated rates
            for this shipment before pressing{' '}
            <strong>
              'Submit'
            </strong>{' '}
            button. Make sure to check the
            farthest destination of the shipment.
          </div>


          {/* TOAST */}
          {toast.msg && (
            <div
              style={{
                marginBottom: 14,
                padding: '10px 12px',
                borderRadius: 6,
                fontSize: 13,

                background:
                  toast.type === 'error'
                    ? '#fef2f2'
                    : '#f0fdf4',

                border:
                  toast.type === 'error'
                    ? '1px solid #fecaca'
                    : '1px solid #bbf7d0',

                color:
                  toast.type === 'error'
                    ? '#991b1b'
                    : '#166534',
              }}
            >
              {toast.msg}
            </div>
          )}


          {/* TABS */}
          <div
            className="tabs"
            style={{
              marginBottom: 0,
            }}
          >
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={
                  activeTab === tab.key
                    ? 'active'
                    : ''
                }
                onClick={() =>
                  setActiveTab(tab.key)
                }
                disabled={busy}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>


        {/* ===================================================
            FORM
        =================================================== */}
        <form
          style={{
            display: 'flex',
            flex: 1,
            flexDirection: 'column',
            minHeight: 0,
          }}
          onSubmit={(event) => {
            event.preventDefault();
            handleSave();
          }}
        >
          <div
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              padding: '0 20px 0',
            }}
          >
            {renderTab()}
          </div>


          {/* =================================================
              FOOTER
          ================================================= */}
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              disabled={busy}
            >
              <X size={14} />
              Cancel
            </button>


            {!viewOnly && (
              <button
                type="submit"
                className="btn btn-primary"
                disabled={busy}
              >
                {busy ? (
                  <Loader2
                    size={14}
                    className="animate-spin"
                  />
                ) : (
                  <Save size={14} />
                )}

                {busy
                  ? 'Saving…'
                  : 'Confirm'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}