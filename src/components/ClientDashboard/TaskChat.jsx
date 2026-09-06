import { useEffect, useRef, useState } from 'react'
import { Paperclip, X, Clock } from 'lucide-react'
import { useClickUpComments } from '../../hooks/useClickUp'

const fmt = ts => {
  if (!ts) return ''
  const d = new Date(Number(ts))
  const today = new Date()
  const isToday = d.toDateString() === today.toDateString()
  const time = d.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })
  if (isToday) return time
  return d.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short' }) + ' · ' + time
}

// Client messages are stored as "[Name]: text" — parse to extract sender and body
const parseComment = (c) => {
  const match = c.comment_text?.match(/^\[(.+?)\]: ([\s\S]*)/)
  if (match) {
    return { name: match[1], text: match[2], isClient: true }
  }
  return { name: 'SideQuest Tech', text: c.comment_text || '', isClient: false }
}

// Calculate billable hours from developer message timestamps
// Sessions are groups of messages with gaps < 30 minutes
// Each session time = (last message - first message) in that session
const calculateWorkHours = (comments) => {
  if (!comments?.length) return { totalHours: 0, sessions: [] }
  
  // Filter and sort developer messages by timestamp
  const devMessages = comments
    .map(c => ({ ...c, parsed: parseComment(c) }))
    .filter(c => !c.parsed.isClient)
    .sort((a, b) => Number(a.date) - Number(b.date))
  
  if (devMessages.length === 0) return { totalHours: 0, sessions: [] }
  if (devMessages.length === 1) {
    // Single message = assume minimum 15 minutes of work
    return { 
      totalHours: 0.25, 
      sessions: [{ 
        start: Number(devMessages[0].date), 
        end: Number(devMessages[0].date) + (15 * 60 * 1000),
        messages: 1,
        hours: 0.25 
      }] 
    }
  }
  
  const SESSION_GAP_MS = 30 * 60 * 1000 // 30 minutes
  const MIN_SESSION_MS = 15 * 60 * 1000 // Minimum 15 minutes per session
  const sessions = []
  let currentSession = { start: Number(devMessages[0].date), messages: 1 }
  
  for (let i = 1; i < devMessages.length; i++) {
    const prevTime = Number(devMessages[i - 1].date)
    const currTime = Number(devMessages[i].date)
    const gap = currTime - prevTime
    
    if (gap > SESSION_GAP_MS) {
      // End current session
      currentSession.end = prevTime
      const duration = Math.max(currentSession.end - currentSession.start, MIN_SESSION_MS)
      currentSession.hours = duration / (1000 * 60 * 60) // Convert to hours
      sessions.push(currentSession)
      
      // Start new session
      currentSession = { start: currTime, messages: 1 }
    } else {
      currentSession.messages++
    }
  }
  
  // Close final session
  currentSession.end = Number(devMessages[devMessages.length - 1].date)
  const duration = Math.max(currentSession.end - currentSession.start, MIN_SESSION_MS)
  currentSession.hours = duration / (1000 * 60 * 60)
  sessions.push(currentSession)
  
  const totalHours = sessions.reduce((sum, s) => sum + s.hours, 0)
  
  return { totalHours, sessions }
}

export default function TaskChat({ task, client, onClose }) {
  const { comments, loading, refresh, postComment, postAttachment } = useClickUpComments(task?.id)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [showSessions, setShowSessions] = useState(false)
  const fileRef = useRef(null)
  const bottomRef = useRef(null)

  // Calculate work hours from message timestamps
  const { totalHours, sessions } = calculateWorkHours(comments)

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: comments?.length > 0 ? 'smooth' : 'instant' })
  }, [comments])

  // Poll for new messages every 10 seconds while drawer is open
  useEffect(() => {
    const id = setInterval(refresh, 10000)
    return () => clearInterval(id)
  }, [])

  const send = async () => {
    if (!text.trim() || sending) return
    setSending(true)
    try {
      const prefixed = client?.name ? `[${client.name}]: ${text.trim()}` : text.trim()
      await postComment(prefixed)
      setText('')
    } finally { setSending(false) }
  }

  const handleFile = async e => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 3 * 1024 * 1024) { alert('Please keep attachments under 3 MB.'); return }
    setSending(true)
    try { await postAttachment(file) } finally { setSending(false); e.target.value = '' }
  }

  return <div className="cp-chat-overlay" onMouseDown={e => e.target === e.currentTarget && onClose()}>
    <div className="cp-chat-drawer">
      <div className="cp-chat-head">
        <div>
          <strong>{task?.name}</strong>
          <small>Task discussion</small>
        </div>
        <button onClick={onClose}><X size={14} /></button>
      </div>

      {totalHours > 0 && (
        <div className="cp-chat-hours-summary">
          <Clock size={16} />
          <div style={{ flex: 1 }}>
            <strong>{totalHours.toFixed(1)} hours</strong> logged on this task
            <small style={{ display: 'block', fontSize: '9px', marginTop: '2px', opacity: 0.7 }}>
              {sessions.length} work session{sessions.length !== 1 ? 's' : ''} detected
            </small>
          </div>
          <button 
            onClick={() => setShowSessions(!showSessions)}
            style={{
              background: 'transparent',
              border: '1px solid rgba(30,125,82,0.3)',
              color: '#1e7d52',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '9px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            {showSessions ? 'Hide' : 'Show'} Sessions
          </button>
        </div>
      )}

      {showSessions && sessions.length > 0 && (
        <div className="cp-chat-sessions">
          {sessions.map((session, i) => {
            const start = new Date(session.start)
            const end = new Date(session.end)
            const startStr = start.toLocaleString('en-ZA', { 
              month: 'short', 
              day: 'numeric', 
              hour: '2-digit', 
              minute: '2-digit' 
            })
            const endStr = end.toLocaleTimeString('en-ZA', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })
            
            return (
              <div key={i} className="cp-chat-session">
                <div className="cp-session-time">
                  {startStr} → {endStr}
                </div>
                <div className="cp-session-info">
                  <span>{session.messages} message{session.messages !== 1 ? 's' : ''}</span>
                  <strong>{session.hours.toFixed(2)}h</strong>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="cp-chat-messages">
        {loading && <div className="cp-loading" />}
        {!loading && !comments?.length && (
          <div className="cp-chat-empty">No messages yet. Start the conversation below.</div>
        )}
        {comments?.map(c => {
          const { name, text: body, isClient } = parseComment(c)
          const isMine = isClient && name === client?.name
          
          return <div key={c.id} className={`cp-chat-msg ${isMine ? 'mine' : ''}`}>
            {!isMine && (
              <div className="cp-chat-avatar team">
                {name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="cp-chat-bubble">
              <strong>{isMine ? 'You' : name}</strong>
              <p>{body}</p>
              {c.attachments?.map((a, i) =>
                a.url ? <img key={i} src={a.url} alt={a.title || 'attachment'} /> : null
              )}
              <time>{fmt(c.date)}</time>
            </div>
          </div>
        })}
        <div ref={bottomRef} />
      </div>

      <div className="cp-chat-input">
        <textarea
          placeholder="Write a message… (Ctrl+Enter to send)"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send() }}
        />
        <div className="cp-chat-actions">
          <label className="cp-chat-attach">
            <Paperclip size={13} /> Attach image
            <input ref={fileRef} type="file" accept="image/*,.pdf" hidden onChange={handleFile} />
          </label>
          <button className="cp-chat-send" onClick={send} disabled={!text.trim() || sending}>
            {sending ? 'Sending…' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  </div>
}
