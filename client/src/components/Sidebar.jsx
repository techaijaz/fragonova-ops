import { NavLink } from 'react-router-dom'
import { Package, ShoppingCart, FlaskConical, Truck, LayoutDashboard, Ship, Wallet, TrendingUp } from 'lucide-react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/orders', icon: ShoppingCart, label: 'Orders' },
  { to: '/products', icon: Package, label: 'Products' },
  { to: '/inventory', icon: FlaskConical, label: 'Inventory' },
  { to: '/vendors', icon: Truck, label: 'Vendors' },
  { to: '/shipping', icon: Ship, label: 'Shipping' },
  { to: '/accounts', icon: Wallet, label: 'Accounts' },
  { to: '/reports', icon: TrendingUp, label: 'Reports' }
]

export default function Sidebar() {
  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen flex flex-col">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-xl font-bold">PerfumeOps</h1>
        <p className="text-xs text-slate-400 mt-1">Decanting Business</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
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
    </aside>
  )
}
