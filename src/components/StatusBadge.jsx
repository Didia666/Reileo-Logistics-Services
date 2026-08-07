const STATUS_COLORS = {
  'Under Review': '#4f5fae',
  'Approved': '#4f5fae',
  'Dispatched': '#2f6fed',
  'Delivered': '#2f6fed',
  'Completed': '#24a866',
  'Cancelled': '#9aa0ac',
  'Declined': '#d33f3f',
  'Draft': '#2e3a50',
  'Submitted': '#2f6fed',
  'On Service': '#d98f2b',
  'Paid': '#24a866',
  'Due Soon': '#d98f2b',
  'Overdue': '#d33f3f',
}

export default function StatusBadge({ status }) {
  const bg = STATUS_COLORS[status] || '#2e3a50'
  return (
    <span className="badge" style={{ background: bg }}>
      {status}
    </span>
  )
}
