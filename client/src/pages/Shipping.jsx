import { useEffect, useState } from 'react'
import api from '../services/api'
import DataTable from '../components/DataTable'
import StatusBadge from '../components/StatusBadge'
import { Truck, Package, RefreshCw, ExternalLink } from 'lucide-react'

export default function Shipping() {
  const [tab, setTab] = useState('ready')
  const [packedOrders, setPackedOrders] = useState([])
  const [shipments, setShipments] = useState([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState({})

  const fetchReady = async () => {
    setLoading(true)
    try {
      const res = await api.get('/orders')
      const orders = (res.data.data || []).filter(o => o.status === 'PACKED')
      setPackedOrders(orders)
    } catch {}
    setLoading(false)
  }

  const fetchShipments = async () => {
    setLoading(true)
    try {
      const res = await api.get('/shipments')
      setShipments(res.data.data || [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => {
    if (tab === 'ready') fetchReady()
    else fetchShipments()
  }, [tab])

  const createShipment = async (orderId) => {
    setActing(prev => ({ ...prev, [orderId]: 'creating' }))
    try {
      const res = await api.post('/shipments', { orderId })
      setActing(prev => ({ ...prev, [orderId]: 'assigning' }))
      const shipment = res.data.data.shipment
      await api.post(`/shipments/${shipment.id}/assign-awb`)
      fetchReady()
      if (tab === 'shipped') fetchShipments()
    } catch (err) {
      console.error(err)
    }
    setActing(prev => ({ ...prev, [orderId]: 'idle' }))
  }

  const trackShipment = async (shipmentId) => {
    setActing(prev => ({ ...prev, [shipmentId + '_track']: 'loading' }))
    try {
      const res = await api.get(`/shipments/${shipmentId}/track`)
      setShipments(prev => prev.map(s => s.id === shipmentId ? { ...s, ...res.data.data.shipment, tracking: res.data.data.tracking } : s))
    } catch (err) {
      console.error(err)
    }
    setActing(prev => ({ ...prev, [shipmentId + '_track']: 'idle' }))
  }

  const getLabel = async (shipmentId) => {
    try {
      const res = await api.get(`/shipments/${shipmentId}/label`)
      if (res.data.data?.labelUrl) {
        window.open(res.data.data.labelUrl, '_blank')
      }
    } catch (err) {
      console.error(err)
    }
  }

  const readyColumns = [
    { accessorKey: 'id', header: 'Order ID', cell: (info) => info.getValue().slice(0, 8) + '...' },
    { accessorKey: 'customerName', header: 'Customer' },
    { accessorKey: 'total', header: 'Total', cell: (info) => `₹${info.getValue().toLocaleString()}` },
    { accessorKey: 'items', header: 'Items', cell: (info) => info.getValue()?.length || 0 }
  ]

  const shipmentsColumns = [
    { accessorKey: 'id', header: 'ID', cell: (info) => info.getValue().slice(0, 8) + '...' },
    { accessorKey: 'awb', header: 'AWB', cell: (info) => info.getValue() || '—' },
    { accessorKey: 'courierName', header: 'Courier', cell: (info) => info.getValue() || '—' },
    { accessorKey: 'status', header: 'Status', cell: (info) => <StatusBadge status={info.getValue()} /> },
    { accessorKey: 'shippingCharge', header: 'Charge', cell: (info) => `₹${(info.getValue() || 0).toLocaleString()}` },
    { accessorKey: 'createdAt', header: 'Created', cell: (info) => new Date(info.getValue()).toLocaleDateString() },
    {
      accessorKey: 'actions',
      header: 'Actions',
      cell: (info) => {
        const s = info.row.original
        return (
          <div className="flex gap-2">
            {s.awb && (
              <button onClick={() => getLabel(s.id)} className="text-xs px-2 py-1 bg-slate-100 rounded hover:bg-slate-200">Label</button>
            )}
            {s.trackingUrl && (
              <a href={s.trackingUrl} target="_blank" rel="noreferrer" className="text-xs px-2 py-1 bg-slate-100 rounded hover:bg-slate-200 flex items-center gap-1">
                Track <ExternalLink className="w-3 h-3" />
              </a>
            )}
            <button onClick={() => trackShipment(s.id)} disabled={acting[s.id + '_track'] === 'loading'} className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 disabled:opacity-50">
              <RefreshCw className={`w-3 h-3 ${acting[s.id + '_track'] === 'loading' ? 'animate-spin' : ''}`} />
            </button>
          </div>
        )
      }
    }
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Shipping</h1>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab('ready')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'ready' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
          <Package className="w-4 h-4 inline mr-2" />
          Ready to Ship ({packedOrders.length})
        </button>
        <button onClick={() => setTab('shipped')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'shipped' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
          <Truck className="w-4 h-4 inline mr-2" />
          Shipped ({shipments.length})
        </button>
      </div>

      {loading ? (
        <div className="text-slate-500">Loading...</div>
      ) : tab === 'ready' ? (
        <DataTable
          data={packedOrders}
          columns={[
            ...readyColumns,
            {
              accessorKey: 'actions',
              header: 'Actions',
              cell: (info) => {
                const order = info.row.original
                return (
                  <button
                    onClick={() => createShipment(order.id)}
                    disabled={acting[order.id] !== undefined}
                    className="text-xs px-3 py-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {acting[order.id] === 'creating' ? 'Creating...' : acting[order.id] === 'assigning' ? 'Assigning AWB...' : 'Ship Now'}
                  </button>
                )
              }
            }
          ]}
        />
      ) : (
        <DataTable data={shipments} columns={shipmentsColumns} />
      )}
    </div>
  )
}
