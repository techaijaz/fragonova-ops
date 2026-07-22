import { useState } from 'react'
import { toast } from 'sonner'
import { KeyRound, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useChangePassword } from '../../hooks/useAuth'

export default function ChangePasswordPage() {
  const changePassword = useChangePassword()

  const [form, setForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
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

    changePassword.mutate(
      { oldPassword: form.oldPassword, newPassword: form.newPassword },
      {
        onSuccess: () => {
          toast.success('Password changed successfully!')
          setForm({ oldPassword: '', newPassword: '', confirmPassword: '' })
        },
        onError: (err) => {
          toast.error(err.response?.data?.message || 'Failed to change password')
        }
      }
    )
  }

  return (
    <div style={{ maxWidth: '520px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <KeyRound className="w-6 h-6 text-indigo-500" />
          Change Password
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Update your account password. You'll need your current password.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          background: 'white',
          padding: '2rem',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
        }}
      >
        {changePassword.isError && (
          <div className="auth-error" style={{ background: 'rgba(239,68,68,0.06)', color: '#ef4444' }}>
            <AlertCircle size={16} />
            {changePassword.error?.response?.data?.message || 'Failed to change password'}
          </div>
        )}

        {changePassword.isSuccess && (
          <div className="auth-success" style={{ background: 'rgba(34,197,94,0.06)', color: '#16a34a' }}>
            <CheckCircle2 size={16} />
            Password updated successfully
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label htmlFor="change-old" className="text-sm font-medium text-slate-700">Current password</label>
          <div style={{ position: 'relative' }}>
            <input
              id="change-old"
              type={showOld ? 'text' : 'password'}
              name="oldPassword"
              placeholder="Enter current password"
              value={form.oldPassword}
              onChange={handleChange}
              required
              minLength={8}
              autoComplete="current-password"
              style={{
                width: '100%',
                padding: '0.75rem 2.75rem 0.75rem 1rem',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                fontSize: '0.9375rem',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
            />
            <button
              type="button"
              onClick={() => setShowOld(!showOld)}
              tabIndex={-1}
              style={{
                position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px', display: 'flex'
              }}
            >
              {showOld ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label htmlFor="change-new" className="text-sm font-medium text-slate-700">New password</label>
          <div style={{ position: 'relative' }}>
            <input
              id="change-new"
              type={showNew ? 'text' : 'password'}
              name="newPassword"
              placeholder="Min. 8 characters"
              value={form.newPassword}
              onChange={handleChange}
              required
              minLength={8}
              autoComplete="new-password"
              style={{
                width: '100%',
                padding: '0.75rem 2.75rem 0.75rem 1rem',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                fontSize: '0.9375rem',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              tabIndex={-1}
              style={{
                position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px', display: 'flex'
              }}
            >
              {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label htmlFor="change-confirm" className="text-sm font-medium text-slate-700">Confirm new password</label>
          <div style={{ position: 'relative' }}>
            <input
              id="change-confirm"
              type={showConfirm ? 'text' : 'password'}
              name="confirmPassword"
              placeholder="Re-enter new password"
              value={form.confirmPassword}
              onChange={handleChange}
              required
              minLength={8}
              autoComplete="new-password"
              style={{
                width: '100%',
                padding: '0.75rem 2.75rem 0.75rem 1rem',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                fontSize: '0.9375rem',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              tabIndex={-1}
              style={{
                position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px', display: 'flex'
              }}
            >
              {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={changePassword.isPending}
          style={{
            width: '100%',
            padding: '0.8125rem 1.5rem',
            background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
            color: 'white',
            fontSize: '0.9375rem',
            fontWeight: 600,
            border: 'none',
            borderRadius: '10px',
            cursor: changePassword.isPending ? 'not-allowed' : 'pointer',
            opacity: changePassword.isPending ? 0.6 : 1,
            transition: 'all 0.25s ease',
            marginTop: '0.5rem'
          }}
        >
          {changePassword.isPending ? 'Updating...' : 'Update password'}
        </button>
      </form>
    </div>
  )
}
