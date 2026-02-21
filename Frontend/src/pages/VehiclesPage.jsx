import React, { useState } from 'react'
import { useFleet } from '../context/FleetContext'
import StatusPill from '../components/StatusPill'
import { Plus, Truck, Edit2, Trash2, X, Save, ToggleLeft, ToggleRight } from 'lucide-react'

const empty = { make: '', model: '', plate: '', type: 'Van', capacity: '', odometer: '', acquired: new Date().getFullYear() }

export default function VehiclesPage() {
  const { vehicles, addVehicle, updateVehicle, deleteVehicle } = useFleet()
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(empty)
  const [error, setError] = useState('')

  const openAdd = () => { setForm(empty); setEditId(null); setError(''); setShowModal(true) }
  const openEdit = (v) => {
    setForm({
      make: v.make,
      model: v.model,
      plate: v.license_plate ?? v.plate ?? '',
      type: v.type,
      capacity: v.max_load_kg ?? v.capacity ?? '',
      odometer: v.odometer_km ?? v.odometer ?? '',
      acquired: v.year ?? v.acquired ?? new Date().getFullYear(),
    })
    setEditId(v.vehicle_id ?? v.id)
    setError('')
    setShowModal(true)
  }

  const submit = () => {
    if (!form.make || !form.model || !form.plate || !form.capacity) { setError('Please fill in all required fields.'); return }
    const plateExists = vehicles.find(v => (v.license_plate ?? v.plate) === form.plate && (v.vehicle_id ?? v.id) !== editId)
    if (plateExists) { setError('License plate already exists.'); return }

    const payload = {
      make: form.make,
      model: form.model,
      license_plate: form.plate,
      type: form.type,
      max_load_kg: +form.capacity,
      odometer_km: +form.odometer || 0,
      year: +form.acquired,
      // backend requires these on create
      fuel_tank_liters: 60,
      acquisition_cost: 0,
    }

    if (editId) {
      updateVehicle(editId, payload)
    } else {
      addVehicle(payload)
    }
    setShowModal(false)
  }

  const toggleRetire = (v) => {
    const newStatus = v.status === 'Out of Service' ? 'Available' : 'Out of Service'
    updateVehicle(v.vehicle_id ?? v.id, { status: newStatus })
  }

  const formatNumber = (value) => {
    const n = Number(value)
    if (Number.isNaN(n)) return '0'
    return n.toLocaleString()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>Vehicle Registry</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Manage your fleet assets — {vehicles.length} total vehicles</p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <Plus size={15} /> Add Vehicle
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Assets', value: vehicles.length, color: '#94a3b8' },
          { label: 'Available', value: vehicles.filter(v => v.status === 'Available').length, color: '#10b981' },
          { label: 'On Trip', value: vehicles.filter(v => v.status === 'On Trip').length, color: '#3b82f6' },
          { label: 'In Shop', value: vehicles.filter(v => v.status === 'In Shop').length, color: '#ef4444' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card px-5 py-4">
            <div className="font-display font-bold text-2xl" style={{color}}>{value}</div>
            <div className="text-xs mt-1 font-display font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <h3 className="font-display font-bold" style={{ color: 'var(--text-primary)' }}>All Vehicles</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="table-header">
              <th className="text-left px-6 py-3">ID</th>
              <th className="text-left px-4 py-3">Make / Model</th>
              <th className="text-left px-4 py-3">Plate</th>
              <th className="text-left px-4 py-3">Type</th>
              <th className="text-left px-4 py-3">Max Capacity</th>
              <th className="text-left px-4 py-3">Odometer</th>
              <th className="text-left px-4 py-3">Year</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map(v => (
              <tr key={v.vehicle_id ?? v.id} className="table-row">
                <td className="px-6 py-3 font-mono text-xs text-amber-500">{v.vehicle_id ?? v.id}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                      <Truck size={13} className="text-amber-500" />
                    </div>
                    <span className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{v.make} {v.model}</span>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--bg-tertiary)' }}>{v.license_plate ?? v.plate}</td>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>{v.type}</td>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{formatNumber(v.max_load_kg ?? v.capacity)} kg</td>
                <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{formatNumber(v.odometer_km ?? v.odometer)} km</td>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>{v.year ?? v.acquired}</td>
                <td className="px-4 py-3"><StatusPill status={v.status} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(v)} className="p-1.5 rounded-lg transition-all" style={{ color: 'var(--text-muted)' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--amber)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                      <Edit2 size={13} />
                    </button>
                    <button onClick={() => toggleRetire(v)} className={`p-1.5 rounded-lg transition-all ${v.status !== 'Available' ? 'text-green-400 hover:bg-green-500/10' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-500/10'}`}>
                      {v.status !== 'Available' ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
                    </button>
                    <button onClick={() => deleteVehicle(v.vehicle_id ?? v.id)} className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-box">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)' }}>{editId ? 'Edit Vehicle' : 'New Vehicle Registration'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg transition-all" style={{ color: 'var(--text-muted)' }}>
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Make *</label>
                  <input className="input-field" placeholder="e.g. Toyota" value={form.make} onChange={e => setForm(f => ({...f, make: e.target.value}))} />
                </div>
                <div>
                  <label className="label">Model *</label>
                  <input className="input-field" placeholder="e.g. Hilux" value={form.model} onChange={e => setForm(f => ({...f, model: e.target.value}))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">License Plate *</label>
                  <input className="input-field" placeholder="e.g. TRK-007" value={form.plate} onChange={e => setForm(f => ({...f, plate: e.target.value.toUpperCase()}))} />
                </div>
                <div>
                  <label className="label">Vehicle Type</label>
                  <select className="input-field" value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value}))}>
                    <option>Van</option>
                    <option>Truck</option>
                    <option>Bike</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Max Capacity (kg) *</label>
                  <input type="number" className="input-field" placeholder="e.g. 2000" value={form.capacity} onChange={e => setForm(f => ({...f, capacity: e.target.value}))} />
                </div>
                <div>
                  <label className="label">Odometer (km)</label>
                  <input type="number" className="input-field" placeholder="e.g. 15000" value={form.odometer} onChange={e => setForm(f => ({...f, odometer: e.target.value}))} />
                </div>
              </div>
              <div>
                <label className="label">Acquisition Year</label>
                <input type="number" className="input-field" placeholder="e.g. 2022" value={form.acquired} onChange={e => setForm(f => ({...f, acquired: e.target.value}))} />
              </div>

              {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2.5 text-red-400 text-sm">{error}</div>}

              <div className="flex gap-3 pt-2">
                <button onClick={submit} className="btn-primary flex-1 justify-center">
                  <Save size={14} /> {editId ? 'Save Changes' : 'Register Vehicle'}
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
