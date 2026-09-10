import React, { useEffect, useRef, useState } from 'react'
import { Paperclip, X, Clock } from 'lucide-react'
import { useClickUpComments, ClickUpTask, ClickUpComment } from '../../hooks/useClickUp'
import { ClientPayload } from '../../storage'

const fmt = (ts: string | undefined): string => {
  if (!ts) return ''
  const d = new Date(Number(ts))
  const today = new Date()
  const isToday = d.toDateString() === today.toDateString()
  const time = d.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })
  if (isToday) return time
  return d.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short' }) + ' · ' + time
}

// Extract hours from text in format [Xh] or [X.Xh] (e.g., [2h], [2.5h])
const extractHours = (text: string | undefined): number | null => {
  const match = text?.match(/\[(\d+(?:\.\d+)?h)\]/i)
  if (!match) return null
  const hours = parseFloat(match[1].replace('h', ''))
  return isNaN(hours) ? null : hours
}

interface ParsedComment {
  name: string
  text: string
  isClient: boolean
  hours: number | null
}

// Client messages are stored as "[Name]: text" — parse to extract sender and body
const parseComment = (c: ClickUpComment): ParsedComment => {
  const match = c.comment_text?.match(/^\[(.+?)\]: ([\s\S]*)/)
  if (match) {
    const hours = extractHours(match[2])
    return { name: match[1], text: match[2], isClient: true, hours }
  }
  const hours = extractHours(c.comment_text)
  return { name: 'SideQuest Tech', text: c.comment_text || '', isClient: false, hours }
}

// Calculate total billable hours from all developer messages
const calculateTotalHours = (comments: ClickUpComment[] | null): number => {
  if (!comments?.length) return 0
  return comments.reduce((total, c) => {
    const parsed = parseComment(c)
    if (!parsed.isClient && parsed.hours) {
      return total + parsed.hours
    }
    return total
  }, 0)
}

interface TaskChatProps {
  task: ClickUpTask
  client: ClientPayload
  onClose: () => void
}

export default function TaskChat({ task, client, onClose }: TaskChatProps): React.ReactElement {
  const { comments, loading, refresh, postComment, postAttachment } = useClickUpComments(task?.id)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Calculate total hours from developer messages
  const totalHours = calculateTotalHours(comments)

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: comments?.length ? 'smooth' : 'instant' })
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

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
          <span>
            <strong>{totalHours.toFixed(1)} hours</strong> logged on this task
          </span>
        </div>
      )}

      <div className="cp-chat-messages">
        {loading && <div className="cp-loading" />}
        {!loading && !comments?.length && (
          <div className="cp-chat-empty">No messages yet. Start the conversation below.</div>
        )}
        {comments?.map(c => {
          const { name, text: body, isClient, hours } = parseComment(c)
          const isMine = isClient && name === client?.name
          const showHoursBadge = !isClient && hours

          return <div key={c.id} className={`cp-chat-msg ${isMine ? 'mine' : ''}`}>
            {!isMine && (
              <div className="cp-chat-avatar team">
                {name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="cp-chat-bubble">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <strong>{isMine ? 'You' : name}</strong>
                {showHoursBadge && (
                  <span className="cp-chat-hours-badge">
                    <Clock size={11} /> {hours}h
                  </span>
                )}
              </div>
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
