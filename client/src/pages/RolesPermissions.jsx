import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Shield, RotateCcw, Save } from 'lucide-react'
import api from '../services/api'

const ACTIONS = [
  { key: 'canView', label: 'View' },
  { key: 'canCreate', label: 'Create' },
  { key: 'canEdit', label: 'Edit' },
  { key: 'canDelete', label: 'Delete' }
]

export default function RolesPermissions() {
  const [roles, setRoles] = useState([])
  const [modules, setModules] = useState([])
  const [matrix, setMatrix] = useState(null)
  const [activeRole, setActiveRole] = useState('admin')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    api.get('/rbac/matrix')
      .then((r) => {
        const data = r.data.data
        setRoles(data.roles || [])
        setModules(data.modules || [])
        setMatrix(data.matrix || {})
        if (data.roles?.length && !data.roles.includes(activeRole)) {
          setActiveRole(data.roles[0])
        }
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to load RBAC matrix'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const toggle = (moduleKey, actionKey) => {
    setMatrix((prev) => {
      const next = structuredClone(prev)
      if (!next[activeRole]) next[activeRole] = {}
      if (!next[activeRole][moduleKey]) {
        next[activeRole][moduleKey] = {
          canView: false,
          canCreate: false,
          canEdit: false,
          canDelete: false
        }
      }
      next[activeRole][moduleKey][actionKey] = !next[activeRole][moduleKey][actionKey]
      // Creating/editing/deleting implies view
      if (actionKey !== 'canView' && next[activeRole][moduleKey][actionKey]) {
        next[activeRole][moduleKey].canView = true
      }
      return next
    })
  }

  const handleSave = () => {
    setSaving(true)
    api.put('/rbac/matrix', { matrix })
      .then((r) => {
        setMatrix(r.data.data.matrix)
        toast.success('Permissions saved')
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Save failed'))
      .finally(() => setSaving(false))
  }

  const handleReset = () => {
    if (!window.confirm('Reset all roles to default permissions?')) return
    setSaving(true)
    api.post('/rbac/matrix/reset')
      .then((r) => {
        setMatrix(r.data.data.matrix)
        toast.success('Permissions reset to defaults')
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Reset failed'))
      .finally(() => setSaving(false))
  }

  if (loading || !matrix) {
    return <div className="text-slate-500">Loading roles & permissions...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Shield className="w-7 h-7 text-indigo-600" />
            Roles & Permissions
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage RBAC matrix for each role. Changes apply after users re-login / refresh.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleReset}
            disabled={saving}
            className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50 disabled:opacity-60"
          >
            <RotateCcw className="w-4 h-4" />
            Reset defaults
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save permissions'}
          </button>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        {roles.map((role) => (
          <button
            key={role}
            type="button"
            onClick={() => setActiveRole(role)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition-colors ${
              activeRole === role
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {role}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Module</th>
              {ACTIONS.map((a) => (
                <th key={a.key} className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">
                  {a.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {modules.map((mod) => {
              const perms = matrix[activeRole]?.[mod.key] || {
                canView: false,
                canCreate: false,
                canEdit: false,
                canDelete: false
              }
              return (
                <tr key={mod.key} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-800">{mod.label}</td>
                  {ACTIONS.map((a) => (
                    <td key={a.key} className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={!!perms[a.key]}
                        onChange={() => toggle(mod.key, a.key)}
                        className="h-4 w-4 rounded border-slate-300"
                        disabled={activeRole === 'admin' && mod.key === 'rbac'}
                        title={
                          activeRole === 'admin' && mod.key === 'rbac'
                            ? 'Admin always keeps Roles & Permissions access'
                            : undefined
                        }
                      />
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
