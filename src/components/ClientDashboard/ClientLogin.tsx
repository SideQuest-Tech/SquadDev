import React, { useState } from 'react'
import { ArrowRight, ChevronLeft, LockKeyhole } from 'lucide-react'
import { clientSessionStore } from '../../storage'
import brandImage from '../../favIcon.jpg'
import '../../styles.css'

interface FieldProps {
  label: string
  name: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  type?: string
  required?: boolean
}

function Field({ label, name, value, onChange, type = 'text', required }: FieldProps): React.ReactElement {
  return <div className="form-group">
    <label htmlFor={name}>{label}</label>
    <input id={name} name={name} type={type} value={value} onChange={onChange} required={required} autoComplete={name} />
  </div>
}

interface ClientLoginProps {
  setView: (view: string) => void
}

export default function ClientLogin({ setView }: ClientLoginProps): React.ReactElement {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mustChange, setMustChange] = useState(false)
  const [pendingToken, setPendingToken] = useState<string | null>(null)

  const login = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/client-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password })
      })
      const data = await res.json()
      if (!data.ok) { setError(data.error || 'Login failed'); return }

      if (data.client.mustChangePassword) {
        setPendingToken(data.token)
        setMustChange(true)
      } else {
        clientSessionStore.setToken(data.token)
        setView('client-dashboard')
      }
    } catch { setError('Network error. Please try again.') }
    finally { setLoading(false) }
  }

  const changePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return }
    if (newPassword.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${pendingToken}` },
        body: JSON.stringify({ currentPassword: password, newPassword })
      })
      const data = await res.json()
      if (!data.ok) { setError(data.error || 'Failed to update password'); return }
      clientSessionStore.setToken(pendingToken!)
      setView('client-dashboard')
    } catch { setError('Network error. Please try again.') }
    finally { setLoading(false) }
  }

  return <div className="admin-page section-grid">
    <div className="admin-login">
      <button className="back-site cursor-target" onClick={() => setView('site')}>
        <ChevronLeft /> Back to website
      </button>

      <button className="logo cursor-target" onClick={() => setView('site')} aria-label="SideQuest Tech home">
        <span className="logo-mark"><img src={brandImage} alt="" /></span>
        <span>SideQuest <span>Tech</span></span>
      </button>

      <div className="login-icon"><LockKeyhole /></div>

      <div>
        <div className="eyebrow">Client portal</div>
        <h1>{mustChange ? 'Set your password' : 'Welcome back'}</h1>
        <p>{mustChange
          ? 'This is your first login. Please set a new password before continuing.'
          : 'Sign in to view your project updates, chat, and meetings.'
        }</p>
      </div>

      {!mustChange
        ? <form onSubmit={login}>
          <Field label="Email address" name="email" value={email} onChange={e => { setEmail(e.target.value); setError('') }} type="email" required />
          <Field label="Password" name="password" value={password} onChange={e => { setPassword(e.target.value); setError('') }} type="password" required />
          {error && <div className="form-error">{error}</div>}
          <button className="btn cursor-target" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : <><span>Sign in</span> <ArrowRight /></>}
          </button>
        </form>
        : <form onSubmit={changePassword}>
          <Field label="New password" name="newPassword" value={newPassword} onChange={e => { setNewPassword(e.target.value); setError('') }} type="password" required />
          <Field label="Confirm new password" name="confirmPassword" value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); setError('') }} type="password" required />
          {error && <div className="form-error">{error}</div>}
          <button className="btn cursor-target" type="submit" disabled={loading}>
            {loading ? 'Saving…' : <><span>Set password & continue</span> <ArrowRight /></>}
          </button>
        </form>
      }
    </div>
  </div>
}
