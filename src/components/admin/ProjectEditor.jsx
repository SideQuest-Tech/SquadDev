import { useState } from 'react'
import { ArrowDown, ArrowUp, Check, Copy, Eye, KeyRound, Plus, RotateCcw, Trash2 } from 'lucide-react'
import {
  dateLabel, deliverableStatuses, generateAccessCode, healthOptions, projectProgress, projectStages,
  stageLabel, stageStatuses, stageTasks, todayIso, updateTypes
} from '../../data/projects'
import { needOptions, services } from '../../data'
import { projectStore } from '../../storage'
import './ProjectEditor.css'

const tabs = [
  ['overview', 'Overview'], ['stages', 'Stages'], ['updates', 'Updates'], ['deliverables', 'Deliverables'],
  ['client', 'Client actions and dates'], ['team', 'Team and extras']
]

const newId = prefix => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
const replaceAt = (list, index, item) => list.map((entry, position) => position === index ? item : entry)
const removeAt = (list, index) => list.filter((_, position) => position !== index)
const move = (list, index, delta) => {
  const target = index + delta
  if (target < 0 || target >= list.length) return list
  const next = [...list]
  ;[next[index], next[target]] = [next[target], next[index]]
  return next
}
const byDateDesc = list => [...list].sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))
const laterDate = (a, b) => (String(a || '') > String(b || '') ? a : b) || a || b

function Field({ label, children, wide = false, hint }) {
  return <label className={`pe-field ${wide ? 'wide' : ''}`}><span>{label}{hint && <em>{hint}</em>}</span>{children}</label>
}

function Text({ label, value, onChange, type = 'text', placeholder, wide, hint }) {
  return <Field label={label} wide={wide} hint={hint}><input type={type} value={value || ''} placeholder={placeholder} onChange={event => onChange(event.target.value)} /></Field>
}

function Area({ label, value, onChange, rows = 3, placeholder, hint }) {
  return <Field label={label} wide hint={hint}><textarea rows={rows} value={value || ''} placeholder={placeholder} onChange={event => onChange(event.target.value)} /></Field>
}

function Select({ label, value, onChange, options, wide }) {
  return <Field label={label} wide={wide}><select value={value || ''} onChange={event => onChange(event.target.value)}>
    {options.map(option => { const [optionValue, optionLabel] = Array.isArray(option) ? option : [option, option]; return <option key={optionValue} value={optionValue}>{optionLabel}</option> })}
  </select></Field>
}

function Toggle({ label, checked, onChange, disabled }) {
  return <label className={`pe-toggle ${disabled ? 'disabled' : ''}`}><input type="checkbox" checked={Boolean(checked)} disabled={disabled} onChange={event => onChange(event.target.checked)} /><span>{label}</span></label>
}

function RowTools({ onUp, onDown, onRemove, removeLabel = 'Remove' }) {
  return <div className="pe-tools">
    {onUp && <button type="button" onClick={onUp} aria-label="Move up" title="Move up"><ArrowUp /></button>}
    {onDown && <button type="button" onClick={onDown} aria-label="Move down" title="Move down"><ArrowDown /></button>}
    <button type="button" className="danger" onClick={onRemove} aria-label={removeLabel} title={removeLabel}><Trash2 /></button>
  </div>
}

function AddButton({ children, onClick }) {
  return <button type="button" className="pe-add" onClick={onClick}><Plus /> {children}</button>
}

function OverviewTab({ project, save, onPreview, onCopy, onRestore, onDelete }) {
  const projects = projectStore.get()
  const invite = `Track your project with SideQuest Tech\n${window.location.origin}/#track\n\nEmail: ${project.client.email}\nAccess code: ${project.accessCode}`
  return <>
    <section className="pe-card">
      <h3>Project</h3>
      <div className="pe-grid">
        <Text label="Project name" value={project.name} onChange={value => save({ name: value })} wide />
        <Select label="Service" value={project.service} options={needOptions.map(([value, label]) => [value, label.replace('I need ', '').replace('I am ', '')])} onChange={value => save({ service: value, serviceLabel: services.find(item => item.short === value)?.name || project.serviceLabel })} />
        <Select label="Health (admin list only)" value={project.health} options={healthOptions} onChange={value => save({ health: value })} />
        <Area label="Summary" value={project.summary} onChange={value => save({ summary: value })} placeholder="One paragraph on what is being built and why." />
        <Text type="date" label="Started" value={project.startedAt} onChange={value => save({ startedAt: value })} />
        <Text type="date" label="Launch date" value={project.targetLaunch} onChange={value => save({ targetLaunch: value })} />
        <Text type="date" label="Last update shown" value={project.lastUpdated} onChange={value => save({ lastUpdated: value })} hint="Moves to today whenever you edit" />
        <Text label="Status line label" value={project.buildLabel} onChange={value => save({ buildLabel: value })} placeholder="internet-athi / redesign" />
        <Text label="Domain" value={project.domain} onChange={value => save({ domain: value })} placeholder="clientdomain.co.za" />
        <Text label="Tagline" value={project.tagline} onChange={value => save({ tagline: value })} />
        <Area label="Update rhythm (shown under the team)" value={project.cadence} onChange={value => save({ cadence: value })} rows={2} />
      </div>
    </section>
    <section className="pe-card">
      <h3>Client and access</h3>
      <div className="pe-grid">
        <Text label="Client name" value={project.client.name} onChange={value => save({ client: { ...project.client, name: value } })} />
        <Text label="First name" value={project.client.contact} onChange={value => save({ client: { ...project.client, contact: value } })} />
        <Text label="Company" value={project.client.company} onChange={value => save({ client: { ...project.client, company: value } })} />
        <Text label="Location" value={project.client.location} onChange={value => save({ client: { ...project.client, location: value } })} />
        <Text type="email" label="Sign-in email" value={project.client.email} onChange={value => save({ client: { ...project.client, email: value } })} />
        <Field label="Access code" hint="What the client types to sign in">
          <div className="pe-inline">
            <input className="code" value={project.accessCode || ''} onChange={event => save({ accessCode: event.target.value.toUpperCase().replace(/\s+/g, '') })} />
            <button type="button" className="crm-button secondary" onClick={() => save({ accessCode: generateAccessCode(project.client.company || project.client.name, projects.filter(item => item.id !== project.id)) })}><KeyRound /> Generate</button>
          </div>
        </Field>
      </div>
      <div className="pe-actions">
        <button type="button" className="crm-button primary" onClick={() => onPreview(project.id)}><Eye /> Open client view</button>
        <button type="button" className="crm-button secondary" onClick={() => onCopy(invite, 'Invite copied')}><Copy /> Copy invite</button>
        {onRestore && <button type="button" className="crm-button secondary" onClick={onRestore}><RotateCcw /> Restore demo data</button>}
        <button type="button" className="crm-button danger" onClick={onDelete}><Trash2 /> Delete project</button>
      </div>
    </section>
  </>
}

function StageEditor({ stage, onChange }) {
  const tasks = stageTasks(stage)
  const Icon = stage.icon
  const setTasks = next => onChange({ tasks: next })
  const setStatus = status => {
    const fields = { status, tasks: tasks.map(task => ({ label: task.label, done: status === 'complete' ? true : status === 'upcoming' ? false : task.done })) }
    if (status === 'complete' && !stage.completedAt) fields.completedAt = todayIso()
    if (status !== 'upcoming' && !stage.startedAt) fields.startedAt = todayIso()
    onChange(fields)
  }
  return <article className={`pe-stage ${stage.status}`}>
    <header>
      <span className="pe-stage-icon">{stage.status === 'complete' ? <Check /> : <Icon />}</span>
      <div><h3>{String(stage.index + 1).padStart(2, '0')} {stage.name}</h3><p>{stage.blurb}</p></div>
      <Select label="Status" value={stage.status} options={stageStatuses} onChange={setStatus} />
    </header>
    <div className="pe-grid">
      {stage.status !== 'upcoming' && <Text type="date" label="Started" value={stage.startedAt} onChange={value => onChange({ startedAt: value })} />}
      {stage.status === 'complete' && <Text type="date" label="Completed" value={stage.completedAt} onChange={value => onChange({ completedAt: value })} />}
      {stage.status === 'upcoming' && <Text type="date" label="Planned from" value={stage.plannedFrom} onChange={value => onChange({ plannedFrom: value })} />}
      <Text label="Headline shown to the client" value={stage.summary} onChange={value => onChange({ summary: value })} wide placeholder="One sentence on what this stage is about right now." />
      <Text label="Note (optional)" value={stage.note} onChange={value => onChange({ note: value })} wide placeholder="Context the client should know, for example why a stage reopened." />
    </div>
    <div className="pe-steps">
      <h4>Steps {tasks.length > 0 && <span>{tasks.filter(task => task.done).length} of {tasks.length} done</span>}</h4>
      {tasks.map((task, index) => <div className="pe-row" key={index}>
        <input type="checkbox" checked={task.done} disabled={stage.status !== 'active'} title={stage.status === 'active' ? 'Done' : 'Set the stage to in progress to tick steps'} onChange={event => setTasks(replaceAt(tasks, index, { ...task, done: event.target.checked }))} aria-label="Done" />
        <input value={task.label} placeholder="What needs to happen" onChange={event => setTasks(replaceAt(tasks, index, { ...task, label: event.target.value }))} />
        <RowTools onUp={() => setTasks(move(tasks, index, -1))} onDown={() => setTasks(move(tasks, index, 1))} onRemove={() => setTasks(removeAt(tasks, index))} />
      </div>)}
      <AddButton onClick={() => setTasks([...tasks, { label: '', done: false }])}>Add step</AddButton>
    </div>
  </article>
}

function StagesTab({ project, save }) {
  return <>
    <p className="pe-help">{stageLabel(project)}. {projectProgress(project)}% complete overall. More than one stage can be in progress at the same time.</p>
    {projectStages(project).map(stage => <StageEditor key={stage.id} stage={stage} onChange={fields => save(current => ({ stages: current.stages.map(item => item.id === stage.id ? { ...item, ...fields } : item) }))} />)}
  </>
}

function UpdatesTab({ project, save, onToast }) {
  const authors = project.team.map(member => member.name)
  const [draft, setDraft] = useState({ date: todayIso(), type: 'update', author: authors[0] || '', title: '', body: '' })
  const setField = (name, value) => setDraft(current => ({ ...current, [name]: value }))
  const post = () => {
    if (!draft.title.trim()) return onToast('Give the update a title first')
    const entry = { id: newId('u'), ...draft, title: draft.title.trim(), body: draft.body.trim() }
    save(current => ({ updates: byDateDesc([entry, ...current.updates]), lastUpdated: laterDate(current.lastUpdated, draft.date) }))
    setDraft(current => ({ ...current, title: '', body: '' }))
    onToast('Update posted to the tracker')
  }
  const setEntry = (id, fields) => save(current => ({ updates: byDateDesc(current.updates.map(entry => entry.id === id ? { ...entry, ...fields } : entry)) }))
  const remove = id => save(current => ({ updates: current.updates.filter(entry => entry.id !== id) }))
  return <>
    <section className="pe-card pe-compose">
      <h3>Post an update</h3>
      <div className="pe-grid">
        <Text type="date" label="Date" value={draft.date} onChange={value => setField('date', value)} />
        <Select label="Type" value={draft.type} options={updateTypes} onChange={value => setField('type', value)} />
        {authors.length ? <Select label="Author" value={draft.author} options={authors} onChange={value => setField('author', value)} /> : <Text label="Author" value={draft.author} onChange={value => setField('author', value)} />}
        <Text label="Title" value={draft.title} onChange={value => setField('title', value)} wide placeholder="What happened, in one line" />
        <Area label="Details" value={draft.body} onChange={value => setField('body', value)} placeholder="Plain language. The client reads this on Friday." />
      </div>
      <button type="button" className="crm-button primary" onClick={post}><Plus /> Post update</button>
    </section>
    <section className="pe-card">
      <h3>Posted updates <span>{project.updates.length}</span></h3>
      {project.updates.map(entry => <div className="pe-entry" key={entry.id}>
        <div className="pe-grid">
          <Text type="date" label="Date" value={entry.date} onChange={value => setEntry(entry.id, { date: value })} />
          <Select label="Type" value={entry.type} options={updateTypes} onChange={value => setEntry(entry.id, { type: value })} />
          <Text label="Author" value={entry.author} onChange={value => setEntry(entry.id, { author: value })} />
          <Text label="Title" value={entry.title} onChange={value => setEntry(entry.id, { title: value })} wide />
          <Area label="Details" value={entry.body} onChange={value => setEntry(entry.id, { body: value })} rows={2} />
        </div>
        <div className="pe-entry-foot"><RowTools onRemove={() => remove(entry.id)} removeLabel="Remove update" /></div>
      </div>)}
      {!project.updates.length && <p className="pe-help">Nothing posted yet.</p>}
    </section>
  </>
}

function DeliverablesTab({ project, save }) {
  const items = project.deliverables
  const setItems = next => save({ deliverables: next })
  const setItem = (index, fields) => setItems(replaceAt(items, index, { ...items[index], ...fields }))
  return <section className="pe-card">
    <h3>Deliverables <span>{items.length}</span></h3>
    <p className="pe-help">Group them as Pages, Features, Launch or anything else. Tick "client can approve" to show an Approve button in the tracker while the status is "Awaiting your approval".</p>
    {items.map((item, index) => <div className="pe-entry" key={item.id}>
      <div className="pe-grid">
        <Text label="Group" value={item.group} onChange={value => setItem(index, { group: value })} placeholder="Pages" />
        <Text label="Name" value={item.name} onChange={value => setItem(index, { name: value })} />
        <Select label="Status" value={item.status} options={deliverableStatuses} onChange={value => setItem(index, { status: value, ...(value !== 'Approved' ? { approvedBy: undefined, approvedAt: undefined } : {}) })} />
        <Text type="date" label="Date" value={item.date} onChange={value => setItem(index, { date: value })} />
        <Text label="Description" value={item.description} onChange={value => setItem(index, { description: value })} wide />
        <Text label="Note shown to the client" value={item.note} onChange={value => setItem(index, { note: value })} wide />
      </div>
      <div className="pe-entry-foot">
        <Toggle label="Client can approve" checked={item.approvable} onChange={value => setItem(index, { approvable: value })} />
        {item.approvedBy === 'client' && <span className="pe-flag"><Check /> Approved by the client on {dateLabel(item.approvedAt)}</span>}
        <RowTools onUp={() => setItems(move(items, index, -1))} onDown={() => setItems(move(items, index, 1))} onRemove={() => setItems(removeAt(items, index))} />
      </div>
    </div>)}
    <AddButton onClick={() => setItems([...items, { id: newId('d'), group: items.at(-1)?.group || 'Pages', name: '', description: '', status: 'Scheduled', date: '' }])}>Add deliverable</AddButton>
  </section>
}

function ClientTab({ project, save }) {
  const actions = project.actions
  const setActions = next => save({ actions: next })
  const setAction = (index, fields) => setActions(replaceAt(actions, index, { ...actions[index], ...fields }))
  const dates = project.keyDates
  const setDates = next => save({ keyDates: next })
  const setDate = (index, fields) => setDates(replaceAt(dates, index, { ...dates[index], ...fields }))
  const deliverableOptions = [['', 'None'], ...project.deliverables.map(item => [item.id, item.name || item.id])]
  return <>
    <section className="pe-card">
      <h3>Waiting on the client <span>{actions.filter(action => !action.done).length} open</span></h3>
      <p className="pe-help">These show at the top of the client's overview. Link one to a deliverable and it closes itself when the client approves.</p>
      {actions.map((action, index) => <div className="pe-entry" key={action.id}>
        <div className="pe-grid">
          <Text label="What we need" value={action.title} onChange={value => setAction(index, { title: value })} wide />
          <Text label="Detail" value={action.detail} onChange={value => setAction(index, { detail: value })} wide />
          <Text type="date" label="Due" value={action.due} onChange={value => setAction(index, { due: value })} />
          <Select label="Linked deliverable" value={action.deliverableId || ''} options={deliverableOptions} onChange={value => setAction(index, { deliverableId: value || undefined })} />
        </div>
        <div className="pe-entry-foot">
          <Toggle label="Optional" checked={action.optional} onChange={value => setAction(index, { optional: value })} />
          <Toggle label="Done" checked={action.done} onChange={value => setAction(index, { done: value, doneAt: value ? new Date().toISOString() : undefined, doneBy: value ? 'admin' : undefined })} />
          {action.doneBy === 'client' && <span className="pe-flag"><Check /> Ticked by the client on {dateLabel(action.doneAt)}</span>}
          <RowTools onUp={() => setActions(move(actions, index, -1))} onDown={() => setActions(move(actions, index, 1))} onRemove={() => setActions(removeAt(actions, index))} />
        </div>
      </div>)}
      <AddButton onClick={() => setActions([...actions, { id: newId('a'), title: '', detail: '', due: '' }])}>Add item</AddButton>
    </section>
    <section className="pe-card">
      <h3>Key dates <span>{dates.length}</span></h3>
      {dates.map((item, index) => <div className="pe-row dates" key={index}>
        <input value={item.label || ''} placeholder="Label" onChange={event => setDate(index, { label: event.target.value })} />
        <input type="date" value={item.date || ''} onChange={event => setDate(index, { date: event.target.value })} />
        <input value={item.note || ''} placeholder="Note (optional)" onChange={event => setDate(index, { note: event.target.value })} />
        <Toggle label="Highlight" checked={item.highlight} onChange={value => setDate(index, { highlight: value })} />
        <RowTools onUp={() => setDates(move(dates, index, -1))} onDown={() => setDates(move(dates, index, 1))} onRemove={() => setDates(removeAt(dates, index))} />
      </div>)}
      <AddButton onClick={() => setDates([...dates, { label: '', date: '' }])}>Add date</AddButton>
    </section>
  </>
}

function SimpleList({ title, items, fields, onChange, blank, addLabel }) {
  const setItem = (index, name, value) => onChange(replaceAt(items, index, { ...items[index], [name]: value }))
  return <section className="pe-card">
    <h3>{title} <span>{items.length}</span></h3>
    {items.map((item, index) => <div className={`pe-row cols-${fields.length}`} key={index}>
      {fields.map(([name, placeholder, type = 'text']) => <input key={name} type={type} value={item[name] || ''} placeholder={placeholder} onChange={event => setItem(index, name, event.target.value)} />)}
      <RowTools onUp={() => onChange(move(items, index, -1))} onDown={() => onChange(move(items, index, 1))} onRemove={() => onChange(removeAt(items, index))} />
    </div>)}
    <AddButton onClick={() => onChange([...items, { ...blank }])}>{addLabel}</AddButton>
  </section>
}

function TeamTab({ project, save }) {
  return <>
    <SimpleList title="Team" items={project.team} fields={[['name', 'Name'], ['role', 'Role']]} blank={{ name: '', role: 'Engineer' }} addLabel="Add person" onChange={team => save({ team })} />
    <SimpleList title="Links" items={project.links || []} fields={[['label', 'Label'], ['url', 'https://', 'url'], ['note', 'Note']]} blank={{ label: '', url: '', note: '' }} addLabel="Add link" onChange={links => save({ links })} />
    <SimpleList title="By the numbers" items={project.numbers || []} fields={[['value', 'Value'], ['label', 'Label']]} blank={{ value: '', label: '' }} addLabel="Add number" onChange={numbers => save({ numbers })} />
    <SimpleList title="Payment schedule" items={project.payments || []} fields={[['label', 'Milestone'], ['share', 'Share, e.g. 40%'], ['status', 'Paid or Due at go-live'], ['date', '', 'date']]} blank={{ label: '', share: '', status: 'Due', date: '' }} addLabel="Add payment" onChange={payments => save({ payments })} />
  </>
}

export default function ProjectEditor({ project, onPreview, onCopy, onToast, onDelete, onRestore }) {
  const [tab, setTab] = useState('overview')
  const save = patch => projectStore.update(project.id, current => {
    const fields = typeof patch === 'function' ? patch(current) : patch
    return 'lastUpdated' in fields ? fields : { ...fields, lastUpdated: todayIso() }
  })

  return <div className="pe-editor">
    <header className="pe-editor-head">
      <div>
        <small>{project.reference} · {project.serviceLabel}</small>
        <h2>{project.name || 'Untitled project'}</h2>
        <p>{stageLabel(project)} · {projectProgress(project)}% complete · changes save as you type</p>
      </div>
      <button type="button" className="crm-button secondary" onClick={() => onPreview(project.id)}><Eye /> Client view</button>
    </header>
    <div className="pe-tabs" role="tablist">{tabs.map(([value, label]) => <button type="button" key={value} role="tab" aria-selected={tab === value} className={tab === value ? 'active' : ''} onClick={() => setTab(value)}>{label}</button>)}</div>
    {tab === 'overview' && <OverviewTab project={project} save={save} onPreview={onPreview} onCopy={onCopy} onRestore={onRestore} onDelete={onDelete} />}
    {tab === 'stages' && <StagesTab project={project} save={save} />}
    {tab === 'updates' && <UpdatesTab project={project} save={save} onToast={onToast} />}
    {tab === 'deliverables' && <DeliverablesTab project={project} save={save} />}
    {tab === 'client' && <ClientTab project={project} save={save} />}
    {tab === 'team' && <TeamTab project={project} save={save} />}
  </div>
}
