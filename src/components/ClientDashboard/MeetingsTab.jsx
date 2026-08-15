import { useEffect, useState } from 'react'
import { Calendar, Check, Clock, Plus, Video, X } from 'lucide-react'
import { clientSessionStore } from '../../storage'

const TZ = 'Africa/Johannesburg'

const fmtDateTime = iso => new Date(iso).toLocaleString('en-ZA', {
  weekday: 'short', day: '2-digit', month: 'short',
  year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: TZ
})

const fmtDate = iso => new Date(iso).toLocaleDateString('en-ZA', {
  day: '2-digit', month: 'short', timeZone: TZ
})

const fmtTime = iso => new Date(iso).toLocaleTimeString('en-ZA', {
  hour: '2-digit', minute: '2-digit', timeZone: TZ
})

// ─── Calendar helpers ────────────────────────────────────────────────────────

const gcalUrl = meeting => {
  const s = new Date(meeting.confirmedTime)
  const e = new Date(s.getTime() + meeting.duration * 60000)
  const fmt = d => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  return `https://calendar.google.com/calendar/render?action=TEMPLATE` +
    `&text=${encodeURIComponent(meeting.title)}` +
    `&dates=${fmt(s)}/${fmt(e)}` +
    `&details=${encodeURIComponent('Join via Google Meet: ' + meeting.meetLink)}` +
    `&location=${encodeURIComponent(meeting.meetLink)}`
}

const downloadICS = meeting => {
  const s = new Date(meeting.confirmedTime)
  const e = new Date(s.getTime() + meeting.duration * 60000)
  const fmt = d => d.toISOString().replace(/[-:]/g, '').replace('.000', '')
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//SideQuest Tech//EN',
    'BEGIN:VEVENT',
    `UID:${meeting.id}@sidequesttech.co.za`,
    `DTSTART:${fmt(s)}`, `DTEND:${fmt(e)}`,
    `SUMMARY:${meeting.title}`,
    `DESCRIPTION:Join via Google Meet: ${meeting.meetLink}`,
    `LOCATION:${meeting.meetLink}`,
    'END:VEVENT', 'END:VCALENDAR'
  ].join('\r\n')
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' })),
    download: 'meeting.ics'
  })
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
}

// ─── Request modal (client proposes meeting) ─────────────────────────────────

function RequestModal({ onClose, onCreated }) {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [duration, setDuration] = useState(60)
  const [slots, setSlots] = useState(['', '', ''])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const setSlot = (i, v) => setSlots(s => s.map((x, idx) => idx === i ? v : x))
  const filledSlots = slots.filter(Boolean)

  const submit = async () => {
    setError('')
    if (!title.trim()) return setError('Please enter a meeting title.')
    if (!filledSlots.length) return setError('Please suggest at least one time slot.')
    setSaving(true)
    try {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${clientSessionStore.getToken()}` },
        body: JSON.stringify({ title: title.trim(), message: message.trim(), duration, proposedTimes: filledSlots })
      })
      const data = await res.json()
      if (!data.ok) return setError(data.error || 'Failed to send request.')
      onCreated()
      onClose()
    } catch { setError('Network error. Please try again.') }
    finally { setSaving(false) }
  }

  return <div className="cp-chat-overlay" onMouseDown={e => e.target === e.currentTarget && onClose()}>
    <div className="cp-chat-drawer" style={{ maxWidth: 480 }}>
      <div className="cp-chat-head">
        <div><strong>Request a meeting</strong><small>We'll confirm a time and create a Google Meet link.</small></div>
        <button onClick={onClose}><X size={14} /></button>
      </div>
      <div style={{ padding: '20px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="cp-form-group">
          <label>Meeting title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Design review" />
        </div>
        <div className="cp-form-group">
          <label>Agenda / notes <span style={{ fontWeight: 400, color: '#9ab' }}>(optional)</span></label>
          <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="What would you like to discuss?" style={{ minHeight: 70 }} />
        </div>
        <div className="cp-form-group">
          <label>Duration</label>
          <select value={duration} onChange={e => setDuration(Number(e.target.value))}>
            <option value={30}>30 minutes</option>
            <option value={60}>60 minutes</option>
            <option value={90}>90 minutes</option>
          </select>
        </div>
        <div className="cp-form-group">
          <label>Proposed time slots <span style={{ fontWeight: 400, color: '#9ab' }}>(suggest up to 3)</span></label>
          {slots.map((s, i) => (
            <input key={i} type="datetime-local" value={s} onChange={e => setSlot(i, e.target.value)}
              style={{ marginBottom: i < 2 ? 6 : 0 }} />
          ))}
        </div>
        {error && <div className="cp-form-error">{error}</div>}
      </div>
      <div style={{ padding: '14px 20px', borderTop: '1px solid #e4eaf2', display: 'flex', justifyContent: 'flex-end' }}>
        <button className="cp-chat-send" disabled={saving} onClick={submit}>
          {saving ? 'Sending…' : 'Send request'}
        </button>
      </div>
    </div>
  </div>
}

// ─── Accept modal (client confirms one of admin's proposed slots) ─────────────

function AcceptModal({ meeting, onClose, onDone }) {
  const [confirmedTime, setConfirmedTime] = useState(meeting.proposedTimes?.[0] || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const accept = async () => {
    if (!confirmedTime) return setError('Please select a time.')
    setSaving(true)
    try {
      const res = await fetch('/api/meetings-respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${clientSessionStore.getToken()}` },
        body: JSON.stringify({ meetingId: meeting.id, action: 'accept', confirmedTime })
      })
      const data = await res.json()
      if (!data.ok) return setError(data.error || 'Failed to confirm.')
      onDone(); onClose()
    } catch { setError('Network error. Please try again.') }
    finally { setSaving(false) }
  }

  const decline = async () => {
    setSaving(true)
    try {
      await fetch('/api/meetings-respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${clientSessionStore.getToken()}` },
        body: JSON.stringify({ meetingId: meeting.id, action: 'decline' })
      })
      onDone(); onClose()
    } catch { setError('Network error.') }
    finally { setSaving(false) }
  }

  return <div className="cp-chat-overlay" onMouseDown={e => e.target === e.currentTarget && onClose()}>
    <div className="cp-chat-drawer" style={{ maxWidth: 420 }}>
      <div className="cp-chat-head">
        <div><strong>{meeting.title}</strong><small>Confirm your time</small></div>
        <button onClick={onClose}><X size={14} /></button>
      </div>
      <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p style={{ fontSize: 12, color: '#607080', margin: 0 }}>
          SideQuest Tech proposed the following times. Select one to confirm — we'll create the Google Meet link automatically.
        </p>
        {meeting.proposedTimes.map((t, i) => (
          <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '10px 14px', borderRadius: 8, border: `2px solid ${confirmedTime === t ? '#2563eb' : '#e4eaf2'}`, background: confirmedTime === t ? '#eff6ff' : '#fff', fontSize: 13 }}>
            <input type="radio" name="slot" value={t} checked={confirmedTime === t} onChange={() => setConfirmedTime(t)} style={{ accentColor: '#2563eb' }} />
            {fmtDateTime(t)}
          </label>
        ))}
        {error && <div className="cp-form-error">{error}</div>}
      </div>
      <div style={{ padding: '14px 20px', borderTop: '1px solid #e4eaf2', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button onClick={decline} disabled={saving} style={{ padding: '8px 16px', borderRadius: 7, border: '1px solid #e4eaf2', background: '#fff', color: '#607080', fontSize: 12, cursor: 'pointer' }}>
          Decline
        </button>
        <button className="cp-chat-send" disabled={saving} onClick={accept}>
          {saving ? 'Confirming…' : 'Confirm & create Meet'}
        </button>
      </div>
    </div>
  </div>
}

// ─── Meeting card ─────────────────────────────────────────────────────────────

function MeetingCard({ meeting, onRespond }) {
  const isAdminProposed = meeting.proposedBy === 'admin'
  const isPending = meeting.status === 'pending'
  const isAccepted = meeting.status === 'accepted'
  const isDeclined = meeting.status === 'declined'

  return <div className="cp-meeting-card" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', width: '100%', gap: 10 }}>
      <div>
        <h3 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700 }}>{meeting.title}</h3>
        {meeting.message && <p style={{ margin: '0 0 6px', fontSize: 12, color: '#607080' }}>{meeting.message}</p>}
        <span style={{ fontSize: 11, color: '#9aabb8' }}>
          {meeting.duration} min · {isAdminProposed ? 'Scheduled by SideQuest Tech' : 'Your request'}
        </span>
      </div>
      <span className={`cp-status-badge ${isAccepted ? 'in-progress' : isDeclined ? 'cancelled' : 'paused'}`} style={{ flexShrink: 0 }}>
        {isAccepted ? 'Confirmed' : isDeclined ? 'Declined' : 'Pending'}
      </span>
    </div>

    {isAccepted && (
      <>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#2563eb', fontWeight: 600 }}>
          <Clock size={13} /> {fmtDateTime(meeting.confirmedTime)}
        </div>
        <a href={meeting.meetLink} target="_blank" rel="noreferrer" className="cp-meet-btn">
          <Video size={13} /> Join Google Meet
        </a>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => window.open(gcalUrl(meeting), '_blank')}
            style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d4dce8', background: '#fff', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
            <Calendar size={11} /> Add to Google Calendar
          </button>
          <button onClick={() => downloadICS(meeting)}
            style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d4dce8', background: '#fff', fontSize: 11, cursor: 'pointer' }}>
            Download .ics
          </button>
        </div>
      </>
    )}

    {isPending && !isAdminProposed && (
      <div style={{ fontSize: 12, color: '#607080' }}>
        <strong>Proposed times:</strong>
        <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {meeting.proposedTimes.map((t, i) => (
            <span key={i}><Clock size={10} style={{ marginRight: 4 }} />{fmtDateTime(t)}</span>
          ))}
        </div>
      </div>
    )}

    {isPending && isAdminProposed && (
      <button className="cp-chat-send" style={{ alignSelf: 'flex-start' }} onClick={() => onRespond(meeting)}>
        <Check size={12} /> Review & confirm
      </button>
    )}
  </div>
}

// ─── Main tab ─────────────────────────────────────────────────────────────────

export default function MeetingsTab({ clientName, clientCompany }) {
  const [meetings, setMeetings] = useState([])
  const [loading, setLoading] = useState(true)
  const [showRequest, setShowRequest] = useState(false)
  const [respondTo, setRespondTo] = useState(null)

  const load = () => {
    setLoading(true)
    fetch('/api/meetings', {
      headers: { Authorization: `Bearer ${clientSessionStore.getToken()}` }
    })
      .then(r => r.json())
      .then(d => { if (d.ok) setMeetings(d.meetings) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const pending = meetings.filter(m => m.status === 'pending')
  const confirmed = meetings.filter(m => m.status === 'accepted')
  const past = meetings.filter(m => m.status === 'declined')

  return <>
    <div className="cp-meetings">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button className="cp-chat-send" onClick={() => setShowRequest(true)}>
          <Plus size={13} /> Request a meeting
        </button>
      </div>

      {loading && <div className="cp-loading">Loading meetings</div>}

      {!loading && !meetings.length && (
        <div className="cp-meetings-empty">
          <Calendar size={36} />
          <h3>No meetings yet</h3>
          <p>Request a meeting and we'll confirm a time and send a Google Meet link.</p>
        </div>
      )}

      {!loading && confirmed.length > 0 && (
        <section style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#607080', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10 }}>Confirmed</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {confirmed.map(m => <MeetingCard key={m.id} meeting={m} onRespond={setRespondTo} />)}
          </div>
        </section>
      )}

      {!loading && pending.length > 0 && (
        <section style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#607080', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10 }}>Pending</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pending.map(m => <MeetingCard key={m.id} meeting={m} onRespond={setRespondTo} />)}
          </div>
        </section>
      )}

      {!loading && past.length > 0 && (
        <section>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#607080', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10 }}>Declined</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {past.map(m => <MeetingCard key={m.id} meeting={m} onRespond={setRespondTo} />)}
          </div>
        </section>
      )}
    </div>

    {showRequest && <RequestModal onClose={() => setShowRequest(false)} onCreated={load} />}
    {respondTo && <AcceptModal meeting={respondTo} onClose={() => setRespondTo(null)} onDone={load} />}
  </>
}
