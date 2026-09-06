import { useState } from 'react'
import { LayoutGrid, List, RefreshCw } from 'lucide-react'
import TaskChat from './TaskChat'

const priorityLabel = p => {
  if (!p) return null
  const map = { 1: 'urgent', 2: 'high', 3: 'normal', 4: 'low' }
  return map[p.id] || p.priority?.toLowerCase()
}

const fmtDate = ts => {
  if (!ts) return null
  return new Date(Number(ts)).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short' })
}

const fmtTime = date => {
  if (!date) return ''
  const now = new Date()
  const diff = Math.floor((now - date) / 1000) // seconds
  
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return date.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })
}

function KanbanView({ tasks, onTaskClick }) {
  const columns = {}
  tasks?.forEach(t => {
    const col = t.status?.status || 'No Status'
    if (!columns[col]) columns[col] = { label: col, orderindex: t.status?.orderindex ?? 99, tasks: [] }
    columns[col].tasks.push(t)
  })
  const cols = Object.values(columns).sort((a, b) => a.orderindex - b.orderindex)

  return <div className="cp-kanban">
    {cols.map(col => (
      <div key={col.label} className="cp-kanban-col">
        <header>
          <span>{col.label}</span>
          <span>{col.tasks.length}</span>
        </header>
        <div>
          {col.tasks.length === 0
            ? <div className="cp-kanban-empty">No tasks</div>
            : col.tasks.map(t => {
              const priority = priorityLabel(t.priority)
              return <div key={t.id} className="cp-task-card" onClick={() => onTaskClick(t)}>
                <strong>{t.name}</strong>
                {t.description && <small>{t.description.slice(0, 70)}{t.description.length > 70 ? '…' : ''}</small>}
                <div className="cp-task-meta">
                  {priority && <span className={`cp-task-priority ${priority}`}>{priority}</span>}
                  {t.due_date && <span className="cp-task-due">{fmtDate(t.due_date)}</span>}
                </div>
              </div>
            })}
        </div>
      </div>
    ))}
  </div>
}

function ListView({ tasks, onTaskClick }) {
  return <div className="cp-task-list">
    <div className="cp-task-list-head">
      <span>Task</span>
      <span>Status</span>
      <span>Priority</span>
      <span>Due</span>
    </div>
    {tasks?.map(t => {
      const priority = priorityLabel(t.priority)
      return <div key={t.id} className="cp-task-list-row" onClick={() => onTaskClick(t)}>
        <div>
          <strong>{t.name}</strong>
          {t.description && <small>{t.description.slice(0, 60)}{t.description.length > 60 ? '…' : ''}</small>}
        </div>
        <span className="cp-task-list-status">{t.status?.status || '—'}</span>
        {priority ? <span className={`cp-task-priority ${priority}`}>{priority}</span> : <span>—</span>}
        <span className="cp-task-list-due">{t.due_date ? fmtDate(t.due_date) : '—'}</span>
      </div>
    })}
    {!tasks?.length && (
      <div style={{ padding: '40px 20px', textAlign: 'center', color: '#8a99ad', fontSize: '12px' }}>
        No tasks yet.
      </div>
    )}
  </div>
}

export default function TaskBoard({ tasks, loading, error, client, lastUpdated, onRefresh }) {
  const [boardView, setBoardView] = useState(() => localStorage.getItem('sidequest_board_view') || 'kanban')
  const [activeTask, setActiveTask] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  const setView = v => { setBoardView(v); localStorage.setItem('sidequest_board_view', v) }

  const handleRefresh = async () => {
    setRefreshing(true)
    await onRefresh?.()
    setTimeout(() => setRefreshing(false), 500) // Ensure spinner shows for at least 500ms
  }

  return <>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {lastUpdated && (
          <span style={{ fontSize: '11px', color: '#8a99ad' }}>
            Updated {fmtTime(lastUpdated)}
          </span>
        )}
        <button 
          onClick={handleRefresh}
          disabled={refreshing}
          style={{ 
            padding: '6px 12px', 
            fontSize: '12px', 
            background: 'transparent', 
            border: '1px solid #dfe4ea', 
            borderRadius: '6px',
            cursor: refreshing ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: '#1a2a3a'
          }}
        >
          <RefreshCw size={12} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>
      
      <div className="cp-view-toggle">
        <button className={boardView === 'kanban' ? 'active' : ''} onClick={() => setView('kanban')}>
          <LayoutGrid size={13} /> Board
        </button>
        <button className={boardView === 'list' ? 'active' : ''} onClick={() => setView('list')}>
          <List size={13} /> List
        </button>
      </div>
    </div>

    {loading && <div className="cp-loading">Loading tasks</div>}
    {error && <div className="cp-error"><p>Could not load tasks. Please refresh.</p></div>}
    {!loading && !error && (
      boardView === 'kanban'
        ? <KanbanView tasks={tasks} onTaskClick={setActiveTask} />
        : <ListView tasks={tasks} onTaskClick={setActiveTask} />
    )}

    {activeTask && <TaskChat task={activeTask} client={client} onClose={() => setActiveTask(null)} />}
  </>
}
