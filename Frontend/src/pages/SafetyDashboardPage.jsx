import React, { useState, useEffect } from 'react'
import { useFleet } from '../context/FleetContext'
import { analyticsAPI } from '../services/api'
import { Shield, AlertTriangle, Users, Activity, CheckCircle, XCircle, AlertCircle, TrendingDown, FileText, Download } from 'lucide-react'

export default function SafetyDashboardPage({ onNav }) {
  const { vehicles, drivers, maintenance, refreshDrivers } = useFleet()
  const [safetyData, setSafetyData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchSafetyData()
  }, [])

  const fetchSafetyData = async () => {
    try {
      setLoading(true)
      const res = await analyticsAPI.safetyDashboard()
      setSafetyData(res?.data?.data || null)
    } catch (err) {
      setError('Failed to load safety dashboard data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleExportCSV = async () => {
    try {
      const res = await analyticsAPI.exportCSV('driver-performance')
      const blob = new Blob([res.data], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `safety-report-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      alert('Failed to export CSV')
    }
  }

  const handleExportPDF = async () => {
    try {
      const res = await analyticsAPI.exportPDF('driver-performance')
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `safety-report-${new Date().toISOString().split('T')[0]}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      alert('Failed to export PDF')
    }
  }

  const handleRefresh = () => {
    fetchSafetyData()
    refreshDrivers()
  }

  // Use API data if available, otherwise fallback to context data
  const compliance = safetyData?.driverCompliance || {}
  const vehicleHealth = safetyData?.vehicleHealth || {}
  const scoreDist = safetyData?.scoreDistribution || []
  const expiredList = safetyData?.expiredLicensesList || []
  const lowSafetyList = safetyData?.lowSafetyDrivers || []

  const kpis = [
    { 
      label: 'Expired Licenses', 
      value: compliance.expired_licenses || 0, 
      sub: 'drivers blocked', 
      icon: XCircle, 
      color: '#ef4444',
      critical: (compliance.expired_licenses || 0) > 0
    },
    { 
      label: 'Expiring Soon', 
      value: compliance.expiring_soon || 0, 
      sub: 'within 90 days', 
      icon: AlertCircle, 
      color: '#f59e0b',
      critical: (compliance.expiring_soon || 0) > 0
    },
    { 
      label: 'Suspended Drivers', 
      value: compliance.suspended_drivers || 0, 
      sub: 'not available', 
      icon: Shield, 
      color: '#ef4444'
    },
    { 
      label: 'Low Safety Score', 
      value: compliance.low_safety_score || 0, 
      sub: 'below 75%', 
      icon: TrendingDown, 
      color: '#f59e0b'
    },
  ]

  const vehicleKpis = [
    { 
      label: 'Vehicles In Shop', 
      value: vehicleHealth.vehicles_in_shop || vehicles.filter(v => v.status === 'In Shop').length || 0, 
      sub: 'under maintenance', 
      icon: Activity, 
      color: '#3b82f6'
    },
    { 
      label: 'Active Maintenance', 
      value: vehicleHealth.active_maintenance || maintenance.filter(m => m.status === 'In Progress').length || 0, 
      sub: 'in progress', 
      icon: AlertTriangle, 
      color: '#f59e0b'
    },
  ]

  const getScoreDistribution = (category) => {
    const item = scoreDist.find(s => s.category === category)
    return item?.count || 0
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400" style={{ color: 'var(--text-muted)' }}>Loading safety dashboard...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>Safety & Compliance Dashboard</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Monitor driver compliance, license expirations, and safety metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleRefresh}
            className="btn-secondary"
          >
            Refresh
          </button>
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/25 px-4 py-2 rounded-full">
            <Shield size={16} className="text-emerald-400" />
            <span className="text-sm text-emerald-400 font-display font-bold">Safety Officer</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Driver Compliance KPIs */}
      <div>
        <h3 className="text-sm font-display font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>Driver Compliance</h3>
        <div className="grid grid-cols-4 gap-4">
          {kpis.map(({ label, value, sub, icon: Icon, color, critical }) => (
            <div key={label} className={`card px-5 py-4 ${critical ? 'border-red-500/30' : ''}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:`${color}20`}}>
                  <Icon size={18} style={{color}} />
                </div>
                {critical && <AlertTriangle size={14} className="text-red-400" />}
              </div>
              <div className="font-display font-bold text-3xl text-white mb-1">{value}</div>
              <div className="text-sm font-display font-semibold text-slate-300">{label}</div>
              <div className="text-xs text-slate-500 mt-1">{sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Vehicle Health KPIs */}
      <div>
        <h3 className="text-sm font-display font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>Vehicle Health</h3>
        <div className="grid grid-cols-2 gap-4">
          {vehicleKpis.map(({ label, value, sub, icon: Icon, color }) => (
            <div key={label} className="card px-5 py-4">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:`${color}20`}}>
                  <Icon size={18} style={{color}} />
                </div>
              </div>
              <div className="font-display font-bold text-3xl text-white mb-1">{value}</div>
              <div className="text-sm font-display font-semibold text-slate-300">{label}</div>
              <div className="text-xs text-slate-500 mt-1">{sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Critical Alerts */}
      {(expiredList.length > 0) && (
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
            <div className="flex items-center gap-3">
              <AlertTriangle size={18} className="text-red-400" />
              <h3 className="font-display font-bold" style={{ color: 'var(--text-primary)' }}>License Compliance Alerts</h3>
            </div>
            <button 
              onClick={() => onNav('drivers')}
              className="text-xs text-amber-500 hover:text-amber-400 font-display font-bold"
            >
              View All Drivers →
            </button>
          </div>
          <div className="divide-y divide-[#1e293b]">
            {expiredList.filter(d => d.is_license_expired).map(d => (
              <div key={d.driver_id} className="px-6 py-4 flex items-center justify-between bg-red-500/5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                    <XCircle size={18} className="text-red-400" />
                  </div>
                  <div>
                    <div className="font-display font-bold text-white">{d.full_name}</div>
                    <div className="text-sm text-slate-400">License: <span className="font-mono">{d.license_number}</span></div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-red-400 font-display font-bold">EXPIRED</div>
                  <div className="text-xs text-slate-500">{d.license_expiry_date}</div>
                </div>
              </div>
            ))}
            {expiredList.filter(d => !d.is_license_expired).map(d => (
              <div key={d.driver_id} className="px-6 py-4 flex items-center justify-between bg-amber-500/5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                    <AlertCircle size={18} className="text-amber-400" />
                  </div>
                  <div>
                    <div className="font-display font-bold text-white">{d.full_name}</div>
                    <div className="text-sm text-slate-400">License: <span className="font-mono">{d.license_number}</span></div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-amber-400 font-display font-bold">EXPIRES SOON</div>
                  <div className="text-xs text-slate-500">{d.license_expiry_date}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-4">
        <button 
          onClick={() => onNav('drivers')}
          className="card p-6 text-left hover:border-amber-500/50 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center group-hover:bg-amber-500/30 transition-all">
              <Users size={22} className="text-amber-400" />
            </div>
            <div>
              <div className="font-display font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Driver Profiles</div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Manage {drivers.length} drivers and safety scores</div>
            </div>
          </div>
        </button>

        <button 
          onClick={() => onNav('vehicles')}
          className="card p-6 text-left hover:border-blue-500/50 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center group-hover:bg-blue-500/30 transition-all">
              <Activity size={22} className="text-blue-400" />
            </div>
            <div>
              <div className="font-display font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Vehicle Registry</div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>View {vehicles.length} vehicles and maintenance status</div>
            </div>
          </div>
        </button>

        <button 
          onClick={() => onNav('maintenance')}
          className="card p-6 text-left hover:border-emerald-500/50 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center group-hover:bg-emerald-500/30 transition-all">
              <CheckCircle size={22} className="text-emerald-400" />
            </div>
            <div>
              <div className="font-display font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Maintenance</div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Track vehicle health & service logs</div>
            </div>
          </div>
        </button>

        <button 
          onClick={handleExportCSV}
          className="card p-6 text-left hover:border-purple-500/50 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center group-hover:bg-purple-500/30 transition-all">
              <FileText size={22} className="text-purple-400" />
            </div>
            <div>
              <div className="font-display font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Export Report</div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Download CSV/PDF safety reports</div>
            </div>
          </div>
        </button>
      </div>

      {/* Safety Score Distribution */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
          <h3 className="font-display font-bold" style={{ color: 'var(--text-primary)' }}>Driver Safety Score Overview</h3>
          <button 
            onClick={handleExportPDF}
            className="text-xs flex items-center gap-1"
            style={{ color: 'var(--text-muted)' }}
          >
            <Download size={12} /> Export PDF
          </button>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <div className="font-display font-bold text-2xl text-emerald-400">
                {getScoreDistribution('excellent')}
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Excellent (90-100)</div>
            </div>
            <div className="text-center p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <div className="font-display font-bold text-2xl text-amber-400">
                {getScoreDistribution('good')}
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Good (75-89)</div>
            </div>
            <div className="text-center p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <div className="font-display font-bold text-2xl text-red-400">
                {getScoreDistribution('needs_improvement')}
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Needs Improvement (&lt;75)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Low Safety Score Drivers */}
      {lowSafetyList.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
            <h3 className="font-display font-bold" style={{ color: 'var(--text-primary)' }}>Drivers with Low Safety Scores</h3>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
            {lowSafetyList.map(d => (
              <div key={d.driver_id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                    <TrendingDown size={18} className="text-red-400" />
                  </div>
                  <div>
                    <div className="font-display font-bold text-white">{d.full_name}</div>
                    <div className="text-sm text-slate-400">License: <span className="font-mono">{d.license_number}</span></div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-red-400 font-display font-bold text-xl">{d.safety_score}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Safety Score</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
