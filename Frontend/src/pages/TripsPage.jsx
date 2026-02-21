import React, { useState } from 'react'
import { useFleet } from '../context/FleetContext'
import StatusPill from '../components/StatusPill'
import { Plus, X, Save, MapPin, AlertCircle, CheckCircle2, XCircle } from 'lucide-react'

const emptyTrip = { vehicle: '', driver: '', cargo: '', origin: '', destination: '', estimatedFuel: '', date: new Date().toISOString().slice(0, 10) }

export default function TripsPage() {
  const { vehicles, drivers, trips, addTrip, updateTrip, getVehicle, getDriver, shipments } = useFleet()
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyTrip)
  const [error, setError] = useState('')
  const [warning, setWarning] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  // Check if shipments exist
  const hasShipments = shipments && shipments.length > 0

  const formatNumber = (value) => {
    const n = Number(value)
    if (Number.isNaN(n)) return '0'
    return n.toLocaleString()
  }

  const selectedVehicle = vehicles.find(v => String(v.vehicle_id ?? v.id) === String(form.vehicle))
  const selectedDriver = drivers.find(d => String(d.driver_id ?? d.id) === String(form.driver))

  const availableVehicles = vehicles.filter(v => v.status === 'Available')
  const availableDrivers = drivers.filter(d => {
    if (d.status === 'Suspended') return false
    if (d.status === 'Off Duty') return false
    const expiry = new Date(d.license_expiry_date ?? d.licenseExpiry)
    if (expiry < new Date()) return false
    if (d.status === 'On Trip') return false

    return true
  })

  const handleVehicleChange = (vId) => {
    setForm(f => ({ ...f, vehicle: vId }))
    setWarning('')
  }

  const handleCargoChange = (val) => {
    setForm(f => ({ ...f, cargo: val }))
    const cap = selectedVehicle?.max_load_kg ?? selectedVehicle?.capacity
    if (selectedVehicle && cap != null && +val > +cap) {
      setWarning(`⚠ Cargo (${val}kg) exceeds vehicle capacity (${cap}kg)!`)
    } else {
      setWarning('')
    }
  }

  const submit = () => {
    if (!form.vehicle || !form.driver || !form.cargo || !form.origin || !form.destination) {
      setError('Please fill in all required fields.'); return
    }
    const cap = selectedVehicle?.max_load_kg ?? selectedVehicle?.capacity
    if (selectedVehicle && cap != null && +form.cargo > +cap) {
      setError(`Cargo weight exceeds vehicle max capacity of ${cap}kg.`); return
    }
    if (selectedDriver) {
      const expiry = new Date(selectedDriver.license_expiry_date ?? selectedDriver.licenseExpiry)
      if (expiry < new Date()) { setError('Selected driver has an expired license.'); return }
    }

    // Format date for MySQL DATETIME (YYYY-MM-DD HH:MM:SS)
    const formatDateTime = (date) => {
      const d = new Date(date)
      return d.toISOString().slice(0, 19).replace('T', ' ')
    }
    
    addTrip({
      vehicle_id: +form.vehicle,
      driver_id: +form.driver,
      origin_address: form.origin,
      destination_address: form.destination,
      cargo_weight_kg: +form.cargo,
      scheduled_start: formatDateTime(form.date),
      scheduled_end: formatDateTime(new Date(form.date).getTime() + 24 * 60 * 60 * 1000),
      odometer_start_km: +(selectedVehicle?.odometer_km ?? selectedVehicle?.odometer ?? 0),
      estimated_fuel_cost: +form.estimatedFuel || null,
      status: 'Dispatched',
    })
    setShowModal(false)
    setForm(emptyTrip)
    setError('')
    setWarning('')
  }

  const statuses = ['All', 'Draft', 'Dispatched', 'On Trip', 'Completed', 'Cancelled']
  const filteredTrips = trips.filter(t => statusFilter === 'All' || t.status === statusFilter)

  const lifecycle = ['Draft', 'Dispatched', 'On Trip', 'Completed', 'Cancelled']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>Trip Dispatcher</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Schedule, assign, and track deliveries</p>
        </div>
        <button onClick={() => { setShowModal(true); setError(''); setWarning(''); setForm(emptyTrip) }} className="btn-primary">
          <Plus size={15} /> New Trip
        </button>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        {statuses.map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`text-sm font-display font-bold px-4 py-1.5 rounded-full border transition-all ${statusFilter === s ? 'border-amber-500 bg-amber-500/10 text-amber-400' : 'border-[var(--border-color)] text-[var(--text-muted)] hover:border-[var(--text-secondary)]'}`}>
            {s}
            <span className="ml-2 text-xs">
              {s === 'All' ? trips.length : trips.filter(t => t.status === s).length}
            </span>
          </button>
        ))}
      </div>

      {/* Trips table */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="table-header">
              <th className="text-left px-6 py-3">Trip</th>
              <th className="text-left px-4 py-3">Vehicle</th>
              <th className="text-left px-4 py-3">Driver</th>
              <th className="text-left px-4 py-3">Route</th>
              <th className="text-left px-4 py-3">Cargo (kg)</th>
              <th className="text-left px-4 py-3">Date</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTrips.map(t => {
              const vehicle = getVehicle(t.vehicle_id ?? t.vehicle)
              const driver = getDriver(t.driver_id ?? t.driver)
              return (
                <tr key={t.trip_id ?? t.id} className="table-row">
                  <td className="px-6 py-3 font-mono text-xs text-amber-500">{t.trip_code ?? t.trip_id ?? t.id}</td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-display font-semibold" style={{ color: 'var(--text-primary)' }}>{vehicle?.make} {vehicle?.model}</div>
                    <div className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{t.vehicle_id ?? t.vehicle}</div>
                  </td>
                  <td className="px-4 py-3 text-sm font-display font-semibold" style={{ color: 'var(--text-primary)' }}>{driver?.full_name || driver?.name || t.driver_name || t.driver_id || t.driver}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <MapPin size={10} className="text-amber-500" />
                      <span>{t.origin_address ?? t.origin}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>→</span>
                      <span>{t.destination_address ?? t.destination}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>{formatNumber(t.cargo_weight_kg ?? t.cargo)} </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{String(t.scheduled_start ?? t.date ?? '').slice(0, 10)}</td>
                  <td className="px-4 py-3"><StatusPill status={t.status} /></td>
                  <td className="px-4 py-3">
                    {t.status === 'Draft' ? (
                      <div className="flex gap-1">
                        <button onClick={() => updateTrip(t.trip_id ?? t.id, { status: 'Dispatched' })}
                          className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-500/10 transition-all" title="Dispatch">
                          <CheckCircle2 size={14} />
                        </button>
                        <button onClick={() => updateTrip(t.trip_id ?? t.id, { status: 'Cancelled' })}
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-all" title="Cancel">
                          <XCircle size={14} />
                        </button>
                      </div>
                    ) : t.status === 'Dispatched' || t.status === 'On Trip' ? (
                      <div className="flex gap-1">
                        <button onClick={() => updateTrip(t.trip_id ?? t.id, { status: 'Completed' })}
                          className="p-1.5 rounded-lg text-green-500 hover:bg-green-500/10 transition-all" title="Complete">
                          <CheckCircle2 size={14} />
                        </button>
                        <button onClick={() => updateTrip(t.trip_id ?? t.id, { status: 'Cancelled' })}
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-all" title="Cancel">
                          <XCircle size={14} />
                        </button>
                      </div>
                    ) : <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filteredTrips.length === 0 && <div className="py-12 text-center font-display" style={{ color: 'var(--text-muted)' }}>No trips found</div>}
      </div>

      {/* Trip lifecycle legend */}
      <div className="card px-6 py-4">
        <div className="text-xs font-display font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Trip Lifecycle</div>
        <div className="flex items-center gap-2">
          {lifecycle.map((s, i) => (
            <React.Fragment key={s}>
              <StatusPill status={s} />
              {i < lifecycle.length - 1 && <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>→</span>}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-box">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)' }}>Create New Trip</h3>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg transition-all" style={{ color: 'var(--text-muted)' }}><X size={16} /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label">Select Vehicle *</label>
                <select className="input-field" value={form.vehicle} onChange={e => handleVehicleChange(e.target.value)}>
                  <option value="">— Choose available vehicle —</option>
                  {availableVehicles.map(v => (
                    <option key={v.vehicle_id ?? v.id} value={v.vehicle_id ?? v.id}>{v.vehicle_id ?? v.id} — {v.make} {v.model} ({v.type}) | Max: {v.max_load_kg ?? v.capacity}kg</option>
                  ))}
                </select>
                {availableVehicles.length === 0 && <p className="text-xs text-amber-400 mt-1">No vehicles currently available</p>}
              </div>

              <div>
                <label className="label">Cargo Weight (kg) *</label>
                <input type="number" className="input-field" placeholder="e.g. 1200" value={form.cargo} onChange={e => handleCargoChange(e.target.value)} />
                {selectedVehicle && (
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Vehicle max capacity: <span className="text-amber-400 font-mono">{selectedVehicle.max_load_kg ?? selectedVehicle.capacity}kg</span></p>
                )}
                {warning && (
                  <div className="mt-2 flex items-center gap-2 text-amber-400 text-xs bg-amber-500/10 border border-amber-500/30 px-3 py-2 rounded-lg">
                    <AlertCircle size={13} /> {warning}
                  </div>
                )}
              </div>

              <div>
                <label className="label">Assign Driver *</label>
                <select className="input-field" value={form.driver} onChange={e => setForm(f => ({...f, driver: e.target.value}))}>
                  <option value="">— Choose available driver —</option>
                  {availableDrivers.map(d => (
                    <option key={d.driver_id ?? d.id} value={d.driver_id ?? d.id}>{d.full_name ?? d.name} | Score: {d.safety_score ?? d.safetyScore ?? '-'} | Exp: {d.license_expiry_date ?? d.licenseExpiry}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Origin *</label>
                  <input className="input-field" placeholder="e.g. Mumbai HQ" value={form.origin} onChange={e => setForm(f => ({...f, origin: e.target.value}))} />
                </div>
                <div>
                  <label className="label">Destination *</label>
                  <input className="input-field" placeholder="e.g. Pune Depot" value={form.destination} onChange={e => setForm(f => ({...f, destination: e.target.value}))} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Estimated Fuel Cost (₹)</label>
                  <input type="number" className="input-field" placeholder="e.g. 5000" value={form.estimatedFuel} onChange={e => setForm(f => ({...f, estimatedFuel: e.target.value}))} />
                </div>
                <div>
                  <label className="label">Dispatch Date</label>
                  <input type="date" className="input-field" value={form.date} onChange={e => setForm(f => ({...f, date: e.target.value}))} />
                </div>
              </div>

              {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2.5 text-red-400 text-sm flex items-center gap-2"><AlertCircle size={14} />{error}</div>}

              <div className="flex gap-3 pt-2">
                <button onClick={submit} className="btn-primary flex-1 justify-center">
                  <Save size={14} /> Confirm & Dispatch Trip
                </button>
                <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
