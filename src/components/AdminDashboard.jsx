import { useMemo, useState } from 'react'
import {
  AlertTriangle, Archive, BarChart3, Bell, BellRing, Building2, CalendarClock,
  Check, CheckCircle2, ChevronRight, CircleDollarSign, ClipboardList, Columns3,
  Copy, Database, Download, ExternalLink, Eye, Globe, Inbox, LayoutDashboard,
  LogOut, Mail, Phone, Plus, RotateCcw, Search, Settings, SlidersHorizontal,
  Smartphone, Trash2, UserCog, UserRound, Wallet, Workflow, X
} from 'lucide-react'
import { needOptions, serviceLabel as getServiceLabel } from '../data'
import { requestStore } from '../storage'
import brandImage from '../favIcon.jpg'

const statusOptions = ['New', 'Reviewing', 'Contacted', 'In Progress', 'Completed', 'Archived']
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
    settings: ['Settings', 'Prepare your workspace for future backend and team integrations.']
  }[view]
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

function RequestDrawer({ request, onClose, onStatus, onNotes, onDelete, onCopy }) {
  const excluded = ['id', 'reference', 'status', 'createdAt', 'fullName', 'company', 'email', 'phone', 'contactMethod', 'need', 'budget', 'launchDate', 'urgency', 'adminNotes', 'isDemo']
  const answers = Object.entries(request).filter(([key, value]) => value && !excluded.includes(key))
  const summary = `${request.reference}\n${request.fullName}${request.company ? `, ${request.company}` : ''}\n${serviceLabel(request.need)}\nBudget: ${request.budget}\nTimeline: ${request.launchDate}\nUrgency: ${request.urgency}\n\n${request.problem || request.businessIdea || request.repetitiveTask || request.broken || ''}`
  return <div className="crm-drawer-overlay" onMouseDown={event => event.target === event.currentTarget && onClose()}><aside className="crm-drawer" aria-label={`Project request ${request.reference}`}>
    <header><div><small>Project request</small><h2>{request.reference}</h2></div><button onClick={onClose} aria-label="Close details"><X /></button></header>
    <div className="drawer-client"><span className="client-avatar large">{request.fullName.split(' ').map(part => part[0]).join('').slice(0, 2)}</span><div><h3>{request.fullName}</h3><p>{request.company || 'Independent project'}</p></div><UrgencyBadge value={request.urgency} /></div>
    <div className="drawer-actions"><button onClick={() => onCopy(request.email, 'Email copied')}><Mail /> Copy email</button><button onClick={() => onCopy(request.phone, 'Phone copied')}><Phone /> Copy phone</button><button onClick={() => onCopy(summary, 'Project summary copied')}><Copy /> Copy summary</button></div>
    <div className="drawer-status"><label>Status<select value={request.status} onChange={event => onStatus(request.id, event.target.value)}>{statusOptions.map(value => <option key={value}>{value}</option>)}</select></label></div>
    <section><h4>Contact details</h4><DetailRow label="Email" value={request.email} /><DetailRow label="Phone" value={request.phone} /><DetailRow label="Preferred contact" value={request.contactMethod} /></section>
    <section><h4>Project overview</h4><DetailRow label="Service" value={serviceLabel(request.need)} /><DetailRow label="Budget" value={request.budget} /><DetailRow label="Timeline" value={request.launchDate} /><DetailRow label="Urgency" value={request.urgency} /><DetailRow label="Must-have features" value={request.mustHave} /><DetailRow label="Nice-to-have features" value={request.niceToHave} /></section>
    <section><h4>Full project profile</h4>{answers.map(([key, value]) => <DetailRow key={key} label={key.replace(/([A-Z])/g, ' $1')} value={value} />)}</section>
    <section className="admin-notes"><h4>Internal admin notes</h4><p>Only visible in this admin workspace.</p><textarea value={request.adminNotes || ''} onChange={event => onNotes(request.id, event.target.value)} placeholder="Add qualification notes, next steps, or follow-up details..." /></section>
    <button className="drawer-delete" onClick={() => onDelete(request.id)}><Trash2 /> Delete request</button>
  </aside></div>
}

export default function AdminDashboard({ onLogout, onClose }) {
  const [requests, setRequests] = useState(requestStore.get)
  const [activeView, setActiveView] = useState('overview')
  const [selectedId, setSelectedId] = useState(null)
  const [toast, setToast] = useState('')
  const [filters, setFilters] = useState({ search: '', service: 'All', status: 'All', urgency: 'All', sort: 'newest' })
  const selected = requests.find(request => request.id === selectedId) || null

  const persist = next => { setRequests(next); requestStore.save(next) }
  const updateRequest = (id, patch) => persist(requests.map(request => request.id === id ? { ...request, ...patch } : request))
  const updateStatus = (id, status) => updateRequest(id, { status })
  const remove = id => {
    if (!window.confirm('Delete this request permanently?')) return
    persist(requests.filter(request => request.id !== id)); setSelectedId(null)
  }
  const addDemo = () => { const demo = makeDemoRequest(); persist([demo, ...requests]); setActiveView('requests'); setToast('Demo request created'); setTimeout(() => setToast(''), 2200) }
  const clearDemo = () => { if (window.confirm('Remove all demo requests? Real requests will be kept.')) persist(requests.filter(request => !request.isDemo)) }
  const resetFilters = () => setFilters({ search: '', service: 'All', status: 'All', urgency: 'All', sort: 'newest' })
  const setFilter = (name, value) => setFilters(current => ({ ...current, [name]: value }))
  const copy = async (value, message) => {
    try { await navigator.clipboard.writeText(value || 'Not provided'); setToast(message) } catch { setToast('Copy was not available') }
    setTimeout(() => setToast(''), 2000)
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

  const navigation = [[LayoutDashboard, 'overview', 'Overview'], [ClipboardList, 'requests', 'Project Requests'], [Columns3, 'pipeline', 'Pipeline'], [BarChart3, 'analytics', 'Analytics'], [Settings, 'settings', 'Settings']]
  return <div className="crm-dashboard">
    <aside className="crm-sidebar"><Brand onClick={onClose} /><div className="crm-admin-label"><span>Admin</span><small>Internal CRM</small></div><nav>{navigation.map(([Icon, value, label]) => <button className={activeView === value ? 'active' : ''} key={value} onClick={() => setActiveView(value)}><Icon />{label}{value === 'requests' && <span>{requests.length}</span>}</button>)}</nav><div className="crm-sidebar-foot"><button onClick={onClose}><ExternalLink /> View Website</button><button onClick={onLogout}><LogOut /> Sign Out</button></div></aside>
    <main className="crm-main"><ViewHeader view={activeView} requests={requests} onWebsite={onClose} onExport={exportCsv} onClearDemo={clearDemo} />{activeView !== 'settings' && <DashboardMetrics requests={requests} />}
      {activeView === 'overview' && <OverviewView requests={requests} onView={request => setSelectedId(request.id)} onNavigate={setActiveView} onWebsite={onClose} onDemo={addDemo} />}
      {activeView === 'requests' && <RequestsView requests={requests} filtered={filtered} filters={filters} setFilter={setFilter} onReset={resetFilters} onWebsite={onClose} onDemo={addDemo} onView={request => setSelectedId(request.id)} onStatus={updateStatus} onDelete={remove} />}
      {activeView === 'pipeline' && <PipelineView requests={requests} onView={request => setSelectedId(request.id)} onStatus={updateStatus} />}
      {activeView === 'analytics' && <AnalyticsView requests={requests} />}
      {activeView === 'settings' && <SettingsView />}
    </main>
    {selected && <RequestDrawer request={selected} onClose={() => setSelectedId(null)} onStatus={updateStatus} onNotes={(id, adminNotes) => updateRequest(id, { adminNotes })} onDelete={remove} onCopy={copy} />}
    {toast && <div className="crm-toast"><Check /> {toast}</div>}
  </div>
}
