import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { bookings, lookups } from '../services/api.js';
import {
  Save,
  Loader2,
  Plus,
  X,
  RefreshCw,
  CloudUpload,
  Info,
  XCircle,
} from 'lucide-react';

const DEFAULT_ITEM = {
  item_type_id: '',
  item_description: '',
  length_cm: '',
  width_cm: '',
  height_cm: '',
  weight_kg: '',
};

const FALLBACK_ITEM_TYPES = [
  { item_type_id: 1, item_type: 'Boxes/Crates' },
  { item_type_id: 2, item_type: 'Pallets' },
  { item_type_id: 3, item_type: 'Drums' },
  { item_type_id: 4, item_type: 'General Cargo' },
];

const FALLBACK_TRUCK_TYPES = [
  { category_type_id: 1, category_type: '6W Van' },
  { category_type_id: 2, category_type: '10W Wing Van' },
  { category_type_id: 3, category_type: '6W Closed Van' },
];

export default function BookingForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [toast, setToast] = useState({
    type: '',
    msg: '',
  });

  const [form, setForm] = useState({
    plate_no: '',
    body_no: '',
    status_id: '',
    vehicle_type_id: '',
    vehicle_manufacturer_id: '',
    vehicle_model_id: '',
    year: '',
    commodity_type_id: '1',
    asset_no: '',
    category_type_id: '',
    vendor_id: '',
    destination_id: '',
    vehicle_id: '',
    truck_type_id: '',
    category_type: '',
    area: '',
    trip_allowance: '',
    fuel_liters: '',
    fuel_po: '',
    fuel_amount: '0.00',

    driver_id: '',
    driver_source: 'direct',
    driver_included_driver: false,

    helper1_id: '',
    helper1_source: 'direct',
    driver_included_h1: false,

    helper2_id: '',
    helper2_source: 'direct',
    driver_included_h2: false,

    remarks: '',
    client_ref_no: '',
    other_ref_no: '',
    remarks_2: '',

    items: [{ ...DEFAULT_ITEM }],
    photos: [null, null, null],
  });

  const [subcon, setSubcon] = useState(false);

  const [customers, setCustomers] = useState([]);
  const [bookingTypes, setBookingTypes] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [depots, setDepots] = useState([]);
  const [commodities, setCommodities] = useState([]);
  const [origins, setOrigins] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [personnel, setPersonnel] = useState([]);
  const [itemTypes, setItemTypes] = useState(FALLBACK_ITEM_TYPES);
  const [truckTypes, setTruckTypes] = useState(FALLBACK_TRUCK_TYPES);

  /*
   * ============================================================
   * HELPERS
   * ============================================================
   */

  const showToast = (type, msg) => {
    setToast({ type, msg });

    setTimeout(() => {
      setToast({ type: '', msg: '' });
    }, 4000);
  };

  const update = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  /*
   * ============================================================
   * BOOKING TYPE HELPERS
   * ============================================================
   *
   * The database uses `book_type`, while older API responses may
   * expose the same value as `booking_type`, `name`, `type`, or
   * `label`. Normalize all of those possibilities so the form
   * always has a consistent `booking_type` field to display.
   */

  const getBookingTypeId = (type) => {
    return (
      type?.booking_type_id ??
      type?.id ??
      ''
    );
  };

  const getBookingTypeName = (type) => {
    return (
      type?.booking_type ??
      type?.book_type ??
      type?.name ??
      type?.type ??
      type?.label ??
      ''
    );
  };

  /*
   * ============================================================
   * LOAD LOOKUPS
   * ============================================================
   */

  const loadLookups = async () => {
    try {
      const results = await Promise.allSettled([
        typeof lookups.customers === 'function'
          ? lookups.customers()
          : Promise.resolve([]),

        typeof lookups.bookingTypes === 'function'
          ? lookups.bookingTypes()
          : Promise.resolve([]),

        typeof lookups.bookingStatuses === 'function'
          ? lookups.bookingStatuses()
          : Promise.resolve([]),

        typeof lookups.depots === 'function'
          ? lookups.depots()
          : Promise.resolve([]),

        typeof lookups.commodities === 'function'
          ? lookups.commodities()
          : Promise.resolve([]),

        typeof lookups.origins === 'function'
          ? lookups.origins()
          : Promise.resolve([]),

        typeof lookups.destinations === 'function'
          ? lookups.destinations()
          : Promise.resolve([]),

        typeof lookups.personnel === 'function'
          ? lookups.personnel()
          : Promise.resolve([]),

        typeof lookups.item_types === 'function'
          ? lookups.item_types()
          : Promise.resolve([]),

        typeof lookups.category_types === 'function'
          ? lookups.category_types()
          : Promise.resolve([]),
      ]);

      const getResult = (index) => {
        const result = results[index];

        if (result.status !== 'fulfilled') {
          console.warn(
            `Lookup ${index} failed:`,
            result.reason
          );

          return [];
        }

        // Normal API response: [...]
        if (Array.isArray(result.value)) {
          return result.value;
        }

        // Also support: { data: [...] }
        if (Array.isArray(result.value?.data)) {
          return result.value.data;
        }

        // Also support: { rows: [...] }
        if (Array.isArray(result.value?.rows)) {
          return result.value.rows;
        }

        return [];
      };

      const c = getResult(0);
      const bt = getResult(1);
      const s = getResult(2);
      const d = getResult(3);
      const cm = getResult(4);
      const o = getResult(5);
      const dst = getResult(6);
      const p = getResult(7);
      const it = getResult(8);
      const tt = getResult(9);

      // Normalize booking types because the database column is
      // `book_type`, while the form uses `booking_type`.
      const normalizedBookingTypes = bt
        .map((type) => ({
          ...type,
          booking_type_id: getBookingTypeId(type),
          booking_type: getBookingTypeName(type),
        }))
        .filter(
          (type) =>
            type.booking_type_id !== '' &&
            type.booking_type !== ''
        );

      console.log(
        'Booking types loaded:',
        normalizedBookingTypes
      );

      setCustomers(c);
      setBookingTypes(normalizedBookingTypes);
      setStatuses(s);
      setDepots(d);
      setCommodities(cm);
      setOrigins(o);
      setDestinations(dst);
      setPersonnel(p);

      setItemTypes(
        it.length > 0
          ? it
          : FALLBACK_ITEM_TYPES
      );

      setTruckTypes(
        tt.length > 0
          ? tt
          : FALLBACK_TRUCK_TYPES
      );

      return {
        customers: c,
        bookingTypes: normalizedBookingTypes,
        statuses: s,
        depots: d,
        commodities: cm,
        origins: o,
        destinations: dst,
        personnel: p,
        itemTypes: it.length > 0 ? it : FALLBACK_ITEM_TYPES,
        truckTypes: tt.length > 0 ? tt : FALLBACK_TRUCK_TYPES,
      };
    } catch (error) {
      console.error('Failed to load lookups:', error);
      throw error;
    }
  };

  /*
   * ============================================================
   * LOAD VEHICLES
   * ============================================================
   */

  const loadVehicles = async (useSubcon = false) => {
    try {
      if (typeof lookups.vehicles !== 'function') {
        console.warn('lookups.vehicles() is not available.');
        setVehicles([]);
        return [];
      }

      const result = await lookups.vehicles(
        useSubcon ? { subcon: 1 } : {}
      );

      const list = Array.isArray(result) ? result : [];

      setVehicles(list);

      return list;
    } catch (error) {
      console.error('Failed to load vehicles:', error);
      setVehicles([]);

      return [];
    }
  };

  /*
   * ============================================================
   * INITIAL LOAD
   * ============================================================
   */

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        setLoading(true);

        const lookupData = await loadLookups();

        await loadVehicles(false);

        if (!mounted) return;

        /*
         * EDIT EXISTING BOOKING
         */
        if (isEdit) {
          if (typeof bookings.get !== 'function') {
            throw new Error(
              'bookings.get() is not available in services/api.js'
            );
          }

          const b = await bookings.get(id);

          if (!b) {
            throw new Error('Booking was not found.');
          }

          const bp = Array.isArray(b.personnel)
            ? b.personnel
            : [];

          const getPid = (role) => {
            const row = bp.find(
              (r) => r.assignment_role === role
            );

            return row ? row.personnel_id : '';
          };

          setForm((prev) => ({
            ...prev,

            booking_no:
              b.booking_no ?? prev.booking_no,

            customer_id:
              b.customer_id ?? '',

            booking_type_id:
              b.booking_type_id ?? '',

            depot_id:
              b.depot_id ?? '',

            commodity_type_id:
              b.commodity_type_id ?? '',

            origin_id:
              b.origin_id ?? '',

            destination_id:
              b.destination_id ?? '',

            vehicle_id:
              b.vehicle_id ?? '',

            truck_type_id:
              b.truck_type_id ?? '',

            status_id:
              b.status_id ??
              lookupData.statuses?.[0]?.status_id ??
              '',

            delivery_date:
              b.delivery_date ?? '',

            route_code:
              b.route_code ?? '',

            no_of_trips:
              b.no_of_trips ?? '1',

            no_of_drops:
              b.no_of_drops ?? '',

            category_type:
              b.category_type ?? '',

            area:
              b.area ?? '',

            trip_allowance:
              b.trip_allowance ?? '',

            fuel_liters:
              b.fuel_liters ?? '',

            fuel_po:
              b.fuel_po ?? '',

            fuel_amount:
              b.fuel_amount ?? '0.00',

            remarks:
              b.remarks ?? '',

            client_ref_no:
              b.client_ref_no ?? '',

            other_ref_no:
              b.other_ref_no ?? '',

            remarks_2:
              b.remarks_2 ?? '',

            items:
              Array.isArray(b.items) && b.items.length > 0
                ? b.items
                : [{ ...DEFAULT_ITEM }],

            driver_id:
              getPid('driver'),

            helper1_id:
              getPid('helper1'),

            helper2_id:
              getPid('helper2'),
          }));
        }

        /*
         * CREATE NEW BOOKING
         */
        else {
          setForm((prev) => ({
            ...prev,
            status_id:
              lookupData.statuses?.[0]?.status_id ?? '',
          }));
        }
      } catch (error) {
        console.error('Booking form initialization error:', error);

        if (mounted) {
          showToast(
            'error',
            `Failed to load booking form: ${
              error?.message || 'Unknown error'
            }`
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initialize();

    return () => {
      mounted = false;
    };

    // Intentionally run when booking ID changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  /*
   * ============================================================
   * SUBCON VEHICLES
   * ============================================================
   */

  useEffect(() => {
    loadVehicles(subcon);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subcon]);

  /*
   * ============================================================
   * AUTO-SET TRUCK TYPE FROM VEHICLE
   * ============================================================
   */

  useEffect(() => {
    if (!form.vehicle_id) return;

    const vehicle = vehicles.find(
      (v) =>
        String(v.vehicle_id) ===
        String(form.vehicle_id)
    );

    if (!vehicle) return;

    setForm((prev) => ({
      ...prev,

      category_type:
        vehicle.category_type ??
        prev.category_type,

      truck_type_id:
        vehicle.category_type_id ??
        prev.truck_type_id,
    }));

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.vehicle_id, vehicles]);

  /*
   * ============================================================
   * ITEMS
   * ============================================================
   */

  const updateItem = (index, key, value) => {
    setForm((prev) => {
      const nextItems = [...prev.items];

      nextItems[index] = {
        ...nextItems[index],
        [key]: value,
      };

      return {
        ...prev,
        items: nextItems,
      };
    });
  };

  const addItem = () => {
    setForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { ...DEFAULT_ITEM },
      ],
    }));
  };

  const removeItem = (index) => {
    setForm((prev) => ({
      ...prev,

      items:
        prev.items.length === 1
          ? [{ ...DEFAULT_ITEM }]
          : prev.items.filter(
              (_, i) => i !== index
            ),
    }));
  };

  const totalWeight = useMemo(() => {
    return form.items.reduce((sum, item) => {
      const weight = parseFloat(
        item.weight_kg
      );

      return (
        sum +
        (Number.isNaN(weight) ? 0 : weight)
      );
    }, 0);
  }, [form.items]);

  /*
   * ============================================================
   * PHOTOS
   * ============================================================
   */

  const onPhotoSelect = (index, file) => {
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (event) => {
      setForm((prev) => {
        const photos = [...prev.photos];

        photos[index] = {
          name: file.name,
          data: event.target.result,
        };

        return {
          ...prev,
          photos,
        };
      });
    };

    reader.onerror = () => {
      showToast(
        'error',
        'Failed to read the selected image.'
      );
    };

    reader.readAsDataURL(file);
  };

  const removePhoto = (index) => {
    setForm((prev) => {
      const photos = [...prev.photos];

      photos[index] = null;

      return {
        ...prev,
        photos,
      };
    });
  };

  /*
   * ============================================================
   * SUBMIT
   * ============================================================
   */

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.customer_id) {
      showToast(
        'error',
        'Customer is required.'
      );
      return;
    }

    if (!form.booking_type_id) {
      showToast(
        'error',
        'Booking Type is required.'
      );
      return;
    }

    if (!form.delivery_date) {
      showToast(
        'error',
        'Delivery Date is required.'
      );
      return;
    }

    if (!form.depot_id) {
      showToast(
        'error',
        'Depot is required.'
      );
      return;
    }

    if (!form.commodity_type_id) {
      showToast(
        'error',
        'Commodity Type is required.'
      );
      return;
    }

    if (!form.origin_id) {
      showToast(
        'error',
        'Origin is required.'
      );
      return;
    }

    if (!form.vehicle_id) {
      showToast(
        'error',
        'Vehicle No. is required.'
      );
      return;
    }

    setSubmitting(true);

    try {
      const personnelAssignments = [];

      if (form.driver_id) {
        personnelAssignments.push({
          personnel_id: Number(form.driver_id),
          assignment_role: 'driver',
          source: form.driver_source,
        });
      }

      if (form.helper1_id) {
        personnelAssignments.push({
          personnel_id: Number(form.helper1_id),
          assignment_role: 'helper1',
          source: form.helper1_source,
        });
      }

      if (form.helper2_id) {
        personnelAssignments.push({
          personnel_id: Number(form.helper2_id),
          assignment_role: 'helper2',
          source: form.helper2_source,
        });
      }

      const validItems = form.items
        .filter(
          (item) =>
            item.item_type_id ||
            item.item_description ||
            item.weight_kg ||
            item.length_cm ||
            item.width_cm ||
            item.height_cm
        )
        .map((item) => ({
          ...item,

          item_type_id:
            item.item_type_id
              ? Number(item.item_type_id)
              : null,

          length_cm:
            item.length_cm
              ? Number(item.length_cm)
              : null,

          width_cm:
            item.width_cm
              ? Number(item.width_cm)
              : null,

          height_cm:
            item.height_cm
              ? Number(item.height_cm)
              : null,

          weight_kg:
            item.weight_kg
              ? Number(item.weight_kg)
              : null,
        }));

      const payload = {
        booking_no:
          form.booking_no || null,

        customer_id:
          form.customer_id
            ? Number(form.customer_id)
            : null,

        booking_type_id:
          form.booking_type_id
            ? Number(form.booking_type_id)
            : null,

        depot_id:
          form.depot_id
            ? Number(form.depot_id)
            : null,

        commodity_type_id:
          form.commodity_type_id
            ? Number(form.commodity_type_id)
            : null,

        origin_id:
          form.origin_id
            ? Number(form.origin_id)
            : null,

        destination_id:
          form.destination_id
            ? Number(form.destination_id)
            : null,

        vehicle_id:
          form.vehicle_id
            ? Number(form.vehicle_id)
            : null,

        status_id:
          form.status_id
            ? Number(form.status_id)
            : null,

        delivery_date:
          form.delivery_date || null,

        route_code:
          form.route_code || null,

        no_of_trips:
          form.no_of_trips
            ? Number(form.no_of_trips)
            : null,

        no_of_drops:
          form.no_of_drops
            ? Number(form.no_of_drops)
            : null,

        category_type:
          form.category_type || null,

        area:
          form.area || null,

        trip_allowance:
          form.trip_allowance || null,

        fuel_liters:
          form.fuel_liters || null,

        fuel_po:
          form.fuel_po || null,

        fuel_amount:
          form.fuel_amount || null,

        remarks:
          form.remarks || null,

        client_ref_no:
          form.client_ref_no || null,

        other_ref_no:
          form.other_ref_no || null,

        remarks_2:
          form.remarks_2 || null,

        personnel:
          personnelAssignments,

        items:
          validItems,

        photos:
          form.photos.filter(Boolean),
      };

      if (isEdit) {
        if (typeof bookings.update !== 'function') {
          throw new Error(
            'bookings.update() is not available in services/api.js'
          );
        }

        await bookings.update(
          id,
          payload
        );

        showToast(
          'success',
          'Booking updated successfully.'
        );
      } else {
        if (typeof bookings.create !== 'function') {
          throw new Error(
            'bookings.create() is not available in services/api.js'
          );
        }

        const result =
          await bookings.create(payload);

        showToast(
          'success',
          `Booking ${
            result?.booking_no || ''
          } created successfully.`
        );

        if (result?.booking_id) {
          setTimeout(() => {
            navigate(
              `/bookings/${result.booking_id}/edit`
            );
          }, 800);
        }
      }
    } catch (error) {
      console.error(
        'Booking save error:',
        error
      );

      showToast(
        'error',
        error?.message ||
          'Failed to save booking.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  /*
   * ============================================================
   * LOADING SCREEN
   * ============================================================
   */

  if (loading) {
    return (
      <div className="loading">
        <Loader2
          className="animate-spin"
          size={20}
        />
        Loading form…
      </div>
    );
  }

  /*
   * ============================================================
   * FORM
   * ============================================================
   */

  return (
    <>
      <div className="booking-page-header">
        <div className="booking-page-title">
          <h2>
            {isEdit
              ? 'Update Vehicle'
              : 'Create Vehicle'}
          </h2>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 8,
          }}
        >
          <Link
            to="/vehicles"
            className="btn btn-ghost-booking"
          >
            <XCircle size={14} />
            Cancel
          </Link>

          <button
            type="submit"
            form="booking-main-form"
            className="btn btn-primary-booking"
            disabled={submitting}
          >
            {submitting && (
              <Loader2
                size={16}
                className="animate-spin"
              />
            )}

            <Save size={14} />

            {submitting
              ? 'Saving…'
              : 'Save'}
          </button>
        </div>
      </div>

      {toast.msg && (
        <div
          className={`alert alert-${
            toast.type || 'success'
          }`}
          style={{
            marginBottom: 16,
          }}
        >
          {toast.msg}
        </div>
      )}

      <form
        id="booking-main-form"
        onSubmit={handleSubmit}
      >
        {/* ======================================================
            1. BOOKING INFORMATION
        ====================================================== */}

        <div className="reminder-banner">
          <span style={{ marginRight: 8 }}>
            ⚠️
          </span>

          Reminder: Bookings that remain UNDER
          REVIEW for 7 days from the creation
          date will be automatically cancelled
          by the system.
        </div>

        <div className="bf-section">
          <div className="bf-section-title">
            Booking Information
          </div>

          <div className="bf-grid">
            <div className="bf-col-2">
              <div className="bf-field">
                <label>
                  Customer{' '}
                  <span className="req">
                    *
                  </span>
                </label>

                <select
                  value={form.customer_id}
                  onChange={(e) =>
                    update(
                      'customer_id',
                      e.target.value
                    )
                  }
                  required
                >
                  <option value="">
                    -Select-
                  </option>

                  {customers.map((customer) => (
                    <option
                      key={customer.customer_id}
                      value={customer.customer_id}
                    >
                      {customer.customer_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bf-col-1">
              <div className="bf-field">
                <label>
                  Booking Type{' '}
                  <span className="req">
                    *
                  </span>
                </label>

                <select
                  value={form.booking_type_id}
                  onChange={(e) =>
                    update(
                      'booking_type_id',
                      e.target.value
                    )
                  }
                  required
                >
                  <option value="">
                    -Select-
                  </option>

                  {bookingTypes.map((type) => {
                    const bookingTypeId =
                      getBookingTypeId(type);

                    const bookingTypeName =
                      getBookingTypeName(type);

                    return (
                      <option
                        key={bookingTypeId}
                        value={bookingTypeId}
                      >
                        {bookingTypeName}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div className="bf-col-1">
              <div className="bf-field">
                <label>
                  Delivery Date{' '}
                  <span className="req">
                    *
                  </span>
                </label>

                <input
                  type="date"
                  value={form.delivery_date}
                  onChange={(e) =>
                    update(
                      'delivery_date',
                      e.target.value
                    )
                  }
                  required
                />
              </div>
            </div>

            <div className="bf-col-1">
              <div className="bf-field">
                <label>
                  Depot{' '}
                  <span className="req">
                    *
                  </span>
                </label>

                <select
                  value={form.depot_id}
                  onChange={(e) =>
                    update(
                      'depot_id',
                      e.target.value
                    )
                  }
                  required
                >
                  <option value="">
                    -Select-
                  </option>

                  {depots.map((depot) => (
                    <option
                      key={depot.depot_id}
                      value={depot.depot_id}
                    >
                      {depot.depot_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bf-col-1">
              <div className="bf-field">
                <label>
                  Commodity Type{' '}
                  <span className="req">
                    *
                  </span>
                </label>

                <select
                  value={
                    form.commodity_type_id
                  }
                  onChange={(e) =>
                    update(
                      'commodity_type_id',
                      e.target.value
                    )
                  }
                  required
                >
                  <option value="">
                    -Select-
                  </option>

                  {commodities.map(
                    (commodity) => (
                      <option
                        key={
                          commodity.commodity_type_id
                        }
                        value={
                          commodity.commodity_type_id
                        }
                      >
                        {
                          commodity.commodity_type
                        }
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>

            <div className="bf-col-1">
              <div className="bf-field">
                <label>
                  Route Code
                </label>

                <input
                  type="text"
                  value={form.route_code}
                  onChange={(e) =>
                    update(
                      'route_code',
                      e.target.value
                    )
                  }
                />
              </div>
            </div>

            <div className="bf-col-1">
              <div className="bf-field">
                <label>
                  No. of Trips
                </label>

                <input
                  type="number"
                  min="1"
                  value={form.no_of_trips}
                  onChange={(e) =>
                    update(
                      'no_of_trips',
                      e.target.value
                    )
                  }
                />
              </div>
            </div>

            <div className="bf-col-1">
              <div className="bf-field">
                <label>
                  No. of Drops
                </label>

                <input
                  type="number"
                  min="0"
                  value={form.no_of_drops}
                  onChange={(e) =>
                    update(
                      'no_of_drops',
                      e.target.value
                    )
                  }
                />
              </div>
            </div>

            <div className="bf-col-1">
              <div className="bf-field">
                <label>
                  Origin{' '}
                  <span className="req">
                    *
                  </span>
                </label>

                <select
                  value={form.origin_id}
                  onChange={(e) =>
                    update(
                      'origin_id',
                      e.target.value
                    )
                  }
                  required
                >
                  <option value="">
                    -Select-
                  </option>

                  {origins.map((origin) => (
                    <option
                      key={origin.origin_id}
                      value={origin.origin_id}
                    >
                      {origin.origin_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bf-col-2">
              <div className="bf-field">
                <label>
                  Destination
                </label>

                <select
                  value={form.destination_id}
                  onChange={(e) =>
                    update(
                      'destination_id',
                      e.target.value
                    )
                  }
                >
                  <option value="">
                    -Select-
                  </option>

                  {destinations.map(
                    (destination) => (
                      <option
                        key={
                          destination.destination_id
                        }
                        value={
                          destination.destination_id
                        }
                      >
                        {destination.destination}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================
            2. VEHICLE ASSIGNMENT
        ====================================================== */}

        <div className="bf-section">
          <div className="bf-section-title">
            Vehicle Assignment
          </div>

          <div className="bf-grid">
            <div className="bf-col-1">
              <div className="bf-field">
                <label className="bf-check">
                  <input
                    type="checkbox"
                    id="subcon"
                    checked={subcon}
                    onChange={(e) =>
                      setSubcon(
                        e.target.checked
                      )
                    }
                  />

                  <span>Subcon</span>
                </label>
              </div>
            </div>

            <div className="bf-col-2" />

            <div className="bf-col-1">
              <div className="bf-field">
                <label>
                  Vehicle No.{' '}
                  <span className="req">
                    *
                  </span>
                </label>

                <div
                  style={{
                    display: 'flex',
                    gap: 6,
                  }}
                >
                  <select
                    value={form.vehicle_id}
                    onChange={(e) =>
                      update(
                        'vehicle_id',
                        e.target.value
                      )
                    }
                    style={{
                      flex: 1,
                    }}
                    required
                  >
                    <option value="">
                      -Select-
                    </option>

                    {vehicles.map((vehicle) => (
                      <option
                        key={
                          vehicle.vehicle_id
                        }
                        value={
                          vehicle.vehicle_id
                        }
                      >
                        {vehicle.plate_no ||
                          vehicle.body_no}

                        {vehicle.vehicle_model
                          ? ` (${vehicle.vehicle_model})`
                          : ''}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    className="btn btn-ghost-small"
                    title="Refresh vehicles"
                    onClick={() =>
                      loadVehicles(subcon)
                    }
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>
              </div>
            </div>

            <div className="bf-col-1">
              <div className="bf-field">
                <label>
                  Truck Type{' '}
                  <span className="req">
                    *
                  </span>
                </label>

                <select
                  value={form.truck_type_id}
                  onChange={(e) => {
                    const selected =
                      truckTypes.find(
                        (truck) =>
                          String(
                            truck.category_type_id
                          ) ===
                          String(
                            e.target.value
                          )
                      );

                    setForm((prev) => ({
                      ...prev,

                      truck_type_id:
                        e.target.value,

                      category_type:
                        selected
                          ? selected.category_type
                          : '',
                    }));
                  }}
                  required
                >
                  <option value="">
                    -Select-
                  </option>

                  {truckTypes.map((truck) => (
                    <option
                      key={
                        truck.category_type_id
                      }
                      value={
                        truck.category_type_id
                      }
                    >
                      {truck.category_type}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bf-col-1">
              <div className="bf-field">
                <label>
                  Category Type
                </label>

                <input
                  type="text"
                  value={
                    form.category_type || '-'
                  }
                  readOnly
                  style={{
                    background: '#f5f5f5',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================
            3. FUEL AND TRIP ALLOWANCE
        ====================================================== */}

        <div className="bf-section">
          <div className="bf-section-title">
            Fuel and Trip Allowance
          </div>

          <div className="bf-grid">
            <div className="bf-col-1">
              <div className="bf-field">
                <label>Area</label>

                <select
                  value={form.area}
                  onChange={(e) =>
                    update(
                      'area',
                      e.target.value
                    )
                  }
                >
                  <option value="">
                    -Select-
                  </option>

                  <option value="Metro Manila">
                    Metro Manila
                  </option>

                  <option value="North Luzon">
                    North Luzon
                  </option>

                  <option value="South Luzon">
                    South Luzon
                  </option>

                  <option value="Visayas">
                    Visayas
                  </option>

                  <option value="Mindanao">
                    Mindanao
                  </option>
                </select>
              </div>
            </div>

            <div className="bf-col-1">
              <div className="bf-field">
                <label>
                  Trip Allowance
                </label>

                <input
                  type="number"
                  step="0.01"
                  value={
                    form.trip_allowance
                  }
                  onChange={(e) =>
                    update(
                      'trip_allowance',
                      e.target.value
                    )
                  }
                />
              </div>
            </div>

            <div className="bf-col-1">
              <div className="bf-field">
                <label>Fuel (L)</label>

                <input
                  type="number"
                  step="0.01"
                  value={
                    form.fuel_liters
                  }
                  onChange={(e) =>
                    update(
                      'fuel_liters',
                      e.target.value
                    )
                  }
                />
              </div>
            </div>

            <div className="bf-col-1">
              <div className="bf-field">
                <label>Fuel Po.</label>

                <input
                  type="text"
                  value={form.fuel_po}
                  onChange={(e) =>
                    update(
                      'fuel_po',
                      e.target.value
                    )
                  }
                />
              </div>
            </div>

            <div className="bf-col-1">
              <div className="bf-field">
                <label>
                  Fuel Amount
                </label>

                <input
                  type="number"
                  step="0.01"
                  value={
                    form.fuel_amount
                  }
                  onChange={(e) =>
                    update(
                      'fuel_amount',
                      e.target.value
                    )
                  }
                />
              </div>
            </div>

            <div className="bf-col-1" />
          </div>
        </div>

        {/* ======================================================
            4. PERSONNEL ASSIGNMENT
        ====================================================== */}

        <div className="bf-section">
          <div className="bf-section-title">
            Personnel Assignment
          </div>

          <div className="bf-grid">
            {/* DRIVER */}

            <div className="bf-col-1">
              <div className="bf-field">
                <label className="bf-sublabel">
                  Assigned Personnel - Driver
                </label>

                <div className="bf-radio-row">
                  <label className="bf-radio">
                    <input
                      type="radio"
                      name="driver_source"
                      value="direct"
                      checked={
                        form.driver_source ===
                        'direct'
                      }
                      onChange={(e) =>
                        update(
                          'driver_source',
                          e.target.value
                        )
                      }
                    />

                    <span>
                      Direct Hired
                    </span>
                  </label>

                  <label className="bf-radio">
                    <input
                      type="radio"
                      name="driver_source"
                      value="outsource"
                      checked={
                        form.driver_source ===
                        'outsource'
                      }
                      onChange={(e) =>
                        update(
                          'driver_source',
                          e.target.value
                        )
                      }
                    />

                    <span>
                      Outsourced
                    </span>
                  </label>
                </div>
              </div>

              <div className="bf-field">
                <label>
                  Driver{' '}
                  <span className="req">
                    *
                  </span>
                </label>

                <select
                  value={form.driver_id}
                  onChange={(e) =>
                    update(
                      'driver_id',
                      e.target.value
                    )
                  }
                >
                  <option value="">
                    -Select-
                  </option>

                  {personnel.map((person) => (
                    <option
                      key={
                        person.personnel_id
                      }
                      value={
                        person.personnel_id
                      }
                    >
                      {person.full_name ||
                        `${person.first_name || ''} ${
                          person.last_name || ''
                        }`.trim()}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* HELPER 1 */}

            <div className="bf-col-1">
              <div className="bf-field">
                <label className="bf-sublabel">
                  Assigned Personnel - Helper 1
                </label>

                <div className="bf-radio-row">
                  <label className="bf-radio">
                    <input
                      type="radio"
                      name="helper1_source"
                      value="direct"
                      checked={
                        form.helper1_source ===
                        'direct'
                      }
                      onChange={(e) =>
                        update(
                          'helper1_source',
                          e.target.value
                        )
                      }
                    />

                    <span>
                      Direct Hired
                    </span>
                  </label>

                  <label className="bf-radio">
                    <input
                      type="radio"
                      name="helper1_source"
                      value="outsource"
                      checked={
                        form.helper1_source ===
                        'outsource'
                      }
                      onChange={(e) =>
                        update(
                          'helper1_source',
                          e.target.value
                        )
                      }
                    />

                    <span>
                      Outsourced
                    </span>
                  </label>
                </div>
              </div>

              <div className="bf-field">
                <label>
                  Helper 1
                </label>

                <select
                  value={form.helper1_id}
                  onChange={(e) =>
                    update(
                      'helper1_id',
                      e.target.value
                    )
                  }
                >
                  <option value="">
                    -Select-
                  </option>

                  {personnel.map((person) => (
                    <option
                      key={
                        person.personnel_id
                      }
                      value={
                        person.personnel_id
                      }
                    >
                      {person.full_name ||
                        `${person.first_name || ''} ${
                          person.last_name || ''
                        }`.trim()}
                    </option>
                  ))}
                </select>
              </div>

              <div
                className="bf-field"
                style={{
                  marginTop: 4,
                }}
              >
                <label className="bf-check bf-check-inline">
                  <input
                    type="checkbox"
                    checked={
                      form.driver_included_h1
                    }
                    onChange={(e) =>
                      update(
                        'driver_included_h1',
                        e.target.checked
                      )
                    }
                  />

                  <span>
                    Driver Included?
                    <Info
                      size={12}
                      className="bf-info-icon"
                    />
                  </span>
                </label>
              </div>
            </div>

            {/* HELPER 2 */}

            <div className="bf-col-1">
              <div className="bf-field">
                <label className="bf-sublabel">
                  Assigned Personnel - Helper 2
                </label>

                <div className="bf-radio-row">
                  <label className="bf-radio">
                    <input
                      type="radio"
                      name="helper2_source"
                      value="direct"
                      checked={
                        form.helper2_source ===
                        'direct'
                      }
                      onChange={(e) =>
                        update(
                          'helper2_source',
                          e.target.value
                        )
                      }
                    />

                    <span>
                      Direct Hired
                    </span>
                  </label>

                  <label className="bf-radio">
                    <input
                      type="radio"
                      name="helper2_source"
                      value="outsource"
                      checked={
                        form.helper2_source ===
                        'outsource'
                      }
                      onChange={(e) =>
                        update(
                          'helper2_source',
                          e.target.value
                        )
                      }
                    />

                    <span>
                      Outsourced
                    </span>
                  </label>
                </div>
              </div>

              <div className="bf-field">
                <label>
                  Helper 2
                </label>

                <select
                  value={form.helper2_id}
                  onChange={(e) =>
                    update(
                      'helper2_id',
                      e.target.value
                    )
                  }
                >
                  <option value="">
                    -Select-
                  </option>

                  {personnel.map((person) => (
                    <option
                      key={
                        person.personnel_id
                      }
                      value={
                        person.personnel_id
                      }
                    >
                      {person.full_name ||
                        `${person.first_name || ''} ${
                          person.last_name || ''
                        }`.trim()}
                    </option>
                  ))}
                </select>
              </div>

              <div
                className="bf-field"
                style={{
                  marginTop: 4,
                }}
              >
                <label className="bf-check bf-check-inline">
                  <input
                    type="checkbox"
                    checked={
                      form.driver_included_h2
                    }
                    onChange={(e) =>
                      update(
                        'driver_included_h2',
                        e.target.checked
                      )
                    }
                  />

                  <span>
                    Driver Included?
                    <Info
                      size={12}
                      className="bf-info-icon"
                    />
                  </span>
                </label>
              </div>
            </div>

            <div className="bf-col-full">
              <div className="bf-field">
                <label>
                  Remarks
                </label>

                <textarea
                  rows={2}
                  maxLength={255}
                  placeholder="Maximum of 255 only."
                  value={form.remarks}
                  onChange={(e) =>
                    update(
                      'remarks',
                      e.target.value
                    )
                  }
                />
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================
            5. REFERENCES
        ====================================================== */}

        <div className="bf-section">
          <div className="bf-section-title">
            References
          </div>

          <div className="bf-grid">
            <div className="bf-col-2">
              <div className="bf-field">
                <label>
                  Client Ref No.
                </label>

                <input
                  type="text"
                  value={
                    form.client_ref_no
                  }
                  onChange={(e) =>
                    update(
                      'client_ref_no',
                      e.target.value
                    )
                  }
                />
              </div>
            </div>

            <div className="bf-col-1">
              <div className="bf-field">
                <label>
                  Other Ref No.
                </label>

                <input
                  type="text"
                  value={
                    form.other_ref_no
                  }
                  onChange={(e) =>
                    update(
                      'other_ref_no',
                      e.target.value
                    )
                  }
                />
              </div>
            </div>

            <div className="bf-col-full">
              <div className="bf-field">
                <label>
                  Remarks 2
                </label>

                <input
                  type="text"
                  value={form.remarks_2}
                  onChange={(e) =>
                    update(
                      'remarks_2',
                      e.target.value
                    )
                  }
                />
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================
            6. ITEM DETAILS
        ====================================================== */}

        <div className="bf-section">
          <div className="bf-section-title">
            Item Details
          </div>

          {form.items.map(
            (item, index) => (
              <div
                key={index}
                className="bf-grid bf-item-row"
              >
                <div className="bf-col-1">
                  <div className="bf-field">
                    <label>
                      {index === 0
                        ? 'Item Type'
                        : ''}
                    </label>

                    <select
                      value={
                        item.item_type_id
                      }
                      onChange={(e) =>
                        updateItem(
                          index,
                          'item_type_id',
                          e.target.value
                        )
                      }
                    >
                      <option value="">
                        -Select-
                      </option>

                      {itemTypes.map(
                        (type) => (
                          <option
                            key={
                              type.item_type_id
                            }
                            value={
                              type.item_type_id
                            }
                          >
                            {type.item_type}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </div>

                <div className="bf-col-3 bf-col-ib">
                  <div className="bf-field">
                    <label>
                      {index === 0
                        ? 'Item Description'
                        : ''}
                    </label>

                    <input
                      type="text"
                      value={
                        item.item_description
                      }
                      onChange={(e) =>
                        updateItem(
                          index,
                          'item_description',
                          e.target.value
                        )
                      }
                    />
                  </div>
                </div>

                <div className="bf-col-1">
                  <div className="bf-field">
                    <label>
                      {index === 0
                        ? 'Length (cm)'
                        : ''}
                    </label>

                    <input
                      type="number"
                      step="0.01"
                      value={
                        item.length_cm
                      }
                      onChange={(e) =>
                        updateItem(
                          index,
                          'length_cm',
                          e.target.value
                        )
                      }
                    />
                  </div>
                </div>

                <div className="bf-col-1">
                  <div className="bf-field">
                    <label>
                      {index === 0
                        ? 'Width (cm)'
                        : ''}
                    </label>

                    <input
                      type="number"
                      step="0.01"
                      value={
                        item.width_cm
                      }
                      onChange={(e) =>
                        updateItem(
                          index,
                          'width_cm',
                          e.target.value
                        )
                      }
                    />
                  </div>
                </div>

                <div className="bf-col-1">
                  <div className="bf-field">
                    <label>
                      {index === 0
                        ? 'Height (cm)'
                        : ''}
                    </label>

                    <input
                      type="number"
                      step="0.01"
                      value={
                        item.height_cm
                      }
                      onChange={(e) =>
                        updateItem(
                          index,
                          'height_cm',
                          e.target.value
                        )
                      }
                    />
                  </div>
                </div>

                <div className="bf-col-1 bf-col-ib">
                  <div className="bf-field">
                    <label>
                      {index === 0
                        ? 'Weight (kg)'
                        : ''}
                    </label>

                    <input
                      type="number"
                      step="0.01"
                      value={
                        item.weight_kg
                      }
                      onChange={(e) =>
                        updateItem(
                          index,
                          'weight_kg',
                          e.target.value
                        )
                      }
                    />
                  </div>
                </div>

                <div className="bf-item-actions">
                  {form.items.length >
                    1 && (
                    <button
                      type="button"
                      className="bf-item-remove"
                      onClick={() =>
                        removeItem(index)
                      }
                      title="Remove item"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
            )
          )}

          <div className="bf-grid">
            <div
              className="bf-col-full"
              style={{
                display: 'flex',
                justifyContent:
                  'space-between',
                alignItems: 'center',
              }}
            >
              <button
                type="button"
                className="btn btn-success-small"
                onClick={addItem}
              >
                <Plus size={14} />
                New Item
              </button>

              <div className="bf-total-weight">
                TOTAL WEIGHT:{' '}
                <strong>
                  {totalWeight.toFixed(2)}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================
            7. BOOKING PHOTOS
        ====================================================== */}

        <div className="bf-section">
          <div className="bf-section-title">
            Booking Photos
          </div>

          <div className="bf-photos-row">
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className="bf-photo-box-wrapper"
              >
                {form.photos[index] ? (
                  <div className="bf-photo-preview">
                    <img
                      src={
                        form.photos[index].data
                      }
                      alt={`photo ${
                        index + 1
                      }`}
                    />

                    <button
                      type="button"
                      className="bf-photo-remove"
                      onClick={() =>
                        removePhoto(index)
                      }
                      title="Remove"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <label className="bf-photo-box">
                    <input
                      type="file"
                      accept="image/*"
                      style={{
                        display: 'none',
                      }}
                      onChange={(event) => {
                        const file =
                          event.target
                            .files?.[0];

                        if (file) {
                          onPhotoSelect(
                            index,
                            file
                          );
                        }
                      }}
                    />

                    <CloudUpload
                      size={36}
                      color="#a78bfa"
                    />

                    <span>
                      Click to select image
                    </span>
                  </label>
                )}
              </div>
            ))}
          </div>
        </div>
      </form>
    </>
  );
}