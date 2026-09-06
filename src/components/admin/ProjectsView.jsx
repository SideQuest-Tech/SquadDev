import { useEffect, useState } from 'react'
import { FolderKanban, Plus, X } from 'lucide-react'
import { dateLabel, generateAccessCode, makeProject, pendingActions, projectProgress, stageLabel } from '../../data/projects'
import { needOptions } from '../../data'
import { projectStore } from '../../storage'
import { useProjects } from '../../hooks/useProjects'
import ProjectEditor from './ProjectEditor'
import './ProjectEditor.css'

const healthTone = health => health === 'On track' ? 'good' : health === 'At risk' ? 'risk' : 'attention'

function NewProjectForm({ projects, onCreate, onCancel }) {
  const [draft, setDraft] = useState({ name: '', clientName: '', company: '', email: '', service: 'website', targetLaunch: '', accessCode: '' })
  const [error, setError] = useState('')
  const set = (name, value) => { setDraft(current => ({ ...current, [name]: value })); setError('') }
  const suggestedCode = draft.accessCode || generateAccessCode(draft.company || draft.clientName, projects)
  const submit = event => {
    event.preventDefault()
    if (!draft.name.trim() || !draft.clientName.trim() || !/^\S+@\S+\.\S+$/.test(draft.email)) return setError('A project name, client name and a valid sign-in email are needed.')
    if (projects.some(project => project.client.email.toLowerCase() === draft.email.trim().toLowerCase())) return setError('That email already has a project. Each client email signs in to one tracker.')
    onCreate({ ...draft, name: draft.name.trim(), clientName: draft.clientName.trim(), email: draft.email.trim(), accessCode: suggestedCode })
  }
  return <form className="pe-editor pe-new" onSubmit={submit}>
    <header className="pe-editor-head">
      <div><small>New project</small><h2>Start a client tracker</h2><p>The seven stages are laid out for you. Fill in the rest as the project moves.</p></div>
      <button type="button" className="crm-button secondary" onClick={onCancel}><X /> Cancel</button>
    </header>
    <section className="pe-card">
      <div className="pe-grid">
        <label className="pe-field wide"><span>Project name</span><input value={draft.name} onChange={event => set('name', event.target.value)} placeholder="Lumen Logistics operations dashboard" autoFocus /></label>
        <label className="pe-field"><span>Client name</span><input value={draft.clientName} onChange={event => set('clientName', event.target.value)} /></label>
        <label className="pe-field"><span>Company</span><input value={draft.company} onChange={event => set('company', event.target.value)} /></label>
        <label className="pe-field"><span>Sign-in email</span><input type="email" value={draft.email} onChange={event => set('email', event.target.value)} /></label>
        <label className="pe-field"><span>Service</span><select value={draft.service} onChange={event => set('service', event.target.value)}>{needOptions.map(([value, label]) => <option key={value} value={value}>{label.replace('I need ', '').replace('I am ', '')}</option>)}</select></label>
        <label className="pe-field"><span>Launch date</span><input type="date" value={draft.targetLaunch} onChange={event => set('targetLaunch', event.target.value)} /></label>
        <label className="pe-field"><span>Access code<em>Suggested from the company name</em></span><input className="code" value={suggestedCode} onChange={event => set('accessCode', event.target.value.toUpperCase().replace(/\s+/g, ''))} /></label>
      </div>
      {error && <div className="form-error">{error}</div>}
      <div className="pe-actions"><button type="submit" className="crm-button primary"><Plus /> Create project</button></div>
    </section>
  </form>
}

export default function ProjectsView({ selectedId, onSelect, onPreview, onCopy, onToast }) {
  const projects = useProjects()
  const [creating, setCreating] = useState(false)
  const selected = projects.find(project => project.id === selectedId) || null

  useEffect(() => {
    if (!selected && !creating && projects.length) onSelect(projects[0].id)
  }, [selected, creating, projects, onSelect])

  const create = draft => {
    const project = makeProject(draft, projects)
    projectStore.add(project)
    setCreating(false)
    onSelect(project.id)
    onToast('Project created. Copy the invite from the Overview tab.')
  }
  const remove = project => {
    if (!window.confirm(`Delete ${project.name}? The client will no longer be able to sign in to it.`)) return
    projectStore.remove(project.id)
    onSelect('')
    onToast('Project deleted')
  }
  const restore = project => {
    if (!window.confirm('Restore the demo data for this project? Your edits to it will be lost.')) return
    projectStore.restore(project.id)
    onToast('Demo data restored')
  }

  return <div className="pe-layout">
    <aside className="crm-panel pe-list">
      <div className="pe-list-head"><div><h2>All projects</h2><span>{projects.length} tracked</span></div><button type="button" className="crm-button primary" onClick={() => { setCreating(true); onSelect('') }}><Plus /> New</button></div>
      <div className="pe-list-body">
        {projects.map(project => {
          const open = pendingActions(project).length
          return <button type="button" key={project.id} className={`pe-project ${project.id === selectedId && !creating ? 'active' : ''}`} onClick={() => { setCreating(false); onSelect(project.id) }}>
            <span className="pe-project-top"><small>{project.reference}</small><i className={healthTone(project.health)} title={project.health} /></span>
            <strong>{project.name || 'Untitled project'}</strong>
            <span className="pe-project-client">{project.client.company || project.client.name}</span>
            <span className="pe-project-meter"><i style={{ width: `${projectProgress(project)}%` }} /></span>
            <span className="pe-project-meta"><span>{stageLabel(project)}</span>{open > 0 && <b>{open} waiting on client</b>}</span>
            <span className="pe-project-meta muted">Updated {dateLabel(project.lastUpdated)}</span>
          </button>
        })}
        {!projects.length && <div className="pe-empty"><FolderKanban /><strong>No projects yet</strong><span>Create one here or from a request in the drawer.</span></div>}
      </div>
    </aside>
    <div className="pe-main">
      {creating
        ? <NewProjectForm projects={projects} onCreate={create} onCancel={() => { setCreating(false); if (projects.length) onSelect(projects[0].id) }} />
        : selected
          ? <ProjectEditor project={selected} onPreview={onPreview} onCopy={onCopy} onToast={onToast} onDelete={() => remove(selected)} onRestore={projectStore.isSeed(selected.id) ? () => restore(selected) : null} />
          : <div className="crm-panel pe-empty tall"><FolderKanban /><strong>Pick a project</strong><span>Select one on the left, or create a new tracker.</span></div>}
    </div>
  </div>
}
