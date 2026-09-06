import { useEffect, useMemo, useState } from 'react'
import {
  Activity, ArrowRight, Check, ChevronDown, ChevronLeft, ChevronRight, CircleAlert, CircleCheck,
  ClipboardCheck, ExternalLink, Flag, LayoutDashboard, ListChecks, LogOut, Mail, PackageCheck, Rocket
} from 'lucide-react'
import {
  activeStage, activeStages, dateLabel, daysUntil, pendingActions, projectProgress, projectStages,
  shortDate, stageLabel, stageShare, stageTasks
} from '../../data/projects'
import { projectStore } from '../../storage'
import { useProject } from '../../hooks/useProjects'
import brandImage from '../../favIcon.jpg'
import './ClientPortal.css'

const SUPPORT_EMAIL = 'hello@sidequesttech.co.za'

const feedTypes = [
  ['all', 'All'], ['milestone', 'Milestones'], ['update', 'Updates'], ['decision', 'Decisions'], ['needs-you', 'Needs you']
]
const typeLabel = { milestone: 'Milestone', update: 'Update', decision: 'Decision', 'needs-you': 'Needs you' }
const typeIcon = { milestone: Flag, update: Activity, decision: ClipboardCheck, 'needs-you': CircleAlert }

const badgeClass = status => ({
  'Approved': 'approved', 'Complete': 'complete', 'Awaiting your approval': 'awaiting', 'In review': 'review',
  'In progress': 'progress', 'Scheduled': 'scheduled', 'On hold': 'hold', 'Paid': 'paid'
})[status] || (String(status).startsWith('Due') ? 'due' : '')

export const initialsOf = name => {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  return (parts.length > 1 ? parts.map(part => part[0]).join('') : parts[0].slice(0, 2)).slice(0, 2).toUpperCase()
}

const messageLink = (project, subject) => `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`[${project.reference}] ${subject}`)}`

function Brand({ onClick }) {
  return <button className="pt-brand" onClick={onClick} aria-label="View SideQuest Tech website">
    <img src={brandImage} alt="" />
    <span><strong>SideQuest Tech</strong><small>Client workspace</small></span>
  </button>
}

function Avatar({ name, size = '' }) {
  return <span className={`pt-avatar ${size}`} aria-hidden="true">{initialsOf(name)}</span>
}

function Panel({ title, note, action, children, className = '' }) {
  return <section className={`pt-panel ${className}`}>
    <div className="pt-panel-head"><div><h2>{title}</h2>{note && <p>{note}</p>}</div>{action}</div>
    <div className="pt-panel-body">{children}</div>
  </section>
}

function StatusBadge({ value }) {
  const tone = badgeClass(value)
  const showCheck = ['approved', 'complete', 'paid'].includes(tone)
  return <span className={`pt-badge ${tone}`}>{showCheck && <Check />}{value}</span>
}

function DueChip({ action }) {
  if (action.done) return <span className="pt-due soft">Done</span>
  if (!action.due) return <span className="pt-due soft">{action.optional ? 'Optional' : 'No date'}</span>
  const days = daysUntil(action.due)
  if (days < 0) return <span className="pt-due late">Overdue</span>
  if (days === 0) return <span className="pt-due">Due today</span>
  if (days === 1) return <span className="pt-due">Due tomorrow</span>
  return <span className="pt-due">Due {shortDate(action.due)}</span>
}

function LaunchCountdown({ project }) {
  const launch = projectStages(project).find(stage => stage.id === 'launch')
  if (launch?.status === 'complete') return <span>Live since <b>{dateLabel(launch.completedAt)}</b></span>
  const days = daysUntil(project.targetLaunch)
  if (days === null) return <span>Launch date <b>to be confirmed</b></span>
  if (days > 1) return <span><b>{days} days</b> to launch on {dateLabel(project.targetLaunch)}</span>
  if (days === 1) return <span>Launch is <b>tomorrow</b></span>
  if (days === 0) return <span>Launch is <b>today</b></span>
  return <span>Launch date <b>{dateLabel(project.targetLaunch)}</b></span>
}

function StageRail({ project }) {
  const stages = projectStages(project)
  const current = activeStages(project)
  const furthest = activeStage(project)
  const progress = projectProgress(project)
  const completeCount = stages.filter(stage => stage.status === 'complete').length

  // The connector runs from the centre of the first node to the centre of the last one,
  // and fills up to the furthest stage that is in progress.
  const span = 100 - 100 / stages.length
  const reach = current.length ? furthest.index : Math.max(0, completeCount - 1)
  const railWidth = stages.length > 1 ? (reach / (stages.length - 1)) * span : 0

  const nodeDate = stage => {
    if (stage.status === 'complete') return shortDate(stage.completedAt) || 'Done'
    if (stage.status === 'active') return 'In progress'
    return stage.plannedFrom ? `From ${shortDate(stage.plannedFrom)}` : 'Up next'
  }

  return <section className="pt-stages" aria-label="Project stages">
    <div className="pt-track">
      <i style={{ width: `${railWidth}%` }} aria-hidden="true" />
      {stages.map(stage => {
        const Icon = stage.icon
        return <div className={`pt-node ${stage.status}`} key={stage.id} aria-current={stage.status === 'active' ? 'step' : undefined}>
          <span>{stage.status === 'complete' ? <Check /> : <Icon />}</span>
          <b>{stage.name}</b>
          <small>{nodeDate(stage)}</small>
        </div>
      })}
    </div>
    <div className="pt-progress">
      <div>
        <div className="pt-segments" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Overall progress">
          {stages.map(stage => <i key={stage.id} className={stage.status} style={stage.status === 'active' ? { '--fill': `${Math.round(stageShare(stage) * 100)}%` } : undefined} />)}
        </div>
        <div className="pt-progress-copy">
          <strong>{progress}% complete</strong>
          <span>{stageLabel(project)}</span>
        </div>
      </div>
      <div className="pt-progress-meta">
        <div>Started<b>{dateLabel(project.startedAt)}</b></div>
        <div>Launch<b>{dateLabel(project.targetLaunch)}</b></div>
        <div>Last update<b>{dateLabel(project.lastUpdated)}</b></div>
      </div>
    </div>
  </section>
}

function TaskList({ stage }) {
  const tasks = stageTasks(stage)
  if (!tasks.length) return <p className="pt-tasks-summary">The steps for this stage will appear here once they are planned.</p>
  return <ul className="pt-tasks">
    {tasks.map((task, index) => <li key={`${index}-${task.label}`} className={task.done ? 'done' : ''}>
      <span>{task.done && <Check />}</span>{task.label}
    </li>)}
  </ul>
}

function ActionItems({ project, onToggle, onNavigate }) {
  const pending = pendingActions(project)
  return <>
    {pending.length === 0 && <div className="pt-all-clear"><CircleCheck /><strong>Nothing waiting on you</strong>We will let you know here when something needs your input.</div>}
    {project.actions.map(action => <div className={`pt-action ${action.done ? 'done' : ''}`} key={action.id}>
      <button className={`pt-check ${action.done ? 'on' : ''}`} role="checkbox" aria-checked={Boolean(action.done)} aria-label={`${action.done ? 'Reopen' : 'Mark done'}: ${action.title}`} onClick={() => onToggle(action.id)}>{action.done && <Check />}</button>
      <div>
        <strong>{action.title}</strong>
        <p>{action.detail}</p>
        {action.deliverableId && !action.done && <button className="link" onClick={() => onNavigate('deliverables')}>Go to deliverables <ChevronRight /></button>}
      </div>
      <DueChip action={action} />
    </div>)}
    {project.actions.length > 0 && <p className="pt-local-note">Ticks and approvals are saved to your project, and the team confirms them in the Friday update.</p>}
  </>
}

function FeedEntry({ entry, compact = false }) {
  const Icon = typeIcon[entry.type] || Activity
  return <li className={`pt-entry ${entry.type} ${compact ? 'compact' : ''}`}>
    <i aria-hidden="true" />
    <div className="pt-entry-meta"><time dateTime={entry.date}>{dateLabel(entry.date)}</time><span className={`pt-type ${entry.type}`}>{typeLabel[entry.type] || 'Update'}</span></div>
    <h3>{entry.title}</h3>
    <p>{entry.body}</p>
    {!compact && <div className="pt-entry-by"><Avatar name={entry.author} size="mini" /> {entry.author}, SideQuest Tech <Icon aria-hidden="true" /></div>}
  </li>
}

function HappeningNow({ project }) {
  const current = activeStages(project)
  const stages = current.length ? current : [activeStage(project)]
  return <>
    {stages.map(stage => {
      const tasks = stageTasks(stage)
      const done = tasks.filter(task => task.done).length
      return <div className="pt-now-block" key={stage.id}>
        <div className="pt-eyebrow"><i /> Stage {stage.index + 1} of {project.stages.length}: {stage.name}</div>
        <h3>{stage.summary || stage.blurb}</h3>
        {stage.note && <p className="pt-stage-note">{stage.note}</p>}
        <TaskList stage={stage} />
        {tasks.length > 0 && <div className="pt-tasks-summary">{done} of {tasks.length} items in this stage are done.</div>}
      </div>
    })}
  </>
}

function OverviewView({ project, onToggleAction, onNavigate }) {
  const current = activeStages(project)
  const pending = pendingActions(project).length
  const nowNote = current.length ? `${current.map(stage => stage.name).join(' and ')} in progress` : `${activeStage(project).name} up next`

  return <div className="pt-grid">
    <div className="pt-col">
      <Panel className="pt-now pt-p-now" title="Happening now" note={nowNote}>
        <HappeningNow project={project} />
      </Panel>
      <Panel className="pt-p-updates" title="Recent updates" note="What the team has shipped and decided" action={<button onClick={() => onNavigate('updates')}>All updates <ChevronRight /></button>}>
        {project.updates.length
          ? <ul className="pt-feed">{project.updates.slice(0, 3).map(entry => <FeedEntry key={entry.id} entry={entry} compact />)}</ul>
          : <p className="pt-tasks-summary">No updates posted yet.</p>}
      </Panel>
      {project.numbers?.length > 0 && <Panel className="pt-p-numbers" title="By the numbers" note="A few facts from the work so far">
        <div className="pt-numbers">{project.numbers.map(item => <div key={item.label}><strong>{item.value}</strong><small>{item.label}</small></div>)}</div>
      </Panel>}
    </div>
    <div className="pt-col">
      <Panel className="pt-p-actions" title="Waiting on you" note={pending ? `${pending} item${pending === 1 ? '' : 's'} need your input` : 'All clear'}>
        <ActionItems project={project} onToggle={onToggleAction} onNavigate={onNavigate} />
      </Panel>
      {project.keyDates?.length > 0 && <Panel className="pt-p-dates" title="Key dates" note="Confirmed and target dates">
        <ul className="pt-dates">{project.keyDates.map((item, index) => {
          const past = daysUntil(item.date) < 0
          return <li key={`${index}-${item.label}`} className={item.highlight ? 'highlight' : past ? 'past' : ''}>
            <time dateTime={item.date}>{shortDate(item.date) || 'TBC'}</time>
            <div><strong>{item.label}</strong>{item.note && <small>{item.note}</small>}</div>
          </li>
        })}</ul>
      </Panel>}
      <Panel className="pt-p-team" title="Your team" note="The engineers on this project">
        <div className="pt-team">{project.team.map(member => <div key={member.name}>
          <Avatar name={member.name} size="large" />
          <div><strong>{member.name}</strong><small>{member.role}</small></div>
        </div>)}</div>
        {project.cadence && <p className="pt-cadence">{project.cadence}</p>}
      </Panel>
      {project.links?.length > 0 && <Panel className="pt-p-links" title="Links" note="Where the work lives">
        <div className="pt-links">{project.links.map(link => <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer">
          <div><strong>{link.label}</strong><small>{link.note}</small></div><ExternalLink />
        </a>)}</div>
      </Panel>}
    </div>
  </div>
}

function StagesView({ project }) {
  const stages = projectStages(project)
  const [open, setOpen] = useState(() => new Set((activeStages(project).length ? activeStages(project) : [activeStage(project)]).map(stage => stage.id)))
  const toggle = id => setOpen(current => {
    const next = new Set(current)
    if (next.has(id)) next.delete(id); else next.add(id)
    return next
  })

  const dates = stage => {
    if (stage.status === 'complete') return <><b>Completed</b>{stage.startedAt ? `${shortDate(stage.startedAt)} to ` : ''}{dateLabel(stage.completedAt)}</>
    if (stage.status === 'active') return <><b>In progress</b>Started {dateLabel(stage.startedAt)}</>
    return <><b>Up next</b>{stage.plannedFrom ? `Planned from ${dateLabel(stage.plannedFrom)}` : 'Date to be confirmed'}</>
  }

  return <>
    <div className="pt-view-intro"><div><h2>Every stage, start to finish</h2><p>The same seven steps we use on every project. Open a stage to see what it covers and what is still to do.</p></div></div>
    <div className="pt-stage-list">{stages.map(stage => {
      const Icon = stage.icon
      const expanded = open.has(stage.id)
      const tasks = stageTasks(stage)
      const done = tasks.filter(task => task.done).length
      return <article className={`pt-stage-card ${stage.status} ${expanded ? 'open' : ''}`} key={stage.id}>
        <button className="pt-stage-toggle" onClick={() => toggle(stage.id)} aria-expanded={expanded}>
          <span>{stage.status === 'complete' ? <Check /> : <Icon />}</span>
          <div><h3>{stage.name}<small>{String(stage.index + 1).padStart(2, '0')}</small></h3><p>{stage.blurb}</p></div>
          <div className="pt-stage-dates">{dates(stage)}</div>
          <ChevronDown />
        </button>
        {expanded && <div className="pt-stage-body">
          {stage.summary && <p>{stage.summary}</p>}
          {stage.note && <p className="pt-stage-note">{stage.note}</p>}
          <TaskList stage={stage} />
          {tasks.length > 0 && <div className="pt-tasks-summary">{stage.status === 'upcoming' ? `${tasks.length} planned items` : `${done} of ${tasks.length} done`}</div>}
        </div>}
      </article>
    })}</div>
  </>
}

function UpdatesView({ project }) {
  const [filter, setFilter] = useState('all')
  const entries = useMemo(() => project.updates.filter(entry => filter === 'all' || entry.type === filter), [project, filter])
  return <>
    <div className="pt-view-intro">
      <div><h2>Project updates</h2><p>Everything we have shipped, decided and asked for, newest first.</p></div>
      <div className="pt-chips" role="tablist" aria-label="Filter updates">{feedTypes.map(([value, label]) => <button key={value} role="tab" aria-selected={filter === value} className={filter === value ? 'active' : ''} onClick={() => setFilter(value)}>{label}</button>)}</div>
    </div>
    <section className="pt-panel"><div className="pt-panel-body">
      {entries.length
        ? <ul className="pt-feed">{entries.map(entry => <FeedEntry key={entry.id} entry={entry} />)}</ul>
        : <div className="pt-all-clear"><CircleCheck /><strong>Nothing here yet</strong>No entries of this type so far.</div>}
    </div></section>
  </>
}

function DeliverablesView({ project, onApprove }) {
  const groups = [...new Set(project.deliverables.map(item => item.group))]
  const signedOff = item => ['Approved', 'Complete'].includes(item.status)
  return <>
    <div className="pt-view-intro"><div><h2>Deliverables</h2><p>Each page, feature and launch item, with where it stands and what we need from you.</p></div></div>
    {groups.length === 0 && <section className="pt-panel"><div className="pt-panel-body"><div className="pt-all-clear"><CircleCheck /><strong>Nothing listed yet</strong>Pages, features and launch items will appear here as they are planned.</div></div></section>}
    {groups.map(group => {
      const items = project.deliverables.filter(item => item.group === group)
      return <section className="pt-panel pt-group" key={group}>
        <div className="pt-panel-head"><div><h2>{group}<span>{items.filter(signedOff).length} of {items.length} signed off</span></h2></div></div>
        {items.map(item => {
          const clientApproved = item.approvedBy === 'client' && item.approvedAt
          const shownDate = clientApproved ? item.approvedAt : item.date
          return <div className="pt-deliverable" key={item.id}>
            <div>
              <strong>{item.name}</strong>
              <p>{item.description}</p>
              {clientApproved
                ? <div className="note good">Approved by you on {dateLabel(item.approvedAt)}. The team will confirm it in the next update.</div>
                : item.note && <div className="note">{item.note}</div>}
            </div>
            <div className="pt-deliverable-side">
              <StatusBadge value={item.status} />
              {shownDate && <time dateTime={shownDate}>{dateLabel(shownDate)}</time>}
              {item.approvable && item.status === 'Awaiting your approval' && <button className="pt-button primary small" onClick={() => onApprove(item)}>Approve <Check /></button>}
            </div>
          </div>
        })}
      </section>
    })}
    {project.payments?.length > 0 && <Panel title="Payment schedule" note="Milestone-based, agreed at planning">
      <ul className="pt-payments">{project.payments.map((item, index) => <li key={`${index}-${item.label}`}>
        <div><strong>{item.label}</strong><small>{dateLabel(item.date)}</small></div>
        <b>{item.share}</b>
        <StatusBadge value={item.status} />
      </li>)}</ul>
    </Panel>}
  </>
}

const navigation = [
  [LayoutDashboard, 'overview', 'Overview'], [ListChecks, 'stages', 'Stages'], [Activity, 'updates', 'Updates'], [PackageCheck, 'deliverables', 'Deliverables']
]

export default function ClientPortal({ projectId, onLogout, onClose, preview = false }) {
  const project = useProject(projectId)
  const [view, setView] = useState('overview')
  const [toast, setToast] = useState('')

  useEffect(() => { if (!project) onLogout() }, [project, onLogout])
  useEffect(() => { window.scrollTo({ top: 0 }) }, [view])
  useEffect(() => {
    if (!toast) return undefined
    const timer = setTimeout(() => setToast(''), 2400)
    return () => clearTimeout(timer)
  }, [toast])

  if (!project) return null

  const toggleAction = id => {
    const action = project.actions.find(item => item.id === id)
    const done = !action?.done
    projectStore.update(projectId, current => ({
      actions: current.actions.map(item => item.id === id ? { ...item, done, doneAt: done ? new Date().toISOString() : undefined, doneBy: done ? 'client' : undefined } : item)
    }))
    setToast(done ? 'Marked as done' : 'Item reopened')
  }

  const approve = item => {
    const stamp = new Date().toISOString()
    projectStore.update(projectId, current => ({
      deliverables: current.deliverables.map(entry => entry.id === item.id ? { ...entry, status: 'Approved', approvedAt: stamp, approvedBy: 'client' } : entry),
      actions: current.actions.map(action => action.deliverableId === item.id ? { ...action, done: true, doneAt: stamp, doneBy: 'client' } : action)
    }))
    setToast(`${item.name} approved`)
  }

  const pending = pendingActions(project).length

  return <div className="pt-shell">
    <aside className="pt-rail">
      <Brand onClick={onClose} />
      <div className="pt-project">
        <small>{project.reference}</small>
        <strong>{project.name}</strong>
      </div>
      <nav className="pt-nav" aria-label="Project sections">{navigation.map(([Icon, value, label]) => <button key={value} className={view === value ? 'active' : ''} onClick={() => setView(value)} aria-current={view === value ? 'page' : undefined}>
        <Icon />{label}{value === 'deliverables' && pending > 0 && <span>{pending}</span>}
      </button>)}</nav>
      <div className="pt-rail-foot">
        <div className="pt-rail-client"><Avatar name={project.client.name} /><div><strong>{project.client.name}</strong><small>{project.client.company}</small></div></div>
        {preview
          ? <button onClick={onClose}><ChevronLeft /> Back to admin</button>
          : <><button onClick={onClose}><ExternalLink /> View website</button><button onClick={onLogout}><LogOut /> Sign out</button></>}
      </div>
    </aside>

    <main className="pt-main">
      <div className="pt-statusline" aria-label="Project status line">
        {preview && <span className="pt-preview-tag">Admin preview</span>}
        {project.buildLabel && <span>{project.buildLabel}</span>}
        <span>{project.serviceLabel}</span>
        <span>Ref <b>{project.reference}</b></span>
      </div>
      <header className="pt-header">
        <div>
          <h1>{project.name}</h1>
          {project.summary && <p>{project.summary}</p>}
        </div>
        <div className="pt-header-side">
          <div className="pt-progress-copy"><LaunchCountdown project={project} /></div>
          <div className="pt-buttons">
            <a className="pt-button" href={messageLink(project, `Question about ${project.name}`)}><Mail /> Message the team</a>
            {view !== 'overview' && <button className="pt-button" onClick={() => setView('overview')}><LayoutDashboard /> Overview</button>}
          </div>
        </div>
      </header>

      <StageRail project={project} />

      {view === 'overview' && <OverviewView project={project} onToggleAction={toggleAction} onNavigate={setView} />}
      {view === 'stages' && <StagesView project={project} />}
      {view === 'updates' && <UpdatesView project={project} />}
      {view === 'deliverables' && <DeliverablesView project={project} onApprove={approve} />}

      <section className="pt-panel pt-contact">
        <div>
          <span className="pt-avatar large" aria-hidden="true"><Rocket /></span>
          <div><strong>Something unclear, or changed on your side?</strong><p>Reply to any update or email us. Quote {project.reference} so it lands with the right person.</p></div>
        </div>
        <a className="pt-button primary" href={messageLink(project, `Update from ${project.client.name}`)}>Email the team <ArrowRight /></a>
      </section>
    </main>

    {toast && <div className="pt-toast" role="status"><Check /> {toast}</div>}
  </div>
}
