import React, { useState } from 'react'
import { Truck, Mail, Lock, ChevronRight, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function LoginPage({ onLogin }) {
  const { login } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handle = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) { setError('Please fill in all fields.'); return }
    if (form.password.length < 4) { setError('Password too short.'); return }

    setError('')
    setSubmitting(true)
    const result = await login(form.email, form.password)
    setSubmitting(false)

    if (!result.success) {
      setError(result.message)
      return
    }

    // Keep compatibility with existing App.jsx which expects onLogin(role)
    if (onLogin) onLogin((result.user.role || '').toLowerCase())
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{background:'#090e1a'}}>
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-amber-500/5 rounded-full"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-amber-500/8 rounded-full"></div>
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-500 rounded-2xl mb-6 shadow-lg" style={{boxShadow:'0 0 40px rgba(245,158,11,0.4)'}}>
            <Truck size={28} className="text-[#090e1a]" />
          </div>
          <h1 className="font-display font-800 text-4xl text-white mb-2">FleetFlow</h1>
          <p className="text-slate-400 text-sm">Fleet & Logistics Management System</p>
        </div>

        {/* Card */}
        <div className="card p-8 amber-glow">
          <div className="mb-6">
            <h2 className="font-display font-bold text-xl text-white mb-1">Sign In</h2>
            <p className="text-slate-500 text-sm">Access your fleet command center</p>
          </div>

          <form onSubmit={handle} className="space-y-5">
            <div>
              <label className="label">Email Address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  className="input-field pl-10"
                  placeholder="admin@fleetflow.io"
                  value={form.email}
                  onChange={e => setForm(f => ({...f, email: e.target.value}))}
                />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input-field pl-10 pr-10"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({...f, password: e.target.value}))}
                />
                <button type="button" onClick={() => setShowPass(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-amber-400 transition-colors">
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">{error}</div>
            )}

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-500 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded accent-amber-500" />
                Remember me
              </label>
              <button type="button" className="text-amber-500 hover:text-amber-400 font-display font-bold transition-colors">Forgot password?</button>
            </div>

            <button type="submit" className="btn-primary w-full justify-center py-3 text-base">
              {submitting ? 'Signing In...' : 'Sign In to FleetFlow'}
              <ChevronRight size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
