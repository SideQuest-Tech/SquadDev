import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight, Check, CheckCircle2, ChevronLeft, ChevronRight, CircleDot, Clock3,
  ExternalLink, Eye, Filter, Layers3, LockKeyhole, Mail, MapPin, Menu,
  MessageSquare, Phone, Search, ShieldCheck, Sparkles, Trash2, X, Zap
} from 'lucide-react'
import { needOptions, serviceLabel, services } from './data'
import { requestStore, sessionStore } from './storage'
import brandImage from './favIcon.jpg'
import DotField from './components/DotField/DotField'
import TextType from './components/TextType/TextType'

const emptyForm = {
  need: '', projectType: '', payments: '', booking: '', dashboard: '', branding: '',
  platform: '', users: '', problem: '', accounts: '', features: '', repetitiveTask: '',
  currentTools: '', automationOutputs: '', broken: '', technology: '', issueUrgent: '',
  fixScope: '', businessIdea: '', desiredResult: '', budget: '', launchDate: '', urgency: '',
  mustHave: '', niceToHave: '', fullName: '', company: '', email: '', phone: '',
  contactMethod: '', notes: ''
}

const scrollTo = (id) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function Logo({ onClick }) {
  return <button className="logo" onClick={onClick} aria-label="SideQuest Tech home"><span className="logo-mark"><img src={brandImage} alt="" /></span><span>SideQuest <span>Tech</span></span></button>
}

function Navbar({ onStart, onAdmin }) {
  const [open, setOpen] = useState(false), [active, setActive] = useState('home')
  useEffect(() => {
    const onScroll = () => {
      const sections = ['home', 'services', 'process', 'portfolio']
      const current = sections.filter(id => document.getElementById(id)?.getBoundingClientRect().top <= 140).at(-1)
      if (current) setActive(current)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  const go = (id) => { setActive(id); scrollTo(id); setOpen(false) }
  return <header className="nav-wrap">
    <nav className="navbar container">
      <Logo onClick={() => go('home')} />
      <button className="menu-btn" onClick={() => setOpen(!open)} aria-label="Toggle navigation">{open ? <X /> : <Menu />}</button>
      <div className={`nav-links ${open ? 'open' : ''}`}>
        <button className={active === 'home' ? 'active' : ''} onClick={() => go('home')}>Home</button><button className={active === 'services' ? 'active' : ''} onClick={() => go('services')}>Services</button>
        <button className={active === 'process' ? 'active' : ''} onClick={() => go('process')}>Process</button><button className={active === 'portfolio' ? 'active' : ''} onClick={() => go('portfolio')}>Portfolio</button>
        <button onClick={() => { onAdmin(); setOpen(false) }}>Admin Login</button>
        <button className="btn btn-small" onClick={() => { onStart(); setOpen(false) }}>Start a Project <ArrowRight size={15} /></button>
      </div>
    </nav>
  </header>
}

function Hero({ onStart }) {
  return <section id="home" className="hero section-grid">
    <div className="orb orb-one" /><div className="orb orb-two" />
    <div className="dot-field-layer hero-dot-field" aria-hidden="true"><DotField
      dotRadius={1.2} dotSpacing={18} bulgeStrength={55} glowRadius={140}
      sparkle={false} waveAmplitude={0} cursorRadius={420} cursorForce={0.08} bulgeOnly
      gradientFrom="rgba(255,255,255,0.18)" gradientTo="rgba(84,86,90,0.12)"
      glowColor="rgba(37,99,235,0.18)"
    /></div>
    <div className="container hero-layout">
      <div className="hero-copy reveal">
        <h1 aria-label="Your Vision. Our Next Quest.">
          <TextType as="span" className="vision-line" text="Your Vision." typingSpeed={75} loop={false} showCursor={false} aria-hidden="true" />
          <TextType as="span" className="quest-line" text="Our Next Quest." typingSpeed={75} initialDelay={1050} pauseDuration={1500} deletingSpeed={50} loop={false} showCursor cursorCharacter="_" cursorClassName="hero-type-cursor" cursorBlinkDuration={0.5} aria-hidden="true" />
        </h1>
        <p>We build reliable websites, apps, automation tools, MVPs and custom software for businesses and founders ready to move forward.</p>
        <div className="hero-actions"><button className="btn" onClick={onStart}>Start a Project <ArrowRight size={18} /></button><button className="btn btn-secondary" onClick={() => scrollTo('services')}>View Services</button></div>
        <div className="trust-row"><div><ShieldCheck /><span><b>Business first</b><small>Technology with purpose</small></span></div><div><Clock3 /><span><b>Clear delivery</b><small>No black box development</small></span></div></div>
      </div>
      <div className="hero-visual" aria-hidden="true">
        <div className="code-window glass">
          <div className="window-head"><span /><span /><span /><small>sidequest-tech / delivery</small></div>
          <div className="code-lines"><i /><i /><i /><i /><i /><i /></div>
          <div className="build-status"><CheckCircle2 /><span><b>Build successful</b><small>Ready for what is next</small></span><strong>100%</strong></div>
        </div>
        <div className="float-card card-a glass"><Zap /><span><b>Fast by design</b><small>Performance built in</small></span></div>
        <div className="float-card card-b glass"><Layers3 /><span><b>Built to scale</b><small>Solid foundations</small></span></div>
      </div>
    </div>
    <div className="tech-strip"><span>PRODUCT STRATEGY</span><i /><span>WEB ENGINEERING</span><i /><span>MOBILE APPS</span><i /><span>AUTOMATION</span><i /><span>LONG-TERM SUPPORT</span></div>
  </section>
}

function SectionHeading({ label, title, text, centered = false }) {
  return <div className={`section-heading ${centered ? 'centered' : ''}`}><div className="eyebrow">{label}</div><h2>{title}</h2>{text && <p>{text}</p>}</div>
}

function Services({ onSelect }) {
  return <section id="services" className="section services"><div className="container">
    <SectionHeading label="What we build" title="Engineering capability that meets you where you are" text="From the first useful version to a mature platform, we bring the right level of product thinking and technical depth." />
    <div className="service-grid">{services.map((service, i) => { const Icon = service.icon; return <article className="service-card" key={service.name}>
      <div className="service-top"><span className="service-icon"><Icon /></span><span className="service-num">0{i + 1}</span></div><h3>{service.name}</h3><p>{service.description}</p>
      <button onClick={() => onSelect(service.short)}>Request this service <ArrowRight size={16} /></button>
    </article> })}</div>
  </div></section>
}

const values = [
  ['Clean engineering', 'Readable, maintainable systems your team can trust.'], ['Fast delivery', 'Focused execution with useful progress you can see.'],
  ['Scalable systems', 'Architecture designed for today without limiting tomorrow.'], ['Clear communication', 'Honest updates, sound decisions and no mystery.'],
  ['Business-first thinking', 'Every technical choice begins with the outcome it supports.'], ['Long-term support', 'A capable partner beyond the first successful launch.']
]

function Values() {
  return <section className="section values-section"><div className="dot-field-layer values-dot-field" aria-hidden="true"><DotField
    dotRadius={1} dotSpacing={20} bulgeStrength={45} glowRadius={120}
    sparkle={false} waveAmplitude={0} cursorRadius={360} cursorForce={0.06} bulgeOnly
    gradientFrom="rgba(255,255,255,0.12)" gradientTo="rgba(84,86,90,0.08)"
    glowColor="rgba(37,99,235,0.12)"
  /></div><div className="container values-layout"><div className="values-copy"><SectionHeading label="Why SideQuest Tech" title="Strong software starts with a better working relationship" text="Good engineering is more than code. It is clear thinking, dependable execution and attention to what moves the business." /><div className="metric-card glass"><strong>One team</strong><span>From discovery to delivery and beyond</span></div></div><div className="value-list">{values.map(([title, text], i) => <div className="value-item" key={title}><span>{String(i + 1).padStart(2, '0')}</span><div><h3>{title}</h3><p>{text}</p></div><Check size={18} /></div>)}</div></div></section>
}

const process = [['Discovery', 'Understand the goal, context and real constraints.'], ['Planning', 'Define the path, scope and delivery priorities.'], ['Design', 'Shape clear user journeys and polished interfaces.'], ['Development', 'Build in focused, testable and visible increments.'], ['Testing', 'Check quality, performance and edge cases.'], ['Launch', 'Move to production with a controlled release.'], ['Support', 'Monitor, improve and grow the product with you.']]

function Process() {
  return <section id="process" className="section process-section"><div className="container"><SectionHeading centered label="How we work" title="A clear path from problem to progress" text="A practical process that keeps momentum high and surprises low." /><div className="process-line">{process.map(([title, text], i) => <div className="process-step" key={title}><span>{i + 1}</span><h3>{title}</h3><p>{text}</p></div>)}</div></div></section>
}

const portfolio = [
  ['Business landing page', 'Conversion-focused web experience', 'Strategy · Design · Development'],
  ['Booking platform', 'Scheduling and payment flow', 'Product · Web app · Integrations'],
  ['Internal dashboard', 'Operational data in one clear view', 'UX · Software · Analytics'],
  ['Ecommerce website', 'Modern retail and checkout experience', 'Commerce · Payments · Growth'],
  ['Automation workflow', 'Connected processes with less manual work', 'Automation · APIs · Reporting']
]

function Portfolio() {
  return <section id="portfolio" className="section portfolio-section"><div className="container"><div className="portfolio-head"><SectionHeading label="Selected capabilities" title="A glimpse of what we can build" text="These concept examples show our range. They are not presented as client claims." /><span className="concept-label">CAPABILITY SHOWCASE</span></div><div className="portfolio-grid">{portfolio.map(([title, text, tags], i) => <article className={`project-card project-${i + 1}`} key={title}><div className="project-preview"><div className="mock-window"><span /><span /><span /></div><div className="mock-content"><i /><i /><i /></div><ExternalLink /></div><div className="project-info"><small>Example 0{i + 1}</small><h3>{title}</h3><p>{text}</p><span>{tags}</span></div></article>)}</div></div></section>
}

function Contact({ onStart }) {
  return <section id="contact" className="section contact-section"><div className="container"><div className="contact-panel section-grid"><div><div className="eyebrow">Let us build what is next</div><h2>Have a problem worth solving?</h2><p>Tell us what is getting in the way. You do not need a technical specification to start the conversation.</p><button className="btn btn-light" onClick={onStart}>Start your project request <ArrowRight /></button></div><div className="contact-details"><a href="mailto:hello@sidequesttech.co.za"><Mail /> <span><small>Email</small>hello@sidequesttech.co.za</span></a><a href="tel:+27000000000"><Phone /> <span><small>Phone</small>+27 00 000 0000</span></a><div><MapPin /> <span><small>Location</small>South Africa</span></div></div></div></div></section>
}

function Footer() {
  return <footer><div className="container footer-main"><div><Logo onClick={() => scrollTo('home')} /><p>Your Vision. Our Next Quest.</p></div><div><h4>Company</h4><button onClick={() => scrollTo('services')}>Services</button><button onClick={() => scrollTo('process')}>Process</button><button onClick={() => scrollTo('portfolio')}>Capabilities</button></div><div><h4>Start here</h4><a href="mailto:hello@sidequesttech.co.za">hello@sidequesttech.co.za</a><span>South Africa</span></div></div><div className="container footer-bottom"><span>© {new Date().getFullYear()} SideQuest Tech. All rights reserved.</span><span>Engineered with intent.</span></div></footer>
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
  const submit = () => {
    setSubmitting(true)
    setTimeout(() => {
      const stamp = Date.now(), ref = `SQT-${new Date().getFullYear()}-${String(stamp).slice(-6)}`
      const request = { ...data, id: stamp, reference: ref, status: 'New', createdAt: new Date().toISOString() }
      requestStore.add(request); setSuccess(request); setSubmitting(false); onSubmitted?.()
    }, 900)
  }
  const answers = Object.entries(data).filter(([key, value]) => value && !['need', 'fullName', 'company', 'email', 'phone', 'contactMethod', 'notes'].includes(key))
  if (success) return <div className="modal-shell"><div className="wizard success-card"><button className="modal-close" onClick={onClose}><X /></button><div className="success-icon"><Check /></div><div className="eyebrow">Request received</div><h2>Thank you, {success.fullName.split(' ')[0]}.</h2><p>Your project profile is safely stored. Our team will use it to understand the opportunity before reaching out.</p><div className="reference"><small>Your reference number</small><strong>{success.reference}</strong></div><button className="btn" onClick={onClose}>Return to website</button></div></div>
  return <div className="modal-shell"><div className="wizard"><div className="wizard-head"><div><Logo /><span>Project request</span></div><button className="modal-close" onClick={onClose}><X /></button></div>
    <div className="wizard-progress">{stepNames.map((name, i) => <div className={`${i <= step ? 'active' : ''} ${i < step ? 'done' : ''}`} key={name}><span>{i < step ? <Check /> : i + 1}</span><small>{name}</small></div>)}</div>
    <div className="wizard-body">
      {step === 0 && <><div className="wizard-title"><span>01</span><div><h2>What do you need help with?</h2><p>Choose the closest fit. You can add context in the next step.</p></div></div><div className="option-grid">{needOptions.map(([value, label]) => <button key={value} onClick={() => { setData(d => ({ ...d, need: value })); setError('') }} className={data.need === value ? 'selected' : ''}><span><CircleDot /></span>{label}<Check /></button>)}</div></>}
      {step === 1 && <><div className="wizard-title"><span>02</span><div><h2>Tell us a little more</h2><p>Plain language is perfect. We will help shape the technical details.</p></div></div><div className="form-grid"><ConditionalQuestions data={data} onChange={change} /></div></>}
      {step === 2 && <><div className="wizard-title"><span>03</span><div><h2>Budget and timing</h2><p>This helps us recommend a realistic delivery path.</p></div></div><div className="form-grid"><SelectField label="Budget range" name="budget" value={data.budget} onChange={change} required options={['Under R25,000', 'R25,000 - R60,000', 'R60,000 - R150,000', 'R150,000+', 'Not sure yet']} /><Field label="Desired launch date" name="launchDate" value={data.launchDate} onChange={change} type="date" required /><SelectField label="Urgency level" name="urgency" value={data.urgency} onChange={change} required options={['Flexible', 'Standard', 'High', 'Urgent']} /><Field label="Must-have features" name="mustHave" value={data.mustHave} onChange={change} type="textarea" required /><Field label="Nice-to-have features" name="niceToHave" value={data.niceToHave} onChange={change} type="textarea" /></div></>}
      {step === 3 && <><div className="wizard-title"><span>04</span><div><h2>How can we reach you?</h2><p>We will only use these details to discuss your request.</p></div></div><div className="form-grid"><Field label="Full name" name="fullName" value={data.fullName} onChange={change} required /><Field label="Company name" name="company" value={data.company} onChange={change} /><Field label="Email" name="email" value={data.email} onChange={change} type="email" required /><Field label="Phone number" name="phone" value={data.phone} onChange={change} type="tel" required /><SelectField label="Preferred contact method" name="contactMethod" value={data.contactMethod} onChange={change} required options={['Email', 'Phone', 'WhatsApp']} /><Field label="Extra notes" name="notes" value={data.notes} onChange={change} type="textarea" /></div></>}
      {step === 4 && <><div className="wizard-title"><span>05</span><div><h2>Review your request</h2><p>Check the essentials before sending it to the SideQuest Tech team.</p></div></div><div className="review-grid"><div className="review-card"><small>Project</small><h3>{serviceLabel(data.need)}</h3><p>{data.problem || data.businessIdea || data.repetitiveTask || data.broken}</p></div><div className="review-card"><small>Budget and timing</small><h3>{data.budget}</h3><p>Target: {data.launchDate} · {data.urgency} urgency</p></div><div className="review-card"><small>Contact</small><h3>{data.fullName}</h3><p>{data.company || 'Independent project'}<br />{data.email} · {data.phone}</p></div><div className="review-card review-wide"><small>Project profile</small>{answers.map(([key, value]) => <div className="answer-row" key={key}><span>{key.replace(/([A-Z])/g, ' $1')}</span><p>{value}</p></div>)}</div>{data.notes && <div className="review-card review-wide"><small>Extra notes</small><p>{data.notes}</p></div>}</div></>}
      {error && <div className="form-error">{error}</div>}
    </div>
    <div className="wizard-footer"><button className="btn btn-secondary" onClick={() => step === 0 ? onClose() : setStep(s => s - 1)}><ChevronLeft /> {step === 0 ? 'Cancel' : 'Back'}</button>{step < 4 ? <button className="btn" onClick={next}>Continue <ChevronRight /></button> : <button className="btn" onClick={submit} disabled={submitting}>{submitting ? <><span className="spinner" /> Sending request</> : <>Submit Request <ArrowRight /></>}</button>}</div>
  </div></div>
}

function AdminLogin({ onLogin, onClose }) {
  const [email, setEmail] = useState(''), [password, setPassword] = useState(''), [error, setError] = useState('')
  const submit = e => { e.preventDefault(); if (email === 'admin@sidequesttech.co.za' && password === 'SideQuestTech2026') onLogin(); else setError('The email or password is incorrect.') }
  return <div className="admin-page section-grid"><div className="admin-login"><button className="back-site" onClick={onClose}><ChevronLeft /> Back to website</button><Logo onClick={onClose} /><div className="login-icon"><LockKeyhole /></div><div><div className="eyebrow">Secure workspace</div><h1>Admin login</h1><p>Manage incoming project requests and delivery status.</p></div><form onSubmit={submit}><Field label="Email address" name="email" value={email} onChange={e => { setEmail(e.target.value); setError('') }} type="email" required /><Field label="Password" name="password" value={password} onChange={e => { setPassword(e.target.value); setError('') }} type="password" required />{error && <div className="form-error">{error}</div>}<button className="btn" type="submit">Sign in <ArrowRight /></button></form><div className="demo-note"><ShieldCheck /><span><b>Demo access</b><small>admin@sidequesttech.co.za · SideQuestTech2026</small></span></div></div></div>
}

const statusOptions = ['New', 'Reviewing', 'Contacted', 'In Progress', 'Completed']

function AdminDashboard({ onLogout, onClose }) {
  const [requests, setRequests] = useState(requestStore.get), [search, setSearch] = useState(''), [service, setService] = useState('All'), [status, setStatus] = useState('All'), [selected, setSelected] = useState(null)
  const persist = next => { setRequests(next); requestStore.save(next) }
  const updateStatus = (id, nextStatus) => { const next = requests.map(r => r.id === id ? { ...r, status: nextStatus } : r); persist(next); setSelected(s => s?.id === id ? { ...s, status: nextStatus } : s) }
  const remove = id => { if (window.confirm('Delete this request permanently?')) { persist(requests.filter(r => r.id !== id)); setSelected(null) } }
  const filtered = useMemo(() => requests.filter(r => {
    const query = `${r.reference} ${r.fullName} ${r.company} ${r.email}`.toLowerCase()
    return query.includes(search.toLowerCase()) && (service === 'All' || r.need === service) && (status === 'All' || r.status === status)
  }), [requests, search, service, status])
  const stats = [
    ['Total requests', requests.length], ['New requests', requests.filter(r => r.status === 'New').length],
    ['Website requests', requests.filter(r => r.need === 'website').length], ['App requests', requests.filter(r => r.need === 'app').length],
    ['Automation requests', requests.filter(r => r.need === 'automation').length], ['Urgent requests', requests.filter(r => r.urgency === 'Urgent').length]
  ]
  return <div className="dashboard"><aside><Logo onClick={onClose} /><div className="side-label">Workspace</div><button className="side-active"><MessageSquare /> Project requests <span>{requests.length}</span></button><div className="side-foot"><button onClick={onClose}><ExternalLink /> View website</button><button onClick={onLogout}><LockKeyhole /> Sign out</button></div></aside><main><div className="dashboard-head"><div><div className="eyebrow">SideQuest Tech admin</div><h1>Project requests</h1><p>Review new opportunities and keep every conversation moving.</p></div><button className="btn btn-secondary" onClick={onClose}>View website <ExternalLink /></button></div><div className="stats-grid">{stats.map(([label, value], i) => <div className="stat-card" key={label}><span className={`stat-icon s${i}`}><Sparkles /></span><div><strong>{value}</strong><small>{label}</small></div></div>)}</div><section className="request-panel"><div className="panel-head"><div><h2>All requests</h2><span>{filtered.length} shown</span></div><div className="filters"><label className="search-box"><Search /><input placeholder="Search requests" value={search} onChange={e => setSearch(e.target.value)} /></label><label><Filter /><select value={service} onChange={e => setService(e.target.value)}><option>All</option>{needOptions.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label><label><select value={status} onChange={e => setStatus(e.target.value)}><option>All</option>{statusOptions.map(s => <option key={s}>{s}</option>)}</select></label></div></div>{filtered.length ? <div className="table-wrap"><table><thead><tr><th>Request</th><th>Client</th><th>Service</th><th>Budget</th><th>Timeline</th><th>Status</th><th /></tr></thead><tbody>{filtered.map(r => <tr key={r.id}><td><b>{r.reference}</b><small>{new Date(r.createdAt).toLocaleDateString()}</small></td><td><b>{r.fullName}</b><small>{r.company || r.email}</small></td><td>{serviceLabel(r.need)}</td><td>{r.budget}</td><td><span className={`urgency ${r.urgency?.toLowerCase()}`}>{r.urgency}</span><small>{r.launchDate}</small></td><td><select className={`status-select ${r.status.toLowerCase().replace(' ', '-')}`} value={r.status} onChange={e => updateStatus(r.id, e.target.value)}>{statusOptions.map(s => <option key={s}>{s}</option>)}</select></td><td><div className="table-actions"><button title="View details" onClick={() => setSelected(r)}><Eye /></button><button title="Delete request" onClick={() => remove(r.id)}><Trash2 /></button></div></td></tr>)}</tbody></table></div> : <div className="empty-state"><span><MessageSquare /></span><h3>No requests found</h3><p>{requests.length ? 'Try changing your search or filters.' : 'Submitted project requests will appear here.'}</p></div>}</section></main>
    {selected && <div className="detail-overlay" onMouseDown={e => e.target === e.currentTarget && setSelected(null)}><div className="detail-drawer"><div className="detail-head"><div><small>Project request</small><h2>{selected.reference}</h2></div><button onClick={() => setSelected(null)}><X /></button></div><div className="detail-client"><div className="avatar">{selected.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2)}</div><div><h3>{selected.fullName}</h3><p>{selected.company || 'Independent project'}</p></div></div><div className="detail-status"><label>Status<select value={selected.status} onChange={e => updateStatus(selected.id, e.target.value)}>{statusOptions.map(s => <option key={s}>{s}</option>)}</select></label></div><div className="detail-section"><h4>Project overview</h4><Detail label="Service" value={serviceLabel(selected.need)} /><Detail label="Budget" value={selected.budget} /><Detail label="Desired launch" value={selected.launchDate} /><Detail label="Urgency" value={selected.urgency} /></div><div className="detail-section"><h4>Contact details</h4><Detail label="Email" value={selected.email} /><Detail label="Phone" value={selected.phone} /><Detail label="Preferred contact" value={selected.contactMethod} /></div><div className="detail-section"><h4>Full project profile</h4>{Object.entries(selected).filter(([k, v]) => v && !['id', 'reference', 'status', 'createdAt', 'fullName', 'company', 'email', 'phone', 'contactMethod', 'need'].includes(k)).map(([k, v]) => <Detail key={k} label={k.replace(/([A-Z])/g, ' $1')} value={v} />)}</div><button className="delete-full" onClick={() => remove(selected.id)}><Trash2 /> Delete request</button></div></div>}
  </div>
}

function Detail({ label, value }) { return <div className="detail-row"><span>{label}</span><p>{value || 'Not provided'}</p></div> }

function Site({ onStart, onAdmin }) {
  return <><Navbar onStart={() => onStart()} onAdmin={onAdmin} /><main><Hero onStart={() => onStart()} /><Services onSelect={onStart} /><Values /><Process /><Portfolio /><Contact onStart={() => onStart()} /></main><Footer /></>
}

export default function App() {
  const [view, setView] = useState(() => sessionStore.get() ? 'dashboard' : 'site')
  const [wizard, setWizard] = useState(false), [service, setService] = useState('')
  const openWizard = (choice = '') => { setService(choice); setWizard(true) }
  const login = () => { sessionStore.set(true); setView('dashboard') }
  const logout = () => { sessionStore.set(false); setView('site') }
  if (view === 'login') return <AdminLogin onLogin={login} onClose={() => setView('site')} />
  if (view === 'dashboard') return <AdminDashboard onLogout={logout} onClose={() => setView('site')} />
  return <><Site onStart={openWizard} onAdmin={() => setView(sessionStore.get() ? 'dashboard' : 'login')} />{wizard && <ProjectWizard initialService={service} onClose={() => setWizard(false)} />}</>
}
