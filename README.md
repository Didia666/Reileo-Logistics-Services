# Smartfleet - Bookings (React + Vite)

A UI of the Bookings screen (list view + Add/Update Booking form),.

## Setup

This project was authored in a sandbox with no internet access, so the
dependencies have **not** been installed or run yet. On your own machine:

```bash
npm install
npm run dev
```

Then open the printed local URL (usually http://localhost:5173).

## What's included

- `src/components/Sidebar.jsx` — left nav (Dashboard, Home, Bookings, Billing
  Management, Asset Management, Reminders, Incidents, Parts Management,
  Work Order, Fuel Record, Reports)
- `src/components/BookingsList.jsx` — the bookings table: status tabs (All,
  Under Review, Approved, Dispatched, Delivered, Completed, Cancelled,
  Declined), items-per-page control, and a per-row Select action menu
  (View / Update / Cancel)
- `src/components/BookingForm.jsx` — Add/Update Booking form with the three
  documented sections (Booking Information, Vehicle Assignment, Personnel
  Assignment), including the Subcon toggle (filters vehicle options),
  auto-filled Truck Type, and the "Driver Included?" helper-list rule
- `src/data/mockData.js` — placeholder data standing in for your MySQL
  tables (`customers`, `depots`, `vehicles`, `personnel`, etc. — see
  `bookings_module_schema.sql`)

## Next steps to make it real

1. Replace `src/data/mockData.js` with API calls to your backend
   (e.g. `fetch('/api/bookings')`), matching the tables in the schema
   already provided.
2. Wire `handleSave` in `src/App.jsx` to `POST`/`PUT` your bookings endpoint.
3. Add auth/role checks (admin / employee / customer) once you have a
   login flow — the `roles`/`permissions` tables from the schema map
   directly onto route guards here.
4. If you have the real screenshots for other screens (Dashboard, Billing,
   Asset Management, etc.), send them over and I'll build those pages to
   match too.
