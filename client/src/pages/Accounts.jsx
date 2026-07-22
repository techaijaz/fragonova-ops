import { useState, useEffect } from 'react'
import api from '../services/api'
import DataTable from '../components/DataTable'
import StatusBadge from '../components/StatusBadge'
import { Wallet, TrendingUp, Truck, CreditCard, Receipt, Warehouse, Plus, X, Calendar } from 'lucide-react'

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'vendors', label: 'Vendor Ledger' },
  { id: 'expenses', label: 'Expenses' },
  { id: 'valuation', label: 'Inventory Valuation' },
  { id: 'remittances', label: 'Remittances' }
]

const expenseCategories = ['Packaging', 'Rent', 'Marketing', 'Utilities', 'Logistics', 'Miscellaneous']

function OverviewTab() {
  const [data, setData] = useState(null)
  const [range, setRange] = useState('today')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  const fetchData = () => {
    const params = new URLSearchParams({ range })
    if (range === 'custom') {
      if (customStart) params.append('startDate', customStart)
      if (customEnd) params.append('endDate', customEnd)
    }
    api.get(`/accounts/dashboard?${params.toString()}`)
      .then(r => setData(r.data.data))
      .catch(() => {})
  }

  useEffect(() => { fetchData() }, [range, customStart, customEnd])

  return (
    <div>
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
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-500">Revenue</p>
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-xl font-bold text-slate-900">₹{data.revenue.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-500">COGS</p>
              <Receipt className="w-4 h-4 text-red-500" />
            </div>
            <p className="text-xl font-bold text-slate-900">₹{data.cogs.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-500">Shipping</p>
              <Truck className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-xl font-bold text-slate-900">₹{data.shippingCharges.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-500">Gateway</p>
              <CreditCard className="w-4 h-4 text-purple-500" />
            </div>
            <p className="text-xl font-bold text-slate-900">₹{data.gatewayCharges.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-500">Expenses</p>
              <Wallet className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-xl font-bold text-slate-900">₹{data.expenses.toLocaleString()}</p>
          </div>
          <div className={`bg-white rounded-xl border p-4 shadow-sm ${data.netProfit >= 0 ? 'border-green-200' : 'border-red-200'}`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-500">Net Profit</p>
              <TrendingUp className={`w-4 h-4 ${data.netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`} />
            </div>
            <p className={`text-xl font-bold ${data.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>₹{data.netProfit.toLocaleString()}</p>
          </div>
        </div>
      )}
      {data && (
        <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-600">
          <p>Orders: {data.orderCount} | Delivered: {data.deliveredCount} | Net Profit Margin: {data.revenue > 0 ? ((data.netProfit / data.revenue) * 100).toFixed(1) : 0}%</p>
        </div>
      )}
    </div>
  )
}

function VendorLedgerTab() {
  const [ledger, setLedger] = useState(null)

  useEffect(() => {
    api.get('/accounts/vendors/ledger')
      .then(r => setLedger(r.data.data))
      .catch(() => {})
  }, [])

  const columns = [
    { accessorKey: 'name', header: 'Vendor' },
    { accessorKey: 'phone', header: 'Phone' },
    { accessorKey: 'purchaseCount', header: 'Purchases' },
    { accessorKey: 'totalOrdered', header: 'Total Ordered', cell: (info) => `₹${info.getValue().toLocaleString()}` },
    { accessorKey: 'totalPaid', header: 'Total Paid', cell: (info) => `₹${info.getValue().toLocaleString()}` },
    { accessorKey: 'totalDue', header: 'Amount Due', cell: (info) => (
      <span className={info.getValue() > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
        ₹{info.getValue().toLocaleString()}
      </span>
    )}
  ]

  return (
    <div>
      {ledger && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <p className="text-xs text-slate-500">Total Ordered</p>
              <p className="text-xl font-bold text-slate-900">₹{ledger.totals.totalOrdered.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <p className="text-xs text-slate-500">Total Paid</p>
              <p className="text-xl font-bold text-green-600">₹{ledger.totals.totalPaid.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <p className="text-xs text-slate-500">Total Due</p>
              <p className="text-xl font-bold text-red-600">₹{ledger.totals.totalDue.toLocaleString()}</p>
            </div>
          </div>
          <DataTable data={ledger.vendors} columns={columns} />
        </>
      )}
    </div>
  )
}

function ExpensesTab() {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ category: 'Packaging', amount: '', expenseDate: new Date().toISOString().split('T')[0], notes: '' })

  const fetchExpenses = () => {
    api.get('/expenses')
      .then(r => setExpenses(r.data.data || []))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchExpenses() }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    api.post('/expenses', form)
      .then(() => {
        setShowForm(false)
        setForm({ category: 'Packaging', amount: '', expenseDate: new Date().toISOString().split('T')[0], notes: '' })
        fetchExpenses()
      })
      .catch(() => {})
  }

  const columns = [
    { accessorKey: 'category', header: 'Category' },
    { accessorKey: 'amount', header: 'Amount', cell: (info) => `₹${info.getValue().toLocaleString()}` },
    { accessorKey: 'expenseDate', header: 'Date', cell: (info) => new Date(info.getValue()).toLocaleDateString() },
    { accessorKey: 'notes', header: 'Notes' }
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-800">Expenses</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'Add Expense'}
        </button>
      </div>
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                {expenseCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                required
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
              <input
                type="date"
                required
                value={form.expenseDate}
                onChange={(e) => setForm({ ...form, expenseDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
              <input
                type="text"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>
          </div>
          <button type="submit" className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800">
            Save Expense
          </button>
        </form>
      )}
      {loading ? (
        <div className="text-slate-500">Loading expenses...</div>
      ) : (
        <DataTable data={expenses} columns={columns} />
      )}
    </div>
  )
}

function ValuationTab() {
  const [data, setData] = useState(null)

  useEffect(() => {
    api.get('/accounts/inventory/valuation')
      .then(r => setData(r.data.data))
      .catch(() => {})
  }, [])

  const columns = [
    { accessorKey: 'productName', header: 'Product' },
    { accessorKey: 'batchNo', header: 'Batch #' },
    { accessorKey: 'totalMl', header: 'Total ML' },
    { accessorKey: 'wastageMl', header: 'Wastage ML' },
    { accessorKey: 'usableMl', header: 'Usable ML' },
    { accessorKey: 'costPerMl', header: 'Cost/ML', cell: (info) => `₹${info.getValue()}` },
    { accessorKey: 'value', header: 'Value (₹)', cell: (info) => `₹${info.getValue().toLocaleString()}` }
  ]

  return (
    <div>
      {data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">Total Inventory Value</p>
                  <p className="text-2xl font-bold text-slate-900">₹{data.totalValue.toLocaleString()}</p>
                </div>
                <Warehouse className="w-8 h-8 text-indigo-500" />
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">Source Batches</p>
                  <p className="text-2xl font-bold text-slate-900">{data.batches.length}</p>
                </div>
                <Calendar className="w-8 h-8 text-blue-500" />
              </div>
            </div>
          </div>
          <DataTable data={data.batches} columns={columns} />
        </>
      )}
    </div>
  )
}

function RemittancesTab() {
  const [remittances, setRemittances] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/accounts/remittances')
      .then(r => setRemittances(r.data.data || []))
      .finally(() => setLoading(false))
  }, [])

  const columns = [
    { accessorKey: 'orderId', header: 'Order ID', cell: (info) => `ORD-${info.getValue().slice(0, 8).toUpperCase()}` },
    { accessorKey: 'shiprocketSettlementId', header: 'Settlement ID' },
    { accessorKey: 'amount', header: 'Amount (₹)', cell: (info) => `₹${info.getValue().toLocaleString()}` },
    { accessorKey: 'settlementDate', header: 'Settlement Date', cell: (info) => new Date(info.getValue()).toLocaleDateString() },
    { accessorKey: 'status', header: 'Status', cell: (info) => (
      <StatusBadge status={info.getValue()} />
    )}
  ]

  return (
    <div>
      {loading ? (
        <div className="text-slate-500">Loading remittances...</div>
      ) : (
        <DataTable data={remittances} columns={columns} />
      )}
    </div>
  )
}

export default function Accounts() {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Accounts</h1>
      <div className="border-b border-slate-200 mb-6">
        <div className="flex gap-1">
          {tabs.map(tab => (
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
      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'vendors' && <VendorLedgerTab />}
      {activeTab === 'expenses' && <ExpensesTab />}
      {activeTab === 'valuation' && <ValuationTab />}
      {activeTab === 'remittances' && <RemittancesTab />}
    </div>
  )
}
