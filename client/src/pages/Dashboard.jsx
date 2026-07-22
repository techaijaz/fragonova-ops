import { useEffect, useState } from 'react'
import api from '../services/api'
import { ShoppingCart, DollarSign, Truck, Users } from 'lucide-react'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/inventory/stats/dashboard')
      .then(r => setStats(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-slate-500">Loading dashboard...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Today's Orders</p>
              <p className="text-2xl font-bold text-slate-900">{stats?.todayOrders || 0}</p>
            </div>
            <ShoppingCart className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Today's Revenue</p>
              <p className="text-2xl font-bold text-slate-900">₹{stats?.todayRevenue?.toLocaleString() || 0}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Pending Shipments</p>
              <p className="text-2xl font-bold text-slate-900">{stats?.pendingShipments || 0}</p>
            </div>
            <Truck className="w-8 h-8 text-purple-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Vendors</p>
              <p className="text-2xl font-bold text-slate-900">{stats?.vendorCount || 0}</p>
            </div>
            <Users className="w-8 h-8 text-amber-500" />
          </div>
        </div>
      </div>
    </div>
  )
}
