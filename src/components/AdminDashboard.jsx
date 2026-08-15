import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle, Archive, BarChart3, Bell, BellRing, Building2, CalendarClock,
  Check, CheckCircle2, ChevronRight, CircleDollarSign, ClipboardList, Columns3,
  Copy, Database, Download, ExternalLink, Eye, FolderKanban, Globe, Inbox, LayoutDashboard,
  LogOut, Mail, Pause, Phone, Play, Plus, RotateCcw, Search, Settings, SlidersHorizontal,
  Smartphone, Trash2, UserCog, UserRound, Wallet, Workflow, X
} from 'lucide-react'
import { needOptions, serviceLabel as getServiceLabel } from '../data'
import brandImage from '../favIcon.jpg'

const statusOptions = ['New', 'Reviewing', 'Contacted', 'In Progress', 'Completed', 'Approved', 'Archived']
const urgencyOptions = ['Low', 'Medium', 'High', 'Urgent']
const pipelineStatuses = statusOptions.filter(status => status !== 'Archived')
const crmServiceLabels = { website: 'Website', app: 'Mobile App', software: 'Custom Software', automation: 'Automation', existing: 'System Maintenance', mvp: 'MVP', unsure: 'Not Sure Yet', design: 'UI/UX Design', consulting: 'Technical Consulting' }
const serviceLabel = value => crmServiceLabels[value] || getServiceLabel(value)

const slug = value => String(value || '').toLowerCase().replace(/\s+/g, '-')

const budgetValue = budget => {
  const value = String(budget || '').toLowerCase().replace(/,/g, '')
  if (value.includes('not sure') || value.includes('not specified')) return 0
  if (value.includes('under') && value.match(/\d+/)) return Number(value.match(/\d+/)[0]) / 2
  if (value.includes('+') && value.match(/\d+/)) return Number(value.match(/\d+/)[0]) * 1.2
  const numbers = [...value.matchAll(/\d+(?:\.\d+)?/g)].map(match => Number(match[0]))
  if (!numbers.length) return 0
  const multiplier = /r|zar/.test(value) && Math.max(...numbers) < 1000 ? 1000 : 1
  return numbers.length > 1 ? ((numbers[0] + numbers[1]) / 2) * multiplier : numbers[0] * multiplier
}

const money = value => new Intl.NumberFormat('en-ZA', {
  style: 'currency', currency: 'ZAR', maximumFractionDigits: 0
}).format(value || 0)

const dateLabel = value => {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Not specified' : date.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })
}

const makeDemoRequest = () => {
  const stamp = Date.now()
  return {
    id: stamp,
    reference: `SQT-${new Date().getFullYear()}-${String(stamp).slice(-6)}`,
    fullName: 'Naledi Mokoena',
    company: 'Lumen Logistics',
    email: 'naledi@lumenlogistics.co.za',
    phone: '+27 82 555 0147',
    contactMethod: 'Email',
    need: 'software',
    platform: 'Web',
    users: 'Operations managers and dispatch teams',
    problem: 'Shipment updates are split across spreadsheets, email and WhatsApp.',
    desiredResult: 'A single operations dashboard with reliable live status reporting.',
    features: 'Role-based access, shipment tracking, reporting and notifications',
    budget: 'R60,000 - R150,000',
    launchDate: '2026-10-15',
    urgency: 'High',
    mustHave: 'Operations dashboard, user accounts, reporting and audit history',
    niceToHave: 'Driver mobile view and automated customer notifications',
    notes: 'The current process supports around 250 deliveries per week.',
    adminNotes: '',
    status: 'New',
    createdAt: new Date().toISOString(),
    isDemo: true
  }
}

const csvCell = value => `"${String(value ?? '').replace(/"/g, '""')}"`

function Brand({ onClick }) {
  return <button className="crm-brand" onClick={onClick} aria-label="View SideQuest Tech website">
    <img src={brandImage} alt="" />
    <span><strong>SideQuest Tech</strong><small>Admin workspace</small></span>
  </button>
}

function StatusBadge({ value }) {
  return <span className={`crm-badge status-${slug(value)}`}>{value}</span>
}

function UrgencyBadge({ value }) {
  return <span className={`crm-badge urgency-${slug(value)}`}>{value || 'Medium'}</span>
}

function MetricCard({ icon: Icon, label, value, note, tone }) {
  return <article className="crm-metric">
    <span className={`crm-metric-icon ${tone}`}><Icon /></span>
    <div><small>{label}</small><strong>{value}</strong><p>{note}</p></div>
  </article>
}

function ViewHeader({ view, requests, onWebsite, onExport, onClearDemo }) {
  const copy = {
    overview: ['Overview', 'Monitor incoming opportunities and the health of your project pipeline.'],
    requests: ['Project Requests', 'Review opportunities, qualify leads, and move projects through the pipeline.'],
    pipeline: ['Pipeline', 'Track every qualified opportunity from first review through completion.'],
    analytics: ['Analytics', 'Understand demand, priority, and the estimated value of your pipeline.'],
    settings: ['Settings', 'Prepare your workspace for future backend and team integrations.'],
    clients: ['Clients', 'Manage approved client accounts and add new projects.'],
    projects: ['Project Tracking', 'Track active, paused, and completed projects for all clients.']
  }[view] || ['Admin', '']
  const demoCount = requests.filter(request => request.isDemo).length
  return <header className="crm-header">
    <div><div className="eyebrow">SideQuest Tech admin</div><h1>{copy[0]}</h1><p>{copy[1]}</p></div>
    <div className="crm-header-actions">
      <button className="crm-button secondary" onClick={onWebsite}><ExternalLink /> View Website</button>
      <button className="crm-button secondary" onClick={onExport} disabled={!requests.length}><Download /> Export CSV</button>
      {demoCount > 0 && <button className="crm-button danger" onClick={onClearDemo}><Trash2 /> Clear Demo Data</button>}
      <div className="admin-pill"><span>SQ</span><div><strong>Administrator</strong><small>SideQuest Tech</small></div></div>
    </div>
  </header>
}

function DashboardMetrics({ requests }) {
  const pipelineValue = requests.filter(request => !['Completed', 'Archived'].includes(request.status)).reduce((sum, request) => sum + budgetValue(request.budget), 0)
  const metrics = [
    [Inbox, 'Total Requests', requests.length, 'All submitted leads', 'blue'],
    [Bell, 'New Requests', requests.filter(r => r.status === 'New').length, 'Awaiting review', 'green'],
    [Globe, 'Website Requests', requests.filter(r => r.need === 'website').length, 'Web build opportunities', 'violet'],
    [Smartphone, 'App Requests', requests.filter(r => r.need === 'app').length, 'Mobile product leads', 'cyan'],
    [Workflow, 'Automation Requests', requests.filter(r => r.need === 'automation').length, 'Workflow opportunities', 'amber'],
    [AlertTriangle, 'Urgent Requests', requests.filter(r => r.urgency === 'Urgent').length, 'High priority leads', 'red'],
    [CheckCircle2, 'Completed', requests.filter(r => r.status === 'Completed').length, 'Successfully delivered', 'teal'],
    [Wallet, 'Pipeline Value', money(pipelineValue), 'Estimated open value', 'navy']
  ]
  return <section className="crm-metrics-grid">{metrics.map(([Icon, label, value, note, tone]) => <MetricCard key={label} icon={Icon} label={label} value={value} note={note} tone={tone} />)}</section>
}

function EmptyState({ filtered, onWebsite, onDemo, onReset }) {
  return <div className="crm-empty">
    <span><ClipboardList /></span>
    <h3>{filtered ? 'No matching requests' : 'No project requests yet'}</h3>
    <p>{filtered ? 'Try resetting your filters or using a broader search.' : 'Once a visitor completes the project request wizard, their details will appear here.'}</p>
    <div>{filtered
      ? <button className="crm-button primary" onClick={onReset}><RotateCcw /> Reset filters</button>
      : <><button className="crm-button secondary" onClick={onWebsite}><ExternalLink /> View public website</button><button className="crm-button primary" onClick={onDemo}><Plus /> Create demo request</button></>}
    </div>
  </div>
}

function RequestActions({ request, onView, onStatus, onDelete }) {
  return <div className="crm-row-actions">
    <button title="View details" aria-label={`View ${request.reference}`} onClick={() => onView(request)}><Eye /></button>
    <button title="Mark contacted" aria-label={`Mark ${request.reference} contacted`} disabled={request.status === 'Contacted'} onClick={() => onStatus(request.id, 'Contacted')}><Mail /></button>
    <button title="Move to in progress" aria-label={`Move ${request.reference} to in progress`} disabled={request.status === 'In Progress'} onClick={() => onStatus(request.id, 'In Progress')}><ChevronRight /></button>
    <button className="delete" title="Delete" aria-label={`Delete ${request.reference}`} onClick={() => onDelete(request.id)}><Trash2 /></button>
  </div>
}

function RequestsView({ requests, filtered, filters, setFilter, onReset, onWebsite, onDemo, onView, onStatus, onDelete }) {
  const hasFilters = filters.search || filters.service !== 'All' || filters.status !== 'All' || filters.urgency !== 'All'
  return <section className="crm-panel requests-panel">
    <div className="crm-panel-head">
      <div><h2>All requests</h2><span>{filtered.length} of {requests.length} shown</span></div>
      <div className="crm-filters">
        <label className="crm-search"><Search /><input aria-label="Search requests" placeholder="Search clients, companies or notes" value={filters.search} onChange={event => setFilter('search', event.target.value)} /></label>
        <label><SlidersHorizontal /><select aria-label="Filter by service" value={filters.service} onChange={event => setFilter('service', event.target.value)}><option>All</option>{needOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label><select aria-label="Filter by status" value={filters.status} onChange={event => setFilter('status', event.target.value)}><option>All</option>{statusOptions.map(value => <option key={value}>{value}</option>)}</select></label>
        <label><select aria-label="Filter by urgency" value={filters.urgency} onChange={event => setFilter('urgency', event.target.value)}><option>All</option>{urgencyOptions.map(value => <option key={value}>{value}</option>)}</select></label>
        <label><select aria-label="Sort requests" value={filters.sort} onChange={event => setFilter('sort', event.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="budget">Budget high to low</option><option value="urgency">Urgency</option><option value="status">Status</option></select></label>
        <button className="crm-reset" onClick={onReset} disabled={!hasFilters && filters.sort === 'newest'}><RotateCcw /> Reset</button>
      </div>
    </div>
    {filtered.length ? <div className="crm-table-wrap"><table><thead><tr><th>Reference</th><th>Client</th><th>Company</th><th>Service Type</th><th>Budget</th><th>Timeline</th><th>Urgency</th><th>Status</th><th>Submitted</th><th>Actions</th></tr></thead><tbody>
      {filtered.map(request => <tr key={request.id}>
        <td><button className="reference-link" onClick={() => onView(request)}>{request.reference}</button></td>
        <td><strong>{request.fullName}</strong><small>{request.email}</small></td>
        <td>{request.company || 'Independent'}</td><td>{serviceLabel(request.need)}</td><td>{request.budget}</td><td>{request.launchDate}</td>
        <td><UrgencyBadge value={request.urgency} /></td><td><StatusBadge value={request.status} /></td><td>{dateLabel(request.createdAt)}</td>
        <td><RequestActions request={request} onView={onView} onStatus={onStatus} onDelete={onDelete} /></td>
      </tr>)}
    </tbody></table></div> : <EmptyState filtered={requests.length > 0} onWebsite={onWebsite} onDemo={onDemo} onReset={onReset} />}
  </section>
}

function OverviewView({ requests, onView, onNavigate, onWebsite, onDemo }) {
  const open = requests.filter(request => !['Completed', 'Archived'].includes(request.status))
  const urgent = open.filter(request => request.urgency === 'Urgent' || request.urgency === 'High').slice(0, 4)
  const recent = [...requests].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5)
  if (!requests.length) return <section className="crm-panel"><EmptyState onWebsite={onWebsite} onDemo={onDemo} /></section>
  return <div className="overview-grid">
    <section className="crm-panel overview-recent"><div className="section-title"><div><h2>Recent requests</h2><p>Newest opportunities submitted to SideQuest Tech.</p></div><button onClick={() => onNavigate('requests')}>View all <ChevronRight /></button></div>
      <div className="recent-list">{recent.map(request => <button key={request.id} onClick={() => onView(request)}><span className="client-avatar">{request.fullName.split(' ').map(part => part[0]).join('').slice(0, 2)}</span><span><strong>{request.fullName}</strong><small>{request.company || serviceLabel(request.need)}</small></span><span><StatusBadge value={request.status} /><small>{dateLabel(request.createdAt)}</small></span></button>)}</div>
    </section>
    <section className="crm-panel priority-panel"><div className="section-title"><div><h2>Priority follow-ups</h2><p>High urgency open opportunities.</p></div><CalendarClock /></div>
      {urgent.length ? <div className="priority-list">{urgent.map(request => <button key={request.id} onClick={() => onView(request)}><AlertTriangle /><span><strong>{request.fullName}</strong><small>{request.reference} · {request.budget}</small></span><UrgencyBadge value={request.urgency} /></button>)}</div> : <div className="compact-empty"><CheckCircle2 /><strong>No urgent follow-ups</strong><span>Your open pipeline has no high-priority items.</span></div>}
    </section>
    <section className="crm-panel pipeline-summary"><div className="section-title"><div><h2>Pipeline snapshot</h2><p>Open requests by qualification stage.</p></div><button onClick={() => onNavigate('pipeline')}>Open pipeline <ChevronRight /></button></div>
      <div>{pipelineStatuses.map(status => { const count = requests.filter(request => request.status === status).length; return <article key={status}><span><StatusBadge value={status} /><small>{count} request{count === 1 ? '' : 's'}</small></span><div><i style={{ width: `${requests.length ? Math.max(4, count / requests.length * 100) : 0}%` }} /></div></article> })}</div>
    </section>
  </div>
}

function PipelineView({ requests, onView, onStatus }) {
  return <div className="kanban-board">{pipelineStatuses.map(status => {
    const cards = requests.filter(request => request.status === status)
    return <section className="kanban-column" key={status}><header><StatusBadge value={status} /><span>{cards.length}</span></header><div>
      {cards.map(request => <article className="kanban-card" key={request.id}><button onClick={() => onView(request)}><strong>{request.fullName}</strong><span>{request.company || 'Independent project'}</span></button><dl><div><dt>Service</dt><dd>{serviceLabel(request.need)}</dd></div><div><dt>Budget</dt><dd>{request.budget}</dd></div></dl><footer><UrgencyBadge value={request.urgency} /><small>{request.reference}</small></footer><select aria-label={`Update ${request.reference} status`} value={request.status} onChange={event => onStatus(request.id, event.target.value)}>{pipelineStatuses.map(value => <option key={value}>{value}</option>)}</select></article>)}
      {!cards.length && <div className="kanban-empty">No requests</div>}
    </div></section>
  })}</div>
}

function AnalyticsGroup({ title, icon: Icon, items, total }) {
  const max = Math.max(1, ...items.map(([, value]) => value))
  return <section className="crm-panel analytics-card"><div className="section-title"><div><h2>{title}</h2><p>{total} total requests</p></div><Icon /></div><div className="bar-list">{items.map(([label, value]) => <div key={label}><span><strong>{label}</strong><small>{value}</small></span><div><i style={{ width: `${value / max * 100}%` }} /></div></div>)}</div></section>
}

function AnalyticsView({ requests }) {
  const serviceItems = needOptions.map(([value]) => [serviceLabel(value).replace('I need ', ''), requests.filter(r => r.need === value).length]).filter(([, value]) => value)
  const urgencyItems = urgencyOptions.map(value => [value, requests.filter(r => r.urgency === value).length])
  const statusItems = statusOptions.map(value => [value, requests.filter(r => r.status === value).length])
  const pipeline = requests.filter(r => !['Completed', 'Archived'].includes(r.status)).reduce((sum, r) => sum + budgetValue(r.budget), 0)
  const mostRequested = [...serviceItems].sort((a, b) => b[1] - a[1])[0]?.[0] || 'No data yet'
  return <><section className="analytics-summary"><article><CircleDollarSign /><span><small>Estimated pipeline value</small><strong>{money(pipeline)}</strong></span></article><article><BarChart3 /><span><small>Average request value</small><strong>{money(requests.length ? requests.reduce((sum, r) => sum + budgetValue(r.budget), 0) / requests.length : 0)}</strong></span></article><article><ClipboardList /><span><small>Most requested service</small><strong>{mostRequested}</strong></span></article></section><div className="analytics-grid"><AnalyticsGroup title="Requests by service" icon={Building2} items={serviceItems.length ? serviceItems : [['No requests', 0]]} total={requests.length} /><AnalyticsGroup title="Requests by urgency" icon={AlertTriangle} items={urgencyItems} total={requests.length} /><AnalyticsGroup title="Requests by status" icon={Columns3} items={statusItems} total={requests.length} /></div></>
}

function SettingsView() {
  const cards = [[UserCog, 'Admin account', 'Team access and account security will connect to the production identity provider.'], [Building2, 'Company profile', 'Manage registered company details, contact information, and branding.'], [BellRing, 'Notification preferences', 'Configure alerts for new, urgent, and overdue project requests.'], [Database, 'Data storage', 'Local storage is active. Cloud synchronization will be enabled with the backend.']]
  return <div className="settings-grid">{cards.map(([Icon, title, text]) => <article className="crm-panel" key={title}><Icon /><div><span>Coming soon</span><h2>{title}</h2><p>{text}</p></div></article>)}</div>
}

function DetailRow({ label, value }) {
  return <div className="crm-detail-row"><span>{label}</span><p>{value || 'Not provided'}</p></div>
}

function ApprovalModal({ request, onClose, onApproved, showToast }) {
  const [projectName, setProjectName] = useState(request.company ? `${request.company} – ${serviceLabel(request.need)}` : serviceLabel(request.need))
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const approve = async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/admin-approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': import.meta.env.VITE_ADMIN_SECRET || '' },
        body: JSON.stringify({ requestId: request.id, fullName: request.fullName, email: request.email, company: request.company || request.fullName, projectName })
      })
      const data = await res.json()
      if (!data.ok) { setError(data.error || 'Approval failed'); return }
      setResult(data)
      onApproved(request.id)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return <div className="crm-drawer-overlay" onMouseDown={e => e.target === e.currentTarget && onClose()}>
    <aside className="crm-drawer" style={{ maxWidth: '440px' }}>
      <header><div><small>Approve request</small><h2>{request.reference}</h2></div><button onClick={onClose}><X /></button></header>
      {!result
        ? <>
          <p style={{ fontSize: '12px', color: '#697487', margin: '16px 0 20px' }}>
            Approving will create a ClickUp folder + list for this client and email them their portal credentials.
          </p>
          <section>
            <h4>Client</h4>
            <DetailRow label="Name" value={request.fullName} />
            <DetailRow label="Email" value={request.email} />
            <DetailRow label="Company" value={request.company || 'Independent'} />
          </section>
          <section>
            <h4>Project name in ClickUp</h4>
            <input
              value={projectName}
              onChange={e => setProjectName(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', border: '1px solid #d4dce8', borderRadius: '7px', fontSize: '12px', marginTop: '6px', outline: 'none' }}
              placeholder="e.g. Acme Corp – Website Redesign"
            />
          </section>
          {error && <p style={{ color: '#c03448', fontSize: '11px', marginTop: '12px' }}>{error}</p>}
          <div style={{ display: 'flex', gap: '8px', marginTop: '24px' }}>
            <button className="crm-button" onClick={onClose}>Cancel</button>
            <button className="crm-button primary" onClick={approve} disabled={loading || !projectName.trim()}>
              {loading ? 'Approving…' : <><Check /> Approve & create portal</>}
            </button>
          </div>
        </>
        : <>
          <p style={{ color: '#1b7d52', fontSize: '12px', margin: '16px 0 8px', fontWeight: 700 }}>✓ Client approved and email sent!</p>
          <section>
            <h4>Generated credentials</h4>
            <DetailRow label="Email" value={request.email} />
            <div className="crm-detail-row">
              <span>Temp password</span>
              <p style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <code style={{ background: '#f3f6fa', padding: '3px 8px', borderRadius: '5px', fontSize: '11px', fontWeight: 700 }}>{result.tempPassword}</code>
                <button className="crm-button" style={{ minHeight: '26px', padding: '4px 8px', fontSize: '9px' }} onClick={async () => { await navigator.clipboard.writeText(result.tempPassword); showToast('Password copied') }}>
                  <Copy /> Copy
                </button>
              </p>
            </div>
            <DetailRow label="ClickUp folder" value={result.folderId} />
            <DetailRow label="ClickUp list" value={result.listId} />
          </section>
          <button className="crm-button primary" style={{ marginTop: '20px' }} onClick={onClose}><Check /> Done</button>
        </>
      }
    </aside>
  </div>
}

function ClientsView({ adminSecret, showToast }) {
  const [clients, setClients] = useState(null)
  const [loading, setLoading] = useState(true)
  const [addProjectFor, setAddProjectFor] = useState(null)
  const [newProjectName, setNewProjectName] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const load = () => {
    setLoading(true)
    fetch('/api/clients', { headers: { 'x-admin-secret': adminSecret } })
      .then(r => r.json())
      .then(d => setClients(d.clients || []))
      .catch(() => setClients([]))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const doAction = async (action, email, extra = {}) => {
    setActionLoading(true)
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': adminSecret },
        body: JSON.stringify({ action, email, ...extra })
      })
      const data = await res.json()
      if (data.ok) { load(); showToast(action === 'deactivate' ? 'Client deactivated' : action === 'reactivate' ? 'Client reactivated' : action === 'remove' ? 'Client removed' : 'Project added') }
      else showToast(data.error || 'Action failed')
    } finally { setActionLoading(false) }
  }

  if (loading) return <div className="crm-empty"><span><UserRound /></span><h3>Loading clients…</h3></div>
  if (!clients?.length) return <div className="crm-empty"><span><UserRound /></span><h3>No approved clients yet</h3><p>Approve a project request to create the first client account.</p></div>

  return <section className="crm-panel requests-panel">
    <div className="crm-panel-head"><div><h2>Client accounts</h2><span>{clients.length} client{clients.length !== 1 ? 's' : ''}</span></div></div>
    <div className="crm-table-wrap"><table><thead><tr><th>Client</th><th>Company</th><th>Email</th><th>Status</th><th>Since</th><th>Actions</th></tr></thead><tbody>
      {clients.map(c => <tr key={c.email}>
        <td><strong>{c.fullName}</strong></td>
        <td>{c.company}</td>
        <td><small>{c.email}</small></td>
        <td><span className={`crm-badge ${c.isActive ? 'status-in-progress' : 'status-archived'}`}>{c.isActive ? 'Active' : 'Deactivated'}</span></td>
        <td><small>{dateLabel(c.createdAt)}</small></td>
        <td><div className="crm-row-actions">
          <button title="Add project" onClick={() => { setAddProjectFor(c); setNewProjectName('') }}><Plus /></button>
          {c.isActive
            ? <button title="Deactivate" disabled={actionLoading} onClick={() => { if (window.confirm(`Deactivate ${c.fullName}? Their ClickUp folder will be archived.`)) doAction('deactivate', c.email) }}><Archive /></button>
            : <>
              <button title="Reactivate" disabled={actionLoading} onClick={() => doAction('reactivate', c.email)}><Play /></button>
              <button className="delete" title="Remove permanently" disabled={actionLoading} onClick={() => { if (window.confirm(`Permanently remove ${c.fullName}? This cannot be undone.`)) doAction('remove', c.email) }}><Trash2 /></button>
            </>
          }
        </div></td>
      </tr>)}
    </tbody></table></div>

    {addProjectFor && <div className="crm-drawer-overlay" onMouseDown={e => e.target === e.currentTarget && setAddProjectFor(null)}>
      <aside className="crm-drawer" style={{ maxWidth: '400px' }}>
        <header><div><small>Add project</small><h2>{addProjectFor.fullName}</h2></div><button onClick={() => setAddProjectFor(null)}><X /></button></header>
        <p style={{ fontSize: '12px', color: '#697487', margin: '14px 0' }}>A new ClickUp list will be created in {addProjectFor.company}'s folder.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '10px', fontWeight: 700, color: '#607080', textTransform: 'uppercase', letterSpacing: '.06em' }}>Project name</label>
          <input value={newProjectName} onChange={e => setNewProjectName(e.target.value)} style={{ height: '38px', padding: '0 12px', border: '1px solid #d4dce8', borderRadius: '8px', fontSize: '12px' }} placeholder="e.g. Mobile App Phase 2" />
        </div>
        <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
          <button className="crm-button" onClick={() => setAddProjectFor(null)}>Cancel</button>
          <button className="crm-button primary" disabled={!newProjectName.trim() || actionLoading} onClick={async () => { await doAction('add-project', addProjectFor.email, { projectName: newProjectName }); setAddProjectFor(null) }}>
            <Plus /> Add project
          </button>
        </div>
      </aside>
    </div>}
  </section>
}

function ProjectsView({ adminSecret, showToast }) {
  const [projects, setProjects] = useState(null)
  const [loading, setLoading] = useState(true)
  const [pauseTarget, setPauseTarget] = useState(null)
  const [pauseReason, setPauseReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const load = () => {
    setLoading(true)
    fetch('/api/projects', { headers: { 'x-admin-secret': adminSecret } })
      .then(r => r.json())
      .then(d => setProjects(d.projects || []))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const updateStatus = async (listId, newStatus, reason) => {
    setActionLoading(true)
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': adminSecret },
        body: JSON.stringify({ action: 'update-status', listId, newStatus, pauseReason: reason })
      })
      const data = await res.json()
      if (data.ok) { load(); showToast(`Project ${newStatus.replace('_', ' ')}`) }
      else showToast(data.error || 'Update failed')
    } finally { setActionLoading(false) }
  }

  const projectStatusLabel = { in_progress: 'In Progress', paused: 'Paused', cancelled: 'Cancelled', completed: 'Completed' }
  const columns = ['in_progress', 'paused', 'cancelled', 'completed']

  if (loading) return <div className="crm-empty"><span><FolderKanban /></span><h3>Loading projects…</h3></div>
  if (!projects?.length) return <div className="crm-empty"><span><FolderKanban /></span><h3>No projects yet</h3><p>Approved client requests become projects here.</p></div>

  return <>
    <div className="kanban-board" style={{ gridTemplateColumns: 'repeat(4,minmax(210px,1fr))' }}>
      {columns.map(col => {
        const cards = projects.filter(p => p.projectStatus === col)
        const isReadOnly = col === 'cancelled' || col === 'completed'
        const badgeClass = { in_progress: 'status-in-progress', paused: 'status-reviewing', cancelled: 'status-archived', completed: 'status-completed' }[col]
        return <section className="kanban-column" key={col}>
          <header><span className={`crm-badge ${badgeClass}`}>{projectStatusLabel[col]}</span><span>{cards.length}</span></header>
          <div>
            {!cards.length && <div className="kanban-empty">No projects</div>}
            {cards.map(p => <article className="kanban-card" key={p.listId}>
              <button style={{ width: '100%', textAlign: 'left', border: 0, padding: 0, background: 'none' }}>
                <strong>{p.listName}</strong>
                <span style={{ color: '#8a99ad', fontSize: '9px', display: 'block', marginTop: '3px' }}>{p.clientEmail}</span>
              </button>
              {p.pauseReason && <p style={{ fontSize: '9px', color: '#a07800', background: '#fff9e0', borderRadius: '5px', padding: '5px 8px', margin: '8px 0 0' }}>{p.pauseReason}</p>}
              {p.archivedAt && <p style={{ fontSize: '8px', color: '#8a99ad', marginTop: '6px' }}>Archived {dateLabel(p.archivedAt)}</p>}
              {!isReadOnly && <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '10px' }}>
                {col === 'in_progress' && <>
                  <button className="crm-button" style={{ minHeight: '26px', padding: '4px 7px', fontSize: '8px' }} disabled={actionLoading} onClick={() => { setPauseTarget(p); setPauseReason('') }}><Pause /> Pause</button>
                  <button className="crm-button danger" style={{ minHeight: '26px', padding: '4px 7px', fontSize: '8px' }} disabled={actionLoading} onClick={() => { if (window.confirm('Cancel this project? The ClickUp list will be archived.')) updateStatus(p.listId, 'cancelled') }}><X /> Cancel</button>
                  <button className="crm-button primary" style={{ minHeight: '26px', padding: '4px 7px', fontSize: '8px' }} disabled={actionLoading} onClick={() => { if (window.confirm('Mark as completed? The ClickUp list will be archived.')) updateStatus(p.listId, 'completed') }}><Check /> Complete</button>
                </>}
                {col === 'paused' && <>
                  <button className="crm-button primary" style={{ minHeight: '26px', padding: '4px 7px', fontSize: '8px' }} disabled={actionLoading} onClick={() => updateStatus(p.listId, 'in_progress')}><Play /> Resume</button>
                  <button className="crm-button danger" style={{ minHeight: '26px', padding: '4px 7px', fontSize: '8px' }} disabled={actionLoading} onClick={() => { if (window.confirm('Cancel this project? The ClickUp list will be archived.')) updateStatus(p.listId, 'cancelled') }}><X /> Cancel</button>
                  <button className="crm-button" style={{ minHeight: '26px', padding: '4px 7px', fontSize: '8px' }} disabled={actionLoading} onClick={() => { if (window.confirm('Mark as completed? The ClickUp list will be archived.')) updateStatus(p.listId, 'completed') }}><Check /> Complete</button>
                </>}
              </div>}
            </article>)}
          </div>
        </section>
      })}
    </div>

    {pauseTarget && <div className="crm-drawer-overlay" onMouseDown={e => e.target === e.currentTarget && setPauseTarget(null)}>
      <aside className="crm-drawer" style={{ maxWidth: '400px' }}>
        <header><div><small>Pause project</small><h2>{pauseTarget.listName}</h2></div><button onClick={() => setPauseTarget(null)}><X /></button></header>
        <p style={{ fontSize: '12px', color: '#697487', margin: '14px 0' }}>Clients will see this reason in their portal.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '10px', fontWeight: 700, color: '#607080', textTransform: 'uppercase', letterSpacing: '.06em' }}>Pause reason</label>
          <textarea value={pauseReason} onChange={e => setPauseReason(e.target.value)} style={{ minHeight: '80px', resize: 'vertical', border: '1px solid #d4dce8', borderRadius: '8px', padding: '9px 12px', fontSize: '12px', fontFamily: 'Manrope, sans-serif' }} placeholder="e.g. Waiting for client content and asset delivery" />
        </div>
        <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
          <button className="crm-button" onClick={() => setPauseTarget(null)}>Cancel</button>
          <button className="crm-button primary" disabled={!pauseReason.trim() || actionLoading} onClick={async () => { await updateStatus(pauseTarget.listId, 'paused', pauseReason); setPauseTarget(null) }}>
            <Pause /> Pause project
          </button>
        </div>
      </aside>
    </div>}
  </>
}

function RequestDrawer({ request, onClose, onStatus, onNotes, onDelete, onCopy, onApprove }) {
  const excluded = ['id', 'reference', 'status', 'createdAt', 'fullName', 'company', 'email', 'phone', 'contactMethod', 'need', 'budget', 'launchDate', 'urgency', 'adminNotes', 'isDemo']
  const answers = Object.entries(request).filter(([key, value]) => value && !excluded.includes(key))
  const summary = `${request.reference}\n${request.fullName}${request.company ? `, ${request.company}` : ''}\n${serviceLabel(request.need)}\nBudget: ${request.budget}\nTimeline: ${request.launchDate}\nUrgency: ${request.urgency}\n\n${request.problem || request.businessIdea || request.repetitiveTask || request.broken || ''}`
  const canApprove = !['Approved', 'Completed', 'Archived'].includes(request.status)
  return <div className="crm-drawer-overlay" onMouseDown={event => event.target === event.currentTarget && onClose()}><aside className="crm-drawer" aria-label={`Project request ${request.reference}`}>
    <header><div><small>Project request</small><h2>{request.reference}</h2></div><button onClick={onClose} aria-label="Close details"><X /></button></header>
    <div className="drawer-client"><span className="client-avatar large">{request.fullName.split(' ').map(part => part[0]).join('').slice(0, 2)}</span><div><h3>{request.fullName}</h3><p>{request.company || 'Independent project'}</p></div><UrgencyBadge value={request.urgency} /></div>
    <div className="drawer-actions"><button onClick={() => onCopy(request.email, 'Email copied')}><Mail /> Copy email</button><button onClick={() => onCopy(request.phone, 'Phone copied')}><Phone /> Copy phone</button><button onClick={() => onCopy(summary, 'Project summary copied')}><Copy /> Copy summary</button></div>
    <div className="drawer-status"><label>Status<select value={request.status} onChange={event => onStatus(request.id, event.target.value)}>{statusOptions.map(value => <option key={value}>{value}</option>)}</select></label></div>
    {canApprove && <button className="crm-button primary" style={{ width: '100%', marginBottom: '4px', justifyContent: 'center' }} onClick={() => onApprove(request)}><Check /> Approve request &amp; create client portal</button>}
    <section><h4>Contact details</h4><DetailRow label="Email" value={request.email} /><DetailRow label="Phone" value={request.phone} /><DetailRow label="Preferred contact" value={request.contactMethod} /></section>
    <section><h4>Project overview</h4><DetailRow label="Service" value={serviceLabel(request.need)} /><DetailRow label="Budget" value={request.budget} /><DetailRow label="Timeline" value={request.launchDate} /><DetailRow label="Urgency" value={request.urgency} /><DetailRow label="Must-have features" value={request.mustHave} /><DetailRow label="Nice-to-have features" value={request.niceToHave} /></section>
    <section><h4>Full project profile</h4>{answers.map(([key, value]) => <DetailRow key={key} label={key.replace(/([A-Z])/g, ' $1')} value={value} />)}</section>
    <section className="admin-notes"><h4>Internal admin notes</h4><p>Only visible in this admin workspace.</p><textarea value={request.adminNotes || ''} onChange={event => onNotes(request.id, event.target.value)} placeholder="Add qualification notes, next steps, or follow-up details..." /></section>
    <button className="drawer-delete" onClick={() => onDelete(request.id)}><Trash2 /> Delete request</button>
  </aside></div>
}

export default function AdminDashboard({ onLogout, onClose }) {
  const [requests, setRequests] = useState([])
  const [loadingRequests, setLoadingRequests] = useState(true)
  const [activeView, setActiveView] = useState('overview')
  const [selectedId, setSelectedId] = useState(null)
  const [toast, setToast] = useState('')
  const [approvalTarget, setApprovalTarget] = useState(null)
  const [filters, setFilters] = useState({ search: '', service: 'All', status: 'All', urgency: 'All', sort: 'newest' })
  const selected = requests.find(request => request.id === selectedId) || null
  const adminSecret = import.meta.env.VITE_ADMIN_SECRET || ''

  // Load requests from Redis on mount; migrate any leftover localStorage data
  useEffect(() => {
    const headers = { 'x-admin-secret': adminSecret }
    fetch('/api/requests', { headers })
      .then(r => r.json())
      .then(async data => {
        let loaded = data.requests || []
        // One-time migration from localStorage
        const legacyKeys = ['sidequest_tech_requests', 'squaddevs_requests']
        for (const key of legacyKeys) {
          try {
            const raw = localStorage.getItem(key)
            if (!raw) continue
            const legacy = JSON.parse(raw)
            if (!Array.isArray(legacy) || !legacy.length) continue
            // POST each legacy request to Redis (server deduplicates by id)
            await Promise.all(legacy.map(r => fetch('/api/requests', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(r)
            })))
            localStorage.removeItem(key)
            // Re-fetch after migration
            const refreshed = await fetch('/api/requests', { headers }).then(r => r.json())
            loaded = refreshed.requests || []
          } catch { /* ignore migration errors */ }
        }
        setRequests(loaded)
      })
      .catch(() => {})
      .finally(() => setLoadingRequests(false))
  }, [])

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  const persist = (next) => {
    setRequests(next)
    fetch('/api/requests', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-admin-secret': adminSecret },
      body: JSON.stringify({ requests: next })
    }).catch(console.error)
  }

  const updateRequest = (id, patch) => persist(requests.map(request => request.id === id ? { ...request, ...patch } : request))
  const updateStatus = (id, status) => updateRequest(id, { status })
  const remove = id => {
    if (!window.confirm('Delete this request permanently?')) return
    const next = requests.filter(request => request.id !== id)
    setRequests(next)
    setSelectedId(null)
    fetch('/api/requests', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-admin-secret': adminSecret },
      body: JSON.stringify({ id })
    }).catch(console.error)
  }
  const addDemo = () => {
    const demo = makeDemoRequest()
    const next = [demo, ...requests]
    setRequests(next)
    setActiveView('requests')
    showToast('Demo request created')
    fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(demo)
    }).catch(console.error)
  }
  const clearDemo = () => { if (window.confirm('Remove all demo requests? Real requests will be kept.')) persist(requests.filter(request => !request.isDemo)) }
  const resetFilters = () => setFilters({ search: '', service: 'All', status: 'All', urgency: 'All', sort: 'newest' })
  const setFilter = (name, value) => setFilters(current => ({ ...current, [name]: value }))
  const copy = async (value, message) => {
    try { await navigator.clipboard.writeText(value || 'Not provided'); showToast(message) } catch { showToast('Copy was not available') }
  }
  const exportCsv = () => {
    const headings = ['Reference', 'Client name', 'Company', 'Email', 'Phone', 'Service type', 'Budget', 'Timeline', 'Urgency', 'Status', 'Submitted date', 'Notes']
    const rows = requests.map(request => [request.reference, request.fullName, request.company, request.email, request.phone, serviceLabel(request.need), request.budget, request.launchDate, request.urgency, request.status, request.createdAt, request.adminNotes])
    const blob = new Blob([[headings, ...rows].map(row => row.map(csvCell).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' })
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `sidequest-project-requests-${new Date().toISOString().slice(0, 10)}.csv`; link.click(); URL.revokeObjectURL(link.href)
  }

  const filtered = useMemo(() => {
    const urgencyRank = { Urgent: 4, High: 3, Medium: 2, Low: 1 }
    const statusRank = Object.fromEntries(statusOptions.map((value, index) => [value, index]))
    const query = filters.search.trim().toLowerCase()
    const result = requests.filter(request => {
      const haystack = `${request.reference} ${request.fullName} ${request.company} ${request.email} ${serviceLabel(request.need)} ${request.adminNotes} ${request.notes}`.toLowerCase()
      return (!query || haystack.includes(query)) && (filters.service === 'All' || request.need === filters.service) && (filters.status === 'All' || request.status === filters.status) && (filters.urgency === 'All' || request.urgency === filters.urgency)
    })
    return [...result].sort((a, b) => filters.sort === 'oldest' ? new Date(a.createdAt) - new Date(b.createdAt) : filters.sort === 'budget' ? budgetValue(b.budget) - budgetValue(a.budget) : filters.sort === 'urgency' ? urgencyRank[b.urgency] - urgencyRank[a.urgency] : filters.sort === 'status' ? statusRank[a.status] - statusRank[b.status] : new Date(b.createdAt) - new Date(a.createdAt))
  }, [requests, filters])

// ─── Meetings view ────────────────────────────────────────────────────────────

function MeetingsView({ adminSecret, showToast }) {
  const [meetings, setMeetings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [respondTarget, setRespondTarget] = useState(null) // { meeting, action }
  const [confirmedTime, setConfirmedTime] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [newMtg, setNewMtg] = useState(null) // { clientEmail, clientName } for new meeting modal
  const [newTitle, setNewTitle] = useState('')
  const [newMsg, setNewMsg] = useState('')
  const [newDuration, setNewDuration] = useState(60)
  const [newSlots, setNewSlots] = useState(['', '', ''])
  const [clients, setClients] = useState([])

  const load = () => {
    setLoading(true)
    fetch('/api/meetings', { headers: { 'x-admin-secret': adminSecret } })
      .then(r => r.json()).then(d => { if (d.ok) setMeetings(d.meetings) })
      .catch(console.error).finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    fetch('/api/clients', { headers: { 'x-admin-secret': adminSecret } })
      .then(r => r.json()).then(d => { if (d.ok) setClients(d.clients || []) })
      .catch(console.error)
  }, [])

  const respond = async (meeting, action) => {
    if (action === 'accept' && !confirmedTime) return showToast('Select a confirmed time first')
    setActionLoading(true)
    try {
      const res = await fetch('/api/meetings-respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': adminSecret },
        body: JSON.stringify({ meetingId: meeting.id, action, confirmedTime: action === 'accept' ? confirmedTime : undefined })
      })
      const data = await res.json()
      if (!data.ok) return showToast(data.error || 'Action failed')
      showToast(action === 'accept' ? 'Meeting confirmed · Google Meet created' : 'Meeting declined')
      setRespondTarget(null); setConfirmedTime(''); load()
    } catch { showToast('Network error') }
    finally { setActionLoading(false) }
  }

  const createMeeting = async () => {
    const slots = newSlots.filter(Boolean)
    if (!newTitle.trim() || !slots.length || !newMtg?.clientEmail) return showToast('Fill in title, client, and at least one time slot')
    setActionLoading(true)
    try {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': adminSecret },
        body: JSON.stringify({ title: newTitle.trim(), message: newMsg.trim(), duration: newDuration, proposedTimes: slots, clientEmail: newMtg.clientEmail, clientName: newMtg.clientName })
      })
      const data = await res.json()
      if (!data.ok) return showToast(data.error || 'Failed to create meeting')
      showToast('Meeting request sent to client')
      setNewMtg(null); setNewTitle(''); setNewMsg(''); setNewSlots(['', '', '']); load()
    } catch { showToast('Network error') }
    finally { setActionLoading(false) }
  }

  const fmtDT = iso => new Date(iso).toLocaleString('en-ZA', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Johannesburg' })

  const pending = (meetings || []).filter(m => m.status === 'pending')
  const confirmed = (meetings || []).filter(m => m.status === 'accepted')
  const declined = (meetings || []).filter(m => m.status === 'declined')

  const MeetingRow = ({ m }) => {
    const isPending = m.status === 'pending'
    const isClientProposed = m.proposedBy === 'client'
    return <div style={{ background: '#fff', border: '1px solid #e4eaf2', borderRadius: 10, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <strong style={{ fontSize: 13 }}>{m.title}</strong>
          <div style={{ fontSize: 11, color: '#697487', marginTop: 2 }}>{m.clientName} · {m.clientEmail} · {m.duration} min</div>
          {m.message && <div style={{ fontSize: 11, color: '#8a99ad', marginTop: 2, fontStyle: 'italic' }}>{m.message}</div>}
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: m.status === 'accepted' ? '#dcfce7' : m.status === 'declined' ? '#fee2e2' : '#fef9c3', color: m.status === 'accepted' ? '#166534' : m.status === 'declined' ? '#991b1b' : '#92400e', flexShrink: 0 }}>
          {m.status === 'accepted' ? 'Confirmed' : m.status === 'declined' ? 'Declined' : isClientProposed ? 'Client request' : 'Awaiting client'}
        </span>
      </div>

      {m.status === 'accepted' && (
        <div style={{ fontSize: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div><CalendarClock style={{ width: 11, marginRight: 4 }} />{fmtDT(m.confirmedTime)}</div>
          <a href={m.meetLink} target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontSize: 11 }}>{m.meetLink}</a>
        </div>
      )}

      {isPending && isClientProposed && (
        <>
          <div style={{ fontSize: 11, color: '#607080' }}>
            <strong>Proposed times:</strong>
            {m.proposedTimes.map((t, i) => <div key={i} style={{ marginTop: 2 }}>{fmtDT(t)}</div>)}
          </div>
          <button onClick={() => { setRespondTarget(m); setConfirmedTime(m.proposedTimes[0] || '') }} className="crm-button primary" style={{ alignSelf: 'flex-start', fontSize: 11 }}>
            <Check style={{ width: 12 }} /> Accept & create Meet
          </button>
        </>
      )}

      {isPending && !isClientProposed && (
        <div style={{ fontSize: 11, color: '#607080' }}>
          Waiting for {m.clientName} to confirm a time.
        </div>
      )}
    </div>
  }

  return <>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 18 }}>Meetings</h2>
        <p style={{ margin: '4px 0 0', fontSize: 12, color: '#697487' }}>Schedule meetings with clients. Confirmed meetings auto-create a Google Meet.</p>
      </div>
      <button className="crm-button primary" onClick={() => setNewMtg({ clientEmail: '', clientName: '' })}>
        <Plus style={{ width: 14 }} /> Schedule meeting
      </button>
    </div>

    {loading && <div className="crm-empty"><span><CalendarClock /></span><h3>Loading meetings…</h3></div>}

    {!loading && !meetings?.length && (
      <div className="crm-empty"><span><CalendarClock /></span><h3>No meetings yet</h3><p>Schedule a meeting or wait for a client to request one.</p></div>
    )}

    {!loading && pending.length > 0 && (
      <section style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#697487', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 10 }}>Pending ({pending.length})</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{pending.map(m => <MeetingRow key={m.id} m={m} />)}</div>
      </section>
    )}
    {!loading && confirmed.length > 0 && (
      <section style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#697487', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 10 }}>Confirmed ({confirmed.length})</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{confirmed.map(m => <MeetingRow key={m.id} m={m} />)}</div>
      </section>
    )}
    {!loading && declined.length > 0 && (
      <section>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#697487', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 10 }}>Declined ({declined.length})</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{declined.map(m => <MeetingRow key={m.id} m={m} />)}</div>
      </section>
    )}

    {/* Accept drawer */}
    {respondTarget && <div className="crm-overlay" onMouseDown={e => e.target === e.currentTarget && setRespondTarget(null)}>
      <aside className="crm-drawer" style={{ maxWidth: 400 }}>
        <header><div><small>Confirm meeting</small><h2>{respondTarget.title}</h2></div><button onClick={() => setRespondTarget(null)}><X /></button></header>
        <p style={{ fontSize: 12, color: '#697487', margin: '14px 0 10px' }}>Select which proposed time to confirm. A Google Meet link will be created automatically.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {respondTarget.proposedTimes.map((t, i) => (
            <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '10px 14px', borderRadius: 8, border: `2px solid ${confirmedTime === t ? '#2563eb' : '#e4eaf2'}`, background: confirmedTime === t ? '#eff6ff' : '#fff', fontSize: 12 }}>
              <input type="radio" name="ctime" value={t} checked={confirmedTime === t} onChange={() => setConfirmedTime(t)} style={{ accentColor: '#2563eb' }} />
              {fmtDT(t)}
            </label>
          ))}
          <div style={{ marginTop: 8, fontSize: 11, color: '#697487' }}>Or enter a custom time:</div>
          <input type="datetime-local" value={confirmedTime} onChange={e => setConfirmedTime(e.target.value)} style={{ border: '1px solid #d4dce8', borderRadius: 8, padding: '8px 12px', fontSize: 12 }} />
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          <button className="crm-button" onClick={() => respond(respondTarget, 'decline')} disabled={actionLoading}>Decline</button>
          <button className="crm-button primary" onClick={() => respond(respondTarget, 'accept')} disabled={actionLoading || !confirmedTime}>
            {actionLoading ? 'Creating…' : <><Check style={{ width: 13 }} /> Confirm & create Meet</>}
          </button>
        </div>
      </aside>
    </div>}

    {/* New meeting modal */}
    {newMtg !== null && <div className="crm-overlay" onMouseDown={e => e.target === e.currentTarget && setNewMtg(null)}>
      <aside className="crm-drawer" style={{ maxWidth: 440 }}>
        <header><div><small>New meeting request</small><h2>Schedule with client</h2></div><button onClick={() => setNewMtg(null)}><X /></button></header>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14 }}>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: '#607080', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: 4 }}>Client</label>
            <select value={newMtg.clientEmail} onChange={e => { const c = clients.find(c => c.email === e.target.value); setNewMtg({ clientEmail: e.target.value, clientName: c?.fullName || e.target.value }) }} style={{ width: '100%', border: '1px solid #d4dce8', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
              <option value="">Select a client</option>
              {clients.filter(c => c.isActive).map(c => <option key={c.email} value={c.email}>{c.fullName} — {c.company}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: '#607080', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: 4 }}>Title</label>
            <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. Sprint review" style={{ width: '100%', border: '1px solid #d4dce8', borderRadius: 8, padding: '8px 12px', fontSize: 12, boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: '#607080', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: 4 }}>Message (optional)</label>
            <textarea value={newMsg} onChange={e => setNewMsg(e.target.value)} style={{ width: '100%', minHeight: 60, border: '1px solid #d4dce8', borderRadius: 8, padding: '8px 12px', fontSize: 12, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }} />
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: '#607080', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: 4 }}>Duration</label>
            <select value={newDuration} onChange={e => setNewDuration(Number(e.target.value))} style={{ border: '1px solid #d4dce8', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
              <option value={30}>30 minutes</option>
              <option value={60}>60 minutes</option>
              <option value={90}>90 minutes</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: '#607080', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: 4 }}>Proposed time slots (up to 3)</label>
            {newSlots.map((s, i) => <input key={i} type="datetime-local" value={s} onChange={e => setNewSlots(sl => sl.map((x, idx) => idx === i ? e.target.value : x))} style={{ display: 'block', width: '100%', border: '1px solid #d4dce8', borderRadius: 8, padding: '8px 12px', fontSize: 12, marginBottom: i < 2 ? 6 : 0, boxSizing: 'border-box' }} />)}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          <button className="crm-button" onClick={() => setNewMtg(null)}>Cancel</button>
          <button className="crm-button primary" disabled={actionLoading} onClick={createMeeting}>
            {actionLoading ? 'Sending…' : 'Send to client'}
          </button>
        </div>
      </aside>
    </div>}
  </>
}

  const showMetrics = !['settings', 'clients', 'projects', 'meetings'].includes(activeView)
  const navigation = [
    [LayoutDashboard, 'overview', 'Overview'],
    [ClipboardList, 'requests', 'Project Requests'],
    [Columns3, 'pipeline', 'Pipeline'],
    [BarChart3, 'analytics', 'Analytics'],
    [UserRound, 'clients', 'Clients'],
    [FolderKanban, 'projects', 'Projects'],
    [CalendarClock, 'meetings', 'Meetings'],
    [Settings, 'settings', 'Settings']
  ]

  return <div className="crm-dashboard">
    <aside className="crm-sidebar"><Brand onClick={onClose} /><div className="crm-admin-label"><span>Admin</span><small>Internal CRM</small></div><nav>{navigation.map(([Icon, value, label]) => <button className={activeView === value ? 'active' : ''} key={value} onClick={() => setActiveView(value)}><Icon />{label}{value === 'requests' && <span>{requests.length}</span>}</button>)}</nav><div className="crm-sidebar-foot"><button onClick={onClose}><ExternalLink /> View Website</button><button onClick={onLogout}><LogOut /> Sign Out</button></div></aside>
    <main className="crm-main">
      <ViewHeader view={activeView} requests={requests} onWebsite={onClose} onExport={exportCsv} onClearDemo={clearDemo} />
      {showMetrics && <DashboardMetrics requests={requests} />}
      {loadingRequests && ['overview','requests','pipeline','analytics'].includes(activeView) && <div className="crm-empty"><span><Inbox /></span><h3>Loading requests…</h3></div>}
      {!loadingRequests && activeView === 'overview' && <OverviewView requests={requests} onView={request => setSelectedId(request.id)} onNavigate={setActiveView} onWebsite={onClose} onDemo={addDemo} />}
      {!loadingRequests && activeView === 'requests' && <RequestsView requests={requests} filtered={filtered} filters={filters} setFilter={setFilter} onReset={resetFilters} onWebsite={onClose} onDemo={addDemo} onView={request => setSelectedId(request.id)} onStatus={updateStatus} onDelete={remove} />}
      {!loadingRequests && activeView === 'pipeline' && <PipelineView requests={requests} onView={request => setSelectedId(request.id)} onStatus={updateStatus} />}
      {!loadingRequests && activeView === 'analytics' && <AnalyticsView requests={requests} />}
      {activeView === 'clients' && <ClientsView adminSecret={adminSecret} showToast={showToast} />}
      {activeView === 'projects' && <ProjectsView adminSecret={adminSecret} showToast={showToast} />}
      {activeView === 'meetings' && <MeetingsView adminSecret={adminSecret} showToast={showToast} />}
      {activeView === 'settings' && <SettingsView />}
    </main>
    {selected && <RequestDrawer request={selected} onClose={() => setSelectedId(null)} onStatus={updateStatus} onNotes={(id, adminNotes) => updateRequest(id, { adminNotes })} onDelete={remove} onCopy={copy} onApprove={req => { setApprovalTarget(req); setSelectedId(null) }} />}
    {approvalTarget && <ApprovalModal request={approvalTarget} onClose={() => setApprovalTarget(null)} onApproved={id => { updateStatus(id, 'Approved'); showToast('Client approved') }} showToast={showToast} />}
    {toast && <div className="crm-toast"><Check /> {toast}</div>}
  </div>
}
