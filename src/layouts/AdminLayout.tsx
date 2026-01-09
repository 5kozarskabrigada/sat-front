import React from 'react'
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Users, Library, BarChart3, LogOut, ShieldCheck } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import clsx from 'clsx'

export default function AdminLayout() {
  const { logout, username } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const getPageTitle = () => {
    if (location.pathname.includes('/admin/roster')) return 'Student Roster'
    if (location.pathname.includes('/admin/library')) return 'Exam Library'
    if (location.pathname.includes('/admin/audit')) return 'Results Audit'
    if (location.pathname.includes('/admin/architect')) return 'Exam Architect'
    return 'Admin Dashboard'
  }

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-brand-dark">
      {/* Sidebar */}
      <aside className="w-64 bg-brand-dark text-white flex flex-col shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-white/10">
          <div className="w-8 h-8 bg-brand-accent rounded-md flex items-center justify-center mr-3 shadow-lg shadow-brand-accent/20">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold tracking-tight">Admin Console</span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          <NavLink 
            to="/admin/roster"
            className={({ isActive }) => clsx(
              "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
              isActive ? "bg-brand-primary text-white shadow-md" : "text-brand-muted hover:bg-white/5 hover:text-white"
            )}
          >
            <Users className="w-5 h-5" />
            Student Roster
          </NavLink>
          
          <NavLink 
            to="/admin/library"
            className={({ isActive }) => clsx(
              "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
              isActive ? "bg-brand-primary text-white shadow-md" : "text-brand-muted hover:bg-white/5 hover:text-white"
            )}
          >
            <Library className="w-5 h-5" />
            Exam Library
          </NavLink>

          <NavLink 
            to="/admin/audit"
            className={({ isActive }) => clsx(
              "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
              isActive ? "bg-brand-primary text-white shadow-md" : "text-brand-muted hover:bg-white/5 hover:text-white"
            )}
          >
            <BarChart3 className="w-5 h-5" />
            Results Audit
          </NavLink>
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-brand-accent flex items-center justify-center text-xs font-bold">
              AD
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-white">{username || 'Administrator'}</span>
              <span className="text-xs text-brand-muted">Super User</span>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white/5 hover:bg-red-500/20 text-brand-muted hover:text-red-200 rounded-lg text-sm transition-colors border border-transparent hover:border-red-500/20"
          >
            <LogOut className="w-4 h-4" />
            Secure Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm">
          <h1 className="text-xl font-bold text-brand-dark">{getPageTitle()}</h1>
          <div id="header-actions"></div> {/* Portal Target for Page Actions */}
        </header>

        <main className="flex-1 overflow-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
