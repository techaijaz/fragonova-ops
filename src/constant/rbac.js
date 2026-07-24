export const RBAC_MODULES = [
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
    { key: 'rbac', label: 'Roles & Permissions' },
    { key: 'settings', label: 'Settings' }
]

export const RBAC_ROLES = ['admin', 'manager', 'user']

const all = { canView: true, canCreate: true, canEdit: true, canDelete: true }
const opsFull = { canView: true, canCreate: true, canEdit: true, canDelete: true }
const opsNoDelete = { canView: true, canCreate: true, canEdit: true, canDelete: false }
const viewOnly = { canView: true, canCreate: false, canEdit: false, canDelete: false }
const none = { canView: false, canCreate: false, canEdit: false, canDelete: false }

/** Default matrix used for seed / reset */
export const DEFAULT_ROLE_PERMISSIONS = {
    admin: Object.fromEntries(RBAC_MODULES.map((m) => [m.key, { ...all }])),
    manager: {
        dashboard: { ...viewOnly },
        orders: { ...opsFull },
        products: { ...opsFull },
        inventory: { ...opsFull },
        vendors: { ...none },
        shipping: { ...opsFull },
        expenses: { ...opsFull },
        accounts: { ...none },
        reports: { ...none },
        purchases: { ...none },
        users: { ...none },
        rbac: { ...none },
        settings: { ...viewOnly }
    },
    user: {
        dashboard: { ...viewOnly },
        orders: { ...opsNoDelete },
        products: { ...opsNoDelete },
        inventory: { ...opsNoDelete },
        vendors: { ...none },
        shipping: { ...opsNoDelete },
        expenses: { ...opsNoDelete },
        accounts: { ...none },
        reports: { ...none },
        purchases: { ...none },
        users: { ...none },
        rbac: { ...none },
        settings: { ...viewOnly }
    }
}
