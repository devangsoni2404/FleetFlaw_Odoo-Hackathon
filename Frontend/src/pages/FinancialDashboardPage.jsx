import React, { useState, useEffect } from 'react'
import { useFleet } from '../context/FleetContext'
import { analyticsAPI } from '../services/api'
import { DollarSign, TrendingUp, Fuel, Receipt, PieChart, Download, AlertCircle, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react'

export default function FinancialDashboardPage({ onNav }) {
  const { expenses, vehicles, trips } = useFleet()
  const [financialData, setFinancialData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchFinancialData()
  }, [])

  const fetchFinancialData = async () => {
    try {
      setLoading(true)
      const [monthlyRes, roiRes, fuelRes, costRes] = await Promise.all([
        analyticsAPI.monthlyFinancials(),
        analyticsAPI.vehicleROI(),
        analyticsAPI.fuelEfficiency(),
        analyticsAPI.costPerKm()
      ])
      setFinancialData({
        monthly: monthlyRes?.data?.data || [],
        roi: roiRes?.data?.data || [],
        fuel: fuelRes?.data?.data || [],
        costPerKm: costRes?.data?.data || []
      })
    } catch (err) {
      setError('Failed to load financial data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleExportCSV = async (type) => {
    try {
      const res = await analyticsAPI.exportCSV(type)
      const blob = new Blob([res.data], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${type}-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      alert('Failed to export CSV')
    }
  }

  // Calculate totals from expenses data
  const totalExpenses = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0)
  const fuelExpenses = expenses.filter(e => e.expense_type === 'Fuel').reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0)
  const maintenanceExpenses = expenses.filter(e => e.expense_type === 'Maintenance').reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0)
  const pendingApprovals = expenses.filter(e => e.status === 'Pending').length

  // Get latest month data
  const currentMonth = financialData?.monthly?.[financialData.monthly.length - 1] || {}
  const prevMonth = financialData?.monthly?.[financialData.monthly.length - 2] || {}

  const kpis = [
    {
      label: 'Total Expenses',
      value: `₹${totalExpenses.toLocaleString()}`,
      sub: 'All time spend',
      icon: DollarSign,
      color: '#ef4444',
      trend: null
    },
    {
      label: 'Fuel Spend',
      value: `₹${fuelExpenses.toLocaleString()}`,
      sub: `${Math.round((fuelExpenses / (totalExpenses || 1)) * 100)}% of total`,
      icon: Fuel,
      color: '#f59e0b',
      trend: null
    },
    {
      label: 'Maintenance Cost',
      value: `₹${maintenanceExpenses.toLocaleString()}`,
      sub: `${Math.round((maintenanceExpenses / (totalExpenses || 1)) * 100)}% of total`,
      icon: Receipt,
      color: '#3b82f6',
      trend: null
    },
    {
      label: 'Pending Approvals',
      value: pendingApprovals,
      sub: 'expenses awaiting review',
      icon: AlertCircle,
      color: '#f59e0b',
      trend: null
    }
  ]

  // Vehicle ROI summary
  const topRoiVehicles = (financialData?.roi || [])
    .sort((a, b) => (b.roi_percentage || 0) - (a.roi_percentage || 0))
    .slice(0, 5)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">Loading financial dashboard...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>Financial Dashboard</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Audit fuel spend, maintenance ROI, and operational costs</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchFinancialData}
            className="btn-secondary"
          >
            Refresh
          </button>
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/25 px-4 py-2 rounded-full">
            <DollarSign size={16} className="text-emerald-400" />
            <span className="text-sm text-emerald-400 font-display font-bold">Financial Analyst</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Financial KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {kpis.map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="card px-5 py-4">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:`${color}20`}}>
                <Icon size={18} style={{color}} />
              </div>
            </div>
            <div className="font-display font-bold text-3xl mb-1" style={{ color: 'var(--text-primary)' }}>{value}</div>
            <div className="text-sm font-display font-semibold" style={{ color: 'var(--text-secondary)' }}>{label}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-4">
        <button 
          onClick={() => onNav('expenses')}
          className="card p-6 text-left hover:border-emerald-500/50 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center group-hover:bg-emerald-500/30 transition-all">
              <Receipt size={22} className="text-emerald-400" />
            </div>
            <div>
              <div className="font-display font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Expenses & Fuel</div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Log and manage operational expenses</div>
            </div>
          </div>
        </button>

        <button 
          onClick={() => onNav('analytics')}
          className="card p-6 text-left hover:border-blue-500/50 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center group-hover:bg-blue-500/30 transition-all">
              <PieChart size={22} className="text-blue-400" />
            </div>
            <div>
              <div className="font-display font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Analytics</div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>View detailed financial reports</div>
            </div>
          </div>
        </button>

        <button 
          onClick={() => handleExportCSV('monthly-financials')}
          className="card p-6 text-left hover:border-purple-500/50 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center group-hover:bg-purple-500/30 transition-all">
              <Download size={22} className="text-purple-400" />
            </div>
            <div>
              <div className="font-display font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Export Reports</div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Download CSV/PDF for audits</div>
            </div>
          </div>
        </button>
      </div>

      {/* Monthly Financial Trend */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
          <h3 className="font-display font-bold" style={{ color: 'var(--text-primary)' }}>Monthly Financial Trend</h3>
          <button 
            onClick={() => handleExportCSV('monthly-financials')}
            className="text-xs flex items-center gap-1"
            style={{ color: 'var(--text-muted)' }}
          >
            <Download size={12} /> Export
          </button>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Fuel Cost</div>
              <div className="font-display font-bold text-xl text-red-400">
                ₹{Math.round(currentMonth?.fuel_cost || 0).toLocaleString()}
              </div>
            </div>
            <div className="text-center p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Maintenance</div>
              <div className="font-display font-bold text-xl text-blue-400">
                ₹{Math.round(currentMonth?.maintenance_cost || 0).toLocaleString()}
              </div>
            </div>
            <div className="text-center p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Other Expenses</div>
              <div className="font-display font-bold text-xl text-amber-400">
                ₹{Math.round(currentMonth?.expense_cost || 0).toLocaleString()}
              </div>
            </div>
            <div className="text-center p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Revenue</div>
              <div className="font-display font-bold text-xl text-emerald-400">
                ₹{Math.round(currentMonth?.revenue || 0).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Trend table */}
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="text-left px-4 py-2">Month</th>
                <th className="text-right px-4 py-2">Fuel Cost</th>
                <th className="text-right px-4 py-2">Maintenance</th>
                <th className="text-right px-4 py-2">Expenses</th>
                <th className="text-right px-4 py-2">Revenue</th>
                <th className="text-right px-4 py-2">Net</th>
              </tr>
            </thead>
            <tbody>
              {(financialData?.monthly || []).slice(-6).reverse().map((m, i) => {
                const net = (m.revenue || 0) - (m.fuel_cost || 0) - (m.maintenance_cost || 0) - (m.expense_cost || 0)
                return (
                  <tr key={i} className="table-row">
                    <td className="px-4 py-3 text-sm font-display" style={{ color: 'var(--text-primary)' }}>{m.month}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-red-400">₹{Math.round(m.fuel_cost || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-blue-400">₹{Math.round(m.maintenance_cost || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-amber-400">₹{Math.round(m.expense_cost || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-emerald-400">₹{Math.round(m.revenue || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs" style={{color: net >= 0 ? '#10b981' : '#ef4444'}}>
                      {net >= 0 ? '+' : ''}₹{Math.round(net).toLocaleString()}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vehicle ROI Table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
          <h3 className="font-display font-bold" style={{ color: 'var(--text-primary)' }}>Vehicle ROI Performance</h3>
          <button 
            onClick={() => handleExportCSV('vehicle-roi')}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
          >
            <Download size={12} /> Export
          </button>
        </div>
        <table className="w-full">
          <thead>
            <tr className="table-header">
              <th className="text-left px-6 py-3">Vehicle</th>
              <th className="text-left px-4 py-3">Type</th>
              <th className="text-right px-4 py-3">Acquisition Cost</th>
              <th className="text-right px-4 py-3">Total Revenue</th>
              <th className="text-right px-4 py-3">Total Costs</th>
              <th className="text-right px-4 py-3">ROI %</th>
            </tr>
          </thead>
          <tbody>
            {topRoiVehicles.map(v => {
              const totalCosts = (v.total_fuel_cost || 0) + (v.total_maintenance_cost || 0) + (v.total_expense_cost || 0)
              return (
                <tr key={v.vehicle_id} className="table-row">
                  <td className="px-6 py-3">
                    <div className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{v.vehicle_name}</div>
                    <div className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{v.license_plate}</div>
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{v.type}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs" style={{ color: 'var(--text-muted)' }}>₹{Math.round(v.acquisition_cost || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-emerald-400">₹{Math.round(v.total_revenue || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-red-400">₹{Math.round(totalCosts).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-display font-bold ${parseFloat(v.roi_percentage || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {parseFloat(v.roi_percentage || 0).toFixed(1)}%
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {topRoiVehicles.length === 0 && (
          <div className="py-12 text-center font-display" style={{ color: 'var(--text-muted)' }}>No ROI data available</div>
        )}
      </div>

      {/* Fuel Efficiency */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <h3 className="font-display font-bold" style={{ color: 'var(--text-primary)' }}>Fuel Efficiency (km/L)</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="table-header">
              <th className="text-left px-6 py-3">Vehicle</th>
              <th className="text-left px-4 py-3">Plate</th>
              <th className="text-right px-4 py-3">Total Fuel (L)</th>
              <th className="text-right px-4 py-3">Total Distance (km)</th>
              <th className="text-right px-4 py-3">Efficiency (km/L)</th>
            </tr>
          </thead>
          <tbody>
            {(financialData?.fuel || []).slice(0, 5).map(f => (
              <tr key={f.vehicle_id} className="table-row">
                <td className="px-6 py-3 font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{f.vehicle_name}</td>
                <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{f.license_plate}</td>
                <td className="px-4 py-3 text-right font-mono text-xs text-amber-400">{Math.round(f.total_liters || 0).toLocaleString()} L</td>
                <td className="px-4 py-3 text-right font-mono text-xs text-blue-400">{Math.round(f.total_distance_km || 0).toLocaleString()} km</td>
                <td className="px-4 py-3 text-right">
                  <span className={`font-display font-bold ${parseFloat(f.km_per_liter || 0) >= 5 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {parseFloat(f.km_per_liter || 0).toFixed(2)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(financialData?.fuel || []).length === 0 && (
          <div className="py-12 text-center font-display" style={{ color: 'var(--text-muted)' }}>No fuel data available</div>
        )}
      </div>
    </div>
  )
}
