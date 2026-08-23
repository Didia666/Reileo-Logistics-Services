const API_BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  let data = null;
  try { data = await res.json(); } catch { /* no-op */ }
  if (!res.ok) {
    throw new Error((data && data.error) || `HTTP ${res.status}`);
  }
  return data;
}

export const auth = {
  login: (username, password) =>
    request('/login.php', { method: 'POST', body: JSON.stringify({ username, password }) }),
  me: () => request('/login.php', { method: 'GET' }),
  logout: () => request('/login.php?action=logout', { method: 'POST' }),
};

export const bookings = {
  list: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/bookings.php${q ? '?' + q : ''}`);
  },
  get: (id) => request(`/bookings.php?id=${id}`),
  create: (payload) =>
    request('/bookings.php', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id, payload) =>
    request(`/bookings.php?id=${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  cancel: (id) => request(`/bookings.php?action=cancel&id=${id}`, { method: 'POST' }),
  remove: (id) => request(`/bookings.php?id=${id}`, { method: 'DELETE' }),
};

const lookup = (endpoint) => () => request(`/${endpoint}.php`);

export function settingsCrud(endpoint) {
  return {
    schema: () => request(`/${endpoint}.php?schema=1`),
    list: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/${endpoint}.php${q ? '?' + q : ''}`);
    },
    create: (payload) =>
      request(`/${endpoint}.php`, { method: 'POST', body: JSON.stringify(payload) }),
    update: (id, payload) =>
      request(`/${endpoint}.php?id=${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    remove: (id) =>
      request(`/${endpoint}.php?id=${id}`, { method: 'DELETE' }),
  };
}

export const lookups = {
  customers: lookup('customers'),
  depots: lookup('depots'),
  vehicles: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/vehicles.php${q ? '?' + q : ''}`);
  },
  personnel: lookup('personnel'),
  origins: lookup('origins'),
  destinations: lookup('destinations'),
  bookingTypes: lookup('booking_types'),
  bookingStatuses: lookup('booking_statuses'),
  commodities: lookup('commodities'),
  vendors: lookup('vendors'),
  item_types: lookup('item_types'),
  category_types: lookup('category_types'),
};
