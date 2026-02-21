import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  dashboardAPI,
  driversAPI,
  expensesAPI,
  fuelAPI,
  maintenanceAPI,
  tripsAPI,
  vehiclesAPI,
} from '../services/api'

const FleetContext = createContext(null)

export function FleetProvider({ children }) {
  const [vehicles, setVehicles] = useState([])
  const [drivers, setDrivers] = useState([])
  const [trips, setTrips] = useState([])
  const [maintenance, setMaintenance] = useState([])
  const [expenses, setExpenses] = useState([])
  const [fuelLogs, setFuelLogs] = useState([])
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(false)
  const [token, setToken] = useState(() => localStorage.getItem('accessToken'))

  const normalizeListResponse = (res) => {
    const payload = res?.data
    if (payload?.data?.items) return payload.data.items
    if (Array.isArray(payload?.data)) return payload.data
    return []
  }

  const refreshVehicles = async (params) => {
    const res = await vehiclesAPI.getAll(params)
    setVehicles(normalizeListResponse(res))
    return res
  }

  const refreshDrivers = async (params) => {
    const res = await driversAPI.getAll(params)
    setDrivers(normalizeListResponse(res))
    return res
  }

  const refreshTrips = async (params) => {
    const res = await tripsAPI.getAll(params)
    setTrips(normalizeListResponse(res))
    return res
  }

  const refreshMaintenance = async (params) => {
    const res = await maintenanceAPI.getAll(params)
    setMaintenance(normalizeListResponse(res))
    return res
  }

  const refreshExpenses = async (params) => {
    const res = await expensesAPI.getAll(params)
    setExpenses(normalizeListResponse(res))
    return res
  }

  const refreshFuelLogs = async (params) => {
    const res = await fuelAPI.getAll(params)
    setFuelLogs(normalizeListResponse(res))
    return res
  }

  const refreshDashboard = async () => {
    const res = await dashboardAPI.get()
    setDashboard(res?.data?.data ?? null)
    return res
  }

  const refreshAll = async () => {
    setLoading(true)
    try {
      await Promise.all([
        refreshVehicles().catch(() => undefined),
        refreshDrivers().catch(() => undefined),
        refreshTrips().catch(() => undefined),
        refreshMaintenance().catch(() => undefined),
        refreshExpenses().catch(() => undefined),
        refreshFuelLogs().catch(() => undefined),
        refreshDashboard().catch(() => undefined),
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const syncToken = () => setToken(localStorage.getItem('accessToken'))
    window.addEventListener('storage', syncToken)
    const id = window.setInterval(syncToken, 500)
    return () => {
      window.removeEventListener('storage', syncToken)
      window.clearInterval(id)
    }
  }, [])

  useEffect(() => {
    if (token) {
      refreshAll()
      return
    }
    setVehicles([])
    setDrivers([])
    setTrips([])
    setMaintenance([])
    setExpenses([])
    setFuelLogs([])
    setDashboard(null)
  }, [token])

  const addVehicle = async (v) => {
    await vehiclesAPI.create(v)
    await refreshVehicles()
  }

  const updateVehicle = async (id, data) => {
    // If only status is being updated, use the retire endpoint for status toggle
    if (data.status && Object.keys(data).length === 1) {
      await vehiclesAPI.updateStatus(id, data.status)
    } else {
      await vehiclesAPI.update(id, data)
    }
    await refreshVehicles()
  }

  const deleteVehicle = async (id) => {
    await vehiclesAPI.delete(id)
    await refreshVehicles()
  }

  const addDriver = async (d) => {
    await driversAPI.create(d)
    await refreshDrivers()
  }

  const updateDriver = async (id, data) => {
    // If only status is being updated, use the status endpoint
    if (data.status && Object.keys(data).length === 1) {
      // Map status to valid ENUM reason from database schema
      const reasonMap = {
        'Available': 'Reinstated',
        'On Trip': 'Trip Dispatched',
        'Off Duty': 'Medical Leave',
        'Suspended': 'Disciplinary Action'
      }
      const reason = data.reason || reasonMap[data.status] || 'Manually Set by Manager'
      await driversAPI.updateStatus(id, data.status, reason)
    } else {
      await driversAPI.update(id, data)
    }
    await refreshDrivers()
  }

  const deleteDriver = async (id) => {
    await driversAPI.delete(id)
    await refreshDrivers()
  }

  const addTrip = async (t) => {
    await tripsAPI.create(t)
    await refreshTrips()
    await refreshVehicles()
    await refreshDrivers()
  }

  const updateTrip = async (id, data) => {
    if (data?.status === 'Completed') {
      // Get the trip to find odometer_start_km for the completion
      const trip = trips.find(t => String(t.trip_id ?? t.id) === String(id))
      const odometerEnd = data.odometer_end_km || (trip?.odometer_start_km ? trip.odometer_start_km + 100 : 100)
      await tripsAPI.complete(id, { odometer_end_km: odometerEnd })
    } else if (data?.status === 'Cancelled') {
      await tripsAPI.cancel(id, data.cancelled_reason || data.reason || '')
    } else {
      // No generic update endpoint exists in backend routes.
      // Re-fetch so UI stays consistent.
    }
    await refreshTrips()
    await refreshVehicles()
    await refreshDrivers()
  }

  const addMaintenance = async (m) => {
    await maintenanceAPI.create(m)
    await refreshMaintenance()
    await refreshVehicles()
  }

  const completeMaintenance = async (id) => {
    await maintenanceAPI.complete(id)
    await refreshMaintenance()
    await refreshVehicles()
  }

  const addExpense = async (e) => {
    await expensesAPI.create(e)
    await refreshExpenses()
    await refreshTrips()
  }

  const getVehicle = (id) => vehicles.find(v => String(v.vehicle_id ?? v.id) === String(id))
  const getDriver = (id) => drivers.find(d => String(d.driver_id ?? d.id) === String(id))

  return (
    <FleetContext.Provider value={{
      vehicles, drivers, trips, maintenance, expenses, fuelLogs, dashboard,
      loading,
      refreshAll,
      refreshVehicles,
      refreshDrivers,
      refreshTrips,
      refreshMaintenance,
      refreshExpenses,
      refreshFuelLogs,
      refreshDashboard,
      addVehicle, updateVehicle, deleteVehicle,
      addDriver, updateDriver, deleteDriver,
      addTrip, updateTrip,
      addMaintenance, completeMaintenance,
      addExpense,
      getVehicle, getDriver
    }}>
      {children}
    </FleetContext.Provider>
  )
}

export const useFleet = () => useContext(FleetContext)
