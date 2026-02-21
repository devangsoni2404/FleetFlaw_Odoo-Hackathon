import React, { useState } from 'react'
import { useFleet } from '../context/FleetContext'
import { Plus, X, Save, Fuel, Coins } from 'lucide-react'

const empty = { trip: '', driver: '', vehicle: '', distance: '', fuelLiters: '', fuelCost: '', misc: '', date: new Date().toISOString().split('T')[0] }

export default function ExpensesPage() {
  const { vehicles, drivers, trips, expenses, maintenance, fuelLogs, addExpense, getVehicle, getDriver } = useFleet()
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(empty)
  const [error, setError] = useState('')

  const formatNumber = (value) => {
    const n = Number(value)
    if (Number.isNaN(n)) return '0'
    return n.toLocaleString()
  }

  const getMaintCost = (m) => Number((m.total_cost ?? m.cost ?? (Number(m.labour_cost || 0) + Number(m.parts_cost || 0))) || 0)

  const submit = () => {
    if (!form.vehicle || (!form.fuelCost && !form.misc)) { setError('Fill required fields.'); return }

    // Backend has separate fuel_logs and expenses.
    // For now: log everything as a generic expense record using amount.
    addExpense({
      vehicle_id: +form.vehicle,
      trip_id: form.trip ? +form.trip : null,
      driver_id: form.driver ? +form.driver : null,
      expense_type: 'Other',
      description: 'UI expense',
      amount: (+form.fuelCost || 0) + (+form.misc || 0),
      expense_date: form.date,
    })
    setShowModal(false)
    setForm(empty)
    setError('')
  }

  // Calculate totals from fuel_logs and expenses
  const totalFuel = fuelLogs.reduce((a, f) => a + Number((f.total_cost ?? (f.liters_filled * f.price_per_liter)) || 0), 0)
  const totalMisc = expenses.reduce((a, e) => a + Number((e.amount ?? ((e.fuelCost || 0) + (e.misc || 0))) || 0), 0)
  const totalMaint = maintenance.reduce((a, m) => a + getMaintCost(m), 0)
  const grandTotal = totalFuel + totalMisc + totalMaint

  // Per-vehicle totals
  const vehicleCosts = vehicles.map(v => {
    const vid = v.vehicle_id ?? v.id
    const vFuelLogs = fuelLogs.filter(f => String(f.vehicle_id ?? f.vehicle) === String(vid))
    const vExpenses = expenses.filter(e => String(e.vehicle_id ?? e.vehicle) === String(vid))
    const vMaint = maintenance.filter(m => String(m.vehicle_id ?? m.vehicle) === String(vid))
    const fuel = vFuelLogs.reduce((a, f) => a + Number((f.total_cost ?? (f.liters_filled * f.price_per_liter)) || 0), 0)
    const maint = vMaint.reduce((a, m) => a + getMaintCost(m), 0)
    const misc = vExpenses.reduce((a, e) => a + Number(e.amount ?? 0), 0)
    const dist = vFuelLogs.reduce((a, f) => a + Number(f.distance_km ?? f.distance ?? 0), 0)
    const liters = vFuelLogs.reduce((a, f) => a + Number(f.liters_filled ?? 0), 0)
    const efficiency = liters > 0 ? (dist / liters).toFixed(2) : '—'
    return { ...v, fuel, maint, misc, total: fuel + maint + misc, dist, efficiency }
  }).filter(v => v.total > 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>Expense & Fuel Logging</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Financial tracking per asset</p>
        </div>
        <button onClick={() => { setShowModal(true); setError(''); setForm(empty) }} className="btn-primary">
          <Plus size={15} /> Add Expense
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Fuel', value: `₹${formatNumber(totalFuel)}`, color: '#3b82f6', icon: Fuel },
          { label: 'Maintenance', value: `₹${formatNumber(totalMaint)}`, color: '#f59e0b', icon: Coins },
          { label: 'Misc Expenses', value: `₹${formatNumber(totalMisc)}`, color: '#8b5cf6', icon: Coins },
          { label: 'Grand Total', value: `₹${formatNumber(grandTotal)}`, color: '#10b981', icon: Coins },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="kpi-card">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{background:`${color}20`}}>
              <Icon size={16} style={{color}} />
            </div>
            <div className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)' }}>{value}</div>
            <div className="text-xs mt-1 font-display font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Per-vehicle costs */}
      {vehicleCosts.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
            <h3 className="font-display font-bold" style={{ color: 'var(--text-primary)' }}>Total Operational Cost by Vehicle</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="text-left px-6 py-3">Vehicle</th>
                <th className="text-left px-4 py-3">Fuel Cost</th>
                <th className="text-left px-4 py-3">Maintenance</th>
                <th className="text-left px-4 py-3">Misc</th>
                <th className="text-left px-4 py-3">Total Cost</th>
                <th className="text-left px-4 py-3">Distance</th>
                <th className="text-left px-4 py-3">Efficiency</th>
              </tr>
            </thead>
            <tbody>
              {vehicleCosts.map(v => (
                <tr key={v.vehicle_id ?? v.id} className="table-row">
                  <td className="px-6 py-3">
                    <div className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{v.make} {v.model}</div>
                    <div className="text-xs text-amber-500 font-mono">{v.vehicle_id ?? v.id}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-sm" style={{ color: 'var(--text-secondary)' }}>₹{formatNumber(v.fuel)}</td>
                  <td className="px-4 py-3 font-mono text-sm" style={{ color: 'var(--text-secondary)' }}>₹{formatNumber(v.maint)}</td>
                  <td className="px-4 py-3 font-mono text-sm" style={{ color: 'var(--text-secondary)' }}>₹{formatNumber(v.misc)}</td>
                  <td className="px-4 py-3 font-mono text-sm font-bold" style={{ color: 'var(--text-primary)' }}>₹{formatNumber(v.total)}</td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{v.dist} km</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded">{v.efficiency} km/L</span>
                  </td>
                </tr>
             ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Expense log */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <h3 className="font-display font-bold" style={{ color: 'var(--text-primary)' }}>Expense Log</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="table-header">
              <th className="text-left px-6 py-3">ID</th>
              <th className="text-left px-4 py-3">Vehicle</th>
              <th className="text-left px-4 py-3">Date</th>
              <th className="text-left px-4 py-3">Distance</th>
              <th className="text-left px-4 py-3">Fuel (L)</th>
              <th className="text-left px-4 py-3">Fuel Cost</th>
              <th className="text-left px-4 py-3">Misc</th>
              <th className="text-left px-4 py-3">Total</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map(e => {
              const vehicle = getVehicle(e.vehicle_id ?? e.vehicle)
              const amount = Number((e.amount ?? ((e.fuelCost || 0) + (e.misc || 0))) || 0)
              return (
                <tr key={e.expense_id ?? e.id} className="table-row">
                  <td className="px-6 py-3 font-mono text-xs text-amber-500">{e.expense_code ?? e.expense_id ?? e.id}</td>
                  <td className="px-4 py-3 text-sm font-display font-semibold" style={{ color: 'var(--text-primary)' }}>{vehicle?.make} {vehicle?.model}</td>
                  <td className="px-4 py-3 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{String(e.expense_date ?? e.date ?? '').slice(0, 10)}</td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>—</td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>—</td>
                  <td className="px-4 py-3 font-mono text-sm" style={{ color: 'var(--text-secondary)' }}>₹{formatNumber(amount)}</td>
                  <td className="px-4 py-3 font-mono text-sm" style={{ color: 'var(--text-muted)' }}>₹0</td>
                  <td className="px-4 py-3 font-mono text-sm font-bold" style={{ color: 'var(--text-primary)' }}>₹{formatNumber(amount)}</td>
                </tr>
              )
           })}
          </tbody>
        </table>
        {expenses.length === 0 && <div className="py-12 text-center font-display" style={{ color: 'var(--text-muted)' }}>No expense records</div>}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-box">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)' }}>Add Expense Record</h3>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg transition-all" style={{ color: 'var(--text-muted)' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}><X size={16} /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Vehicle *</label>
                  <select className="input-field" value={form.vehicle} onChange={e => setForm(f => ({...f, vehicle: e.target.value}))}>
                    <option value="">— Select vehicle —</option>
                    {vehicles.map(v => <option key={v.vehicle_id ?? v.id} value={v.vehicle_id ?? v.id}>{v.vehicle_id ?? v.id} — {v.make} {v.model}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Trip (optional)</label>
                  <select className="input-field" value={form.trip} onChange={e => setForm(f => ({...f, trip: e.target.value}))}>
                    <option value="">— Link to trip —</option>
                    {trips.map(t => <option key={t.trip_id ?? t.id} value={t.trip_id ?? t.id}>{t.trip_code ?? t.trip_id ?? t.id} — {(t.origin_address ?? t.origin) || '-'} → {(t.destination_address ?? t.destination) || '-'}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Fuel (Liters) *</label>
                  <input type="number" className="input-field" placeholder="e.g. 45" value={form.fuelLiters} onChange={e => setForm(f => ({...f, fuelLiters: e.target.value}))} />
                </div>
                <div>
                  <label className="label">Fuel Cost (₹) *</label>
                  <input type="number" className="input-field" placeholder="e.g. 4500" value={form.fuelCost} onChange={e => setForm(f => ({...f, fuelCost: e.target.value}))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Distance (km)</label>
                  <input type="number" className="input-field" placeholder="e.g. 200" value={form.distance} onChange={e => setForm(f => ({...f, distance: e.target.value}))} />
                </div>
                <div>
                  <label className="label">Misc Expenses (₹)</label>
                  <input type="number" className="input-field" placeholder="e.g. 500" value={form.misc} onChange={e => setForm(f => ({...f, misc: e.target.value}))} />
                </div>
              </div>
              <div>
                <label className="label">Date</label>
                <input type="date" className="input-field" value={form.date} onChange={e => setForm(f => ({...f, date: e.target.value}))} />
              </div>
              {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2.5 text-red-400 text-sm">{error}</div>}
              <div className="flex gap-3 pt-2">
                <button onClick={submit} className="btn-primary flex-1 justify-center"><Save size={14} /> Save Record</button>
                <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
