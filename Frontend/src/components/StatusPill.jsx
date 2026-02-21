import React from 'react'

const map = {
  'Available': 'status-active',
  'On Trip': 'status-trip',
  'In Shop': 'status-shop',
  'On Duty': 'status-active',
  'Off Duty': 'status-idle',
  'Suspended': 'status-suspended',
  'Dispatched': 'status-trip',
  'Completed': 'status-completed',
  'Cancelled': 'status-cancelled',
  'Draft': 'status-idle',
  'In Progress': 'status-trip',
  'Retired': 'status-cancelled',
}

export default function StatusPill({ status }) {
  const cls = map[status] || 'status-idle'
  return (
    <span className={`${cls} text-xs font-display font-bold px-2.5 py-1 rounded-full`}>
      {status}
    </span>
  )
}
