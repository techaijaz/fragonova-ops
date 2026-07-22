import { useEffect, useState } from 'react'
import api from '../services/api'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import { Plus, X } from 'lucide-react'

export default function Vendors() {
    const [vendors, setVendors] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', notes: '' })

    useEffect(() => {
        api.get('/vendors')
            .then(r => setVendors(r.data.data || []))
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [])

    const handleSubmit = (e) => {
        e.preventDefault()
        api.post('/vendors', form)
            .then(() => {
                setShowModal(false)
                setForm({ name: '', phone: '', email: '', address: '', notes: '' })
                api.get('/vendors').then(r => setVendors(r.data.data || []))
            })
            .catch(() => {})
    }

    const columns = [
        { accessorKey: 'name', header: 'Name' },
        { accessorKey: 'phone', header: 'Phone' },
        { accessorKey: 'email', header: 'Email' },
        { accessorKey: 'address', header: 'Address' },
        { accessorKey: 'createdAt', header: 'Joined', cell: (info) => new Date(info.getValue()).toLocaleDateString() }
    ]

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-slate-800">Vendors</h1>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800"
                >
                    <Plus className="w-4 h-4" />
                    Add Vendor
                </button>
            </div>
            <Modal open={showModal} onClose={() => setShowModal(false)} title="Add Vendor">
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
                        <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                        <input
                            type="text"
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                        <input
                            type="email"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                        <textarea
                            value={form.address}
                            onChange={(e) => setForm({ ...form, address: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                            rows="2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                        <textarea
                            value={form.notes}
                            onChange={(e) => setForm({ ...form, notes: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                            rows="2"
                        />
                    </div>
                    <button type="submit" className="w-full px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800">
                        Save Vendor
                    </button>
                </form>
            </Modal>
            {loading ? (
                <div className="text-slate-500">Loading vendors...</div>
            ) : (
                <DataTable data={vendors} columns={columns} />
            )}
        </div>
    )
}
