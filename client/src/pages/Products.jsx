import { useEffect, useState } from 'react'
import api from '../services/api'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import { Plus, X } from 'lucide-react'

export default function Products() {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [form, setForm] = useState({ name: '', description: '', category: '' })

    useEffect(() => {
        api.get('/products')
            .then(r => setProducts(r.data.data || []))
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [])

    const handleSubmit = (e) => {
        e.preventDefault()
        api.post('/products', form)
            .then(() => {
                setShowModal(false)
                setForm({ name: '', description: '', category: '' })
                api.get('/products').then(r => setProducts(r.data.data || []))
            })
            .catch(() => {})
    }

    const columns = [
        { accessorKey: 'name', header: 'Name' },
        { accessorKey: 'category', header: 'Category' },
        { accessorKey: 'shopifyProductId', header: 'Shopify ID' },
        { accessorKey: 'createdAt', header: 'Created', cell: (info) => new Date(info.getValue()).toLocaleDateString() }
    ]

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-slate-800">Products</h1>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800"
                >
                    <Plus className="w-4 h-4" />
                    Add Product
                </button>
            </div>
            <Modal open={showModal} onClose={() => setShowModal(false)} title="Add Product">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                        <input
                            type="text"
                            required
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                        <input
                            type="text"
                            value={form.category}
                            onChange={(e) => setForm({ ...form, category: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                        <textarea
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                            rows="3"
                        />
                    </div>
                    <button type="submit" className="w-full px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800">
                        Save Product
                    </button>
                </form>
            </Modal>
            {loading ? (
                <div className="text-slate-500">Loading products...</div>
            ) : (
                <DataTable data={products} columns={columns} />
            )}
        </div>
    )
}
