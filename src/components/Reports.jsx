import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BarChart3, Car, CircleDollarSign, Download, FileText, Fuel, Users, Loader2, X } from 'lucide-react';
import { lookups, reports } from '../services/api.js';

const REPORTS = [
  {
    key: 'bookings', title: 'Bookings Report', description: 'List of bookings', Icon: BarChart3,
    columns: [['booking_no', 'Booking No.'], ['delivery_date', 'Delivery Date'], ['customer_name', 'Customer'], ['booking_type', 'Type'], ['status_name', 'Status'], ['plate_no', 'Plate No.']],
    excelColumns: [
      ['booking_no', 'Booking #'], ['booking_type', 'Type'], ['customer_name', 'Customer'],
      ['origin_name', 'Origin'], ['depot_name', 'Depot'], ['other_ref_no', 'Other Ref #'],
      ['vendor_name', 'Trucker'], ['agency', 'Agency'], ['plate_no', 'Plate No'],
      ['delivery_date', 'Delivery Date'], ['commodity_type', 'Commodity'], ['status_name', 'Status'],
      ['created_by', 'Created By'], ['driver', 'Driver'], ['helper1', 'Helper 1'], ['helper2', 'Helper 2'],
      ['subcon', 'Sub Con?'], ['client_rate', 'Client Rate'], ['subcon_rate', 'Subcon Rate'],
      ['dispatch_date', 'Dispatched Date'], ['destination_name', 'Farthest Destination'],
      ['odometer_dispatched', 'Odometer-Dispatched'], ['odometer_delivered', 'Odometer-Delivered'],
      ['fuel_po', 'PO Number (Fuel PO)'], ['fuel', 'Fuel (L)'], ['fuel_price', 'Fuel Price'],
      ['vehicle_type', 'Truck Type'], ['client_ref_no', 'Client Ref #'], ['billing_invoice', 'Billing Invoice'],
      ['billed', 'Billed'], ['route_code', 'Route Code'], ['remarks', 'Remarks'], ['charges', 'Charges'],
      ['toll_fees', 'Toll Fees'], ['other_expenses', 'Other Expenses/Fees'], ['extra_drop', 'Extra Drop'],
      ['extra_helper', 'Extra Helper'], ['parking_fee', 'Parking Fees'], ['backload_fee', 'Backload Fee'],
      ['demurrage_fee', 'Demurrage Fee'], ['toll_fee_non_billable', 'Toll Fee - Non-Billable'],
      ['driver_allowance', 'Driver Allowance'], ['helper1_allowance', 'Helper 1 Allowance'],
      ['helper2_allowance', 'Helper 2 Allowance'], ['helper1_agency', 'Helper 1 Agency'],
      ['helper2_agency', 'Helper 2 Agency'], ['trip_allowance', 'Trip Allowance'], ['remarks_2', 'Remarks 2'],
      ['billing_date', 'Billing Date'], ['truck_category', 'Truck Category'],
      ['driver_contact', "Driver's Contact Number"], ['helper1_contact', 'Helper 1 Contact Number'],
      ['helper2_contact', 'Helper 2 Contact Number'], ['aging', 'Aging'], ['created_at', 'Date Created'],
    ],
  },
  {
    key: 'vehicles',
    title: 'Vehicles Report',
    description: 'List of vehicles',
    Icon: Car,
    columns: [['plate_no', 'Plate No.'], ['vehicle_type', 'Vehicle Type'], ['vehicle_manufacturer', 'Manufacturer'], ['vehicle_model', 'Model'], ['status_name', 'Status'], ['vendor_name', 'Vendor']],
    excelColumns: [
      ['body_no', 'Body No'], ['plate_no', 'Plate No'], ['vehicle_manufacturer', 'Maker'], ['vehicle_model', 'Model'], ['status_name', 'Status'], ['depot_name', 'Depot'], ['vehicle_type', 'Vehicle Type'], ['company_owned', 'Company Owned'], ['vendor_name', 'Vendor'], ['registration_date', 'Registration Date'], ['year_model', 'Year'], ['mv_file_no', 'MV File No.'], ['insurance_provider', 'Insurance Provider'], ['insurance_policy_no', 'Insurance Policy No.'], ['insurance_expiry', 'Insurance Expiry'], ['inland_marine_policy_no', 'Inland Marine Policy No.'], ['inland_marine_expiry', 'Inland Marine Expiry'], ['ltfrb_case_no', 'LTFRB Case No.'], ['ltfrb_expiry', 'LTFRB Expiry'], ['cr_number', 'CR No.'], ['cr_date', 'CR Date'], ['or_number', 'OR No.'], ['or_date', 'OR Date'], ['engine_no', 'Engine No.'], ['chassis_no', 'Chassis No.'], ['engine_size', 'Engine Size'], ['color', 'Color'], ['fuel_type', 'Fuel Type'], ['transmission_type', 'Transmission Type'], ['commodity_type', 'Commodity Type'], ['registration_type', 'Registration Type'], ['origin_name', 'Origin'], ['asset_no', 'Asset No.'], ['acquisition_price', 'Acquisition Cost'], ['acquisition_date', 'Acquisition Date'], ['transfer_date', 'Transfer Date'], ['breakdown_date', 'Breakdown Date'], ['breakdown_remarks', 'Breakdown Remarks'], ['project', 'Project'], ['remarks', 'Remarks'], ['with_gps', 'With GPS'], ['odometer', 'Odometer'], ['rfid_type', 'RFID Type'], ['rfid_account_no', 'RFID Account No.'], ['category_type', 'Category Type'],
    ],
  },
  { key: 'personnel-settlement', title: 'Personnel Settlement Report', description: 'List of personnel settlement', Icon: Users, columns: [['full_name', 'Personnel'], ['personnel_type', 'Type'], ['daily_rate', 'Daily Rate'], ['vendor_name', 'Vendor'], ['status', 'Status']] },
  { key: 'operational-expenses', title: 'Operational Expenses Report', description: 'List of operational expenses', Icon: CircleDollarSign, columns: [['expense_date', 'Date'], ['description', 'Description'], ['amount', 'Amount'], ['status', 'Status']] },
  { key: 'fuel', title: 'Fuel Report', description: 'List of fuel records', Icon: Fuel, columns: [['booking_no', 'Booking No.'], ['area', 'Area'], ['fuel', 'Fuel (L)'], ['fuel_po', 'Fuel PO'], ['fuel_amount', 'Fuel Amount']] },
];

function display(value) {
  return value === null || value === undefined || value === '' ? '-' : value;
}

const emptyBookingFilters = {
  deliveryFrom: '', deliveryTo: '', bookingNo: '', clientRefNo: '', customerId: '',
  bookingTypeId: '', commodityTypeId: '', depotId: '', originId: '', vendorId: '', plateNo: '',
};

const BOOKING_STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'Under Review', label: 'Under Review' },
  { key: 'Dispatched', label: 'Dispatched' },
  { key: 'Delivered', label: 'Delivered' },
  { key: 'Completed', label: 'Completed' },
  { key: 'Cancelled', label: 'Cancelled' },
  { key: 'Declined', label: 'Declined' },
  { key: 'aging', label: 'Aging' },
];

const VEHICLE_STATUS_TABS = [
  { key: 'all', label: 'All' }, { key: 'Active', label: 'Active' },
  { key: 'Inactive', label: 'Inactive' }, { key: 'Sold', label: 'Sold' },
  { key: 'Archive', label: 'Archive' }, { key: 'Scrap', label: 'Scrap' },
  { key: 'In-shop', label: 'In-shop' }, { key: 'Out of Service', label: 'Out of Service' },
];

const emptyVehicleFilters = { plateNo: '', vehicleTypeId: '', manufacturerId: '', depotId: '', companyOwned: '', vendorId: '', categoryTypeId: '' };

function matchesBooking(row, filters) {
  const deliveryDate = row.delivery_date || '';
  return (!filters.deliveryFrom || deliveryDate >= filters.deliveryFrom)
    && (!filters.deliveryTo || deliveryDate <= filters.deliveryTo)
    && (!filters.bookingNo || String(row.booking_no || '').toLowerCase().includes(filters.bookingNo.toLowerCase()))
    && (!filters.clientRefNo || String(row.client_ref_no || '').toLowerCase().includes(filters.clientRefNo.toLowerCase()))
    && (!filters.customerId || String(row.customer_id) === filters.customerId)
    && (!filters.bookingTypeId || String(row.booking_type_id) === filters.bookingTypeId)
    && (!filters.commodityTypeId || String(row.commodity_type_id) === filters.commodityTypeId)
    && (!filters.depotId || String(row.depot_id) === filters.depotId)
    && (!filters.originId || String(row.origin_id) === filters.originId)
    && (!filters.vendorId || String(row.vendor_id) === filters.vendorId)
    && (!filters.plateNo || String(row.plate_no || '').toLowerCase().includes(filters.plateNo.toLowerCase()));
}

function hasBookingFilters(filters) {
  return Object.values(filters).some((value) => String(value || '').trim() !== '');
}

function matchesBookingStatus(row, status) {
  if (status === 'all') return true;
  if (status === 'aging') {
    const today = new Date().toISOString().slice(0, 10);
    return row.delivery_date && row.delivery_date < today
      && !['Completed', 'Cancelled', 'Declined'].includes(row.status_name);
  }
  return row.status_name === status;
}

function matchesVehicle(row, filters, status) {
  const statusMatches = status === 'all' || row.status_name === status || (status === 'Scrap' && row.status_name === 'Scrapped');
  return statusMatches
    && (!filters.plateNo || String(row.plate_no || '').toLowerCase().includes(filters.plateNo.toLowerCase()))
    && (!filters.vehicleTypeId || String(row.vehicle_type_id) === filters.vehicleTypeId)
    && (!filters.manufacturerId || String(row.vehicle_manufacturer_id) === filters.manufacturerId)
    && (!filters.depotId || String(row.depot_id) === filters.depotId)
    && (!filters.companyOwned || (filters.companyOwned === 'owned' ? !row.vendor_id : Boolean(row.vendor_id)))
    && (!filters.vendorId || String(row.vendor_id) === filters.vendorId)
    && (!filters.categoryTypeId || String(row.category_type_id) === filters.categoryTypeId);
}

function escapeExcel(value) {
  if (value === null || value === undefined || value === '') return '';
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function downloadExcel(report, rows, filters = {}) {
  const exportColumns = report.excelColumns || report.columns;
  const header = exportColumns.map(([, label]) => `<th>${escapeExcel(label)}</th>`).join('');
  const body = rows.map((row) => `<tr>${exportColumns.map(([key]) => `<td>${escapeExcel(row[key])}</td>`).join('')}</tr>`).join('');
  const html = `<html><head><meta charset="UTF-8"><style>
    table { border-collapse: collapse; font-family: Arial, sans-serif; font-size: 10pt; }
    th, td { border: 1px solid #7f7f7f; padding: 5px 7px; white-space: nowrap; }
    th { background: #f4b183; color: #000; font-weight: bold; text-align: center; }
    td { background: #fff; vertical-align: top; }
  </style></head><body><table><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table></body></html>`;
  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const generatedDate = new Date().toISOString().slice(0, 10);
  const datePart = filters.deliveryFrom || filters.deliveryTo
    ? `-${filters.deliveryFrom || 'all'}-to-${filters.deliveryTo || 'all'}`
    : `-${generatedDate}`;
  const reportName = report.title.replace(/\s+/g, '-');
  link.download = `${reportName}${datePart}.xls`;
  link.click();
  URL.revokeObjectURL(url);
}

function ReportTable({ report, rows }) {
  return (
    <div className="report-table-wrap">
      <table className="data-table report-table">
        <thead><tr>{report.columns.map(([, label]) => <th key={label}>{label}</th>)}</tr></thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={report.columns.length} className="empty-row">No records available.</td></tr>
          ) : rows.map((row, index) => (
            <tr key={row.booking_id || row.vehicle_id || row.personnel_id || row.bk_fuel_trip_id || index}>
              {report.columns.map(([key]) => <td key={key}>{display(row[key])}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Reports() {
  const [selected, setSelected] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showDownload, setShowDownload] = useState(false);
  const [filters, setFilters] = useState(emptyBookingFilters);
  const [draftFilters, setDraftFilters] = useState(emptyBookingFilters);
  const [bookingStatus, setBookingStatus] = useState('all');
  const [vehicleStatus, setVehicleStatus] = useState('all');
  const [vehicleFilters, setVehicleFilters] = useState(emptyVehicleFilters);
  const [vehicleDraftFilters, setVehicleDraftFilters] = useState(emptyVehicleFilters);
  const [lookupData, setLookupData] = useState({ customers: [], bookingTypes: [], commodities: [], depots: [], origins: [], vendors: [] });
  const [vehicleLookupData, setVehicleLookupData] = useState({ vehicleTypes: [], manufacturers: [], depots: [], vendors: [], categories: [] });

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    setError('');
    reports.list(selected.key)
      .then((data) => setRows(Array.isArray(data) ? data : (data?.data || [])))
      .catch((e) => setError(e.message || 'Unable to load report.'))
      .finally(() => setLoading(false));
  }, [selected]);

  useEffect(() => {
    if (selected?.key !== 'vehicles') return;
    Promise.all([
      lookups.vh_types().catch(() => []), lookups.vh_manufacturers().catch(() => []),
      lookups.depots().catch(() => []), lookups.vendors().catch(() => []),
      lookups.category_types().catch(() => []),
    ]).then(([vehicleTypes, manufacturers, depots, vendors, categories]) => {
      const normalize = (value) => Array.isArray(value) ? value : (value?.data || []);
      setVehicleLookupData({ vehicleTypes: normalize(vehicleTypes), manufacturers: normalize(manufacturers), depots: normalize(depots), vendors: normalize(vendors), categories: normalize(categories) });
    });
  }, [selected]);

  useEffect(() => {
    if (selected?.key !== 'bookings') return;
    Promise.all([
      lookups.customers().catch(() => []), lookups.bookingTypes().catch(() => []),
      lookups.commodity_type().catch(() => []), lookups.depots().catch(() => []),
      lookups.origins().catch(() => []), lookups.vendors().catch(() => []),
    ]).then(([customers, bookingTypes, commodities, depots, origins, vendors]) => {
      const normalize = (value) => Array.isArray(value) ? value : (value?.data || []);
      setLookupData({ customers: normalize(customers), bookingTypes: normalize(bookingTypes), commodities: normalize(commodities), depots: normalize(depots), origins: normalize(origins), vendors: normalize(vendors) });
    });
  }, [selected]);

  const filteredRows = useMemo(
    () => {
      if (selected?.key === 'vehicles') return rows.filter((row) => matchesVehicle(row, vehicleFilters, vehicleStatus));
      if (selected?.key !== 'bookings') return rows;
      return rows.filter((row) => matchesBooking(row, filters)).filter((row) => matchesBookingStatus(row, bookingStatus));
    },
    [rows, selected, filters, bookingStatus, vehicleFilters, vehicleStatus]
  );

  const updateDraft = (key, value) => setDraftFilters((previous) => ({ ...previous, [key]: value }));
  const applyFilters = () => { setFilters(draftFilters); setShowDownload(false); };
  const clearFilters = () => { setDraftFilters(emptyBookingFilters); setFilters(emptyBookingFilters); };
  const updateVehicleDraft = (key, value) => setVehicleDraftFilters((previous) => ({ ...previous, [key]: value }));
  const applyVehicleFilters = () => { setVehicleFilters(vehicleDraftFilters); setShowDownload(false); };
  const clearVehicleFilters = () => { setVehicleDraftFilters(emptyVehicleFilters); setVehicleFilters(emptyVehicleFilters); };

  const renderSelect = (key, options, valueKey, labelKey, placeholder) => (
    <select value={draftFilters[key]} onChange={(e) => updateDraft(key, e.target.value)}>
      <option value="">{placeholder}</option>
      {options.map((option, index) => <option key={`${option[valueKey]}-${index}`} value={option[valueKey]}>{option[labelKey]}</option>)}
    </select>
  );

  const renderVehicleSelect = (key, options, valueKey, labelKey, placeholder) => (
    <select value={vehicleDraftFilters[key]} onChange={(e) => updateVehicleDraft(key, e.target.value)}>
      <option value="">{placeholder}</option>
      {options.map((option, index) => <option key={`${option[valueKey]}-${index}`} value={option[valueKey]}>{option[labelKey]}</option>)}
    </select>
  );

  const filterPanel = (downloadMode = false) => (
    <div className={downloadMode ? 'report-modal-backdrop' : 'report-filter-panel'}>
      <div className={downloadMode ? 'report-download-modal' : ''}>
        {downloadMode && <div className="report-modal-header"><span>Download Report</span><button type="button" onClick={() => setShowDownload(false)}><X size={16} /></button></div>}
        {downloadMode && <div className="report-modal-intro">Choose a filter to download a report</div>}
        <div className="report-filter-grid">
          <label>Booking No.<input value={draftFilters.bookingNo} onChange={(e) => updateDraft('bookingNo', e.target.value)} /></label>
          <label>Client Ref No.<input value={draftFilters.clientRefNo} onChange={(e) => updateDraft('clientRefNo', e.target.value)} /></label>
          <label>Delivery Date From<input type="date" value={draftFilters.deliveryFrom} onChange={(e) => updateDraft('deliveryFrom', e.target.value)} /></label>
          <label>Delivery Date To<input type="date" value={draftFilters.deliveryTo} onChange={(e) => updateDraft('deliveryTo', e.target.value)} /></label>
          <label>Customer{renderSelect('customerId', lookupData.customers, 'customer_id', 'customer_name', '- Select -')}</label>
          <label>Booking Type{renderSelect('bookingTypeId', lookupData.bookingTypes, 'booking_type_id', 'booking_type', '- Select -')}</label>
          <label>Commodity Type{renderSelect('commodityTypeId', lookupData.commodities, 'commodity_type_id', 'commodity_type', '- Select -')}</label>
          <label>Depot{renderSelect('depotId', lookupData.depots, 'depot_id', 'depot_name', '- Select -')}</label>
          <label>Origin{renderSelect('originId', lookupData.origins, 'origin_id', 'origin_name', '- Select -')}</label>
          <label>Trucker{renderSelect('vendorId', lookupData.vendors, 'vendor_id', 'vendor_name', '- Select -')}</label>
          <label className="report-filter-wide">Plate Number<input value={draftFilters.plateNo} onChange={(e) => updateDraft('plateNo', e.target.value)} /></label>
        </div>
        <div className="report-filter-actions">
          <button className="btn btn-secondary" type="button" onClick={clearFilters}>Clear</button>
          {downloadMode ? <button className="btn btn-primary" type="button" onClick={() => { applyFilters(); const exportRows = rows.filter((row) => matchesBooking(row, draftFilters)).filter((row) => matchesBookingStatus(row, bookingStatus)); downloadExcel(selected, exportRows, draftFilters); }}> <FileText size={14} /> Generate Report</button> : <button className="btn btn-primary" type="button" onClick={applyFilters}>Search</button>}
        </div>
      </div>
    </div>
  );

  const vehicleFilterPanel = (downloadMode = false) => (
    <div className={downloadMode ? 'report-modal-backdrop' : 'report-filter-panel'}>
      <div className={downloadMode ? 'report-download-modal' : ''}>
        {downloadMode && <div className="report-modal-header"><span>Download Report</span><button type="button" onClick={() => setShowDownload(false)}><X size={16} /></button></div>}
        {downloadMode && <div className="report-modal-intro">Choose a filter to download a report</div>}
        <div className="report-filter-grid vehicle-filter-grid">
          <label>Plate No.<input value={vehicleDraftFilters.plateNo} onChange={(e) => updateVehicleDraft('plateNo', e.target.value)} /></label>
          <label>Vehicle Type{renderVehicleSelect('vehicleTypeId', vehicleLookupData.vehicleTypes, 'vehicle_type_id', 'vehicle_type', '- Select -')}</label>
          <label>Maker{renderVehicleSelect('manufacturerId', vehicleLookupData.manufacturers, 'vehicle_manufacturer_id', 'vehicle_manufacturer', '- Select -')}</label>
          <label>Depot{renderVehicleSelect('depotId', vehicleLookupData.depots, 'depot_id', 'depot_name', '- Select -')}</label>
          <label>Company Owned
            <select value={vehicleDraftFilters.companyOwned} onChange={(e) => updateVehicleDraft('companyOwned', e.target.value)}>
              <option value="">- Select -</option><option value="owned">Company Owned</option><option value="subcon">Subcon</option>
            </select>
          </label>
          <label>Subcon{renderVehicleSelect('vendorId', vehicleLookupData.vendors, 'vendor_id', 'vendor_name', '- Select -')}</label>
          <label>Category Type{renderVehicleSelect('categoryTypeId', vehicleLookupData.categories, 'category_type_id', 'category_type', '- Select -')}</label>
        </div>
        <div className="report-filter-actions">
          <button className="btn btn-secondary" type="button" onClick={clearVehicleFilters}>Clear</button>
          {downloadMode ? <button className="btn btn-primary" type="button" onClick={() => { applyVehicleFilters(); const exportRows = rows.filter((row) => matchesVehicle(row, vehicleDraftFilters, vehicleStatus)); downloadExcel(selected, exportRows, vehicleDraftFilters); }}><FileText size={14} /> Generate Report</button> : <button className="btn btn-primary" type="button" onClick={applyVehicleFilters}>Search</button>}
        </div>
      </div>
    </div>
  );

  if (selected) {
    return (
      <div className="reports-page">
        <div className="page-header">
          <div>
            <div className="breadcrumb">Reports / {selected.title}</div>
            <h2>{selected.title}</h2>
            <div style={{ color: '#6b7280', fontSize: 13 }}>{filteredRows.length} records</div>
          </div>
          <div className="report-header-actions">
            {(selected.key === 'bookings' || selected.key === 'vehicles') && <><button className="btn btn-secondary" type="button" onClick={() => setShowDownload(true)}><Download size={14} /> Download</button><button className="btn btn-primary" type="button" onClick={() => setShowFilters((value) => !value)}>Filter</button></>}
            <button className="btn btn-secondary" type="button" onClick={() => setSelected(null)}><ArrowLeft size={15} /> Reports</button>
          </div>
        </div>
        {selected.key === 'bookings' && showFilters && filterPanel()}
        {selected.key === 'vehicles' && showFilters && vehicleFilterPanel()}
        {selected.key === 'bookings' && (
          <div className="booking-report-status-tabs">
            {BOOKING_STATUS_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={bookingStatus === tab.key ? 'active' : ''}
                onClick={() => setBookingStatus(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
        {selected.key === 'vehicles' && (
          <div className="booking-report-status-tabs">
            {VEHICLE_STATUS_TABS.map((tab) => (
              <button key={tab.key} type="button" className={vehicleStatus === tab.key ? 'active' : ''} onClick={() => setVehicleStatus(tab.key)}>
                {tab.label}
              </button>
            ))}
          </div>
        )}
        {error && <div className="alert alert-error">{error}</div>}
        {loading ? <div className="loading"><Loader2 className="animate-spin" size={20} /> Loading report...</div> : <ReportTable report={selected} rows={filteredRows} />}
        {showDownload && selected.key === 'bookings' && filterPanel(true)}
        {showDownload && selected.key === 'vehicles' && vehicleFilterPanel(true)}
      </div>
    );
  }

  return (
    <div className="reports-page">
      <div className="page-header">
        <div>
          <div className="breadcrumb">Management / Reports</div>
          <h2>Reports</h2>
          <div style={{ color: '#6b7280', fontSize: 13 }}>Select a report to view its records</div>
        </div>
      </div>
      <div className="reports-grid">
        {REPORTS.map(({ key, title, description, Icon }) => (
          <button className="report-card" type="button" key={key} onClick={() => setSelected(REPORTS.find((report) => report.key === key))}>
            <div className="report-card-icon"><Icon size={38} /></div>
            <div className="report-card-title">{title}</div>
            <div className="report-card-description">{description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
