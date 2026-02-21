import React from 'react'
import { Truck, LayoutDashboard, BookOpen, Navigation, Wrench, Receipt, Users, BarChart3, LogOut, Zap, UserCog, Sun, Moon } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

const nav = [
  {
    icon: LayoutDashboard,
    label: 'Dashboard',
    page: 'dashboard',
    roles: ['manager', 'dispatcher', 'safety officer', 'financial analyst'],
  },
  {
    icon: BookOpen,
    label: 'Vehicle Registry',
    page: 'vehicles',
    roles: ['manager', 'safety officer'],
  },
  {
    icon: Navigation,
    label: 'Trip Dispatcher',
    page: 'trips',
    roles: ['manager', 'dispatcher'],
  },
  {
    icon: Wrench,
    label: 'Maintenance',
    page: 'maintenance',
    roles: ['manager', 'safety officer'],
  },
  {
    icon: Receipt,
    label: 'Expenses & Fuel',
    page: 'expenses',
    roles: ['manager', 'financial analyst'],
  },
  {
    icon: Users,
    label: 'Driver Profiles',
    page: 'drivers',
    roles: ['manager', 'safety officer'],
  },
  {
    icon: UserCog,
    label: 'Users',
    page: 'users',
    roles: ['manager'],
  },
  {
    icon: BarChart3,
    label: 'Analytics',
    page: 'analytics',
    roles: ['manager', 'financial analyst'],
  },
]

export default function Layout({ user, current, onNav, onLogout, children }) {
  const { theme, toggleTheme, isDark } = useTheme()
  const role = (user?.role || 'manager').toLowerCase()
  const title =
    role === 'dispatcher'
      ? 'Dispatcher'
      : role === 'safety officer'
        ? 'Safety Officer'
        : role === 'financial analyst'
          ? 'Financial Analyst'
          : 'Fleet Manager'

  const accessLabel =
    role === 'dispatcher'
      ? 'Dispatcher Access'
      : role === 'safety officer'
        ? 'Safety Access'
        : role === 'financial analyst'
          ? 'Financial Access'
          : 'Manager Access'
  const visibleNav = nav.filter((item) => item.roles.includes(role))

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r flex flex-col" style={{position:'sticky',top:0,height:'100vh', backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)'}}>
        {/* Logo */}
        <div className="p-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center flex-shrink-0">
              <Truck size={18} className="text-[#090e1a]" />
            </div>
            <div>
              <div className="font-display font-800 text-lg leading-none" style={{ color: 'var(--text-primary)' }}>FleetFlow</div>
              <div className="text-[10px] text-amber-500 font-mono tracking-widest uppercase mt-0.5">Management</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="mb-2">
            <div className="text-[10px] font-display font-bold uppercase tracking-widest px-2 mb-2" style={{ color: 'var(--text-muted)' }}>Main</div>
            {visibleNav.map(({ icon: Icon, label, page }) => (
              <button
                key={page}
                onClick={() => onNav(page)}
                className={`sidebar-link w-full text-left ${current === page ? 'active' : ''}`}
              >
                <Icon size={16} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
              <span className="text-amber-400 text-xs font-display font-bold">
                {role === 'dispatcher' ? 'DP' : role === 'safety officer' ? 'SF' : role === 'financial analyst' ? 'FA' : 'FM'}
              </span>
            </div>
            <div>
              <div className="text-sm font-display font-bold" style={{ color: 'var(--text-primary)' }}>{title}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{accessLabel}</div>
            </div>
          </div>
          <button onClick={onLogout} className="sidebar-link w-full text-left text-red-400 hover:text-red-300">
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto min-w-0" style={{ backgroundColor: 'var(--bg-primary)' }}>
        {/* Top bar */}
        <div className="sticky top-0 z-10 backdrop-blur border-b px-8 py-4 flex items-center justify-between" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}>
          <div>
            <div className="text-lg font-display font-bold capitalize" style={{ color: 'var(--text-primary)' }}>{current.replace('_',' ')}</div>
            <div className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>Jan 15, 2024 — 09:42 AM</div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="theme-toggle"
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/25 px-3 py-1.5 rounded-full">
              <div className="w-2 h-2 rounded-full bg-emerald-400" style={{animation:'pulse-amber 2s infinite'}}></div>
              <span className="text-xs text-emerald-400 font-display font-bold">System Live</span>
            </div>
          </div>
        </div>
        <div className="p-8 animate-fade-in">{children}</div>
      </main>
    </div>
  )
}
