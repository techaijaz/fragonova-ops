import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Shield } from 'lucide-react'
import api from '../services/api'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import { useAuth } from '../context/AuthContext'
import usePermissions from '../hooks/usePermissions'

const MODULES = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'orders', label: 'Orders' },
  { key: 'products', label: 'Products' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'vendors', label: 'Vendors' },
  { key: 'shipping', label: 'Shipping' },
  { key: 'expenses', label: 'Expenses' },
  { key: 'accounts', label: 'Accounts' },
  { key: 'reports', label: 'Reports' },
  { key: 'purchases', label: 'Purchases' },
  { key: 'users', label: 'User Management' },
  { key: 'settings', label: 'Settings' }
]

const ACTIONS = [
  { key: 'canView', label: 'View' },
  { key: 'canCreate', label: 'Create' },
  { key: 'canEdit', label: 'Edit' },
  { key: 'canDelete', label: 'Delete' }
]

const emptyOverrides = () =>
  Object.fromEntries(
    MODULES.map((m) => [m.key, { canView: false, canCreate: false, canEdit: false, canDelete: false }])
  )

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  password: '',
  role: 'user',
  canManageUsers: false,
  permissionOverrides: emptyOverrides(),
  showSpecial: false
}

export default function Users() {
  const { user: currentUser } = useAuth()
  const { isAdmin } = usePermissions()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const loadUsers = () => {
    setLoading(true)
    api.get('/users')
      .then((r) => setUsers(r.data.data || []))
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to load users'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const mergeOverrides = (raw) => {
    const base = emptyOverrides()
    if (!raw || typeof raw !== 'object') return base
    for (const mod of MODULES) {
      if (raw[mod.key]) {
        base[mod.key] = {
          canView: !!raw[mod.key].canView,
          canCreate: !!raw[mod.key].canCreate,
          canEdit: !!raw[mod.key].canEdit,
          canDelete: !!raw[mod.key].canDelete
        }
      }
    }
    return base
  }

  const openCreate = () => {
    setEditingId(null)
    setForm({ ...emptyForm, permissionOverrides: emptyOverrides() })
    setShowModal(true)
  }

  const openEdit = (row) => {
    const overrides = mergeOverrides(row.permissionOverrides)
    const hasSpecial = Object.values(overrides).some(
      (a) => a.canView || a.canCreate || a.canEdit || a.canDelete
    )
    setEditingId(row.id)
    setForm({
      name: row.name || '',
      email: row.email || '',
      phone: `${row.phoneCountryCode || ''}${row.phoneInternationalNumber || ''}`.replace(/^\+/, '') || '',
      password: '',
      role: row.role || 'user',
      canManageUsers: !!row.canManageUsers,
      permissionOverrides: overrides,
      showSpecial: hasSpecial
    })
    setShowModal(true)
  }

  const toggleOverride = (moduleKey, actionKey) => {
    setForm((prev) => {
      const next = structuredClone(prev.permissionOverrides)
      next[moduleKey][actionKey] = !next[moduleKey][actionKey]
      if (actionKey !== 'canView' && next[moduleKey][actionKey]) {
        next[moduleKey].canView = true
      }
      return { ...prev, permissionOverrides: next }
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setSaving(true)

    const payload = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      role: form.role
    }
    if (isAdmin) {
      payload.canManageUsers = form.canManageUsers
      payload.permissionOverrides = form.showSpecial ? form.permissionOverrides : null
    }
    if (form.password) payload.password = form.password

    const req = editingId
      ? api.put(`/users/${editingId}`, payload)
      : api.post('/users', { ...payload, password: form.password })

    req
      .then(() => {
        toast.success(editingId ? 'User updated' : 'User created')
        setShowModal(false)
        setForm(emptyForm)
        setEditingId(null)
        loadUsers()
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Save failed'))
      .finally(() => setSaving(false))
  }

  const handleDelete = (row) => {
    if (row.id === currentUser?.id) {
      toast.error('You cannot delete your own account')
      return
    }
    if (!window.confirm(`Delete user ${row.email}?`)) return

    api.delete(`/users/${row.id}`)
      .then(() => {
        toast.success('User deleted')
        loadUsers()
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Delete failed'))
  }

  const toggleManageUsers = (row) => {
    if (!isAdmin) return
    const next = !row.canManageUsers
    api.put(`/users/${row.id}`, { canManageUsers: next })
      .then(() => {
        toast.success(next ? 'User credentials permission granted' : 'User credentials permission removed')
        loadUsers()
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to update permission'))
  }

  const specialCount = (row) => {
    const o = row.permissionOverrides
    if (!o || typeof o !== 'object') return 0
    return Object.values(o).filter((a) => a && (a.canView || a.canCreate || a.canEdit || a.canDelete)).length
  }

  const columns = [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'email', header: 'Email' },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: (info) => <span className="capitalize">{info.getValue()}</span>
    },
    {
      id: 'special',
      header: 'Special Perms',
      cell: ({ row }) => {
        const n = specialCount(row.original)
        return n > 0 ? (
          <span className="text-xs font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
            {n} module{n > 1 ? 's' : ''}
          </span>
        ) : (
          <span className="text-slate-400 text-sm">—</span>
        )
      }
    },
    {
      accessorKey: 'canManageUsers',
      header: 'Manage Users',
      cell: ({ row }) => {
        const enabled = !!row.original.canManageUsers
        if (!isAdmin) {
          return <span className="text-sm text-slate-600">{enabled ? 'Yes' : 'No'}</span>
        }
        return (
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              onChange={() => toggleManageUsers(row.original)}
              className="h-4 w-4 rounded border-slate-300"
            />
            <span className="text-sm text-slate-700">{enabled ? 'Allowed' : 'No'}</span>
          </label>
        )
      }
    },
    {
      accessorKey: 'lastLoginAt',
      header: 'Last Login',
      cell: (info) => (info.getValue() ? new Date(info.getValue()).toLocaleString() : '—')
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => openEdit(row.original)}
            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded"
            title="Edit"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleDelete(row.original)}
            className="p-1.5 text-red-600 hover:bg-red-50 rounded"
            title="Delete"
            disabled={row.original.id === currentUser?.id}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Create users and grant special permissions beyond their role
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800"
        >
          <Plus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {isAdmin && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex gap-3">
          <Shield className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-900">Special permissions</p>
            <p className="text-sm text-amber-800 mt-0.5">
              Edit a user and enable <strong>Special permissions</strong> to grant modules
              (e.g. Vendors, Reports) that their role does not normally allow.
            </p>
          </div>
        </div>
      )}

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? 'Edit User' : 'Add User'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
            <input
              type="text"
              required
              minLength={3}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Phone (with country code)</label>
            <input
              type="text"
              required
              placeholder="911234567890"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Password {editingId ? '(leave blank to keep)' : ''}
            </label>
            <input
              type="password"
              required={!editingId}
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              <option value="user">User</option>
              <option value="manager">Manager</option>
              {isAdmin && <option value="admin">Admin</option>}
            </select>
          </div>

          {isAdmin && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-3">
              <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Permissions
              </p>
              <label className="flex items-start gap-2 text-sm text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.canManageUsers}
                  onChange={(e) => setForm({ ...form, canManageUsers: e.target.checked })}
                  className="mt-0.5 rounded border-slate-300"
                />
                <span>
                  <span className="font-medium">Allow user credentials management</span>
                  <span className="block text-slate-500 text-xs mt-0.5">
                    Can open User Management CRUD.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-2 text-sm text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.showSpecial}
                  onChange={(e) => setForm({ ...form, showSpecial: e.target.checked })}
                  className="mt-0.5 rounded border-slate-300"
                />
                <span>
                  <span className="font-medium">Special permissions (override role)</span>
                  <span className="block text-slate-500 text-xs mt-0.5">
                    Grant extra modules beyond what the role normally allows.
                  </span>
                </span>
              </label>

              {form.showSpecial && (
                <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-2 py-2 text-left">Module</th>
                        {ACTIONS.map((a) => (
                          <th key={a.key} className="px-2 py-2 text-center">{a.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {MODULES.map((mod) => (
                        <tr key={mod.key} className="border-t border-slate-100">
                          <td className="px-2 py-1.5 font-medium text-slate-700">{mod.label}</td>
                          {ACTIONS.map((a) => (
                            <td key={a.key} className="px-2 py-1.5 text-center">
                              <input
                                type="checkbox"
                                checked={!!form.permissionOverrides[mod.key]?.[a.key]}
                                onChange={() => toggleOverride(mod.key, a.key)}
                                className="h-3.5 w-3.5 rounded border-slate-300"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-60"
          >
            {saving ? 'Saving...' : editingId ? 'Update User' : 'Create User'}
          </button>
        </form>
      </Modal>

      {loading ? (
        <div className="text-slate-500">Loading users...</div>
      ) : (
        <DataTable data={users} columns={columns} />
      )}
    </div>
  )
}