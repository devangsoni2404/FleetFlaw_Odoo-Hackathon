import React, { useState } from 'react'
import { useFleet } from '../context/FleetContext'
import StatusPill from '../components/StatusPill'
import { Plus, X, Save, Wrench, CheckCircle } from 'lucide-react'

const empty = { vehicle: '', type: '', date: new Date().toISOString().split('T')[0], cost: '', notes: '', status: 'In Progress' }

export default function MaintenancePage() {
  const { vehicles, maintenance, addMaintenance, completeMaintenance, getVehicle } = useFleet()
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(empty)
  const [error, setError] = useState('')

  const formatNumber = (value) => {
    const n = Number(value)
    if (Number.isNaN(n)) return '0'
    return n.toLocaleString()
  }

  const submit = () => {
    if (!form.vehicle || !form.type || !form.cost) { setError('Fill in required fields.'); return }

    addMaintenance({
      vehicle_id: +form.vehicle,
      service_type: form.type,
      service_date: form.date,
      expected_completion: form.date,
      labour_cost: +form.cost,
      parts_cost: 0,
      odometer_at_service: 0,
      status: form.status,
      service_description: form.notes || null,
    })
    setShowModal(false)
    setForm(empty)
    setError('')
  }

  const serviceTypes = ['Oil Change', 'Tire Replacement', 'Brake Service', 'Engine Overhaul', 'Transmission', 'Battery Replacement', 'AC Service', 'Bodywork', 'Other']

  const getCost = (m) => Number((m.total_cost ?? m.cost ?? (Number(m.labour_cost || 0) + Number(m.parts_cost || 0))) || 0)
  const totalCost = maintenance.reduce((a, m) => a + getCost(m), 0)
  const inProgress = maintenance.filter(m => m.status === 'In Progress' || m.status === 'In Progress').length
  const completed = maintenance.filter(m => m.status === 'Completed').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>Maintenance & Service Logs</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Track vehicle health and service history</p>
        </div>
        <button onClick={() => { setShowModal(true); setError(''); setForm(empty) }} className="btn-primary">
          <Plus size={15} /> Log Service
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card px-5 py-4">
          <div className="font-display font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>{inProgress}</div>
          <div className="text-xs mt-1 font-display font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>In Progress</div>
        </div>
        <div className="card px-5 py-4">
          <div className="font-display font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>{completed}</div>
          <div className="text-xs mt-1 font-display font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Completed</div>
        </div>
        <div className="card px-5 py-4">
          <div className="font-display font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>₹{formatNumber(totalCost)}</div>
          <div className="text-xs mt-1 font-display font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Total Spend</div>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-blue-500/8 border border-blue-500/20 rounded-xl px-5 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center flex-shrink-0">
          <Wrench size={15} className="text-blue-400" />
        </div>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          <span className="text-blue-400 font-display font-bold">Auto-Lock Logic: </span>
          Adding a service record automatically moves the vehicle to <span className="text-amber-400 font-mono">"In Shop"</span> status and removes it from the dispatcher pool until marked complete.
        </p>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <h3 className="font-display font-bold" style={{ color: 'var(--text-primary)' }}>Service Records</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="table-header">
              <th className="text-left px-6 py-3">Log ID</th>
              <th className="text-left px-4 py-3">Vehicle</th>
              <th className="text-left px-4 py-3">Service Type</th>
              <th className="text-left px-4 py-3">Date</th>
              <th className="text-left px-4 py-3">Cost</th>
              <th className="text-left px-4 py-3">Notes</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {maintenance.map(m => {
             const vehicle = getVehicle(m.vehicle_id ?? m.vehicle)
             const cost = getCost(m)
              return (
                <tr key={m.maintenance_id ?? m.id} className="table-row">
                  <td className="px-6 py-3 font-mono text-xs text-amber-500">{m.maintenance_code ?? m.maintenance_id ?? m.id}</td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-display font-semibold" style={{ color: 'var(--text-primary)' }}>{vehicle?.make} {vehicle?.model}</div>
                    <div className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{m.vehicle_id ?? m.vehicle}</div>
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{m.service_type ?? m.type}</td>
                  <td className="px-4 py-3 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{String(m.service_date ?? m.date ?? '').slice(0, 10)}</td>
                  <td className="px-4 py-3 font-mono text-sm" style={{ color: 'var(--text-primary)' }}>₹{formatNumber(cost)}</td>
                  <td className="px-4 py-3 text-xs max-w-xs truncate" style={{ color: 'var(--text-muted)' }}>{(m.service_description ?? m.notes) || '—'}</td>
                  <td className="px-4 py-3"><StatusPill status={m.status} /></td>
                  <td className="px-4 py-3">
                    {m.status === 'In Progress' && (
                      <button onClick={() => completeMaintenance(m.maintenance_id ?? m.id)}
                        className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 px-3 py-1.5 rounded-lg font-display font-bold transition-all">
                        <CheckCircle size={12} /> Mark Done
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {maintenance.length === 0 && <div className="py-12 text-center font-display" style={{ color: 'var(--text-muted)' }}>No maintenance records</div>}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-box">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)' }}>Log New Service</h3>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg transition-all" style={{ color: 'var(--text-muted)' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}><X size={16} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Vehicle *</label>
                <select className="input-field" value={form.vehicle} onChange={e => setForm(f => ({...f, vehicle: e.target.value}))}>
                  <option value="">— Select vehicle —</option>
                  {vehicles.map(v => <option key={v.vehicle_id ?? v.id} value={v.vehicle_id ?? v.id}>{v.vehicle_id ?? v.id} — {v.make} {v.model} ({v.status})</option>)}
                </select>
              </div>
              <div>
                <label className="label">Service Type *</label>
                <select className="input-field" value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value}))}>
                  <option value="">— Select type —</option>
                  {serviceTypes.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Service Date</label>
                  <input type="date" className="input-field" value={form.date} onChange={e => setForm(f => ({...f, date: e.target.value}))} />
                </div>
                <div>
                  <label className="label">Cost (₹) *</label>
                  <input type="number" className="input-field" placeholder="e.g. 5000" value={form.cost} onChange={e => setForm(f => ({...f, cost: e.target.value}))} />
                </div>
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea className="input-field" rows={3} placeholder="Details about the service..." value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} />
              </div>
              {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2.5 text-red-400 text-sm">{error}</div>}
              <div className="bg-amber-500/8 border border-amber-500/20 rounded-lg px-4 py-3 text-xs text-amber-400 font-display">
                ⚠ This will automatically set the vehicle status to "In Shop"
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={submit} className="btn-primary flex-1 justify-center"><Save size={14} /> Create Log</button>
                <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
