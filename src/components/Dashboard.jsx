import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  AlertTriangle,
  Banknote,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  Truck,
} from 'lucide-react';
import { dashboard } from '../services/api.js';

function getLocalDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDate(date) {
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`));
}

function formatTrips(value) {
  return new Intl.NumberFormat().format(Number(value) || 0);
}

function formatRate(value) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function formatBookingDate(date) {
  return date ? formatDate(String(date).slice(0, 10)) : 'No delivery date';
}

function DashboardBookingList({ bookings, emptyLabel, returnTo }) {
  if (bookings.length === 0) {
    return <p className="dashboard-empty">{emptyLabel}</p>;
  }

  return (
    <ul className="dashboard-booking-list">
      {bookings.map((booking) => (
        <li key={booking.booking_id}>
          <Link
            to={`/bookings/${booking.booking_id}/view`}
            state={{ from: returnTo }}
          >
            <span className="dashboard-booking-main">
              <strong>{booking.booking_no || `Booking ${booking.booking_id}`}</strong>
              <span>{booking.customer_name || 'No customer assigned'}</span>
            </span>
            <span className="dashboard-booking-meta">
              <span>{formatBookingDate(booking.delivery_date)}</span>
              {booking.status_name && <span className="dashboard-booking-status">{booking.status_name}</span>}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function Dashboard() {
  const location = useLocation();
  const [selectedDate, setSelectedDate] = useState(getLocalDate);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    dashboard.summary(selectedDate)
      .then((data) => {
        if (active) setSummary(data);
      })
      .catch((requestError) => {
        if (active) {
          setSummary(null);
          setError(requestError.message || 'Unable to load dashboard data.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedDate]);

  const currentSummary = summary?.selected_date === selectedDate ? summary : null;
  const weekLabel = currentSummary
    ? `${formatDate(currentSummary.week_start)} – ${formatDate(currentSummary.week_end)}`
    : '';
  const cards = [
    {
      label: 'Daily Trips',
      period: currentSummary ? formatDate(currentSummary.selected_date) : 'Selected date',
      value: currentSummary ? formatTrips(currentSummary.daily_trips) : '—',
      Icon: Truck,
      color: '#2563eb',
    },
    {
      label: 'Weekly Trips',
      period: weekLabel || 'Selected week',
      value: currentSummary ? formatTrips(currentSummary.weekly_trips) : '—',
      Icon: Truck,
      color: '#0891b2',
    },
    {
      label: 'Daily Total Rates',
      period: currentSummary ? formatDate(currentSummary.selected_date) : 'Selected date',
      value: currentSummary ? formatRate(currentSummary.daily_total_rates) : '—',
      Icon: Banknote,
      color: '#16a34a',
    },
    {
      label: 'Weekly Total Rates',
      period: weekLabel || 'Selected week',
      value: currentSummary ? formatRate(currentSummary.weekly_total_rates) : '—',
      Icon: Banknote,
      color: '#7c3aed',
    },
  ];
  const statusCounts = currentSummary?.status_counts || [];
  const maxStatusCount = Math.max(1, ...statusCounts.map((status) => status.booking_count));

  return (
    <section className="dashboard-page">
      <header className="page-header">
        <div>
          <div className="breadcrumb">Dashboard / Overview</div>
          <h2>Dashboard</h2>
          <div className="dashboard-subtitle">
            Trips and billed rates by delivery date
          </div>
        </div>
        <label className="dashboard-date-filter">
          <CalendarDays size={18} aria-hidden="true" />
          <span>Filter date</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(event) => {
              if (event.target.value) setSelectedDate(event.target.value);
            }}
            aria-label="Filter dashboard by date"
          />
        </label>
      </header>

      {error && <div className="dashboard-error" role="alert">{error}</div>}

      <div className="dashboard-summary-heading">
        <h3>Trip summary</h3>
        {loading && <span className="dashboard-loading"><Loader2 size={16} /> Updating…</span>}
      </div>
      <div className="dashboard-cards" aria-live="polite" aria-busy={loading}>
        {cards.map(({ label, period, value, Icon, color }) => (
          <article className="dashboard-card" key={label}>
            <div className="dashboard-card-icon" style={{ backgroundColor: color }}>
              <Icon size={22} aria-hidden="true" />
            </div>
            <div className="dashboard-card-content">
              <div className="dashboard-card-label">{label}</div>
              <div className="dashboard-card-value">{value}</div>
              <div className="dashboard-card-period">{period}</div>
            </div>
          </article>
        ))}
      </div>

      <div className="dashboard-admin-grid">
        <section className="dashboard-panel" aria-labelledby="dashboard-status-heading">
          <div className="dashboard-panel-header">
            <div className="dashboard-panel-title">
              <CheckCircle2 size={18} />
              <div>
                <h3 id="dashboard-status-heading">Bookings by status</h3>
                <span>All bookings</span>
              </div>
            </div>
            <Link className="dashboard-panel-link" to="/bookings">View bookings</Link>
          </div>
          {loading && !currentSummary ? (
            <p className="dashboard-empty">Loading status counts…</p>
          ) : statusCounts.length ? (
            <ul className="dashboard-status-list">
              {statusCounts.map(({ status_name: statusName, booking_count: count }, index) => (
                <li key={statusName || `status-${index}`}>
                  <span className="dashboard-status-name">{statusName || 'Unknown'}</span>
                  <span className="dashboard-status-bar" aria-hidden="true">
                    <span style={{ width: `${(count / maxStatusCount) * 100}%` }} />
                  </span>
                  <strong>{formatTrips(count)}</strong>
                </li>
              ))}
            </ul>
          ) : (
            <p className="dashboard-empty">No booking statuses to show.</p>
          )}
        </section>

        <section className="dashboard-panel" aria-labelledby="dashboard-attention-heading">
          <div className="dashboard-panel-header">
            <div className="dashboard-panel-title">
              <AlertTriangle size={18} />
              <div>
                <h3 id="dashboard-attention-heading">Delivery attention</h3>
                <span>Compared with {currentSummary ? formatDate(currentSummary.selected_date) : 'selected date'}</span>
              </div>
            </div>
          </div>
          {loading && !currentSummary ? (
            <p className="dashboard-empty">Loading delivery schedule…</p>
          ) : (
            <div className="dashboard-attention-columns">
              <div className="dashboard-attention-group">
                <div className="dashboard-attention-heading">
                  <AlertTriangle size={15} />
                  <h4>Overdue</h4>
                  <strong>{formatTrips(currentSummary?.overdue_count)}</strong>
                </div>
                <DashboardBookingList
                  bookings={currentSummary?.overdue_bookings || []}
                  emptyLabel="No overdue active deliveries."
                  returnTo={`${location.pathname}${location.search}`}
                />
              </div>
              <div className="dashboard-attention-group">
                <div className="dashboard-attention-heading">
                  <Clock3 size={15} />
                  <h4>Due in the next 7 days</h4>
                  <strong>{formatTrips(currentSummary?.upcoming_count)}</strong>
                </div>
                <DashboardBookingList
                  bookings={currentSummary?.upcoming_bookings || []}
                  emptyLabel="No upcoming active deliveries."
                  returnTo={`${location.pathname}${location.search}`}
                />
              </div>
            </div>
          )}
        </section>

        <section className="dashboard-panel" aria-labelledby="dashboard-approvals-heading">
          <div className="dashboard-panel-header">
            <div className="dashboard-panel-title">
              <Clock3 size={18} />
              <div>
                <h3 id="dashboard-approvals-heading">Pending approvals</h3>
                <span>All dates · Under Review</span>
              </div>
            </div>
            <strong className="dashboard-panel-count">{formatTrips(currentSummary?.pending_approval_count)}</strong>
          </div>
          {loading && !currentSummary ? (
            <p className="dashboard-empty">Loading pending approvals…</p>
          ) : (
            <>
              <DashboardBookingList
                bookings={currentSummary?.pending_approvals || []}
                emptyLabel="No bookings are awaiting review."
                returnTo={`${location.pathname}${location.search}`}
              />
              {(currentSummary?.pending_approval_count || 0) > 5 && (
                <Link className="dashboard-panel-link dashboard-panel-more" to="/bookings">
                  View all {formatTrips(currentSummary.pending_approval_count)} pending approvals
                </Link>
              )}
            </>
          )}
        </section>
      </div>
    </section>
  );
}
