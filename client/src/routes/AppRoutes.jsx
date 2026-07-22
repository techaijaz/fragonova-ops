import { Routes, Route, Navigate } from 'react-router-dom'
import PageLayout from '../components/PageLayout'
import ProtectedRoute from '../components/ProtectedRoute'
import GuestRoute from '../components/GuestRoute'

// Auth pages (public / guest-only)
import LoginPage from '../pages/auth/LoginPage'
import SignupPage from '../pages/auth/SignupPage'
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage'
import ResetPasswordPage from '../pages/auth/ResetPasswordPage'
import ConfirmationPage from '../pages/auth/ConfirmationPage'

// Protected pages
import Dashboard from '../pages/Dashboard'
import Orders from '../pages/Orders'
import Products from '../pages/Products'
import Inventory from '../pages/Inventory'
import Vendors from '../pages/Vendors'
import Shipping from '../pages/Shipping'
import Accounts from '../pages/Accounts'
import Reports from '../pages/Reports'
import ChangePasswordPage from '../pages/auth/ChangePasswordPage'
import Settings from '../pages/Settings'

export default function AppRoutes() {
  return (
    <Routes>
      {/* ── Guest-only routes (redirect to dashboard if logged in) ── */}
      <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/signup" element={<GuestRoute><SignupPage /></GuestRoute>} />
      <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
      <Route path="/reset-password/:token" element={<GuestRoute><ResetPasswordPage /></GuestRoute>} />

      {/* ── Public route (email confirmation) ── */}
      <Route path="/confirmation/:token" element={<ConfirmationPage />} />

      {/* ── Protected routes (redirect to login if not authenticated) ── */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <PageLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="orders" element={<Orders />} />
        <Route path="products" element={<Products />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="vendors" element={<ProtectedRoute allowedRoles={['admin']}><Vendors /></ProtectedRoute>} />
        <Route path="shipping" element={<Shipping />} />
        <Route path="accounts" element={<ProtectedRoute allowedRoles={['admin']}><Accounts /></ProtectedRoute>} />
        <Route path="reports" element={<ProtectedRoute allowedRoles={['admin']}><Reports /></ProtectedRoute>} />
        <Route path="settings" element={<Settings />} />
        <Route path="change-password" element={<ChangePasswordPage />} />
      </Route>

      {/* ── Catch-all ── */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
