import { useState, useEffect } from 'react'
import api from '../services/api'
import DataTable from '../components/DataTable'

const tabs = [
    { id: 'best-sellers', label: 'Best Sellers' },
    { id: 'margin', label: 'Margin Analysis' },
    { id: 'wastage', label: 'Wastage' },
    { id: 'sales', label: 'Sales Trend' }
]

export default function Reports() {
    const [activeTab, setActiveTab] = useState('best-sellers')
    const [range, setRange] = useState('month')
    const [customStart, setCustomStart] = useState('')
    const [customEnd, setCustomEnd] = useState('')
    const [data, setData] = useState({})
    const [loading, setLoading] = useState(false)

    const getDateParams = () => {
        if (range === 'custom') {
            return { startDate: customStart, endDate: customEnd }
        }
        const now = new Date()
        let from
        if (range === 'today') {
            from = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        } else if (range === 'week') {
            from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        } else {
            from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        }
        return {
            startDate: from.toISOString().split('T')[0],
            endDate: now.toISOString().split('T')[0]
        }
    }

    useEffect(() => {
        setLoading(true)
        const params = getDateParams()
        const fetchOne = (endpoint) =>
            api.get(endpoint, { params })
                .then(r => r.data.data || [])
                .catch(() => [])

        Promise.all([
            fetchOne('/reports/best-sellers'),
            fetchOne('/reports/margin-analysis'),
            fetchOne('/reports/wastage'),
            fetchOne('/reports/sales-summary')
        ]).then(([bs, margin, wastage, sales]) => {
            setData({ 'best-sellers': bs, margin, wastage, sales })
            setLoading(false)
        }).catch(() => setLoading(false))
    }, [range, customStart, customEnd])

    const renderTab = () => {
        if (loading) {
            return <div className="text-slate-500">Loading...</div>
        }

        switch (activeTab) {
            case 'best-sellers':
                const bsColumns = [
                    { accessorKey: 'name', header: 'Name' },
                    { accessorKey: 'revenue', header: 'Revenue', cell: (info) => `₹${info.getValue().toLocaleString()}` },
                    { accessorKey: 'qty', header: 'Quantity Sold' },
                    { accessorKey: 'orderCount', header: 'Orders' }
                ]
                return <DataTable data={data['best-sellers'] || []} columns={bsColumns} />
            case 'margin':
                const marginColumns = [
                    { accessorKey: 'name', header: 'Product' },
                    { accessorKey: 'qtySold', header: 'Qty Sold' },
                    { accessorKey: 'revenue', header: 'Revenue', cell: (info) => `₹${info.getValue().toLocaleString()}` },
                    { accessorKey: 'cogs', header: 'COGS', cell: (info) => `₹${info.getValue().toLocaleString()}` },
                    { accessorKey: 'margin', header: 'Margin', cell: (info) => `₹${info.getValue().toLocaleString()}` },
                    { accessorKey: 'marginPct', header: 'Margin %', cell: (info) => `${info.getValue()}%` }
                ]
                return <DataTable data={data['margin'] || []} columns={marginColumns} />
            case 'wastage':
                const wastageColumns = [
                    { accessorKey: 'productName', header: 'Product' },
                    { accessorKey: 'batchNo', header: 'Batch #' },
                    { accessorKey: 'totalMlUsed', header: 'Used ML' },
                    { accessorKey: 'totalWastageMl', header: 'Wastage ML' },
                    { accessorKey: 'wastagePct', header: 'Wastage %', cell: (info) => `${info.getValue()}%` },
                    { accessorKey: 'sessionCount', header: 'Sessions' }
                ]
                return <DataTable data={data['wastage'] || []} columns={wastageColumns} />
            case 'sales':
                const salesColumns = [
                    { accessorKey: 'date', header: 'Date' },
                    { accessorKey: 'orders', header: 'Orders' },
                    { accessorKey: 'revenue', header: 'Revenue', cell: (info) => `₹${info.getValue().toLocaleString()}` },
                    { accessorKey: 'avgOrderValue', header: 'Avg Order Value', cell: (info) => `₹${info.getValue().toLocaleString()}` }
                ]
                return <DataTable data={data['sales'] || []} columns={salesColumns} />
            default:
                return null
        }
    }

    return (
        <div>
            <h1 className="text-2xl font-bold text-slate-800 mb-6">Reports</h1>
            <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-2">
                    <label className="text-sm text-slate-600">Range:</label>
                    <select
                        value={range}
                        onChange={(e) => setRange(e.target.value)}
                        className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    >
                        <option value="today">Today</option>
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                        <option value="custom">Custom</option>
                    </select>
                </div>
                {range === 'custom' && (
                    <>
                        <input
                            type="date"
                            value={customStart}
                            onChange={(e) => setCustomStart(e.target.value)}
                            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                        />
                        <input
                            type="date"
                            value={customEnd}
                            onChange={(e) => setCustomEnd(e.target.value)}
                            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                        />
                    </>
                )}
            </div>
            <div className="border-b border-slate-200 mb-6">
                <div className="flex gap-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                                activeTab === tab.id
                                    ? 'bg-slate-900 text-white'
                                    : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>
            {renderTab()}
        </div>
    )
}
