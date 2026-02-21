import React, { useState } from 'react'
import { useFleet } from '../context/FleetContext'
import StatusPill from '../components/StatusPill'
import { Plus, X, Save, Edit2, Trash2, AlertTriangle, Shield, ShieldOff } from 'lucide-react'

const empty = { name: '', license: '', licenseExpiry: '', categories: [], joined: new Date().toISOString().split('T')[0] }
const allCategories = ['Truck', 'Van', 'Bike']
const statusOptions = ['Available', 'On Trip', 'Off Duty', 'Suspended']

export default function DriversPage() {
  const { drivers, addDriver, updateDriver, deleteDriver } = useFleet()
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(empty)
  const [error, setError] = useState('')

  const openAdd = () => { setForm(empty); setEditId(null); setError(''); setShowModal(true) }
  const openEdit = (d) => {
    setForm({
      name: d.full_name ?? d.name ?? '',
      license: d.license_number ?? d.license ?? '',
      licenseExpiry: d.license_expiry_date ?? d.licenseExpiry ?? '',
      categories: d.categories ?? [],
      joined: String(d.created_at ?? d.joined ?? new Date().toISOString().split('T')[0]).slice(0, 10),
    })
    setEditId(d.driver_id ?? d.id)
    setError('')
    setShowModal(true)
  }

  const submit = () => {
    if (!form.name || !form.license || !form.licenseExpiry) { setError('Fill in required fields.'); return }
    // Format date to YYYY-MM-DD for MySQL
    const formattedDate = form.licenseExpiry.split('T')[0]
    if (editId) {
      updateDriver(editId, {
        full_name: form.name,
        license_number: form.license,
        license_expiry_date: formattedDate,
        license_type: form.categories?.[0] || 'Van',
      })
    } else {
      addDriver({
        full_name: form.name,
        phone: `9${Math.floor(100000000 + Math.random() * 900000000)}`,
        email: null,
        license_number: form.license,
        license_type: form.categories?.[0] || 'Van',
        license_expiry_date: formattedDate,
        status: 'Off Duty',
      })
    }
    setShowModal(false)
  }

  const toggleCategory = (cat) => {
    setForm(f => ({
      ...f,
      categories: f.categories.includes(cat) ? f.categories.filter(c => c !== cat) : [...f.categories, cat]
    }))
  }

  const isExpired = (expiry) => new Date(expiry) < new Date()
  const isExpiringSoon = (expiry) => {
    const diff = new Date(expiry) - new Date()
    return diff > 0 && diff < 1000 * 60 * 60 * 24 * 90 // 90 days
  }

  const scoreColor = (score) => {
    if (score >= 90) return '#10b981'
    if (score >= 75) return '#f59e0b'
    return '#ef4444'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>Driver Profiles & Safety</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Compliance, performance & status management</p>
        </div>
        <button onClick={openAdd} className="btn-primary"><Plus size={15} /> Add Driver</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Drivers', value: drivers.length, color: '#94a3b8' },
          { label: 'On Duty', value: drivers.filter(d => d.status === 'On Trip').length, color: '#10b981' },
          { label: 'Suspended', value: drivers.filter(d => d.status === 'Suspended').length, color: '#ef4444' },
          { label: 'Expired License', value: drivers.filter(d => isExpired(d.license_expiry_date ?? d.licenseExpiry)).length, color: '#f59e0b' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card px-5 py-4">
            <div className="font-display font-bold text-2xl" style={{color}}>{value}</div>
            <div className="text-xs mt-1 font-display font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Alerts */}
      {drivers.some(d => isExpired(d.license_expiry_date ?? d.licenseExpiry) || isExpiringSoon(d.license_expiry_date ?? d.licenseExpiry)) && (
        <div className="space-y-2">
          {drivers.filter(d => isExpired(d.license_expiry_date ?? d.licenseExpiry)).map(d => (
            <div key={d.driver_id ?? d.id} className="bg-red-500/8 border border-red-500/25 rounded-xl px-5 py-3 flex items-center gap-3">
              <AlertTriangle size={15} className="text-red-400 flex-shrink-0" />
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}><span className="text-red-400 font-display font-bold">{d.full_name ?? d.name}</span> — License <span className="font-mono text-red-400">{d.license_number ?? d.license}</span> has expired on {d.license_expiry_date ?? d.licenseExpiry}. Driver is blocked from assignment.</span>
            </div>
          ))}
          {drivers.filter(d => !isExpired(d.license_expiry_date ?? d.licenseExpiry) && isExpiringSoon(d.license_expiry_date ?? d.licenseExpiry)).map(d => (
            <div key={d.driver_id ?? d.id} className="bg-amber-500/8 border border-amber-500/25 rounded-xl px-5 py-3 flex items-center gap-3">
              <AlertTriangle size={15} className="text-amber-400 flex-shrink-0" />
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}><span className="text-amber-400 font-display font-bold">{d.full_name ?? d.name}</span> — License expires soon: <span className="font-mono text-amber-400">{d.license_expiry_date ?? d.licenseExpiry}</span></span>
            </div>
          ))}
        </div>
      )}

      {/* Driver cards */}
      <div className="grid grid-cols-1 gap-4">
        {drivers.map(d => {
          const name = d.full_name ?? d.name ?? ''
          const expiryDate = d.license_expiry_date ?? d.licenseExpiry
          const expired = isExpired(expiryDate)
          const expSoon = isExpiringSoon(expiryDate)
          const tripsCount = d.total_trips ?? d.trips ?? 0
          const completedCount = d.completed_trips ?? d.completed ?? 0
          const safetyScore = d.safety_score ?? d.safetyScore ?? 0
          const completionRate = tripsCount > 0 ? Math.round((completedCount / tripsCount) * 100) : 0
          return (
            <div key={d.driver_id ?? d.id} className={`card p-5 ${expired ? 'border-red-500/20' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                    <span className="font-display font-bold text-amber-400 text-lg">{name ? name.split(' ').map(n=>n[0]).join('') : 'DR'}</span>
                  </div>
                  <div>
                    <div className="font-display font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{name || '—'}</div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{d.license_number ?? d.license}</span>
                      <span className={`text-xs font-mono px-2 py-0.5 rounded ${expired ? 'text-red-400 bg-red-500/10 border border-red-500/20' : expSoon ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20' : 'text-slate-500'}`}>
                        Exp: {expiryDate} {expired ? '⚠ EXPIRED' : expSoon ? '⚠ Soon' : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {(d.categories ?? []).map(c => (
                        <span key={c} className="text-xs px-2 py-0.5 rounded border font-display font-bold" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>{c}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Safety score */}
                  <div className="text-center">
                    <div className="font-display font-bold text-2xl" style={{color: scoreColor(safetyScore)}}>{safetyScore}</div>
                    <div className="text-xs uppercase tracking-wider font-display font-bold" style={{ color: 'var(--text-muted)' }}>Safety</div>
                  </div>

                  {/* Completion rate */}
                  <div className="text-center">
                    <div className="font-display font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>{completionRate}%</div>
                    <div className="text-xs uppercase tracking-wider font-display font-bold" style={{ color: 'var(--text-muted)' }}>Complete</div>
                  </div>

                  {/* Trips */}
                  <div className="text-center">
                    <div className="font-display font-bold text-2xl" style={{ color: 'var(--text-secondary)' }}>{tripsCount}</div>
                    <div className="text-xs uppercase tracking-wider font-display font-bold" style={{ color: 'var(--text-muted)' }}>Trips</div>
                  </div>

                  <StatusPill status={d.status} />

                  {/* Status toggle */}
                  <div className="flex flex-col gap-1">
                    {statusOptions.map(s => (
                      <button key={s} onClick={() => updateDriver(d.driver_id ?? d.id, { status: s })}
                        className={`text-xs px-2 py-0.5 rounded font-display font-bold transition-all border ${d.status === s ? 'border-amber-500/50 bg-amber-500/10 text-amber-400' : 'border-transparent hover:border-[var(--border-color)]'}`} style={{ color: d.status === s ? undefined : 'var(--text-muted)' }}>
                        {s}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-1">
                    <button onClick={() => openEdit(d)} className="p-1.5 rounded-lg transition-all" style={{ color: 'var(--text-muted)' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--amber)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}><Edit2 size={13} /></button>
                    <button onClick={() => deleteDriver(d.driver_id ?? d.id)} className="p-1.5 rounded-lg transition-all" style={{ color: 'var(--text-muted)' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}><Trash2 size={13} /></button>
                  </div>
                </div>
              </div>

              {/* Score bar */}
              <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-display font-bold w-24" style={{ color: 'var(--text-muted)' }}>Safety Score</span>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                    <div className="h-full rounded-full transition-all" style={{width:`${safetyScore}%`, background: scoreColor(safetyScore)}}></div>
                  </div>
                  <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{safetyScore}/100</span>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs font-display font-bold w-24" style={{ color: 'var(--text-muted)' }}>Completion</span>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                    <div className="h-full bg-blue-500 rounded-full" style={{width:`${completionRate}%`}}></div>
                  </div>
                  <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{completedCount}/{tripsCount}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-box">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)' }}>{editId ? 'Edit Driver' : 'Add New Driver'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg transition-all" style={{ color: 'var(--text-muted)' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}><X size={16} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Full Name *</label>
                <input className="input-field" placeholder="e.g. John Smith" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">License Number *</label>
                  <input className="input-field" placeholder="e.g. DL-2024-006" value={form.license} onChange={e => setForm(f => ({...f, license: e.target.value}))} />
                </div>
                <div>
                  <label className="label">License Expiry *</label>
                  <input type="date" className="input-field" value={form.licenseExpiry} onChange={e => setForm(f => ({...f, licenseExpiry: e.target.value}))} />
                </div>
              </div>
              <div>
                <label className="label">Vehicle Categories</label>
                <div className="flex gap-2">
                  {allCategories.map(cat => (
                    <button key={cat} type="button" onClick={() => toggleCategory(cat)}
                      className={`px-4 py-2 rounded-lg border font-display font-bold text-sm transition-all ${form.categories.includes(cat) ? 'border-amber-500 bg-amber-500/10 text-amber-400' : 'hover:border-[var(--text-secondary)]'}`} style={{ borderColor: form.categories.includes(cat) ? undefined : 'var(--border-color)', color: form.categories.includes(cat) ? undefined : 'var(--text-muted)' }}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Join Date</label>
                <input type="date" className="input-field" value={form.joined} onChange={e => setForm(f => ({...f, joined: e.target.value}))} />
              </div>
              {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2.5 text-red-400 text-sm">{error}</div>}
              <div className="flex gap-3 pt-2">
                <button onClick={submit} className="btn-primary flex-1 justify-center"><Save size={14} /> {editId ? 'Save' : 'Add Driver'}</button>
                <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
