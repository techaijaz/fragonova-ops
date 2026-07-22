import { useAuth } from '../context/AuthContext'

/**
 * Custom hook to check permissions based on user role.
 * Role Hierarchy:
 * - admin: full access to all modules and actions (including delete)
 * - manager: access to operational modules (Products, Inventory, Orders, Shipping, Expenses), can delete operational items. Cannot access Vendors, Accounts, Reports.
 * - user: access to operational modules (Products, Inventory, Orders, Shipping, Expenses), read/write ONLY (no delete permissions). Cannot access Vendors, Accounts, Reports.
 */
export function usePermissions() {
  const { user } = useAuth()
  const role = user?.role || 'user'

  const isAdmin = role === 'admin'
  const isManager = role === 'manager'
  const isUser = role === 'user'

  return {
    role,
    isAdmin,
    isManager,
    isUser,

    // Module access controls
    canAccessVendors: isAdmin,
    canAccessAccounts: isAdmin,
    canAccessReports: isAdmin,
    canAccessPurchases: isAdmin,

    // Operational permissions
    canDelete: isAdmin || isManager,
    canEdit: true, // admin, manager, user can edit operational resources
    canCreate: true // admin, manager, user can create operational resources
  }
}

export default usePermissions
