import React, { useState } from 'react'
import { useFleet } from '../context/FleetContext'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Download, TrendingUp, Fuel, Activity } from 'lucide-react'

const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl px-4 py-3 shadow-xl">
      <div className="text-xs text-slate-500 mb-2 font-display font-bold">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 rounded-full" style={{background: p.color}}></div>
          <span className="text-slate-400">{p.name}:</span>
          <span className="font-mono text-white">{typeof p.value === 'number' && p.value > 100 ? `₹${p.value.toLocaleString()}` : p.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function AnalyticsPage() {
  const { vehicles, drivers, trips, expenses, maintenance } = useFleet()

  const formatNumber = (value) => {
    const n = Number(value)
    if (Number.isNaN(n)) return '0'
    return n.toLocaleString()
  }

  const getMaintCost = (m) => Number((m.total_cost ?? m.cost ?? (Number(m.labour_cost || 0) + Number(m.parts_cost || 0))) || 0)

  const monthlyData = [
    { month: 'Sep', fuel: 28000, maintenance: 12000, revenue: 85000 },
    { month: 'Oct', fuel: 32000, maintenance: 8000, revenue: 94000 },
    { month: 'Nov', fuel: 29000, maintenance: 22000, revenue: 88000 },
    { month: 'Dec', fuel: 35000, maintenance: 6000, revenue: 112000 },
    { month: 'Jan', fuel: 0, maintenance: maintenance.reduce((a,m)=>a+getMaintCost(m),0), revenue: 105000 },
  ]

  const fuelEffData = []

  const statusData = [
    { name: 'Available', value: vehicles.filter(v => v.status === 'Available').length },
    { name: 'On Trip', value: vehicles.filter(v => v.status === 'On Trip').length },
    { name: 'In Shop', value: vehicles.filter(v => v.status === 'In Shop').length },
    { name: 'Retired', value: vehicles.filter(v => v.status === 'Retired').length },
  ].filter(d => d.value > 0)

  const totalRevenue = 105000
  const totalFuel = 0
  const totalMaint = maintenance.reduce((a,m)=>a+getMaintCost(m),0)
  const totalOps = totalFuel + totalMaint
  const roi = totalOps > 0 ? (((totalRevenue - totalOps) / totalOps) * 100).toFixed(1) : '—'

  const vehicleROI = vehicles.map(v => {
    const vid = v.vehicle_id ?? v.id
    const vMaint = maintenance.filter(m => String(m.vehicle_id ?? m.vehicle) === String(vid))
    const vTrips = trips.filter(t => String(t.vehicle_id ?? t.vehicle) === String(vid) && t.status === 'Completed')
    const fuel = 0
    const maint = vMaint.reduce((a, m) => a + getMaintCost(m), 0)
    const ops = fuel + maint
    const revenue = vTrips.reduce((a, t) => a + (Number(t.cargo_weight_kg ?? t.cargo ?? 0) * 10), 0)
    const acquisitionCost = Number(v.acquisition_cost ?? 50000)
    const roi = acquisitionCost > 0 ? ((revenue - ops) / acquisitionCost) * 100 : 0
    return { ...v, fuel, maint, ops, revenue, acquisitionCost, roi }
  })

  const handleExportCSV = () => {
    const headers = ['Month', 'Revenue', 'Fuel Cost', 'Maintenance', 'Net Profit', 'Margin']
    const rows = monthlyData.map(m => {
      const net = m.revenue - m.fuel - m.maintenance
      const margin = ((net / m.revenue) * 100).toFixed(1)
      return [m.month, formatNumber(m.revenue), formatNumber(m.fuel), formatNumber(m.maintenance), formatNumber(net), `${margin}%`].join(',')
    })
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `fleetflow-analytics-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const driverPerf = drivers.map(d => {
    const name = (d.full_name ?? d.name ?? '').trim()
    const firstName = name ? name.split(' ')[0] : 'Driver'
    const tripsCount = d.total_trips ?? d.trips ?? 0
    const completedCount = d.completed_trips ?? d.completed ?? 0
    return {
      name: firstName,
      safetyScore: d.safety_score ?? d.safetyScore ?? 0,
      completionRate: tripsCount > 0 ? Math.round((completedCount / tripsCount) * 100) : 0,
      trips: tripsCount,
    }
  })

  const handleExport = (type) => {
    const data = type === 'expenses' ? expenses : trips
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `fleetflow-${type}-${new Date().toISOString().split('T')[0]}.json`
    a.click()
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>Operational Analytics</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Data-driven insights across your fleet</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleExportCSV} className="btn-secondary">
            <Download size={14} /> Export CSV
          </button>
          <button onClick={() => handleExport('expenses')} className="btn-secondary">
            <Download size={14} /> Export Expenses (JSON)
          </button>
          <button onClick={() => handleExport('trips')} className="btn-secondary">
            <Download size={14} /> Export Trips (JSON)
          </button>
        </div>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-4 gap-5">
        {[
          { label: 'Total Revenue', value: `₹${formatNumber(totalRevenue)}`, sub: 'This month', color: '#10b981', icon: TrendingUp },
          { label: 'Fuel Spend', value: `₹${formatNumber(totalFuel)}`, sub: 'This month', color: '#3b82f6', icon: Fuel },
          { label: 'Ops Cost', value: `₹${formatNumber(totalOps)}`, sub: 'Fuel + Maintenance', color: '#f59e0b', icon: Activity },
          { label: 'Net ROI', value: `${roi}%`, sub: '(Rev - Ops) / Ops', color: roi > 0 ? '#10b981' : '#ef4444', icon: TrendingUp },
        ].map(({ label, value, sub, color, icon: Icon }) => (
          <div key={label} className="kpi-card">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{background:`${color}20`}}>
              <Icon size={16} style={{color}} />
            </div>
            <div className="font-display font-bold text-2xl" style={{color}}>{value}</div>
            <div className="text-sm font-display font-semibold mt-1" style={{ color: 'var(--text-secondary)' }}>{label}</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-3 gap-6">
        {/* Monthly cost chart */}
        <div className="col-span-2 card p-6">
          <h3 className="font-display font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Monthly Financial Overview</h3>
          <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>Fuel, maintenance costs vs revenue</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="month" tick={{fill:'#64748b', fontSize:12, fontFamily:'Syne'}} axisLine={false} tickLine={false} />
              <YAxis tick={{fill:'#64748b', fontSize:11, fontFamily:'JetBrains Mono'}} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[4,4,0,0]} opacity={0.8} />
              <Bar dataKey="fuel" name="Fuel" fill="#3b82f6" radius={[4,4,0,0]} opacity={0.8} />
              <Bar dataKey="maintenance" name="Maintenance" fill="#f59e0b" radius={[4,4,0,0]} opacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Fleet status pie */}
        <div className="card p-6">
          <h3 className="font-display font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Fleet Status</h3>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Current vehicle allocation</p>
          {statusData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-3">
                {statusData.map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{background: COLORS[i]}}></div>
                      <span className="text-xs font-display font-semibold" style={{ color: 'var(--text-secondary)' }}>{d.name}</span>
                    </div>
                    <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : <div className="text-sm text-center py-12" style={{ color: 'var(--text-muted)' }}>No data</div>}
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-2 gap-6">
        {/* Fuel efficiency */}
        <div className="card p-6">
          <h3 className="font-display font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Fuel Efficiency by Vehicle</h3>
          <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>Kilometers per liter</p>
          {fuelEffData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={fuelEffData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" tick={{fill:'#64748b', fontSize:11}} axisLine={false} tickLine={false} unit=" km/L" />
                <YAxis type="category" dataKey="name" tick={{fill:'#94a3b8', fontSize:12, fontFamily:'Syne'}} axisLine={false} tickLine={false} width={100} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="efficiency" name="km/L" fill="#f59e0b" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="text-sm text-center py-12" style={{ color: 'var(--text-muted)' }}>No fuel data recorded yet</div>}
        </div>

        {/* Driver performance */}
        <div className="card p-6">
          <h3 className="font-display font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Driver Performance</h3>
          <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>Safety score vs completion rate</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={driverPerf}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="name" tick={{fill:'#64748b', fontSize:12, fontFamily:'Syne'}} axisLine={false} tickLine={false} />
              <YAxis tick={{fill:'#64748b', fontSize:11}} axisLine={false} tickLine={false} domain={[0,100]} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="safetyScore" name="Safety Score" fill="#10b981" radius={[4,4,0,0]} opacity={0.85} />
              <Bar dataKey="completionRate" name="Completion %" fill="#3b82f6" radius={[4,4,0,0]} opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Financial summary table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
          <h3 className="font-display font-bold" style={{ color: 'var(--text-primary)' }}>Financial Summary — January 2024</h3>
          <button onClick={handleExportCSV} className="btn-secondary text-xs">
            <Download size={12} /> Export CSV
          </button>
        </div>
        <table className="w-full">
          <thead>
            <tr className="table-header">
              <th className="text-left px-6 py-3">Month</th>
              <th className="text-left px-4 py-3">Revenue</th>
              <th className="text-left px-4 py-3">Fuel Cost</th>
              <th className="text-left px-4 py-3">Maintenance</th>
              <th className="text-left px-4 py-3">Net Profit</th>
              <th className="text-left px-4 py-3">Margin</th>
            </tr>
          </thead>
          <tbody>
            {monthlyData.map(m => {
              const net = m.revenue - m.fuel - m.maintenance
              const margin = ((net / m.revenue) * 100).toFixed(1)
              return (
                <tr key={m.month} className="table-row">
                  <td className="px-6 py-3 font-display font-bold" style={{ color: 'var(--text-primary)' }}>{m.month} 2024</td>
                  <td className="px-4 py-3 font-mono text-sm text-green-400">₹{formatNumber(m.revenue)}</td>
                  <td className="px-4 py-3 font-mono text-sm text-blue-400">₹{formatNumber(m.fuel)}</td>
                  <td className="px-4 py-3 font-mono text-sm text-amber-400">₹{formatNumber(m.maintenance)}</td>
                  <td className="px-4 py-3 font-mono text-sm" style={{color: net > 0 ? '#10b981' : '#ef4444'}}>₹{formatNumber(net)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-mono px-2 py-1 rounded font-bold ${+margin > 50 ? 'text-green-400 bg-green-500/10 border border-green-500/20' : 'text-amber-400 bg-amber-500/10 border border-amber-500/20'}`}>
                      {margin}%
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Vehicle ROI table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <h3 className="font-display font-bold" style={{ color: 'var(--text-primary)' }}>Vehicle ROI Analysis</h3>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>ROI = (Revenue - (Maintenance + Fuel)) / Acquisition Cost</p>
        </div>
        <table className="w-full">
          <thead>
            <tr className="table-header">
              <th className="text-left px-6 py-3">Vehicle</th>
              <th className="text-left px-4 py-3">Revenue</th>
              <th className="text-left px-4 py-3">Fuel Cost</th>
              <th className="text-left px-4 py-3">Maintenance</th>
              <th className="text-left px-4 py-3">Acquisition Cost</th>
              <th className="text-left px-4 py-3">ROI %</th>
            </tr>
          </thead>
          <tbody>
            {vehicleROI.map(v => (
              <tr key={v.vehicle_id ?? v.id} className="table-row">
                <td className="px-6 py-3">
                  <div className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{v.make} {v.model}</div>
                  <div className="text-xs text-amber-500 font-mono">{v.vehicle_id ?? v.id}</div>
                </td>
                <td className="px-4 py-3 font-mono text-sm text-green-400">₹{formatNumber(v.revenue)}</td>
                <td className="px-4 py-3 font-mono text-sm text-blue-400">₹{formatNumber(v.fuel)}</td>
                <td className="px-4 py-3 font-mono text-sm text-amber-400">₹{formatNumber(v.maint)}</td>
                <td className="px-4 py-3 font-mono text-sm" style={{ color: 'var(--text-muted)' }}>₹{formatNumber(v.acquisitionCost)}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-mono px-2 py-1 rounded font-bold ${v.roi > 0 ? 'text-green-400 bg-green-500/10 border border-green-500/20' : 'text-red-400 bg-red-500/10 border border-red-500/20'}`}>
                    {v.roi.toFixed(1)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
