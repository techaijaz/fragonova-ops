import { NavLink, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Package, ShoppingCart, FlaskConical, Truck, LayoutDashboard,
  Ship, Wallet, TrendingUp, Settings as SettingsIcon, LogOut, ShieldCheck
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLogout } from '../hooks/useAuth'
import usePermissions from '../hooks/usePermissions'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/orders', icon: ShoppingCart, label: 'Orders' },
  { to: '/products', icon: Package, label: 'Products' },
  { to: '/inventory', icon: FlaskConical, label: 'Inventory' },
  { to: '/vendors', icon: Truck, label: 'Vendors', roles: ['admin'] },
  { to: '/shipping', icon: Ship, label: 'Shipping' },
  { to: '/accounts', icon: Wallet, label: 'Accounts', roles: ['admin'] },
  { to: '/reports', icon: TrendingUp, label: 'Reports', roles: ['admin'] },
  { to: '/settings', icon: SettingsIcon, label: 'Settings' }
]

export default function Sidebar() {
  const { user } = useAuth()
  const logout = useLogout()
  const navigate = useNavigate()
  const { role } = usePermissions()

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        toast.success('Logged out successfully')
        navigate('/login', { replace: true })
      },
      onError: () => {
        toast.error('Logout failed')
      }
    })
  }

  // Filter items based on user role
  const visibleNavItems = navItems.filter(item => {
    if (!item.roles) return true
    return item.roles.includes(role)
  })

  const getRoleBadgeStyle = (r) => {
    switch (r) {
      case 'admin':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40'
      case 'manager':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40'
      default:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
    }
  }

  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen flex flex-col">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-xl font-bold">PerfumeOps</h1>
        <p className="text-xs text-slate-400 mt-1">Decanting Business</p>
      </div>

      {/* User info */}
      {user && (
        <div className="px-6 py-4 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold shrink-0">
              {user.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-200 truncate">{user.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border capitalize ${getRoleBadgeStyle(user.role)}`}>
                  {user.role || 'user'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <nav className="flex-1 p-4 space-y-1">
        {visibleNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Logout button */}
      <div className="p-4 border-t border-slate-700">
        <button
          onClick={handleLogout}
          disabled={logout.isPending}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-300 hover:bg-red-500/10 hover:text-red-400 transition-colors w-full"
        >
          <LogOut className="w-4 h-4" />
          {logout.isPending ? 'Logging out...' : 'Logout'}
        </button>
      </div>
    </aside>
  )
}

