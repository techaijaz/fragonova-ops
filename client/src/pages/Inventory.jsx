import { useEffect, useState } from 'react'
import api from '../services/api'
import DataTable from '../components/DataTable'
import StatusBadge from '../components/StatusBadge'
import Modal from '../components/Modal'
import { Plus, X } from 'lucide-react'

export default function Inventory() {
    const [batches, setBatches] = useState([])
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [form, setForm] = useState({ sourceBatchId: '', productVariantId: '', qtyProduced: '', mlPerUnit: '', wastageMl: '' })

    const fetchData = () => {
        api.get('/inventory/batches')
            .then(r => setBatches(r.data.data || []))
            .catch(() => {})
        api.get('/products')
            .then(r => setProducts(r.data.data || []))
            .catch(() => {})
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleSubmit = (e) => {
        e.preventDefault()
        api.post('/inventory/sessions', {
            ...form,
            qtyProduced: parseInt(form.qtyProduced),
            mlPerUnit: parseFloat(form.mlPerUnit),
            wastageMl: parseFloat(form.wastageMl || 0)
        })
            .then(() => {
                setShowModal(false)
                setForm({ sourceBatchId: '', productVariantId: '', qtyProduced: '', mlPerUnit: '', wastageMl: '' })
                fetchData()
            })
            .catch(() => {})
    }

    const variants = []
    products.forEach(p => {
        (p.variants || []).forEach(v => {
            variants.push({ id: v.id, label: `${p.name} (${v.sizeMl}ml)` })
        })
    })

    const columns = [
        { accessorKey: 'batchNo', header: 'Batch #' },
        { accessorKey: 'product.name', header: 'Product' },
        { accessorKey: 'totalMl', header: 'Total ML' },
        { accessorKey: 'wastageMl', header: 'Wastage ML' },
        { accessorKey: 'costPerMl', header: 'Cost/ML', cell: (info) => `₹${info.getValue()}` },
        { accessorKey: 'totalCost', header: 'Total Cost', cell: (info) => `₹${info.getValue().toLocaleString()}` },
        { accessorKey: 'vendor.name', header: 'Vendor' },
        { accessorKey: 'purchaseDate', header: 'Date', cell: (info) => new Date(info.getValue()).toLocaleDateString() }
    ]

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-slate-800">Inventory</h1>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800"
                >
                    <Plus className="w-4 h-4" />
                    Log Decant Session
                </button>
            </div>
            <Modal open={showModal} onClose={() => setShowModal(false)} title="Log Decant Session">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Source Batch</label>
                        <select
                            required
                            value={form.sourceBatchId}
                            onChange={(e) => setForm({ ...form, sourceBatchId: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                        >
                            <option value="">Select batch</option>
                            {batches.map(b => (
                                <option key={b.id} value={b.id}>
                                    {b.product.name} - {b.batchNo}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Variant / Size</label>
                        <select
                            required
                            value={form.productVariantId}
                            onChange={(e) => setForm({ ...form, productVariantId: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                        >
                            <option value="">Select variant</option>
                            {variants.map(v => (
                                <option key={v.id} value={v.id}>{v.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Qty Produced</label>
                            <input
                                type="number"
                                required
                                min="1"
                                value={form.qtyProduced}
                                onChange={(e) => setForm({ ...form, qtyProduced: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">ML per Unit</label>
                            <input
                                type="number"
                                required
                                step="0.01"
                                min="0"
                                value={form.mlPerUnit}
                                onChange={(e) => setForm({ ...form, mlPerUnit: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Wastage ML</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={form.wastageMl}
                                onChange={(e) => setForm({ ...form, wastageMl: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                            />
                        </div>
                    </div>
                    <button type="submit" className="w-full px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800">
                        Save Session
                    </button>
                </form>
            </Modal>
            {loading ? (
                <div className="text-slate-500">Loading inventory...</div>
            ) : (
                <DataTable data={batches} columns={columns} />
            )}
        </div>
    )
}
