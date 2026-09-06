import { useEffect, useState } from 'react'
import { AlertTriangle, Archive, Calendar, ExternalLink, FolderOpen, LogOut, User } from 'lucide-react'
import { useClientAuth } from '../../hooks/useClientAuth'
import { useClickUpTasks } from '../../hooks/useClickUp'
import { clientSessionStore } from '../../storage'
import TaskBoard from './TaskBoard'
import MeetingsTab from './MeetingsTab'
import brandImage from '../../favIcon.jpg'
import './ClientDashboard.css'

const statusClass = s => ({ in_progress: 'in-progress', paused: 'paused', cancelled: 'cancelled', completed: 'completed' }[s] || 'in-progress')
const statusLabel = s => ({ in_progress: 'In progress', paused: 'Paused', cancelled: 'Cancelled', completed: 'Completed' }[s] || s)

function ProfileView({ client }) {
  const [cur, setCur] = useState(''), [next, setNext] = useState(''), [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false), [error, setError] = useState(''), [success, setSuccess] = useState('')

  const save = async e => {
    e.preventDefault()
    setError(''); setSuccess('')
    if (next !== confirm) { setError('New passwords do not match'); return }
    if (next.length < 8) { setError('New password must be at least 8 characters'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${clientSessionStore.getToken()}` },
        body: JSON.stringify({ currentPassword: cur, newPassword: next })
      })
      const data = await res.json()
      if (data.ok) { setSuccess('Password updated successfully.'); setCur(''); setNext(''); setConfirm('') }
      else setError(data.error || 'Failed to update password')
    } catch { setError('Network error. Please try again.') }
    finally { setSaving(false) }
  }

  return <div className="cp-profile">
    <div className="cp-profile-card">
      <h3>Account details</h3>
      <div className="cp-form-group"><label>Name</label><input value={client?.name || ''} disabled /></div>
      <div className="cp-form-group"><label>Company</label><input value={client?.company || ''} disabled /></div>
      <div className="cp-form-group"><label>Email</label><input value={client?.sub || ''} disabled /></div>
    </div>
    <div className="cp-profile-card" style={{ marginTop: '14px' }}>
      <h3>Change password</h3>
      <form onSubmit={save}>
        <div className="cp-form-group"><label>Current password</label><input type="password" value={cur} onChange={e => setCur(e.target.value)} required /></div>
        <div className="cp-form-group"><label>New password</label><input type="password" value={next} onChange={e => setNext(e.target.value)} required minLength={8} /></div>
        <div className="cp-form-group"><label>Confirm new password</label><input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required /></div>
        {error && <div className="cp-form-error">{error}</div>}
        {success && <div className="cp-form-success">{success}</div>}
        <button type="submit" className="cp-save-btn" disabled={saving}>{saving ? 'Saving…' : 'Update password'}</button>
      </form>
    </div>
  </div>
}

export default function ClientDashboard({ setView }) {
  const { client, logout } = useClientAuth(setView)
  const [activeNav, setActiveNav] = useState('projects')
  const [selectedListId, setSelectedListId] = useState(null)
  const [projects, setProjects] = useState([])
  const [projectsLoading, setProjectsLoading] = useState(true)

  // Fetch project list + real statuses from Redis
  useEffect(() => {
    if (!client) return
    
    const fetchProjects = () => {
      fetch('/api/client-projects', {
        headers: { Authorization: `Bearer ${clientSessionStore.getToken()}` }
      })
        .then(r => r.json())
        .then(data => { if (data.ok) setProjects(data.projects) })
        .catch(console.error)
        .finally(() => setProjectsLoading(false))
    }

    fetchProjects()
    
    // Poll for project updates every 60 seconds
    const interval = setInterval(fetchProjects, 60000)
    
    return () => clearInterval(interval)
  }, [client])

  const effectiveListId = selectedListId || projects[0]?.listId
  const selectedProject = projects.find(p => p.listId === effectiveListId) || projects[0]
  const projectStatus = selectedProject?.projectStatus || 'in_progress'
  const pauseReason = selectedProject?.pauseReason
  const isArchived = projectStatus === 'cancelled' || projectStatus === 'completed'

  // Skip ClickUp task fetch for archived projects (list is archived there too)
  const { tasks, loading: tasksLoading, error: tasksError, lastUpdated, refresh: refreshTasks } = useClickUpTasks(isArchived ? null : effectiveListId)

  // After all hooks, handle the null-client case
  if (!client) { logout(); return null }



  return <div className="cp-layout">
    <aside className="cp-sidebar">
      <button className="cp-brand" onClick={() => setView('site')}>
        <img src={brandImage} alt="SideQuest Tech" />
        <span><strong>SideQuest Tech</strong><small>Client portal</small></span>
      </button>

      <div className="cp-client-info">
        <strong>{client.name}</strong>
        <span>{client.company}</span>
      </div>

      <nav className="cp-nav">
        <button className={activeNav === 'projects' ? 'active' : ''} onClick={() => setActiveNav('projects')}>
          <FolderOpen size={15} /> <span>My Projects</span>
        </button>
        <button className={activeNav === 'meetings' ? 'active' : ''} onClick={() => setActiveNav('meetings')}>
          <Calendar size={15} /> <span>Meetings</span>
        </button>
        <button className={activeNav === 'account' ? 'active' : ''} onClick={() => setActiveNav('account')}>
          <User size={15} /> <span>My Account</span>
        </button>
      </nav>

      <div className="cp-sidebar-foot">
        <button onClick={() => setView('site')}><ExternalLink size={14} /> <span>View website</span></button>
        <button onClick={logout}><LogOut size={14} /> <span>Sign out</span></button>
      </div>
    </aside>

    <main className="cp-main">
      <div className="cp-topbar">
        <div>
          <h1 className="cp-page-title">
            {activeNav === 'projects' ? 'My Projects' : activeNav === 'meetings' ? 'Meetings' : 'My Account'}
          </h1>
        </div>

        {(activeNav === 'projects' || activeNav === 'meetings') && !projectsLoading && projects.length > 0 && (
          <div className="cp-project-switcher">
            {projects.length > 1
              ? <select value={effectiveListId || ''} onChange={e => setSelectedListId(e.target.value)}>
                  {projects.map(p => <option key={p.listId} value={p.listId}>{p.listName}</option>)}
                </select>
              : <span style={{ fontSize: '13px', fontWeight: 700, color: '#1a2a3a' }}>{selectedProject?.listName}</span>
            }
            <span className={`cp-status-badge ${statusClass(projectStatus)}`}>{statusLabel(projectStatus)}</span>
          </div>
        )}
      </div>

      {projectsLoading && <div className="cp-loading">Loading projects</div>}

      {!projectsLoading && activeNav === 'projects' && (
        <>
          {projectStatus === 'paused' && (
            <div className="cp-pause-banner">
              <AlertTriangle size={16} />
              <div>
                <strong>Project paused</strong>
                <span>{pauseReason || 'This project is temporarily on hold.'}</span>
              </div>
            </div>
          )}
          {isArchived
            ? <div className="cp-archived-card">
              <Archive size={36} />
              <h3>{statusLabel(projectStatus)}</h3>
              <p>{projectStatus === 'completed'
                ? 'This project has been completed. Thank you for working with us!'
                : 'This project has been cancelled. Please contact us if you have any questions.'}
              </p>
            </div>
            : <TaskBoard tasks={tasks} loading={tasksLoading} error={tasksError} client={client} lastUpdated={lastUpdated} onRefresh={refreshTasks} />
          }
        </>
      )}

      {!projectsLoading && activeNav === 'meetings' && (
        <MeetingsTab clientName={client.name} clientCompany={client.company} />
      )}

      {activeNav === 'account' && <ProfileView client={client} />}
    </main>
  </div>
}
