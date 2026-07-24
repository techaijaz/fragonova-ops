import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, allowedRoles, requireManageUsers }) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="auth-spinner" />
          <p className="text-slate-400 text-sm font-medium animate-pulse">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  const role = String(user?.role || '').toLowerCase()
  const hasUserManageFlag =
    user?.canManageUsers === true ||
    user?.canManageUsers === 1 ||
    user?.canManageUsers === '1'

  if (requireManageUsers) {
    const canManage = role === 'admin' || hasUserManageFlag
    if (!canManage) {
      return <Navigate to="/dashboard" replace />
    }
  } else if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.map((r) => String(r).toLowerCase()).includes(role)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

