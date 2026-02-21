import React, { useEffect, useState } from 'react'
import { usersAPI } from '../services/api'
import { Plus, X, Save, Shield, User, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react'

const empty = { full_name: '', email: '', password: '', role: 'Dispatcher' }

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(empty)
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await usersAPI.getAll({ page: 1, limit: 50 })
      const payload = res?.data
      const list = payload?.data?.items || payload?.data || []
      setUsers(Array.isArray(list) ? list : [])
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load users.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const openAdd = () => {
    setForm(empty)
    setError('')
    setShowModal(true)
  }

  const submit = async () => {
    if (!form.full_name || !form.email || !form.password || !form.role) {
      setError('Please fill in all required fields.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await usersAPI.create({
        full_name: form.full_name,
        email: form.email,
        password: form.password,
        role: form.role,
      })
      setShowModal(false)
      await load()
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to create user.')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleActive = async (u) => {
    setError('')
    try {
      await usersAPI.toggleActive(u.user_id)
      await load()
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to toggle user.')
    }
  }

  const removeUser = async (u) => {
    setError('')
    try {
      await usersAPI.delete(u.user_id)
      await load()
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to delete user.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>User Management</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Create and manage Manager/Dispatcher accounts</p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <Plus size={15} /> Add User
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">{error}</div>
      )}

      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
          <h3 className="font-display font-bold" style={{ color: 'var(--text-primary)' }}>Users</h3>
          <div className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{loading ? 'Loading...' : `${users.length} users`}</div>
        </div>

        <table className="w-full">
          <thead>
            <tr className="table-header">
              <th className="text-left px-6 py-3">ID</th>
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Email</th>
              <th className="text-left px-4 py-3">Role</th>
              <th className="text-left px-4 py-3">Active</th>
              <th className="text-left px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.user_id} className="table-row">
                <td className="px-6 py-3 font-mono text-xs text-amber-500">{u.user_id}</td>
                <td className="px-4 py-3 text-sm font-display font-semibold" style={{ color: 'var(--text-primary)' }}>{u.full_name}</td>
                <td className="px-4 py-3 text-sm font-mono" style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                <td className="px-4 py-3">
                  <span className="text-xs font-display font-bold px-2 py-1 rounded inline-flex items-center gap-1" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
                    {u.role === 'Manager' ? <Shield size={12} className="text-amber-400" /> : <User size={12} className="text-blue-400" />}
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-mono ${u.is_active ? 'text-green-400' : ''}`} style={{ color: u.is_active ? undefined : 'var(--text-muted)' }}>{u.is_active ? 'YES' : 'NO'}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleActive(u)}
                      className={`p-1.5 rounded-lg transition-all ${u.is_active ? 'hover:bg-[var(--bg-tertiary)]' : 'text-green-400 hover:bg-green-500/10'}`}
                      style={{ color: u.is_active ? 'var(--text-muted)' : undefined }}
                      title={u.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {u.is_active ? <ToggleLeft size={14} /> : <ToggleRight size={14} />}
                    </button>
                    <button
                      onClick={() => removeUser(u)}
                      className="p-1.5 rounded-lg transition-all"
                      style={{ color: 'var(--text-muted)' }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!loading && users.length === 0 && (
          <div className="py-12 text-center font-display" style={{ color: 'var(--text-muted)' }}>No users found</div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-box">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)' }}>Create User</h3>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg transition-all" style={{ color: 'var(--text-muted)' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label">Full Name *</label>
                <input className="input-field" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
              </div>
              <div>
                <label className="label">Email *</label>
                <input type="email" className="input-field" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <label className="label">Password *</label>
                <input type="password" className="input-field" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
              </div>
              <div>
                <label className="label">Role *</label>
                <select className="input-field" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  <option value="Dispatcher">Dispatcher</option>
                  <option value="Manager">Manager</option>
                  <option value="Safety Officer">Safety Officer</option>
                  <option value="Financial Analyst">Financial Analyst</option>
                </select>
              </div>

              {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2.5 text-red-400 text-sm">{error}</div>}

              <div className="flex gap-3 pt-2">
                <button onClick={submit} disabled={submitting} className="btn-primary flex-1 justify-center">
                  <Save size={14} /> {submitting ? 'Creating...' : 'Create User'}
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
