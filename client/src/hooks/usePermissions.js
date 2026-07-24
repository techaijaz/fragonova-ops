import { useAuth } from '../context/AuthContext'

const truthy = (value) => value === true || value === 1 || value === '1' || value === 'true'

/** Fallback when self-identification has not returned RBAC matrix yet */
const FALLBACK = {
  admin: null, // admin bypasses checks
  manager: {
    dashboard: { canView: true },
    orders: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    products: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    inventory: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    shipping: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    expenses: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    settings: { canView: true }
  },
  user: {
    dashboard: { canView: true },
    orders: { canView: true, canCreate: true, canEdit: true },
    products: { canView: true, canCreate: true, canEdit: true },
    inventory: { canView: true, canCreate: true, canEdit: true },
    shipping: { canView: true, canCreate: true, canEdit: true },
    expenses: { canView: true, canCreate: true, canEdit: true },
    settings: { canView: true }
  }
}

/**
 * Permissions come from RBAC matrix on the user object (self-identification),
 * with admin / canManageUsers fallbacks.
 */
export function usePermissions() {
  const { user } = useAuth()
  const role = String(user?.role || 'user').toLowerCase()
  const hasServerPerms = user?.permissions && Object.keys(user.permissions).length > 0
  const permissions = hasServerPerms ? user.permissions : (FALLBACK[role] || FALLBACK.user)

  const isAdmin = role === 'admin'
  const isManager = role === 'manager'
  const isUser = role === 'user'
  const canManageUsersFlag = truthy(user?.canManageUsers)

  const can = (moduleKey, action = 'canView') => {
    if (isAdmin) return true
    if (moduleKey === 'users' && canManageUsersFlag) return true
    if (moduleKey === 'rbac') return false
    return !!permissions?.[moduleKey]?.[action]
  }

  const canManageUsers = isAdmin || canManageUsersFlag || can('users', 'canView')
  const canManageRbac = isAdmin || can('rbac', 'canView')

  return {
    role,
    isAdmin,
    isManager,
    isUser,
    permissions,
    can,
    canManageUsers,
    canManageRbac,

    canAccessVendors: can('vendors', 'canView'),
    canAccessAccounts: can('accounts', 'canView'),
    canAccessReports: can('reports', 'canView'),
    canAccessPurchases: can('purchases', 'canView'),
    canAccessUsers: canManageUsers,

    canDelete: isAdmin || isManager || can('orders', 'canDelete'),
    canEdit: true,
    canCreate: true
  }
}

export default usePermissions
