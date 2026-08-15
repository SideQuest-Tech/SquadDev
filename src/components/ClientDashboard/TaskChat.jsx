import { useEffect, useRef, useState } from 'react'
import { Paperclip, X } from 'lucide-react'
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
  if (match) return { name: match[1], text: match[2], isClient: true }
  return { name: 'SideQuest Tech', text: c.comment_text || '', isClient: false }
}

export default function TaskChat({ task, client, onClose }) {
  const { comments, loading, refresh, postComment, postAttachment } = useClickUpComments(task?.id)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const fileRef = useRef(null)
  const bottomRef = useRef(null)

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
