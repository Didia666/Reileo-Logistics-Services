import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, Save } from 'lucide-react';
import { bookingCrud, lookups } from '../services/api.js';

const TABS = [
  { key: 'bookinginfo',      label: 'Booking Information' },
  { key: 'vehicleassignment',         label: 'Vehicle Assignment' },
  { key: 'fueltripallowance',  label: 'Fuel and Trip Allowance' },
  { key: 'personnelassignment',  label: 'Personnel Assignment' },
  { key: 'references', label: 'References' },
  { key: 'itemdetails',   label: 'Item Details' },
  { key: 'bookingphotos', label: 'Booking Photos' },
  { key: 'pricingdetails', label: 'Pricing Details' },
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

const nullableNumber = (value) =>
  value === '' || value === null || value === undefined
    ? null
    : Number(value);

const isActiveOption = (option) => {
  const status = option?.status ?? option?.status_name;
  return status == null || String(status).trim().toLowerCase() === 'active';
};

const activeOptionsWithCurrent = (options, valueKey, currentValue) =>
  (Array.isArray(options) ? options : []).filter(
    (option) =>
      isActiveOption(option) ||
      (currentValue !== '' &&
        currentValue !== null &&
        currentValue !== undefined &&
        String(option[valueKey]) === String(currentValue))
  );

const getPhotoSource = (photo) => {
  const source = photo?.photo_data || '';

  if (!source) return '';

  if (/^data:image\//i.test(source)) {
    return source;
  }

  const extension = String(photo?.photo_name || '')
    .split('.')
    .pop()
    ?.toLowerCase();

  const mimeTypes = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
  };

  const mimeType = mimeTypes[extension] || 'image/jpeg';

  return `data:${mimeType};base64,${source}`;
};

export default function BookingFormModal({ isOpen, onClose, onSaved, editBooking, viewOnly }) {
  const [activeTab, setActiveTab] = useState('bookinginfo');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ type: '', msg: '' });
  const [destinationSearch, setDestinationSearch] = useState('');
  const [destinationMenuOpen, setDestinationMenuOpen] = useState(false);
  const [destinationMenuPosition, setDestinationMenuPosition] = useState(null);
  const [destinationInputElement, setDestinationInputElement] = useState(null);
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

  const destinationIdsForBooking = (booking) => {
    const destinations = Array.isArray(booking.destination_ids)
      ? booking.destination_ids
      : Array.isArray(booking.destinations)
        ? booking.destinations.map((destination) => destination.destination_id)
        : booking.destination_id
          ? [booking.destination_id]
          : [];
    return destinations.map(String);
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
    destination_ids: [],

    // Vehicle Assignment
    vehicle_id: '',
    plate_no: '',
    vehicle_type_id: '',
    commodity_type: '',

    // Fuel and Trip Allowance
    charges: '',
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
    bk_photos: [{ photo_name: '', photo_data: '', photo_path: '' }],

    // Pricing Details
    client_rate: '',
    total_amount: '',
    subcon_rate: '',
    driver_rate: '',
    driver_allowance: '',
    helper1_rate: '',
    helper1_allowance: '',
    helper2_rate: '',
    helper2_allowance: '',
    
    // Expenses 
    b_toll_fees: '',
    b_extra_drop: '',
    b_extra_helper: '',
    b_other_fees: '',
    nb_parking_fees: '',
    nb_toll_fees: '',
    nb_demurrage_fees: '',
    nb_backload_fees: '',
    nb_other_deductions: '',

  };

  const [form, setForm] = useState(blankForm);
  const [companyOwned, setCompanyOwned] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!destinationMenuOpen || !destinationInputElement) {
      setDestinationMenuPosition(null);
      return undefined;
    }

    const updatePosition = () => {
      const rect = destinationInputElement.getBoundingClientRect();
      const viewportPadding = 8;
      const spaceBelow = window.innerHeight - rect.bottom - viewportPadding;
      const spaceAbove = rect.top - viewportPadding;
      const openAbove = spaceBelow < 180 && spaceAbove > spaceBelow;
      const availableHeight = Math.max(
        0,
        Math.min(240, openAbove ? spaceAbove : spaceBelow)
      );
      const width = Math.min(rect.width, window.innerWidth - viewportPadding * 2);
      const left = Math.min(
        Math.max(viewportPadding, rect.left),
        window.innerWidth - viewportPadding - width
      );

      setDestinationMenuPosition({
        left,
        top: openAbove ? rect.top - availableHeight - 4 : rect.bottom + 4,
        width,
        maxHeight: availableHeight,
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [destinationMenuOpen, destinationInputElement, form.destination_ids]);

  useEffect(() => {
    if (!isOpen) {
      setDestinationMenuOpen(false);
      setDestinationSearch('');
    }
  }, [isOpen]);

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
    let isCurrent = true;

    if (isOpen) {
      loadLookups();
      if (editBooking) {
        setCompanyOwned(Boolean(editBooking.vendor_id));
        if (Array.isArray(editBooking.bk_photos) && editBooking.bk_photos.length > 0) {
          setForm({

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
            destination_ids: destinationIdsForBooking(editBooking),

            // Vehicle Assignment
            vehicle_id: editBooking.vehicle_id ?? '',
            plate_no: editBooking.plate_no ?? '',
            vehicle_type_id: editBooking.vehicle_type_id ?? '',
            vendor_id: editBooking.vendor_id ?? '',

            // Fuel and Trip Allowance
            charges: editBooking.charges ?? '',
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
                    photo_data: photo.photo_data || '',
                    photo_path: photo.photo_path || '',
                  }))
                : [{ photo_name: '', photo_data: '', photo_path: '' }],

            // Pricing Details
            client_rate: editBooking.client_rate ?? '',
            total_amount: editBooking.total_amount ?? '',
            subcon_rate: editBooking.subcon_rate ?? '',
            driver_rate: editBooking.driver_rate ?? '',
            driver_allowance: editBooking.driver_allowance ?? '',
            helper1_rate: editBooking.helper1_rate ?? '',
            helper1_allowance: editBooking.helper1_allowance ?? '',
            helper2_rate: editBooking.helper2_rate ?? '',
            helper2_allowance: editBooking.helper2_allowance ?? '',


            // Expenses
            b_toll_fees: editBooking.b_toll_fees ?? '',
            b_extra_drop: editBooking.b_extra_drop ?? '',
            b_extra_helper: editBooking.b_extra_helper ?? '',
            b_other_fees: editBooking.b_other_fees ?? '',
            nb_parking_fees: editBooking.nb_parking_fees ?? '',
            nb_toll_fees: editBooking.nb_toll_fees ?? '',
            nb_demurrage_fees: editBooking.nb_demurrage_fees ?? '',
            nb_backload_fees: editBooking.nb_backload_fees ?? '',
            nb_other_deductions: editBooking.nb_other_deductions ?? ''
          });
          

        } else {
          bookingCrud.get(editBooking.booking_id).then(full => {
            if (!isCurrent) return;

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
              destination_ids: destinationIdsForBooking(full),

              // Vehicle Assignment
              vehicle_id: full.vehicle_id ?? '',
              plate_no: full.plate_no ?? '',
              vehicle_type_id: full.vehicle_type_id ?? '',
              vendor_id: full.vendor_id ?? '',

              // Fuel and Trip Allowance
              charges: full.charges ?? '',
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
                      photo_data: photo.photo_data || '',
                      photo_path: photo.photo_path || '',
                    }))
                  : [{ photo_name: '', photo_data: '', photo_path: '' }],

              // Pricing Details
              client_rate: full.client_rate ?? '',
              total_amount: full.total_amount ?? '',
              subcon_rate: full.subcon_rate ?? '',
              driver_rate: full.driver_rate ?? '',
              driver_allowance: full.driver_allowance ?? '',
              helper1_rate: full.helper1_rate ?? '',
              helper1_allowance: full.helper1_allowance ?? '',
              helper2_rate: full.helper2_rate ?? '',
              helper2_allowance: full.helper2_allowance ?? '',

              // Expenses
              b_toll_fees: full.b_toll_fees ?? '',
              b_extra_drop: full.b_extra_drop ?? '',
              b_extra_helper: full.b_extra_helper ?? '',
              b_other_fees: full.b_other_fees ?? '',
              nb_parking_fees: full.nb_parking_fees ?? '',
              nb_toll_fees: full.nb_toll_fees ?? '',
              nb_demurrage_fees: full.nb_demurrage_fees ?? '',
              nb_backload_fees: full.nb_backload_fees ?? '',
              nb_other_deductions: full.nb_other_deductions ?? ''
            });
          }).catch((error) => {
            if (!isCurrent) return;

            setToast({
              type: 'error',
              msg: error?.message || 'Unable to load booking details.',
            });
          });
        }
      } else {
        setForm(blankForm);
        setCompanyOwned(false);
        setActiveTab('bookinginfo');
      }
      setErrors({});
      setToast({ type: '', msg: '' });
    } else {
      setForm(blankForm);
      setCompanyOwned(false);
      setActiveTab('bookinginfo');
      setErrors({});
      setToast({ type: '', msg: '' });
    }

    return () => {
      isCurrent = false;
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

  const addAttachmentRow = (type) => {
    setForm(prev => ({
      ...prev,
      [type]: [
        ...(prev[type] || []),
        type === 'vh_documents'
          ? { document_name: '', document_path: '' }
          : { photo_name: '', photo_data: '', photo_path: '' },
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

  const handlePhotoFile = (index, file) => {
    if (!file) return;

    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
    const extension = file.name
      .split('.')
      .pop()
      ?.toLowerCase();

    if (!allowedExtensions.includes(extension)) {
      setToast({
        type: 'error',
        msg: 'Only JPG, JPEG, PNG, and WEBP images are allowed.',
      });

      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const result = String(reader.result);

      // Removes:
      // data:image/jpeg;base64,
      //
      // leaving only the Base64 image data.
      const base64Data = result.split(',')[1] || '';

      setForm(prev => ({
        ...prev,

        bk_photos: (prev.bk_photos || []).map((photo, i) =>
          i === index
            ? {
                ...photo,
                photo_name: file.name,
                photo_data: base64Data,
                photo_path: '',
              }
            : photo
        ),
      }));
    };

  reader.readAsDataURL(file);
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

      if (!String(currentItem?.item_type_id ?? '').trim()) {
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

  const removeItem = (index) => {
    setForm(prev => {
      const items = prev.item_details || [];
      if (items.length <= 1) return prev;

      return {
        ...prev,
        item_details: items.filter((_, itemIndex) => itemIndex !== index),
      };
    });
  };

  const toggleDestination = (destinationId) => {
    const selectedId = String(destinationId);
    setForm((prev) => {
      const destinations = prev.destination_ids || [];
      const isSelected = destinations.includes(selectedId);
      return {
        ...prev,
        destination_ids: isSelected
          ? destinations.filter((id) => id !== selectedId)
          : [...destinations, selectedId],
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
          destination_ids: (form.destination_ids || [])
            .filter((destinationId) => destinationId !== '' && destinationId !== null)
            .map(Number),
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
          charges: form.charges.trim() || null,
          trip_allowance: nullableNumber(form.trip_allowance),
          fuel: nullableNumber(form.fuel),
          fuel_po: nullableNumber(form.fuel_po),
          fuel_amount: nullableNumber(form.fuel_amount),
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
          .filter(row => row.photo_name && (row.photo_data || row.photo_path))
          .map(row => ({
            photo_name: row.photo_name || null,
            photo_data: row.photo_data || null,
            photo_path: row.photo_path || null,
          })),

        pricing_details: {
          client_rate: nullableNumber(form.client_rate),
          total_amount: nullableNumber(form.total_amount),
          subcon_rate: nullableNumber(form.subcon_rate),
          driver_rate: nullableNumber(form.driver_rate),
          driver_allowance: nullableNumber(form.driver_allowance),
          helper1_rate: nullableNumber(form.helper1_rate),
          helper1_allowance: nullableNumber(form.helper1_allowance),
          helper2_rate: nullableNumber(form.helper2_rate),
          helper2_allowance: nullableNumber(form.helper2_allowance),
        },

        expenses: {
          b_toll_fees: nullableNumber(form.b_toll_fees),
          b_extra_drop: nullableNumber(form.b_extra_drop),
          b_extra_helper: nullableNumber(form.b_extra_helper),
          b_other_fees: nullableNumber(form.b_other_fees),
          nb_parking_fees: nullableNumber(form.nb_parking_fees),
          nb_toll_fees: nullableNumber(form.nb_toll_fees),
          nb_demurrage_fees: nullableNumber(form.nb_demurrage_fees),
          nb_backload_fees: nullableNumber(form.nb_backload_fees),
          nb_other_deductions: nullableNumber(form.nb_other_deductions),
        },

      };

      let saved;
      if (editBooking && editBooking.booking_id) {
        saved = await bookingCrud.update(editBooking.booking_id, payload);
      } else {
        saved = await bookingCrud.create(payload);
      }
      setToast({ type: 'success', msg: 'Booking saved successfully.' });
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

  const closeForm = () => {
    setDestinationMenuOpen(false);
    setDestinationSearch('');
    setForm(blankForm);
    setCompanyOwned(false);
    setActiveTab('bookinginfo');
    setErrors({});
    setToast({ type: '', msg: '' });
    onClose();
  };

  const fuelTripStatuses = ['Dispatched', 'Delivered', 'Completed'];
  const expenses = ['Delivered', 'Completed'];
  const pricingdetail = ['Delivered', 'Completed'];
  const visibleTabs = TABS.filter(tab => {
    if (tab.key === 'fueltripallowance') {
      return Boolean(editBooking) && fuelTripStatuses.includes(editBooking.status_name);
    }
    if (tab.key === 'expenses') {
      return Boolean(editBooking) && expenses.includes(editBooking.status_name);
    }
    if (tab.key === 'pricingdetails') {
      return Boolean(editBooking) && pricingdetail.includes(editBooking.status_name);
    }
    return true;
  });

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
    const safeOptions = activeOptionsWithCurrent(options, valueKey, v);

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
              {o[labelKey]}{!isActiveOption(o) ? ' (Inactive — already assigned)' : ''}
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
      const isCurrentAssignment =
        String(person.personnel_id) === String(form[`${role}_id`] || '');
      if (!isActiveOption(person) && !isCurrentAssignment) return false;
      if (isCurrentAssignment) return true;

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
      <Field label={label} required={role === 'driver'} error={errors[`${role}_id`]}>
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
    const clientRate = Number(form.client_rate) || 0;
    const tripsNumber = Number(form.trips_number) || 0;
    const totalAmount = (clientRate * tripsNumber).toFixed(2);

    const vehicleOptions = lookupsData.vehicles.filter((vehicle) => {
      const isCurrentVehicle = String(vehicle.plate_no) === String(form.plate_no || '');
      if (!isActiveOption(vehicle) && !isCurrentVehicle) return false;
      if (isCurrentVehicle) return true;

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
              <legend style={{ fontSize: 14, fontWeight: 600, color: '#2563eb', padding: '0 6px'}}>
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
                <Field label="Destination" hint="Select destinations in route order; the selection order sets each stop number.">
                  <div>
                    <div
                      ref={setDestinationInputElement}
                      style={{
                        ...inputStyle,
                        minHeight: 38,
                        height: 'auto',
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        gap: 6,
                        cursor: viewOnly ? 'default' : 'text',
                      }}
                      onClick={() => {
                        if (!viewOnly) setDestinationMenuOpen(true);
                      }}
                    >
                      {(form.destination_ids || []).map((destinationId, index) => {
                        const destination = lookupsData.destination.find(
                          (item) => String(item.destination_id) === String(destinationId)
                        );
                        const label = `${destination?.destination_name || `Destination ${destinationId}`}${destination && !isActiveOption(destination) ? ' (Inactive)' : ''}`;
                        return (
                          <span
                            key={destinationId}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              background: '#eff6ff',
                              color: '#1d4ed8',
                              borderRadius: 14,
                              padding: '3px 8px',
                              fontSize: 12,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {index + 1}. {label}
                            {!viewOnly && (
                              <button
                                type="button"
                                aria-label={`Remove ${label}`}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  toggleDestination(destinationId);
                                }}
                                style={{
                                  border: 0,
                                  background: 'transparent',
                                  color: 'inherit',
                                  padding: 0,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                }}
                              >
                                <X size={13} />
                              </button>
                            )}
                          </span>
                        );
                      })}
                      {!viewOnly && (
                        <input
                          type="text"
                          value={destinationSearch}
                          placeholder={form.destination_ids?.length ? 'Add destination...' : '- Select destination -'}
                          onFocus={() => setDestinationMenuOpen(true)}
                          onBlur={() => setDestinationMenuOpen(false)}
                          onChange={(event) => {
                            setDestinationSearch(event.target.value);
                            setDestinationMenuOpen(true);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === 'Escape') setDestinationMenuOpen(false);
                          }}
                          style={{
                            border: 0,
                            outline: 0,
                            flex: '1 1 130px',
                            minWidth: 120,
                            padding: '2px 0',
                            fontSize: 13,
                          }}
                        />
                      )}
                      {viewOnly && !form.destination_ids?.length && (
                        <span style={{ color: '#6b7280', fontSize: 13 }}>No destinations selected</span>
                      )}
                    </div>
                    {!viewOnly && destinationMenuOpen && destinationMenuPosition && typeof document !== 'undefined' && createPortal(
                      <div
                        style={{
                          position: 'fixed',
                          zIndex: 2000,
                          ...destinationMenuPosition,
                          overflowY: 'auto',
                          background: '#fff',
                          border: '1px solid #d1d5db',
                          borderRadius: 6,
                          boxShadow: '0 8px 16px rgba(0,0,0,0.12)',
                        }}
                      >
                        {lookupsData.destination
                          .filter((destination) =>
                            (isActiveOption(destination) ||
                              (form.destination_ids || []).includes(String(destination.destination_id))) &&
                            String(destination.destination_name || '')
                              .toLowerCase()
                              .includes(destinationSearch.trim().toLowerCase())
                          )
                          .map((destination) => {
                            const selected = (form.destination_ids || []).includes(
                              String(destination.destination_id)
                            );
                            return (
                              <button
                                key={destination.destination_id}
                                type="button"
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => toggleDestination(destination.destination_id)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 8,
                                  width: '100%',
                                  padding: '9px 10px',
                                  border: 0,
                                  background: selected ? '#eff6ff' : '#fff',
                                  textAlign: 'left',
                                  cursor: 'pointer',
                                  fontSize: 13,
                                }}
                              >
                                <input type="checkbox" checked={selected} readOnly />
                                  {destination.destination_name}{!isActiveOption(destination) ? ' (Inactive — already assigned)' : ''}
                              </button>
                            );
                          })}
                        {!lookupsData.destination.some((destination) =>
                          (isActiveOption(destination) ||
                            (form.destination_ids || []).includes(String(destination.destination_id))) &&
                          String(destination.destination_name || '')
                            .toLowerCase()
                            .includes(destinationSearch.trim().toLowerCase())
                        ) && (
                          <div style={{ padding: 10, color: '#6b7280', fontSize: 13 }}>
                            No destinations found.
                          </div>
                        )}
                      </div>,
                      document.body
                    )}
                  </div>
                </Field>
                
          
              </div>
            </fieldset>
          </div>
        );

      case 'vehicleassignment':
        return (
          <div style={{ padding: 18 }}>
            <fieldset style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 14, marginBottom: 18 }}>
              <legend style={{ fontSize: 14, fontWeight: 600, color: '#2563eb', padding: '0 6px'}}>
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
              <legend style={{ fontSize: 14, fontWeight: 600, color: '#2563eb', padding: '0 6px'}}>
                Fuel and Trip Allowance
              </legend>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <Field label="Charges ">
                  {renderSelect('charges', [ 
                    { value: 'NO CHARGES', label: 'NO CHARGES' }, 
                    { value: 'CHARGES RECORDED', label: 'CHARGES RECORDED' }], 
                    'value', 'label', '- Select-')}
                </Field>
                <Field label="Trip Allowance (PHP)">
                  {renderInput('trip_allowance', 'e.g. CL-12345', 'number')}
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
              {/* <Field label="Remarks">
                {renderTextarea('remarks', 'Additional notes…')}
              </Field> */}
            </fieldset>
          </div>
        );
      
      case 'personnelassignment':
        return (
          <div style={{ padding: 18 }}>
            <fieldset style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 14, marginBottom: 18 }}>
              <legend style={{ fontSize: 14, fontWeight: 600, color: '#2563eb', padding: '0 6px'}}>
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
              <legend style={{ fontSize: 14, fontWeight: 600, color: '#2563eb', padding: '0 6px'}}>
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
              <legend style={{ fontSize: 14, fontWeight: 600, color: '#2563eb', padding: '0 6px'}}>
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
                        {activeOptionsWithCurrent(lookupsData.item_types, 'item_type_id', item.item_type_id).map((option, optionIndex) => (
                          <option key={`${option.item_type_id}-${optionIndex}`} value={option.item_type_id ?? ''}>
                            {option.item_type || option.item_type_id}{!isActiveOption(option) ? ' (Inactive — already assigned)' : ''}
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
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        disabled={!String(item.item_type_id ?? '').trim()}
                        onClick={() => addItem(index)}
                        style={{
                          color: '#fff',
                          background: String(item.item_type_id ?? '').trim()
                            ? '#16a34a'
                            : '#166534',
                          borderColor: String(item.item_type_id ?? '').trim()
                            ? '#16a34a'
                            : '#166534',
                          cursor: String(item.item_type_id ?? '').trim()
                            ? 'pointer'
                            : 'not-allowed',
                          opacity: 1,
                        }}
                      >
                        + New Item
                      </button>
                      {form.item_details.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={() => removeItem(index)}
                          style={{
                          color: '#fff',
                          background: item.item_type_id && String(item.item_type_id || '').trim()
                            ? '#b91a1a'
                            : '#b91a1a',
                          opacity: 1,
                        }}
                        >
                          Remove Item
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </fieldset>
          </div>
        );

      case 'bookingphotos':
  return (
    <div style={{ padding: 18 }}>
      <fieldset
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: 8,
          padding: 14,
          marginBottom: 18,
        }}
      >
        <legend
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: '#2563eb',
            padding: '0 6px',
          }}
        >
          Booking Photos
        </legend>

        {/* ============================= */}
        {/* PHOTO INPUTS */}
        {/* ============================= */}

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: '#374151',
            }}
          >
            Photos
          </div>

          {!viewOnly && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => addAttachmentRow('bk_photos')}
              style={{ fontSize: 12 }}
            >
              + Add Photo
            </button>
          )}
        </div>

        {(form.bk_photos || []).map((photo, index) => (
          <div
            key={`photo-input-${index}`}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1.5fr 1fr auto',
              gap: 10,
              alignItems: 'end',
              marginBottom: 12,
              paddingBottom: 12,
              borderBottom:
                index < form.bk_photos.length - 1
                  ? '1px solid #e5e7eb'
                  : 'none',
            }}
          >
            {/* PHOTO NAME - AUTOMATIC */}
            <Field label="Photo Name">
              <input
                type="text"
                readOnly
                style={readOnlyStyle}
                value={photo.photo_name || ''}
                placeholder="Automatically filled"
              />
            </Field>

            {/* FILE SELECTOR */}
            <Field label="Select Photo">
              {!viewOnly ? (
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  style={inputStyle}
                  onChange={(e) => {
                    const file = e.target.files?.[0];

                    if (file) {
                      handlePhotoFile(index, file);
                    }
                  }}
                />
              ) : (
                <input
                  type="text"
                  readOnly
                  style={readOnlyStyle}
                  value={photo.photo_name || 'No photo'}
                />
              )}
            </Field>

            {/* PHOTO DATA - AUTOMATIC */}
            <Field label="Photo Data">
              <input
                type="text"
                readOnly
                style={readOnlyStyle}
                value={
                  photo.photo_data
                    ? `Loaded (${Math.round(
                        (photo.photo_data.length * 3) / 4 / 1024
                      )} KB)`
                    : ''
                }
                placeholder="Automatically filled"
              />
            </Field>

            {/* REMOVE */}
            {!viewOnly && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() =>
                  removeAttachmentRow('bk_photos', index)
                }
                style={{
                  height: 34,
                  alignSelf: 'flex-end',
                }}
              > 
                Remove Photo
              </button>
            )}
          </div>
        ))}

        {/* ============================= */}
        {/* ALL PHOTO PREVIEWS */}
        {/* BELOW ALL INPUTS */}
        {/* ============================= */}

        {(form.bk_photos || []).some(
          photo => getPhotoSource(photo)
        ) && (
          <div
            style={{
              marginTop: 20,
              paddingTop: 16,
              borderTop: '1px solid #e5e7eb',
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: '#374151',
                marginBottom: 12,
              }}
            >
              Photo Preview
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fill, minmax(220px, 1fr))',
                gap: 14,
              }}
            >
              {(form.bk_photos || []).map((photo, index) => {
                const imageSource =
                  getPhotoSource(photo);

                if (!imageSource) {
                  return null;
                }

                return (
                  <div
                    key={`photo-preview-${index}`}
                    style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: 8,
                      padding: 10,
                      background: '#f9fafb',
                    }}
                  >
                    <img
                      src={imageSource}
                      alt={
                        photo.photo_name ||
                        `Photo ${index + 1}`
                      }
                      style={{
                        display: 'block',
                        width: '100%',
                        height: 180,
                        objectFit: 'contain',
                        borderRadius: 6,
                        background: '#ffffff',
                      }}
                    />

                    <div
                      style={{
                        marginTop: 8,
                        fontSize: 12,
                        color: '#374151',
                        textAlign: 'center',
                        wordBreak: 'break-word',
                      }}
                    >
                      {photo.photo_name ||
                        `Photo ${index + 1}`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </fieldset>
    </div>
  );

        case 'pricingdetails':
          return (
            <div style={{ padding: 18 }}>
              <fieldset style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 14, marginBottom: 18 }}>
              <legend style={{ fontSize: 14, fontWeight: 600, color: '#2563eb', padding: '0 6px'}}>
                Booking Information
              </legend>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                  <Field label="Client Rate" required error={errors.client_rate}>
                    {renderInput('client_rate', 'e.g. 5', 'number')}
                  </Field>
                  <Field label="Total Amount">
                    <output aria-live="polite" style={{ ...readOnlyStyle, fontWeight: 600 }}>
                      {totalAmount}
                    </output>
                  </Field>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                  <Field label="Subcon Rate">
                    {renderInput('subcon_rate', 'e.g. 5', 'number')}
                  </Field>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                  {form.driver_id && (
                    <>
                      <Field label="Driver Rate">
                        {renderInput('driver_rate', 'e.g. 5', 'number')}
                      </Field>
                      <Field label="Driver Allowance">
                        {renderInput('driver_allowance', 'e.g. 5', 'number')}
                      </Field>
                    </>
                  )}
                  {form.helper1_id && (
                    <>
                      <Field label="Helper 1 Rate">
                        {renderInput('helper1_rate', 'e.g. 5', 'number')}
                      </Field>
                      <Field label="Helper 1 Allowance">
                        {renderInput('helper1_allowance', 'e.g. 5', 'number')}
                      </Field>
                    </>
                  )}
                  {form.helper2_id && (
                    <>
                      <Field label="Helper 2 Rate">
                        {renderInput('helper2_rate', 'e.g. 5', 'number')}
                      </Field>
                      <Field label="Helper 2 Allowance">
                        {renderInput('helper2_allowance', 'e.g. 5', 'number')}
                      </Field>
                    </>
                  )}
                </div>
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
    <div className="modal-overlay" onClick={closeForm} style={{
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
              {viewOnly
                ? 'View Booking'
                : editBooking
                  ? <>Edit <span style={{ color: '#2563eb' }}>Booking #:</span> <span style={{ fontWeight: 400 }}>{editBooking.booking_no}</span></>
                  : 'New Booking'}
            </div>
            {viewOnly && <div style={{ fontSize: 12, color: '#806b73', marginTop: 2 }}>Read-only mode</div>}
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
            <button className="btn btn-ghost" onClick={closeForm}>
              <X size={15} />
            </button>
          </div>
        </div>

        <div className="tabs" style={{ margin: '0 10px 16px', flexWrap: 'nowrap', overflowX: 'auto' }}>
          {visibleTabs.map(t => (
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
  