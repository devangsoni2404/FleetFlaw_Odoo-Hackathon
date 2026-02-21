import React, { useState } from 'react'
import { useFleet } from '../context/FleetContext'
import StatusPill from '../components/StatusPill'
import { Truck, AlertTriangle, Package, TrendingUp, Activity, Filter, ChevronRight } from 'lucide-react'

export default function DashboardPage({ onNav }) {
  const { vehicles, drivers, trips, maintenance } = useFleet()
  const [filter, setFilter] = useState({ type: 'All', status: 'All' })

  const formatNumber = (value) => {
    const n = Number(value)
    if (Number.isNaN(n)) return '0'
    return n.toLocaleString()
  }

  const activeFleet = vehicles.filter(v => v.status === 'On Trip').length
  const maintenanceAlerts = vehicles.filter(v => v.status === 'In Shop').length
  const utilRate = vehicles.length
    ? Math.round((vehicles.filter(v => v.status === 'On Trip').length / vehicles.length) * 100)
    : 0
  const pendingCargo = trips.filter(t => t.status === 'Dispatched').length

  const types = ['All', 'Truck', 'Van', 'Bike']
  const statuses = ['All', 'Available', 'On Trip', 'In Shop']

  const filteredVehicles = vehicles.filter(v =>
    (filter.type === 'All' || v.type === filter.type) &&
    (filter.status === 'All' || v.status === filter.status)
  )

  const recentTrips = [...trips]
    .sort((a, b) => String(b.trip_code ?? b.trip_id ?? b.id ?? '').localeCompare(String(a.trip_code ?? a.trip_id ?? a.id ?? '')))
    .slice(0, 5)

  const kpis = [
    { label: 'Active Fleet', value: activeFleet, sub: `of ${vehicles.length} vehicles`, icon: Truck, color: '#3b82f6' },
    { label: 'Maintenance Alerts', value: maintenanceAlerts, sub: 'vehicles in shop', icon: AlertTriangle, color: '#ef4444' },
    { label: 'Utilization Rate', value: `${utilRate}%`, sub: 'fleet efficiency', icon: TrendingUp, color: '#10b981' },
    { label: 'Pending Cargo', value: pendingCargo, sub: 'awaiting dispatch', icon: Package, color: '#f59e0b' },
  ]

  return (
    <div className="space-y-8">
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-5">
        {kpis.map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="kpi-card">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:`${color}20`}}>
                <Icon size={18} style={{color}} />
              </div>
              <Activity size={14} style={{ color: 'var(--text-muted)' }} />
            </div>
            <div className="font-display font-bold text-3xl mb-1" style={{ color: 'var(--text-primary)' }}>{value}</div>
            <div className="text-sm font-display font-semibold" style={{ color: 'var(--text-secondary)' }}>{label}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Filters + Vehicle Table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between flex-wrap gap-3" style={{ borderColor: 'var(--border-color)' }}>
          <h3 className="font-display font-bold" style={{ color: 'var(--text-primary)' }}>Fleet Overview</h3>
          <div className="flex items-center gap-3">
            <Filter size={14} style={{ color: 'var(--text-muted)' }} />
            <div className="flex gap-2">
              {types.map(t => (
                <button key={t} onClick={() => setFilter(f => ({...f, type: t}))}
                  className={`text-xs font-display font-bold px-3 py-1 rounded-full border transition-all ${filter.type === t ? 'border-amber-500 bg-amber-500/10 text-amber-400' : 'border-[var(--border-color)] text-[var(--text-muted)] hover:border-[var(--text-secondary)]'}`}>
                  {t}
                </button>
              ))}
            </div>
            <div className="w-px h-4" style={{ backgroundColor: 'var(--border-color)' }}></div>
            <div className="flex gap-2">
              {statuses.map(s => (
                <button key={s} onClick={() => setFilter(f => ({...f, status: s}))}
                  className={`text-xs font-display font-bold px-3 py-1 rounded-full border transition-all ${filter.status === s ? 'border-amber-500 bg-amber-500/10 text-amber-400' : 'border-[var(--border-color)] text-[var(--text-muted)] hover:border-[var(--text-secondary)]'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
        <table className="w-full">
          <thead>
            <tr className="table-header">
              <th className="text-left px-6 py-3">ID</th>
              <th className="text-left px-4 py-3">Vehicle</th>
              <th className="text-left px-4 py-3">Type</th>
              <th className="text-left px-4 py-3">Plate</th>
              <th className="text-left px-4 py-3">Capacity</th>
              <th className="text-left px-4 py-3">Odometer</th>
              <th className="text-left px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredVehicles.map(v => (
              <tr key={v.vehicle_id ?? v.id} className="table-row">
                <td className="px-6 py-3 font-mono text-xs text-amber-500">{v.vehicle_id ?? v.id}</td>
                <td className="px-4 py-3 font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{v.make} {v.model}</td>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{v.type}</td>
                <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>{v.license_plate ?? v.plate ?? '-'}</td>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>{formatNumber(v.max_load_kg ?? v.capacity)} kg</td>
                <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{formatNumber(v.odometer_km ?? v.odometer)} km</td>
                <td className="px-4 py-3"><StatusPill status={v.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredVehicles.length === 0 && (
          <div className="py-12 text-center font-display" style={{ color: 'var(--text-muted)' }}>No vehicles match filters</div>
        )}
      </div>

      {/* Recent Trips */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
          <h3 className="font-display font-bold" style={{ color: 'var(--text-primary)' }}>Recent Trips</h3>
          <button onClick={() => onNav('trips')} className="text-xs text-amber-500 hover:text-amber-400 font-display font-bold flex items-center gap-1 transition-colors">
            View All <ChevronRight size={12} />
          </button>
        </div>
        <table className="w-full">
          <thead>
            <tr className="table-header">
              <th className="text-left px-6 py-3">Trip ID</th>
              <th className="text-left px-4 py-3">Vehicle</th>
              <th className="text-left px-4 py-3">Driver</th>
              <th className="text-left px-4 py-3">Route</th>
              <th className="text-left px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {recentTrips.map(t => (
              <tr key={t.trip_id ?? t.id} className="table-row">
                <td className="px-6 py-3 font-mono text-xs text-amber-500">{t.trip_code ?? t.trip_id ?? t.id}</td>
                <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>{t.vehicle_name ?? t.vehicle_id ?? t.vehicle ?? '-'}</td>
                <td className="px-4 py-3 text-sm font-display font-semibold" style={{ color: 'var(--text-primary)' }}>{t.driver_name ?? t.driver_id ?? t.driver ?? '-'}</td>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{t.origin_address ?? t.origin ?? '-'} → {t.destination_address ?? t.destination ?? '-'}</td>
                <td className="px-4 py-3"><StatusPill status={t.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
