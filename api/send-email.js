import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = 'SideQuest Tech <hello@sidequesttech.co.za>'
const BUSINESS_EMAIL = 'hello@sidequesttech.co.za'

const serviceLabel = key => ({
  website: 'Website', app: 'Mobile / web app', automation: 'Automation',
  existing: 'Existing system', mvp: 'MVP', unsure: 'Not sure yet'
})[key] || key

const row = (label, value) => value
  ? `<tr><td style="padding:8px 12px;color:#64748b;font-size:13px;width:160px;vertical-align:top;white-space:nowrap">${label}</td><td style="padding:8px 12px;font-size:13px;color:#1e293b">${value}</td></tr>`
  : ''

function buildBusinessHtml(r) {
  const details = Object.entries(r)
    .filter(([k, v]) => v && !['id', 'reference', 'status', 'createdAt', 'fullName', 'company', 'email', 'phone', 'contactMethod', 'need', 'notes'].includes(k))
    .map(([k, v]) => row(k.replace(/([A-Z])/g, ' $1'), v))
    .join('')

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:system-ui,-apple-system,sans-serif;background:#f1f5f9;margin:0;padding:24px">
<div style="max-width:640px;margin:0 auto">
  <div style="background:#0f172a;border-radius:8px 8px 0 0;padding:28px 32px">
    <div style="color:#3b82f6;font-size:10px;font-weight:700;letter-spacing:3px;margin-bottom:10px">● NEW PROJECT REQUEST</div>
    <h1 style="color:white;margin:0 0 6px;font-size:20px;font-weight:600">${r.reference}</h1>
    <div style="color:#94a3b8;font-size:12px">${new Date(r.createdAt).toLocaleString('en-ZA', { dateStyle: 'full', timeStyle: 'short' })}</div>
  </div>
  <div style="background:white;padding:24px 32px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0">
    <div style="margin-bottom:24px">
      <span style="background:#eff6ff;color:#1d4ed8;font-size:11px;font-weight:600;padding:4px 10px;border-radius:20px;margin-right:8px">${serviceLabel(r.need)}</span>
      <span style="background:#f0fdf4;color:#16a34a;font-size:11px;font-weight:600;padding:4px 10px;border-radius:20px;margin-right:8px">${r.urgency} urgency</span>
      <span style="background:#faf5ff;color:#7c3aed;font-size:11px;font-weight:600;padding:4px 10px;border-radius:20px">${r.budget}</span>
    </div>
    <h2 style="font-size:14px;font-weight:700;color:#0f172a;margin:0 0 12px;text-transform:uppercase;letter-spacing:1px">Client</h2>
    <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;margin-bottom:24px">
      ${row('Name', r.fullName)}${row('Company', r.company)}${row('Email', `<a href="mailto:${r.email}" style="color:#2563eb">${r.email}</a>`)}${row('Phone', r.phone)}${row('Contact via', r.contactMethod)}
    </table>
    <h2 style="font-size:14px;font-weight:700;color:#0f172a;margin:0 0 12px;text-transform:uppercase;letter-spacing:1px">Project profile</h2>
    <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;margin-bottom:24px">
      ${details}
    </table>
    ${r.notes ? `<h2 style="font-size:14px;font-weight:700;color:#0f172a;margin:0 0 12px;text-transform:uppercase;letter-spacing:1px">Notes</h2><p style="font-size:13px;color:#374151;margin:0 0 24px;background:#f8fafc;padding:12px;border-radius:6px;border:1px solid #e2e8f0">${r.notes}</p>` : ''}
  </div>
  <div style="background:#0f172a;border-radius:0 0 8px 8px;padding:16px 32px;display:flex;justify-content:space-between;align-items:center">
    <span style="color:#64748b;font-size:12px">SideQuest Tech — project intake</span>
    <a href="mailto:${r.email}" style="background:#3b82f6;color:white;font-size:12px;font-weight:600;padding:8px 16px;border-radius:6px;text-decoration:none">Reply to client</a>
  </div>
</div>
</body></html>`
}

function buildConfirmationHtml(r) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:system-ui,-apple-system,sans-serif;background:#f1f5f9;margin:0;padding:24px">
<div style="max-width:600px;margin:0 auto">
  <div style="background:#0f172a;border-radius:8px 8px 0 0;padding:28px 32px">
    <h1 style="color:white;margin:0 0 4px;font-size:22px;font-weight:600">We have received your request.</h1>
    <p style="color:#94a3b8;margin:0;font-size:14px">SideQuest Tech will be in touch soon.</p>
  </div>
  <div style="background:white;padding:28px 32px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0">
    <p style="color:#374151;font-size:15px;margin:0 0 24px">Hi ${r.fullName.split(' ')[0]},</p>
    <p style="color:#374151;font-size:15px;margin:0 0 24px">Thank you for submitting your project request. We have captured everything below and our team will review it before reaching out to discuss next steps.</p>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px 24px;margin-bottom:24px">
      <div style="font-size:11px;font-weight:700;letter-spacing:2px;color:#64748b;margin-bottom:4px">YOUR REFERENCE</div>
      <div style="font-size:20px;font-weight:700;color:#0f172a">${r.reference}</div>
    </div>
    <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;margin-bottom:24px">
      ${row('Service', serviceLabel(r.need))}${row('Budget', r.budget)}${row('Launch date', r.launchDate)}${row('Urgency', r.urgency)}
    </table>
    <p style="color:#64748b;font-size:13px;margin:0">In the meantime, feel free to reach us at <a href="mailto:hello@sidequesttech.co.za" style="color:#2563eb">hello@sidequesttech.co.za</a>.</p>
  </div>
  <div style="background:#0f172a;border-radius:0 0 8px 8px;padding:16px 32px">
    <p style="color:#64748b;font-size:12px;margin:0">SideQuest Tech (Pty) Ltd · South Africa · hello@sidequesttech.co.za</p>
  </div>
</div>
</body></html>`
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const r = req.body
  if (!r?.email || !r?.fullName || !r?.reference) {
    return res.status(400).json({ ok: false, error: 'Invalid request payload' })
  }

  try {
    await Promise.all([
      resend.emails.send({
        from: FROM,
        to: BUSINESS_EMAIL,
        reply_to: r.email,
        subject: `[PROJECT REQUEST] ${r.reference} — ${r.fullName} — ${serviceLabel(r.need)}`,
        html: buildBusinessHtml(r)
      }),
      resend.emails.send({
        from: FROM,
        to: r.email,
        subject: `Your SideQuest Tech project request — ${r.reference}`,
        html: buildConfirmationHtml(r)
      })
    ])
    res.json({ ok: true })
  } catch (err) {
    console.error('[send-email]', err.message)
    res.status(500).json({ ok: false, error: 'Failed to send email. Please try again.' })
  }
}
