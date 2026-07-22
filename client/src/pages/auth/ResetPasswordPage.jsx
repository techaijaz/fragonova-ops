import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { KeyRound, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useResetPassword } from '../../hooks/useAuth'
import './auth.css'

export default function ResetPasswordPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const resetPassword = useResetPassword()

  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (form.newPassword !== form.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    resetPassword.mutate(
      { token, newPassword: form.newPassword },
      {
        onSuccess: () => {
          toast.success('Password reset successfully! Please sign in.')
          navigate('/login', { replace: true })
        },
        onError: (err) => {
          toast.error(err.response?.data?.message || 'Failed to reset password')
        }
      }
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <KeyRound />
          </div>
          <h1>Set new password</h1>
          <p>Your new password must be at least 8 characters</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {resetPassword.isError && (
            <div className="auth-error">
              <AlertCircle size={16} />
              {resetPassword.error?.response?.data?.message || 'Reset failed. The link may have expired.'}
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="reset-password">New password</label>
            <div className="auth-password-wrapper">
              <input
                id="reset-password"
                className="auth-input"
                type={showPassword ? 'text' : 'password'}
                name="newPassword"
                placeholder="Min. 8 characters"
                value={form.newPassword}
                onChange={handleChange}
                required
                minLength={8}
                autoComplete="new-password"
                autoFocus
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="reset-confirm">Confirm new password</label>
            <div className="auth-password-wrapper">
              <input
                id="reset-confirm"
                className="auth-input"
                type={showConfirm ? 'text' : 'password'}
                name="confirmPassword"
                placeholder="Re-enter password"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                minLength={8}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowConfirm(!showConfirm)}
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className={`auth-btn ${resetPassword.isPending ? 'auth-btn--loading' : ''}`}
            disabled={resetPassword.isPending}
          >
            Reset password
          </button>
        </form>

        <div className="auth-footer">
          <p>
            <Link to="/login">Back to sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
