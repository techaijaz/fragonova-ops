import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { UserPlus, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useRegister } from '../../hooks/useAuth'
import './auth.css'

export default function SignupPage() {
  const register = useRegister()

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    consent: false
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    const { confirmPassword, ...payload } = form
    
    if (payload.phone && payload.phone.startsWith('+')) {
      payload.phone = payload.phone.substring(1)
    }
    
    register.mutate(payload, {
      onSuccess: () => {
        setSuccess(true)
        toast.success('Account created! Check your email to confirm.')
      },
      onError: (err) => {
        toast.error(err.response?.data?.message || 'Registration failed. Please try again.')
      }
    })
  }

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo" style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>
              <CheckCircle2 />
            </div>
            <h1>Check your email</h1>
            <p>
              We've sent a confirmation link to <strong style={{ color: '#e2e8f0' }}>{form.email}</strong>.
              Click the link to activate your account.
            </p>
          </div>
          <div className="auth-footer">
            <p>
              Already confirmed?{' '}
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
            <UserPlus />
          </div>
          <h1>Create your account</h1>
          <p>Get started with PerfumeOps</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {register.isError && (
            <div className="auth-error">
              <AlertCircle size={16} />
              {register.error?.response?.data?.message || 'Registration failed'}
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="signup-name">Full name</label>
            <input
              id="signup-name"
              className="auth-input"
              type="text"
              name="name"
              placeholder="John Doe"
              value={form.name}
              onChange={handleChange}
              required
              minLength={3}
              autoComplete="name"
              autoFocus
            />
          </div>

          <div className="auth-field">
            <label htmlFor="signup-email">Email address</label>
            <input
              id="signup-email"
              className="auth-input"
              type="email"
              name="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="signup-phone">Phone number</label>
            <input
              id="signup-phone"
              className="auth-input"
              type="tel"
              name="phone"
              placeholder="919876543210 (with country code, no +)"
              value={form.phone}
              onChange={handleChange}
              required
              minLength={4}
              maxLength={20}
              autoComplete="tel"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="signup-password">Password</label>
            <div className="auth-password-wrapper">
              <input
                id="signup-password"
                className="auth-input"
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Min. 8 characters"
                value={form.password}
                onChange={handleChange}
                required
                minLength={8}
                autoComplete="new-password"
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
            <label htmlFor="signup-confirm">Confirm password</label>
            <div className="auth-password-wrapper">
              <input
                id="signup-confirm"
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

          <div className="auth-checkbox-row">
            <input
              id="signup-consent"
              className="auth-checkbox"
              type="checkbox"
              name="consent"
              checked={form.consent}
              onChange={handleChange}
              required
            />
            <label htmlFor="signup-consent">
              I agree to the Terms of Service and Privacy Policy
            </label>
          </div>

          <button
            type="submit"
            className={`auth-btn ${register.isPending ? 'auth-btn--loading' : ''}`}
            disabled={register.isPending}
          >
            Create account
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
