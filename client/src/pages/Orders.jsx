import { useEffect, useState } from 'react'
import api from '../services/api'
import DataTable from '../components/DataTable'
import StatusBadge from '../components/StatusBadge'
import Modal from '../components/Modal'
import { Plus, X, DollarSign } from 'lucide-react'

export default function Orders() {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [actingId, setActingId] = useState(null)
    const [showProfit, setShowProfit] = useState(false)
    const [profitData, setProfitData] = useState(null)
    const [loadingProfit, setLoadingProfit] = useState(false)

    useEffect(() => {
        api.get('/orders')
            .then(r => setOrders(r.data.data || []))
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [])

    const createShipment = async (orderId) => {
        setActingId(orderId)
        try {
            await api.post('/shipments', { orderId })
            alert('Shipment created! Now assign AWB in the Shipping page.')
            window.location.href = '/shipping'
        } catch {
            alert('Failed to create shipment')
        }
        setActingId(null)
    }

    const viewProfit = async (orderId) => {
        setLoadingProfit(true)
        setShowProfit(true)
        try {
            const r = await api.get(`/accounts/profit/order/${orderId}`)
            setProfitData(r.data.data)
        } catch {
            setProfitData(null)
        }
        setLoadingProfit(false)
    }

    const columns = [
        { accessorKey: 'id', header: 'ID', cell: (info) => info.getValue().slice(0, 8) + '...' },
        { accessorKey: 'customerName', header: 'Customer' },
        { accessorKey: 'source', header: 'Source', cell: (info) => <StatusBadge status={info.getValue()} /> },
        { accessorKey: 'status', header: 'Status', cell: (info) => <StatusBadge status={info.getValue()} /> },
        { accessorKey: 'paymentStatus', header: 'Payment', cell: (info) => <StatusBadge status={info.getValue()} /> },
        { accessorKey: 'total', header: 'Total', cell: (info) => `₹${info.getValue().toLocaleString()}` },
        { accessorKey: 'createdAt', header: 'Date', cell: (info) => new Date(info.getValue()).toLocaleDateString() },
        {
            accessorKey: 'actions',
            header: 'Actions',
            cell: (info) => {
                const order = info.row.original
                return (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => viewProfit(order.id)}
                            className="text-xs flex items-center gap-1 px-3 py-1.5 border border-slate-300 rounded hover:bg-slate-50"
                        >
                            <DollarSign className="w-3 h-3" />
                            View Profit
                        </button>
                        {order.status === 'PACKED' && (
                            <button
                                onClick={() => createShipment(order.id)}
                                disabled={actingId === order.id}
                                className="text-xs px-3 py-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {actingId === order.id ? 'Shipping...' : 'Ship'}
                            </button>
                        )}
                    </div>
                )
            }
        }
    ]

    return (
        <div>
            <Modal open={showProfit} onClose={() => setShowProfit(false)} title="Order Profit">
                {loadingProfit ? (
                    <div className="text-slate-500">Loading...</div>
                ) : profitData ? (
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-slate-500">Order</p>
                                <p className="text-sm font-medium">{profitData.orderNumber || profitData.orderId.slice(0, 8)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Customer</p>
                                <p className="text-sm font-medium">{profitData.customerName}</p>
                            </div>
                        </div>
                        <div className="border-t pt-3 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600">Revenue</span>
                                <span className="font-medium">₹{profitData.revenue.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600">COGS</span>
                                <span className="font-medium text-red-600">-₹{profitData.cogs.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600">Shipping</span>
                                <span className="font-medium text-red-600">-₹{profitData.shippingCharge.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600">Gateway</span>
                                <span className="font-medium text-red-600">-₹{profitData.gatewayCharge.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm border-t pt-2">
                                <span className="text-slate-900 font-semibold">Net Profit</span>
                                <span className={`font-bold ${profitData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    ₹{profitData.netProfit.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-slate-500">No profit data available.</div>
                )}
            </Modal>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-slate-800">Orders</h1>
                <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800">
                    <Plus className="w-4 h-4" />
                    Manual Order
                </button>
            </div>
            {loading ? (
                <div className="text-slate-500">Loading orders...</div>
            ) : (
                <DataTable data={orders} columns={columns} />
            )}
        </div>
    )
}
