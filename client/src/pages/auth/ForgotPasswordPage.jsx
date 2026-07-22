import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Mail, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { useForgotPassword } from '../../hooks/useAuth'
import './auth.css'

export default function ForgotPasswordPage() {
  const forgotPassword = useForgotPassword()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    forgotPassword.mutate({ email }, {
      onSuccess: () => {
        setSent(true)
        toast.success('Reset link sent to your email')
      },
      onError: (err) => {
        toast.error(err.response?.data?.message || 'Failed to send reset link')
      }
    })
  }

  if (sent) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo" style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>
              <CheckCircle2 />
            </div>
            <h1>Check your email</h1>
            <p>
              We've sent a password reset link to{' '}
              <strong style={{ color: '#e2e8f0' }}>{email}</strong>.
              The link will expire in 15 minutes.
            </p>
          </div>

          <button
            className="auth-btn"
            style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}
            onClick={() => { setSent(false); setEmail('') }}
          >
            Send another link
          </button>

          <div className="auth-footer">
            <p>
              Remember your password?{' '}
              <Link to="/login">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <Mail />
          </div>
          <h1>Forgot password?</h1>
          <p>Enter your email and we'll send you a reset link</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {forgotPassword.isError && (
            <div className="auth-error">
              <AlertCircle size={16} />
              {forgotPassword.error?.response?.data?.message || 'Something went wrong'}
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="forgot-email">Email address</label>
            <input
              id="forgot-email"
              className="auth-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
            />
          </div>

          <button
            type="submit"
            className={`auth-btn ${forgotPassword.isPending ? 'auth-btn--loading' : ''}`}
            disabled={forgotPassword.isPending}
          >
            Send reset link
          </button>
        </form>

        <div className="auth-footer">
          <p>
            <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
              <ArrowLeft size={14} /> Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
