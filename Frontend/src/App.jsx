import React, { useState } from 'react'
import { FleetProvider } from './context/FleetContext'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import SafetyDashboardPage from './pages/SafetyDashboardPage'
import FinancialDashboardPage from './pages/FinancialDashboardPage'
import VehiclesPage from './pages/VehiclesPage'
import TripsPage from './pages/TripsPage'
import MaintenancePage from './pages/MaintenancePage'
import ExpensesPage from './pages/ExpensesPage'
import DriversPage from './pages/DriversPage'
import AnalyticsPage from './pages/AnalyticsPage'
import UsersPage from './pages/UsersPage'

const rolePageAccess = {
  manager: ['dashboard', 'vehicles', 'trips', 'maintenance', 'expenses', 'drivers', 'analytics', 'users'],
  dispatcher: ['dashboard', 'trips'],
  'safety officer': ['dashboard', 'vehicles', 'drivers', 'maintenance'],
  'financial analyst': ['dashboard', 'expenses', 'analytics'],
}

function AppContent() {
  const { user, loading, logout } = useAuth()
  const [page, setPage] = useState('dashboard')

  if (loading) return null
  if (!user) return <LoginPage />

  const allowedPages = rolePageAccess[(user.role || '').toLowerCase()] || rolePageAccess.manager
  if (!allowedPages.includes(page)) {
    setPage('dashboard')
  }

  const pages = {
    dashboard: allowedPages.includes('dashboard') && (
      (user.role || '').toLowerCase() === 'safety officer' 
        ? <SafetyDashboardPage onNav={setPage} />
        : (user.role || '').toLowerCase() === 'financial analyst'
          ? <FinancialDashboardPage onNav={setPage} />
          : <DashboardPage onNav={setPage} />
    ),
    vehicles: allowedPages.includes('vehicles') && <VehiclesPage />,
    trips: allowedPages.includes('trips') && <TripsPage />,
    maintenance: allowedPages.includes('maintenance') && <MaintenancePage />,
    expenses: allowedPages.includes('expenses') && <ExpensesPage />,
    drivers: allowedPages.includes('drivers') && <DriversPage />,
    analytics: allowedPages.includes('analytics') && <AnalyticsPage />,
    users: allowedPages.includes('users') && <UsersPage />,
  }

  return (
    <Layout
      user={user}
      current={page}
      onNav={setPage}
      onLogout={logout}
    >
      {pages[page] || pages.dashboard}
    </Layout>
  )
}

export default function App() {
  return (
    <FleetProvider>
      <AppContent />
    </FleetProvider>
  )
}
