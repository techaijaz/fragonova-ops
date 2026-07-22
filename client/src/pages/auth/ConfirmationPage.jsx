import { useEffect } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { useConfirmAccount } from '../../hooks/useAuth'
import './auth.css'

export default function ConfirmationPage() {
  const { token } = useParams()
  const [searchParams] = useSearchParams()
  const code = searchParams.get('code')
  const confirm = useConfirmAccount()

  useEffect(() => {
    if (token && code && !confirm.isSuccess && !confirm.isError && !confirm.isPending) {
      confirm.mutate({ token, code })
    }
  }, [token, code]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          {confirm.isPending && (
            <>
              <div className="auth-logo" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                <Loader2 className="animate-spin" />
              </div>
              <h1>Confirming your account...</h1>
              <p>Please wait while we verify your email address.</p>
            </>
          )}

          {confirm.isSuccess && (
            <>
              <div className="auth-logo" style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>
                <CheckCircle2 />
              </div>
              <h1>Account confirmed!</h1>
              <p>Your email has been verified. You can now sign in to your account.</p>
            </>
          )}

          {confirm.isError && (
            <>
              <div className="auth-logo" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
                <XCircle />
              </div>
              <h1>Confirmation failed</h1>
              <p>
                {confirm.error?.response?.data?.message ||
                  'The confirmation link is invalid or has already been used.'}
              </p>
            </>
          )}
        </div>

        {!confirm.isPending && (
          <Link to="/login" className="auth-btn" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
            Go to sign in
          </Link>
        )}
      </div>
    </div>
  )
}
