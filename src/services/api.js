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

  const method = (options.method || 'GET').toUpperCase();
  const isAuditRequest = path.split('?')[0].endsWith('/audit_logs.php');
  const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
  if (isMutation && !isAuditRequest && !path.includes('/login.php')) {
    const query = new URLSearchParams(path.split('?')[1] || '');
    const endpoint = path.split('?')[0].split('/').pop()?.replace('.php', '') || 'system';
    const action = query.get('action') || ({ POST: 'create', PUT: 'update', PATCH: 'update', DELETE: 'delete' }[method]);
    let changes = null;
    try {
      changes = options.body ? JSON.parse(options.body) : null;
      if (changes?.password) delete changes.password;
    } catch { /* no-op */ }
    fetch(`${API_BASE}/audit_logs.php`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        module: endpoint,
        action,
        reference: data?.booking_no || data?.vehicle_id || data?.customer_id || data?.personnel_id || query.get('id') || null,
        changes,
      }),
    }).catch(() => {});
  }
  return data;
}

export const auth = {
  login: (username, password) =>
    request('/login.php', { method: 'POST', body: JSON.stringify({ username, password }) }),
  me: () => request('/login.php', { method: 'GET' }),
  logout: () => request('/login.php?action=logout', { method: 'POST' }),
};

export const auditLogs = {
  list: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/audit_logs.php${q ? '?' + q : ''}`);
  },
};

export const reports = {
  list: (report) => request(`/reports.php?report=${encodeURIComponent(report)}`),
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
  approve: (id) => request(`/bookings.php?action=approve&id=${id}`, { method: 'POST' }),
  dispatch: (id) => request(`/bookings.php?action=dispatch&id=${id}`, { method: 'POST' }),
  deliver: (id) => request(`/bookings.php?action=deliver&id=${id}`, { method: 'POST' }),
  complete: (id) => request(`/bookings.php?action=complete&id=${id}`, { method: 'POST' }),
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

export const customersCrud = {
  list: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/customers.php${q ? '?' + q : ''}`);
  },
  get: (id) => request(`/customers.php?id=${id}`),
  create: (payload) =>
    request('/customers.php', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id, payload) =>
    request(`/customers.php?id=${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  remove: (id) =>
    request(`/customers.php?id=${id}`, { method: 'DELETE' }),
};

export const lookups = {
  customers: lookup('customers'),
  bookingTypes: lookup('booking_types'),
  depots: lookup('depots'),
  vehicles: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/vehicles.php${q ? '?' + q : ''}`);
  },
  personnel: lookup('personnel'),
  origins: lookup('origins'),
  destination: lookup('destination'),
  item_types: lookup('item_types'),
  bookingStatuses: lookup('booking_statuses'),
  vehicle_statuses: lookup('vehicle_statuses'),
  vh_types: lookup('vh_types'),
  vh_manufacturers: lookup('vh_manufacturers'),
  vh_models: lookup('vh_models'),
  vehicles: lookup('vehicles'),
  dl_codes: lookup('dl_codes'),
  commodity_type: lookup('commodity_type'),
  vendors: lookup('vendors'),
  category_types: lookup('category_types'),
};

export const personnelCrud = {
  list: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/personnel.php${q ? '?' + q : ''}`);
  },
  get: (id) => request(`/personnel.php?id=${id}`),
  create: (payload) =>
    request('/personnel.php', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id, payload) =>
    request(`/personnel.php?id=${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  remove: (id) =>
    request(`/personnel.php?id=${id}`, { method: 'DELETE' }),
};

export const vehicleCrud = {
  list: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/vehicles.php${q ? '?' + q : ''}`);
  },
  get: (id) => request(`/vehicles.php?id=${id}`),
  create: (payload) =>
    request('/vehicles.php', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id, payload) =>
    request(`/vehicles.php?id=${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  cancel: (id) => request(`/vehicles.php?action=cancel&id=${id}`, { method: 'POST' }),
  remove: (id) =>
    request(`/vehicles.php?id=${id}`, { method: 'DELETE' }),
};

export const bookingCrud = {
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
  remove: (id) =>
    request(`/bookings.php?id=${id}`, { method: 'DELETE' }),
};
