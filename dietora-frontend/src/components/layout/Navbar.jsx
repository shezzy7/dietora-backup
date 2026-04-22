import { Link, NavLink } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { toggleTheme } from '../../store/slices/themeSlice'
import { logout } from '../../store/slices/authSlice'
import { useState } from 'react'

export default function Navbar() {
  const dispatch = useDispatch()
  const { dark } = useSelector((s) => s.theme)
  const { user } = useSelector((s) => s.auth)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 glass border-b border-slate-100 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-display font-bold text-xl text-emerald-600">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-black">D</span>
            </div>
            DIETORA
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <NavLink to="/" end className={({isActive}) => isActive ? 'text-emerald-600 font-semibold text-sm' : 'nav-link'}>Home</NavLink>
            <NavLink to="/about" className={({isActive}) => isActive ? 'text-emerald-600 font-semibold text-sm' : 'nav-link'}>About</NavLink>
            <NavLink to="/faq" className={({isActive}) => isActive ? 'text-emerald-600 font-semibold text-sm' : 'nav-link'}>FAQ</NavLink>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => dispatch(toggleTheme())}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              title={dark ? 'Light mode' : 'Dark mode'}
            >
              {dark ? '☀️' : '🌙'}
            </button>

            {user ? (
              <div className="flex items-center gap-2">
                <Link to="/dashboard" className="btn-primary py-2 px-4 text-sm">Dashboard</Link>
                <button onClick={() => dispatch(logout())} className="btn-secondary py-2 px-4 text-sm">Logout</button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link to="/login" className="btn-secondary py-2 px-4 text-sm">Login</Link>
                <Link to="/register" className="btn-primary py-2 px-4 text-sm">Get Started</Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 space-y-2 animate-slide-up">
            <NavLink to="/" end className="block py-2 px-4 rounded-lg nav-link" onClick={() => setMobileOpen(false)}>Home</NavLink>
            <NavLink to="/about" className="block py-2 px-4 rounded-lg nav-link" onClick={() => setMobileOpen(false)}>About</NavLink>
            <NavLink to="/faq" className="block py-2 px-4 rounded-lg nav-link" onClick={() => setMobileOpen(false)}>FAQ</NavLink>
            {!user && (
              <div className="flex gap-2 pt-2">
                <Link to="/login" className="btn-secondary py-2 px-4 text-sm flex-1 text-center" onClick={() => setMobileOpen(false)}>Login</Link>
                <Link to="/register" className="btn-primary py-2 px-4 text-sm flex-1 text-center" onClick={() => setMobileOpen(false)}>Get Started</Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
