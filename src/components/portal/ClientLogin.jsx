import { useState } from 'react'
import { ArrowRight, ChevronLeft, KeyRound, Sparkles } from 'lucide-react'
import { projects as seedProjects } from '../../data/projects'
import { projectStore } from '../../storage'
import brandImage from '../../favIcon.jpg'
import './ClientPortal.css'

export default function ClientLogin({ onLogin, onClose }) {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const demo = projectStore.find(seedProjects[0].id) || seedProjects[0]

  const submit = event => {
    event.preventDefault()
    const project = projectStore.findByAccess(email, code)
    if (!project) {
      setError('That email and access code do not match a project. Check the welcome email from the team, or contact hello@sidequesttech.co.za.')
      return
    }
    onLogin(project.id)
  }

  const fillDemo = () => {
    setEmail(demo.client.email)
    setCode(demo.accessCode)
    setError('')
  }

  return <div className="admin-page section-grid portal-login">
    <div className="admin-login">
      <button className="back-site cursor-target" onClick={onClose}><ChevronLeft /> Back to website</button>
      <button className="logo" onClick={onClose} aria-label="SideQuest Tech home">
        <span className="logo-mark"><img src={brandImage} alt="" /></span>
        <span>SideQuest <span>Tech</span></span>
      </button>
      <div className="login-icon"><KeyRound /></div>
      <div>
        <div className="eyebrow">Client workspace</div>
        <h1>Track your project</h1>
        <p>See where your project stands, what happens next and what we need from you.</p>
      </div>
      <form onSubmit={submit}>
        <label className="field">
          <span>Email address<b> *</b></span>
          <input type="email" name="email" value={email} onChange={event => { setEmail(event.target.value); setError('') }} autoComplete="email" required />
        </label>
        <label className="field">
          <span>Access code<b> *</b></span>
          <input className="code" type="text" name="code" value={code} onChange={event => { setCode(event.target.value); setError('') }} placeholder="From your welcome email" autoComplete="off" spellCheck={false} required />
        </label>
        {error && <div className="form-error">{error}</div>}
        <button className="btn" type="submit">Open my project <ArrowRight /></button>
      </form>
      <button type="button" className="demo-note" onClick={fillDemo}>
        <Sparkles />
        <span>
          <b>Demo access</b>
          <small>Use <code>{demo.client.email}</code> with code <code>{demo.accessCode}</code>. Click to fill it in.</small>
        </span>
      </button>
    </div>
  </div>
}
