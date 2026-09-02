import { useEffect, useState } from 'react'
import {
  ArrowRight, Check, CheckCircle2, ChevronLeft, ChevronRight, CircleDot, Clock3,
  Layers3, LockKeyhole, Mail, MapPin, Menu,
  Phone, ShieldCheck, X, Zap
} from 'lucide-react'
import { needOptions, serviceLabel, services } from './data'
import { clientSessionStore, cursorStore, sessionStore } from './storage'
import brandImage from './favIcon.jpg'
import DotField from './components/DotField/DotField'
import TextType from './components/TextType/TextType'
import TargetCursor from './components/TargetCursor'
import CrmDashboard from './components/AdminDashboard'
import ConceptsSection from './components/concepts/ConceptsSection'
import ClientDashboard from './components/ClientDashboard/ClientDashboard'

const emptyForm = {
  need: '', projectType: '', payments: '', booking: '', dashboard: '', branding: '',
  platform: '', users: '', problem: '', accounts: '', features: '', repetitiveTask: '',
  currentTools: '', automationOutputs: '', broken: '', technology: '', issueUrgent: '',
  fixScope: '', businessIdea: '', desiredResult: '', budget: '', launchDate: '', urgency: '',
  mustHave: '', niceToHave: '', fullName: '', company: '', email: '', phone: '',
  contactMethod: '', notes: ''
}

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)

  useEffect(() => {
    const media = window.matchMedia(query)
    const update = () => setMatches(media.matches)
    update()
    media.addEventListener?.('change', update)
    return () => media.removeEventListener?.('change', update)
  }, [query])

  return matches
}

const scrollTo = (id) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function Logo({ onClick }) {
  return <button className="logo cursor-target" onClick={onClick} aria-label="SideQuest Tech home"><span className="logo-mark"><img src={brandImage} alt="" /></span><span>SideQuest <span>Tech</span></span></button>
}

function Navbar({ onStart, onLogin }) {
  const [open, setOpen] = useState(false), [active, setActive] = useState('home')
  const mobile = useMediaQuery('(max-width: 800px)')
  useEffect(() => {
    const onScroll = () => {
      const sections = ['home', 'services', 'process', 'concepts']
      const current = sections.filter(id => document.getElementById(id)?.getBoundingClientRect().top <= 140).at(-1)
      if (current) setActive(current)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!open) return undefined
    const closeOnEscape = event => event.key === 'Escape' && setOpen(false)
    document.body.classList.add('nav-open')
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.classList.remove('nav-open')
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  useEffect(() => {
    if (!mobile) setOpen(false)
  }, [mobile])

  const go = (id) => {
    setActive(id)
    setOpen(false)
    requestAnimationFrame(() => scrollTo(id))
  }
  return <header className={`nav-wrap ${open ? 'menu-open' : ''}`}>
    <nav className="navbar container">
      <Logo onClick={() => go('home')} />
      <button className="menu-btn cursor-target" onClick={() => setOpen(value => !value)} aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} aria-controls="primary-navigation">{open ? <X /> : <Menu />}</button>
      <button className={`nav-scrim ${open ? 'open' : ''}`} aria-label="Close navigation" tabIndex={-1} onClick={() => setOpen(false)} />
      <div id="primary-navigation" className={`nav-links ${open ? 'open' : ''}`} aria-hidden={mobile && !open}>
        <span className="menu-kicker">Navigation</span>
        <button className={`cursor-target ${active === 'home' ? 'active' : ''}`} aria-current={active === 'home' ? 'page' : undefined} onClick={() => go('home')}>Home</button><button className={`cursor-target ${active === 'services' ? 'active' : ''}`} aria-current={active === 'services' ? 'page' : undefined} onClick={() => go('services')}>Services</button>
        <button className={`cursor-target ${active === 'process' ? 'active' : ''}`} aria-current={active === 'process' ? 'page' : undefined} onClick={() => go('process')}>Process</button><button className={`cursor-target ${active === 'concepts' ? 'active' : ''}`} aria-current={active === 'concepts' ? 'page' : undefined} onClick={() => go('concepts')}>Concepts</button>
        <button className="cursor-target" onClick={() => { onLogin(); setOpen(false) }}>Login</button>
        <button className="btn btn-small cursor-target" onClick={() => { onStart(); setOpen(false) }}>Start a Project <ArrowRight size={15} /></button>
      </div>
    </nav>
  </header>
}

function Hero({ onStart }) {
  const compact = useMediaQuery('(max-width: 800px)')
  const phone = useMediaQuery('(max-width: 600px)')

  return <section id="home" className="hero section-grid">
    <div className="orb orb-one" /><div className="orb orb-two" />
    {!compact && <div className="dot-field-layer hero-dot-field" aria-hidden="true"><DotField
      dotRadius={1.2} dotSpacing={18} bulgeStrength={55} glowRadius={140}
      sparkle={false} waveAmplitude={0} cursorRadius={420} cursorForce={0.08} bulgeOnly
      gradientFrom="rgba(255,255,255,0.18)" gradientTo="rgba(84,86,90,0.12)"
      glowColor="rgba(37,99,235,0.18)"
    /></div>}
    <div className="container hero-layout">
      <div className="hero-copy reveal">
        <h1 aria-label="Your Vision. Our Next Quest.">
          <TextType as="span" className="vision-line" text="Your Vision." typingSpeed={compact ? 32 : 75} loop={false} showCursor={false} aria-hidden="true" />
          <TextType as="span" className="quest-line" text="Our Next Quest." typingSpeed={compact ? 32 : 75} initialDelay={compact ? 420 : 1050} pauseDuration={1500} deletingSpeed={50} loop={false} showCursor cursorCharacter="_" cursorClassName="hero-type-cursor" cursorBlinkDuration={0.5} aria-hidden="true" />
        </h1>
        {phone && <div className="mobile-hero-art" aria-hidden="true" />}
        <p>We build reliable websites, apps, automation tools, MVPs and custom software for businesses and founders ready to move forward.</p>
        <div className="hero-actions"><button className="btn cursor-target" onClick={onStart}>Start a Project <ArrowRight size={18} /></button><button className="btn btn-secondary cursor-target" onClick={() => scrollTo('services')}>View Services</button></div>
        {!phone && <div className="trust-row"><div><ShieldCheck /><span><b>Business first</b><small>Technology with purpose</small></span></div><div><Clock3 /><span><b>Clear delivery</b><small>No black box development</small></span></div></div>}
      </div>
      {!phone && <div className="hero-visual" aria-hidden="true">
        <div className="code-window glass">
          <div className="window-head"><span /><span /><span /><small>sidequest-tech / delivery</small></div>
          <div className="code-lines"><i /><i /><i /><i /><i /><i /></div>
          <div className="build-status"><CheckCircle2 /><span><b>Build successful</b><small>Ready for what is next</small></span><strong>100%</strong></div>
        </div>
        <div className="float-card card-a glass"><Zap /><span><b>Fast by design</b><small>Performance built in</small></span></div>
        <div className="float-card card-b glass"><Layers3 /><span><b>Built to scale</b><small>Solid foundations</small></span></div>
      </div>}
    </div>
    {!phone && <div className="tech-strip"><span>PRODUCT STRATEGY</span><i /><span>WEB ENGINEERING</span><i /><span>MOBILE APPS</span><i /><span>AUTOMATION</span><i /><span>LONG-TERM SUPPORT</span></div>}
  </section>
}

function SectionHeading({ label, title, text, centered = false }) {
  return <div className={`section-heading ${centered ? 'centered' : ''}`}><div className="eyebrow">{label}</div><h2>{title}</h2>{text && <p>{text}</p>}</div>
}

function Services({ onSelect }) {
  return <section id="services" className="section services"><div className="container">
    <SectionHeading label="What we build" title="Engineering capability that meets you where you are" text="From the first useful version to a mature platform, we bring the right level of product thinking and technical depth." />
    <div className="service-grid">{services.map((service, i) => { const Icon = service.icon; return <article className="service-card cursor-target" key={service.name}>
      <div className="service-top"><span className="service-icon"><Icon /></span><span className="service-num">0{i + 1}</span></div><h3>{service.name}</h3><p>{service.description}</p>
      <button className="cursor-target" onClick={() => onSelect(service.short)}>Request this service <ArrowRight size={16} /></button>
    </article> })}</div>
  </div></section>
}

const values = [
  ['Clean engineering', 'Readable, maintainable systems your team can trust.'], ['Fast delivery', 'Focused execution with useful progress you can see.'],
  ['Scalable systems', 'Architecture designed for today without limiting tomorrow.'], ['Clear communication', 'Honest updates, sound decisions and no mystery.'],
  ['Business-first thinking', 'Every technical choice begins with the outcome it supports.'], ['Long-term support', 'A capable partner beyond the first successful launch.']
]

function Values() {
  const compact = useMediaQuery('(max-width: 800px)')

  return <section className="section values-section">{!compact && <div className="dot-field-layer values-dot-field" aria-hidden="true"><DotField
    dotRadius={1} dotSpacing={20} bulgeStrength={45} glowRadius={120}
    sparkle={false} waveAmplitude={0} cursorRadius={360} cursorForce={0.06} bulgeOnly
    gradientFrom="rgba(255,255,255,0.12)" gradientTo="rgba(84,86,90,0.08)"
    glowColor="rgba(37,99,235,0.12)"
  /></div>}<div className="container values-layout"><div className="values-copy"><SectionHeading label="Why SideQuest Tech" title="Strong software starts with a better working relationship" text="Good engineering is more than code. It is clear thinking, dependable execution and attention to what moves the business." /><div className="metric-card glass"><strong>One team</strong><span>From discovery to delivery and beyond</span></div></div><div className="value-list">{values.map(([title, text], i) => <div className="value-item" key={title}><span>{String(i + 1).padStart(2, '0')}</span><div><h3>{title}</h3><p>{text}</p></div><Check size={18} /></div>)}</div></div></section>
}

const process = [['Discovery', 'Understand the goal, context and real constraints.'], ['Planning', 'Define the path, scope and delivery priorities.'], ['Design', 'Shape clear user journeys and polished interfaces.'], ['Development', 'Build in focused, testable and visible increments.'], ['Testing', 'Check quality, performance and edge cases.'], ['Launch', 'Move to production with a controlled release.'], ['Support', 'Monitor, improve and grow the product with you.']]

function Process() {
  return <section id="process" className="section process-section"><div className="container"><SectionHeading centered label="How we work" title="A clear path from problem to progress" text="A practical process that keeps momentum high and surprises low." /><div className="process-line">{process.map(([title, text], i) => <div className="process-step" key={title}><span>{i + 1}</span><h3>{title}</h3><p>{text}</p></div>)}</div></div></section>
}

function Contact({ onStart }) {
  return <section id="contact" className="section contact-section"><div className="container"><div className="contact-panel section-grid"><div><div className="eyebrow">Let us build what is next</div><h2>Have a problem worth solving?</h2><p>Tell us what is getting in the way. You do not need a technical specification to start the conversation.</p><button className="btn btn-light cursor-target" onClick={onStart}>Start your project request <ArrowRight /></button></div><div className="contact-details"><a className="cursor-target" href="mailto:hello@sidequesttech.co.za"><Mail /> <span><small>Email</small>hello@sidequesttech.co.za</span></a><a className="cursor-target" href="tel:+27686955513"><Phone /> <span><small>Phone</small>+27 68 695 5513</span></a><div><MapPin /> <span><small>Location</small>South Africa</span></div></div></div></div></section>
}

function Footer() {
  return <footer><div className="container footer-main"><div><Logo onClick={() => scrollTo('home')} /><p>Your Vision. Our Next Quest.</p></div><div><h4>Company</h4><button className="cursor-target" onClick={() => scrollTo('services')}>Services</button><button className="cursor-target" onClick={() => scrollTo('process')}>Process</button><button className="cursor-target" onClick={() => scrollTo('concepts')}>Concepts</button></div><div><h4>Start here</h4><a className="cursor-target" href="mailto:hello@sidequesttech.co.za">hello@sidequesttech.co.za</a><span>South Africa</span><span>SideQuest Tech (Pty) Ltd</span><span>Enterprise no. 2026/488079/07</span></div></div><div className="container footer-bottom"><span>© {new Date().getFullYear()} SideQuest Tech. All rights reserved.</span><span>Engineered with intent.</span></div></footer>
}

function Field({ label, name, value, onChange, type = 'text', required, placeholder, children }) {
  return <label className="field"><span>{label}{required && <b> *</b>}</span>{children || (type === 'textarea' ? <textarea name={name} value={value || ''} onChange={onChange} placeholder={placeholder} /> : <input type={type} name={name} value={value || ''} onChange={onChange} placeholder={placeholder} />)}</label>
}

function SelectField({ label, name, value, onChange, options, required }) {
  return <Field label={label} name={name} value={value} onChange={onChange} required={required}><select name={name} value={value || ''} onChange={onChange}><option value="">Select an option</option>{options.map(o => <option key={o} value={o}>{o}</option>)}</select></Field>
}

function ConditionalQuestions({ data, onChange }) {
  if (data.need === 'website') return <><SelectField label="What kind of website is it?" name="projectType" value={data.projectType} onChange={onChange} required options={['Business', 'Personal brand', 'Ecommerce', 'School', 'Church', 'Restaurant', 'Other']} /><SelectField label="Do you need online payments?" name="payments" value={data.payments} onChange={onChange} options={['Yes', 'No', 'Not sure']} /><SelectField label="Do you need booking?" name="booking" value={data.booking} onChange={onChange} options={['Yes', 'No', 'Not sure']} /><SelectField label="Do you need an admin dashboard?" name="dashboard" value={data.dashboard} onChange={onChange} options={['Yes', 'No', 'Not sure']} /><SelectField label="Do you already have branding?" name="branding" value={data.branding} onChange={onChange} options={['Yes', 'No', 'Partially']} /></>
  if (data.need === 'app') return <><SelectField label="Where should it work?" name="platform" value={data.platform} onChange={onChange} required options={['Mobile', 'Web', 'Both']} /><Field label="Who will use it?" name="users" value={data.users} onChange={onChange} required placeholder="Customers, staff, members..." /><Field label="What main problem should it solve?" name="problem" value={data.problem} onChange={onChange} required type="textarea" /><SelectField label="Do you need login accounts?" name="accounts" value={data.accounts} onChange={onChange} options={['Yes', 'No', 'Not sure']} /><Field label="Special features" name="features" value={data.features} onChange={onChange} placeholder="Payments, maps, chat, notifications, AI..." /></>
  if (data.need === 'automation') return <><Field label="What repetitive task do you want to reduce?" name="repetitiveTask" value={data.repetitiveTask} onChange={onChange} required type="textarea" /><Field label="Which tools do you currently use?" name="currentTools" value={data.currentTools} onChange={onChange} placeholder="Excel, email, accounting software..." /><Field label="What should the automation produce?" name="automationOutputs" value={data.automationOutputs} onChange={onChange} placeholder="Reports, emails, dashboards, integrations..." /></>
  if (data.need === 'existing') return <><Field label="What is broken or frustrating?" name="broken" value={data.broken} onChange={onChange} required type="textarea" /><Field label="What technology is it built with, if known?" name="technology" value={data.technology} onChange={onChange} /><SelectField label="Is the issue urgent?" name="issueUrgent" value={data.issueUrgent} onChange={onChange} options={['Yes', 'No', 'Not sure']} /><Field label="What kind of help do you need?" name="fixScope" value={data.fixScope} onChange={onChange} placeholder="Redesign, performance, bug fixes, new features..." /></>
  if (data.need === 'unsure') return <><Field label="Tell us about your business or idea" name="businessIdea" value={data.businessIdea} onChange={onChange} required type="textarea" /><Field label="What problem are you trying to solve?" name="problem" value={data.problem} onChange={onChange} required type="textarea" /><Field label="What result would make this successful?" name="desiredResult" value={data.desiredResult} onChange={onChange} required type="textarea" /></>
  return <><Field label="Tell us about the idea or system" name="businessIdea" value={data.businessIdea} onChange={onChange} required type="textarea" placeholder="What are you building, and who is it for?" /><Field label="What problem should it solve?" name="problem" value={data.problem} onChange={onChange} required type="textarea" /><Field label="What would a successful outcome look like?" name="desiredResult" value={data.desiredResult} onChange={onChange} type="textarea" /></>
}

const stepNames = ['Project type', 'Project details', 'Budget & timing', 'Contact details', 'Review']

function ProjectWizard({ initialService, onClose, onSubmitted }) {
  const [step, setStep] = useState(0), [data, setData] = useState({ ...emptyForm, need: initialService || '' })
  const [error, setError] = useState(''), [submitting, setSubmitting] = useState(false), [success, setSuccess] = useState(null)
  useEffect(() => { document.body.classList.add('modal-open'); return () => document.body.classList.remove('modal-open') }, [])
  const change = e => { setData(d => ({ ...d, [e.target.name]: e.target.value })); setError('') }
  const validate = () => {
    if (step === 0 && !data.need) return 'Choose the option that best matches your project.'
    if (step === 1) {
      const req = data.need === 'website' ? ['projectType'] : data.need === 'app' ? ['platform', 'users', 'problem'] : data.need === 'automation' ? ['repetitiveTask'] : data.need === 'existing' ? ['broken'] : data.need === 'unsure' ? ['businessIdea', 'problem', 'desiredResult'] : ['businessIdea', 'problem']
      if (req.some(k => !data[k]?.trim())) return 'Complete the required project details to continue.'
    }
    if (step === 2 && (!data.budget || !data.launchDate || !data.urgency || !data.mustHave.trim())) return 'Complete the required budget and timing fields.'
    if (step === 3 && (!data.fullName.trim() || !/^\S+@\S+\.\S+$/.test(data.email) || !data.phone.trim() || !data.contactMethod)) return 'Enter a valid name, email, phone number and contact preference.'
    return ''
  }
  const next = () => { const message = validate(); if (message) return setError(message); setStep(s => Math.min(4, s + 1)); setError('') }
  const submit = async () => {
    setSubmitting(true)
    const stamp = Date.now(), ref = `SQT-${new Date().getFullYear()}-${String(stamp).slice(-6)}`
    const request = { ...data, id: stamp, reference: ref, status: 'New', createdAt: new Date().toISOString(), adminNotes: '' }
    try {
      await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      })
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      })
    } catch (err) {
      console.error('[submit]', err)
    }
    setSuccess(request); setSubmitting(false); onSubmitted?.()
  }
  const answers = Object.entries(data).filter(([key, value]) => value && !['need', 'fullName', 'company', 'email', 'phone', 'contactMethod', 'notes'].includes(key))
  if (success) return <div className="modal-shell"><div className="wizard success-card"><button className="modal-close cursor-target" aria-label="Close project request" onClick={onClose}><X /></button><div className="success-icon"><Check /></div><div className="eyebrow">Request received</div><h2>Thank you, {success.fullName.split(' ')[0]}.</h2><p>Your project profile is safely stored. Our team will use it to understand the opportunity before reaching out.</p><div className="reference"><small>Your reference number</small><strong>{success.reference}</strong></div><button className="btn cursor-target" onClick={onClose}>Return to website</button></div></div>
  return <div className="modal-shell"><div className="wizard"><div className="wizard-head"><div><Logo /><span>Project request</span></div><button className="modal-close cursor-target" aria-label="Close project request" onClick={onClose}><X /></button></div>
    <div className="wizard-progress">{stepNames.map((name, i) => <div className={`${i <= step ? 'active' : ''} ${i < step ? 'done' : ''}`} key={name}><span>{i < step ? <Check /> : i + 1}</span><small>{name}</small></div>)}</div>
    <div className="wizard-body">
      {step === 0 && <><div className="wizard-title"><span>01</span><div><h2>What do you need help with?</h2><p>Choose the closest fit. You can add context in the next step.</p></div></div><div className="option-grid">{needOptions.map(([value, label]) => <button key={value} onClick={() => { setData(d => ({ ...d, need: value })); setError('') }} className={`cursor-target ${data.need === value ? 'selected' : ''}`}><span><CircleDot /></span>{label}<Check /></button>)}</div></>}
      {step === 1 && <><div className="wizard-title"><span>02</span><div><h2>Tell us a little more</h2><p>Plain language is perfect. We will help shape the technical details.</p></div></div><div className="form-grid"><ConditionalQuestions data={data} onChange={change} /></div></>}
      {step === 2 && <><div className="wizard-title"><span>03</span><div><h2>Budget and timing</h2><p>This helps us recommend a realistic delivery path.</p></div></div><div className="form-grid"><SelectField label="Budget range" name="budget" value={data.budget} onChange={change} required options={['Under R25,000', 'R25,000 - R60,000', 'R60,000 - R150,000', 'R150,000+', 'Not sure yet']} /><Field label="Desired launch date" name="launchDate" value={data.launchDate} onChange={change} type="date" required /><SelectField label="Urgency level" name="urgency" value={data.urgency} onChange={change} required options={['Flexible', 'Standard', 'High', 'Urgent']} /><Field label="Must-have features" name="mustHave" value={data.mustHave} onChange={change} type="textarea" required /><Field label="Nice-to-have features" name="niceToHave" value={data.niceToHave} onChange={change} type="textarea" /></div></>}
      {step === 3 && <><div className="wizard-title"><span>04</span><div><h2>How can we reach you?</h2><p>We will only use these details to discuss your request.</p></div></div><div className="form-grid"><Field label="Full name" name="fullName" value={data.fullName} onChange={change} required /><Field label="Company name" name="company" value={data.company} onChange={change} /><Field label="Email" name="email" value={data.email} onChange={change} type="email" required /><Field label="Phone number" name="phone" value={data.phone} onChange={change} type="tel" required /><SelectField label="Preferred contact method" name="contactMethod" value={data.contactMethod} onChange={change} required options={['Email', 'Phone', 'WhatsApp']} /><Field label="Extra notes" name="notes" value={data.notes} onChange={change} type="textarea" /></div></>}
      {step === 4 && <><div className="wizard-title"><span>05</span><div><h2>Review your request</h2><p>Check the essentials before sending it to the SideQuest Tech team.</p></div></div><div className="review-grid"><div className="review-card"><small>Project</small><h3>{serviceLabel(data.need)}</h3><p>{data.problem || data.businessIdea || data.repetitiveTask || data.broken}</p></div><div className="review-card"><small>Budget and timing</small><h3>{data.budget}</h3><p>Target: {data.launchDate} · {data.urgency} urgency</p></div><div className="review-card"><small>Contact</small><h3>{data.fullName}</h3><p>{data.company || 'Independent project'}<br />{data.email} · {data.phone}</p></div><div className="review-card review-wide"><small>Project profile</small>{answers.map(([key, value]) => <div className="answer-row" key={key}><span>{key.replace(/([A-Z])/g, ' $1')}</span><p>{value}</p></div>)}</div>{data.notes && <div className="review-card review-wide"><small>Extra notes</small><p>{data.notes}</p></div>}</div></>}
      {error && <div className="form-error">{error}</div>}
    </div>
    <div className="wizard-footer"><button className="btn btn-secondary cursor-target" onClick={() => step === 0 ? onClose() : setStep(s => s - 1)}><ChevronLeft /> {step === 0 ? 'Cancel' : 'Back'}</button>{step < 4 ? <button className="btn cursor-target" onClick={next}>Continue <ChevronRight /></button> : <button className="btn cursor-target" onClick={submit} disabled={submitting}>{submitting ? <><span className="spinner" /> Sending request</> : <>Submit Request <ArrowRight /></>}</button>}</div>
  </div></div>
}

function UnifiedLogin({ setView }) {
  const [email, setEmail] = useState(''), [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState(''), [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState(''), [loading, setLoading] = useState(false)
  const [mustChange, setMustChange] = useState(false), [pendingToken, setPendingToken] = useState(null)

  const login = async e => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password })
      })
      const data = await res.json()
      if (!data.ok) { setError(data.error || 'Invalid email or password.'); return }
      if (data.role === 'admin') { sessionStore.set(true); setView('dashboard') }
      else if (data.client.mustChangePassword) { setPendingToken(data.token); setMustChange(true) }
      else { clientSessionStore.setToken(data.token); setView('client-dashboard') }
    } catch { setError('Could not reach the server. Please try again.') }
    finally { setLoading(false) }
  }

  const changePassword = async e => {
    e.preventDefault(); setError('')
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return }
    if (newPassword.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${pendingToken}` },
        body: JSON.stringify({ currentPassword: password, newPassword })
      })
      const data = await res.json()
      if (!data.ok) { setError(data.error || 'Failed to update password'); return }
      clientSessionStore.setToken(pendingToken); setView('client-dashboard')
    } catch { setError('Could not reach the server. Please try again.') }
    finally { setLoading(false) }
  }

  return <div className="admin-page section-grid">
    <div className="admin-login">
      <button className="back-site cursor-target" onClick={() => setView('site')}><ChevronLeft /> Back to website</button>
      <Logo onClick={() => setView('site')} />
      <div className="login-icon"><LockKeyhole /></div>
      <div>
        <div className="eyebrow">{mustChange ? 'Client portal' : 'Secure access'}</div>
        <h1>{mustChange ? 'Set your password' : 'Sign in'}</h1>
        <p>{mustChange ? 'This is your first login. Please set a new password before continuing.' : 'Enter your credentials to access your workspace.'}</p>
      </div>
      {!mustChange
        ? <form onSubmit={login}>
          <Field label="Email address" name="email" value={email} onChange={e => { setEmail(e.target.value); setError('') }} type="email" required />
          <Field label="Password" name="password" value={password} onChange={e => { setPassword(e.target.value); setError('') }} type="password" required />
          {error && <div className="form-error">{error}</div>}
          <button className="btn cursor-target" type="submit" disabled={loading}>{loading ? 'Signing in…' : <>Sign in <ArrowRight /></>}</button>
          <button type="button" className="cursor-target" onClick={() => setView('forgot-password')} style={{ marginTop: '12px', fontSize: '13px', color: '#2676ff', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Forgot password?</button>
        </form>
        : <form onSubmit={changePassword}>
          <Field label="New password" name="newPassword" value={newPassword} onChange={e => { setNewPassword(e.target.value); setError('') }} type="password" required />
          <Field label="Confirm new password" name="confirmPassword" value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); setError('') }} type="password" required />
          {error && <div className="form-error">{error}</div>}
          <button className="btn cursor-target" type="submit" disabled={loading}>{loading ? 'Saving…' : <>Set password &amp; continue <ArrowRight /></>}</button>
        </form>
      }
    </div>
  </div>
}

function ForgotPassword({ setView }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const submit = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      })
      const data = await res.json()
      if (!data.ok) {
        setError(data.error || 'Failed to send reset email')
        return
      }
      setSuccess(true)
    } catch {
      setError('Could not reach the server. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return <div className="admin-page section-grid">
    <div className="admin-login">
      <button className="back-site cursor-target" onClick={() => setView('login')}><ChevronLeft /> Back to login</button>
      <Logo onClick={() => setView('site')} />
      <div className="login-icon"><Mail /></div>
      <div>
        <div className="eyebrow">Password recovery</div>
        <h1>Reset your password</h1>
        <p>{success ? 'Check your email for a password reset link.' : 'Enter your email address and we\'ll send you a link to reset your password.'}</p>
      </div>
      {!success ? (
        <form onSubmit={submit}>
          <Field label="Email address" name="email" value={email} onChange={e => { setEmail(e.target.value); setError('') }} type="email" required />
          {error && <div className="form-error">{error}</div>}
          <button className="btn cursor-target" type="submit" disabled={loading}>
            {loading ? 'Sending…' : <>Send reset link <ArrowRight /></>}
          </button>
        </form>
      ) : (
        <div style={{ padding: '24px', background: '#e8f5e9', borderRadius: '8px', marginTop: '16px' }}>
          <p style={{ margin: 0, fontSize: '14px', color: '#2e7d32' }}>
            <strong>Email sent!</strong><br />
            If an account exists with that email, you'll receive a password reset link shortly. The link will expire in 1 hour.
          </p>
          <button className="btn cursor-target" onClick={() => setView('login')} style={{ marginTop: '16px', width: '100%' }}>
            Back to login
          </button>
        </div>
      )}
    </div>
  </div>
}

function ResetPassword({ setView, resetToken }) {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const submit = async e => {
    e.preventDefault()
    setError('')
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, newPassword })
      })
      const data = await res.json()
      if (!data.ok) {
        setError(data.error || 'Failed to reset password')
        return
      }
      setSuccess(true)
    } catch {
      setError('Could not reach the server. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return <div className="admin-page section-grid">
    <div className="admin-login">
      <button className="back-site cursor-target" onClick={() => setView('login')}><ChevronLeft /> Back to login</button>
      <Logo onClick={() => setView('site')} />
      <div className="login-icon"><LockKeyhole /></div>
      <div>
        <div className="eyebrow">Password recovery</div>
        <h1>Set new password</h1>
        <p>{success ? 'Your password has been reset successfully!' : 'Enter a new password for your account.'}</p>
      </div>
      {!success ? (
        <form onSubmit={submit}>
          <Field label="New password" name="newPassword" value={newPassword} onChange={e => { setNewPassword(e.target.value); setError('') }} type="password" required minLength={8} />
          <Field label="Confirm new password" name="confirmPassword" value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); setError('') }} type="password" required />
          {error && <div className="form-error">{error}</div>}
          <button className="btn cursor-target" type="submit" disabled={loading}>
            {loading ? 'Resetting…' : <>Reset password <ArrowRight /></>}
          </button>
        </form>
      ) : (
        <div style={{ padding: '24px', background: '#e8f5e9', borderRadius: '8px', marginTop: '16px' }}>
          <p style={{ margin: 0, fontSize: '14px', color: '#2e7d32' }}>
            <CheckCircle2 style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />
            <strong>Password reset successful!</strong><br />
            You can now log in with your new password.
          </p>
          <button className="btn cursor-target" onClick={() => setView('login')} style={{ marginTop: '16px', width: '100%' }}>
            Go to login
          </button>
        </div>
      )}
    </div>
  </div>
}

function Site({ onStart, onLogin }) {
  return <><Navbar onStart={() => onStart()} onLogin={onLogin} /><main><Hero onStart={() => onStart()} /><Services onSelect={onStart} /><Values /><Process /><ConceptsSection /><Contact onStart={() => onStart()} /></main><Footer /></>
}

function CursorToast({ message }) {
  if (!message) return null
  return <div className="cursor-toast">{message}</div>
}

export default function App() {
  const [view, setView] = useState(() => {
    // Check for reset token in URL
    const params = new URLSearchParams(window.location.search)
    if (params.get('reset')) return 'reset-password'
    if (sessionStore.get()) return 'dashboard'
    if (clientSessionStore.getPayload()) return 'client-dashboard'
    return 'site'
  })
  const [wizard, setWizard] = useState(false), [service, setService] = useState('')
  const [cursorOn, setCursorOn] = useState(() => cursorStore.get())
  const [cursorToast, setCursorToast] = useState('')
  const [resetToken, setResetToken] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('reset') || ''
  })

  useEffect(() => {
    const toastTimer = { id: null }
    const handler = e => {
      if (e.altKey && e.key === 'c') {
        setCursorOn(prev => {
          const next = !prev
          cursorStore.set(next)
          setCursorToast(next ? 'Custom cursor enabled' : 'Custom cursor disabled')
          clearTimeout(toastTimer.id)
          toastTimer.id = setTimeout(() => setCursorToast(''), 5000)
          return next
        })
      }
    }
    window.addEventListener('keydown', handler)
    return () => { window.removeEventListener('keydown', handler); clearTimeout(toastTimer.id) }
  }, [])

  const openWizard = (choice = '') => { setService(choice); setWizard(true) }
  const logout = () => { sessionStore.set(false); setView('site') }

  const content = view === 'login'
    ? <UnifiedLogin setView={setView} />
    : view === 'forgot-password'
      ? <ForgotPassword setView={setView} />
      : view === 'reset-password'
        ? <ResetPassword setView={setView} resetToken={resetToken} />
        : view === 'dashboard'
          ? <CrmDashboard onLogout={logout} onClose={() => setView('site')} />
          : view === 'client-dashboard'
            ? <ClientDashboard setView={setView} />
            : <><Site onStart={openWizard} onLogin={() => setView('login')} />{wizard && <ProjectWizard initialService={service} onClose={() => setWizard(false)} />}</>

  return <>
    {view === 'site' && <TargetCursor spinDuration={2} hideDefaultCursor parallaxOn hoverDuration={0.2} forceEnabled={cursorOn} />}
    <CursorToast message={cursorToast} />
    {content}
  </>
}
