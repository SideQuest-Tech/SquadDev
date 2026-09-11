import React, { useEffect, useRef, useState } from 'react'
import {
  ArrowRight, ArrowUpRight, Check, CheckCircle2, ChevronLeft, ChevronRight, CircleDot,
  Code2, Layers3, LockKeyhole, Mail, MapPin, Menu, MessageSquare,
  Phone, ShieldCheck, Target, X, Zap, Wrench
} from 'lucide-react'
import { needOptions, serviceLabel, services } from './data'
import { clientSessionStore, sessionStore } from './storage'
import brandImage from './favIcon.jpg'
import DotField from './components/DotField/DotField'
import TextType from './components/TextType/TextType'
import CrmDashboard from './components/AdminDashboard'
import ConceptsSection from './components/concepts/ConceptsSection'
import ClientDashboard from './components/ClientDashboard/ClientDashboard'
import { logger } from './lib/logger'

const emptyForm: Record<string, string> = {
  need: '', projectType: '', payments: '', booking: '', dashboard: '', branding: '',
  platform: '', users: '', problem: '', accounts: '', features: '', repetitiveTask: '',
  currentTools: '', automationOutputs: '', broken: '', technology: '', issueUrgent: '',
  fixScope: '', businessIdea: '', desiredResult: '', budget: '', launchDate: '', urgency: '',
  mustHave: '', niceToHave: '', fullName: '', company: '', email: '', phone: '',
  contactMethod: '', notes: ''
}

function useMediaQuery(query: string): boolean {
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

const scrollTo = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

/* ── Logo ─────────────────────────────────────────────────────── */
interface LogoProps {
  onClick?: () => void
}

function Logo({ onClick }: LogoProps): React.ReactElement {
  return (
    <button className="logo" onClick={onClick} aria-label="SideQuest Tech home">
      <span className="logo-mark"><img src={brandImage} alt="" /></span>
      <span>SideQuest <span>Tech</span></span>
    </button>
  )
}

/* ── Navbar ───────────────────────────────────────────────────── */
interface NavbarProps {
  onStart: () => void
  onLogin: () => void
}

function Navbar({ onStart, onLogin }: NavbarProps): React.ReactElement {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState('home')
  const mobile = useMediaQuery('(max-width: 800px)')

  useEffect(() => {
    const onScroll = () => {
      const sections = ['services', 'process', 'concepts']
      const current = sections.filter(
        id => document.getElementById(id)?.getBoundingClientRect().top <= 120
      ).at(-1)
      if (current) setActive(current)
      else setActive('home')
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!open) return undefined
    const closeOnEscape = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.body.classList.add('nav-open')
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.classList.remove('nav-open')
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  useEffect(() => { if (!mobile) setOpen(false) }, [mobile])

  const go = (id: string) => {
    setActive(id)
    setOpen(false)
    requestAnimationFrame(() => scrollTo(id))
  }

  return (
    <header className={`nav-wrap ${open ? 'menu-open' : ''}`}>
      <nav className="navbar container">
        <Logo onClick={() => { setActive('home'); scrollTo('home') }} />
        <button
          className="menu-btn"
          onClick={() => setOpen(v => !v)}
          aria-label={open ? 'Close navigation' : 'Open navigation'}
          aria-expanded={open}
          aria-controls="primary-navigation"
        >
          {open ? <X /> : <Menu />}
        </button>
        <button
          className={`nav-scrim ${open ? 'open' : ''}`}
          aria-label="Close navigation"
          tabIndex={-1}
          onClick={() => setOpen(false)}
        />
        <div
          id="primary-navigation"
          className={`nav-links ${open ? 'open' : ''}`}
          aria-hidden={mobile && !open}
        >
          <span className="menu-kicker">Navigation</span>
          <button className={active === 'services' ? 'active' : ''} onClick={() => go('services')}>Services</button>
          <button className={active === 'process'  ? 'active' : ''} onClick={() => go('process')}>Process</button>
          <button className={active === 'concepts' ? 'active' : ''} onClick={() => go('concepts')}>Concepts</button>
          <button className="nav-login" onClick={() => { onLogin(); setOpen(false) }}>Login</button>
          <button className="btn btn-small" onClick={() => { onStart(); setOpen(false) }}>
            Start a Project <ArrowRight size={14} />
          </button>
        </div>
      </nav>
    </header>
  )
}

/* ── Hero sketch SVG ──────────────────────────────────────────── */
function HeroSketchSVG(): React.ReactElement {
  return (
    <svg viewBox="0 0 480 440" fill="none" xmlns="http://www.w3.org/2000/svg" className="hero-sketch-svg">
      <path d="M60 180 C80 120 140 100 182 90" stroke="currentColor" strokeWidth="1" strokeDasharray="5 9" />
      <path d="M182 90 C242 68 302 100 342 140" stroke="currentColor" strokeWidth="1" />
      <path d="M342 140 C382 180 382 240 362 292" stroke="currentColor" strokeWidth="1" strokeDasharray="4 8" />
      <path d="M182 90 L242 222" stroke="currentColor" strokeWidth="1" />
      <path d="M242 222 L362 292" stroke="currentColor" strokeWidth="1" strokeDasharray="3 7" />
      <path d="M242 222 L120 322" stroke="currentColor" strokeWidth="1" />
      <path d="M120 322 L60 180" stroke="currentColor" strokeWidth="1" strokeDasharray="5 9" />
      <path d="M60 180 L242 222" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 6" opacity="0.4" />
      <circle cx="60"  cy="180" r="5"  stroke="currentColor" strokeWidth="1.5" />
      <circle cx="182" cy="90"  r="8"  stroke="currentColor" strokeWidth="1.5" />
      <circle cx="342" cy="140" r="5"  stroke="currentColor" strokeWidth="1.5" />
      <circle cx="242" cy="222" r="11" stroke="currentColor" strokeWidth="2"   />
      <circle cx="362" cy="292" r="6"  stroke="currentColor" strokeWidth="1.5" />
      <circle cx="120" cy="322" r="5"  stroke="currentColor" strokeWidth="1.5" />
      {([[44,46],[426,74],[418,224],[44,316],[418,356]] as [number,number][]).map(([x,y],i) => (
        <g key={i} stroke="currentColor" strokeWidth="0.75" opacity="0.3">
          <line x1={x-5} y1={y} x2={x+5} y2={y} />
          <line x1={x} y1={y-5} x2={x} y2={y+5} />
        </g>
      ))}
      <g transform="translate(356,286)" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
        <path d="M0 0 L10 6 L0 12" />
      </g>
      <text x="249" y="218" fill="currentColor" fontSize="5.5" opacity="0.22" fontFamily="monospace" textAnchor="middle">origin</text>
      <text x="374" y="308" fill="currentColor" fontSize="5.5" opacity="0.22" fontFamily="monospace" textAnchor="middle">quest</text>
    </svg>
  )
}

/* ── Hero ─────────────────────────────────────────────────────── */
interface HeroProps {
  onStart: () => void
}

function Hero({ onStart }: HeroProps): React.ReactElement {
  const compact = useMediaQuery('(max-width: 800px)')
  return (
    <section id="home" className="hero section-grid">
      <div className="hero-bg-overlay" aria-hidden="true" />
      <div className="container hero-layout">
        <div className="hero-copy">
          <h1 aria-label="Your Vision. Our Next Quest.">
            <TextType
              as="span" className="vision-line" text="Your Vision."
              typingSpeed={compact ? 40 : 80} loop={false} showCursor={false}
              aria-hidden="true"
            />
            <TextType
              as="span" className="quest-line" text="Our Next Quest."
              typingSpeed={compact ? 40 : 80} initialDelay={compact ? 400 : 1000}
              pauseDuration={1500} deletingSpeed={55} loop={false}
              showCursor cursorCharacter="_" cursorClassName="hero-type-cursor"
              cursorBlinkDuration={0.5}
              aria-hidden="true"
            />
          </h1>
          <p className="hero-tagline">Websites. Apps. Software. Built right.</p>
          <div className="hero-actions">
            <button className="btn" onClick={onStart}>
              Start a Project <ArrowRight size={16} />
            </button>
            <button className="btn btn-ghost" onClick={() => scrollTo('concepts')}>
              View Concepts ↓
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Services / Bento ─────────────────────────────────────────── */
interface ServicesProps {
  onSelect: (service: string) => void
}

function Services({ onSelect }: ServicesProps): React.ReactElement {
  return (
    <section id="services" className="section services">
      <div className="container">
        <div className="section-label">
          <span className="section-label-text">What we build</span>
          <span className="section-label-line" />
        </div>
        <div className="services-bento">
          {services.map((svc, i) => {
            const Icon = svc.icon
            return (
              <button
                key={svc.short}
                className={`bento-svc${i === 0 ? ' featured' : ''}`}
                onClick={() => onSelect(svc.short)}
              >
                <Icon className="bento-icon" size={i === 0 ? 32 : 24} strokeWidth={1.4} />
                <span className="bento-name">{svc.name}</span>
                {i === 0 && <span className="bento-desc">{svc.description}</span>}
                <ArrowUpRight className="bento-arrow" size={16} />
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ── Values ───────────────────────────────────────────────────── */
const valueItems = [
  { Icon: Code2,         keyword: 'Clean Code',    phrase: 'Built to last'        },
  { Icon: Zap,           keyword: 'Fast Delivery',  phrase: 'Ship with confidence' },
  { Icon: Layers3,       keyword: 'Scales Well',    phrase: 'Grows with you'       },
  { Icon: MessageSquare, keyword: 'Clear Comms',    phrase: 'No mystery here'      },
  { Icon: Target,        keyword: 'Business First', phrase: 'Outcome-driven'       },
  { Icon: ShieldCheck,   keyword: 'Long Support',   phrase: 'Beyond the launch'    },
]

function Values(): React.ReactElement {
  return (
    <section className="section values-section">
      <div className="container">
        <div className="section-label">
          <span className="section-label-text">Why us</span>
          <span className="section-label-line" />
        </div>
        <div className="values-grid">
          {valueItems.map(({ Icon, keyword, phrase }) => (
            <div key={keyword} className="value-cell">
              <Icon className="value-icon" size={20} strokeWidth={1.5} />
              <div className="value-keyword">{keyword}</div>
              <div className="value-phrase">{phrase}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Process ──────────────────────────────────────────────────── */
const phases = [
  { num: '01', name: 'Discover', desc: 'We listen, you guide.' },
  { num: '02', name: 'Build',    desc: 'We make it work.'      },
  { num: '03', name: 'Launch',   desc: 'We ship it and stay.'  },
]

function Process(): React.ReactElement {
  return (
    <section id="process" className="section process-section">
      <div className="container">
        <div className="section-label">
          <span className="section-label-text">How we work</span>
          <span className="section-label-line" />
        </div>
        <div className="process-phases">
          {phases.map(({ num, name, desc }) => (
            <div key={num} className="process-phase">
              <div className="phase-num-row">
                <span className="phase-num-text">{num}</span>
                <span className="phase-connector" />
              </div>
              <div className="phase-name">{name}</div>
              <p className="phase-desc">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Closing CTA ──────────────────────────────────────────────── */
interface ClosingCTAProps {
  onStart: () => void
}

function ClosingCTA({ onStart }: ClosingCTAProps): React.ReactElement {
  return (
    <section className="closing-cta section-grid">
      <div className="dot-field-layer closing-dot-field" aria-hidden="true">
        <DotField
          dotRadius={1} dotSpacing={22} bulgeStrength={28} glowRadius={90}
          sparkle={true} waveAmplitude={0.4} cursorRadius={280} cursorForce={0.05}
          gradientFrom="rgba(255,255,255,0.09)" gradientTo="rgba(84,86,90,0.05)"
          glowColor="rgba(37,99,235,0.09)"
        />
      </div>
      <div className="container closing-cta-inner">
        <h2 className="closing-heading">
          Ready to build<br />something?
        </h2>
        <button className="btn" onClick={onStart}>
          Start a Project <ArrowRight size={16} />
        </button>
        <a className="closing-email" href="mailto:hello@sidequesttech.co.za">
          hello@sidequesttech.co.za
        </a>
      </div>
    </section>
  )
}

/* ── Footer ───────────────────────────────────────────────────── */
interface FooterProps {
  onLogin: () => void
}

function Footer({ onLogin }: FooterProps): React.ReactElement {
  return (
    <footer>
      <div className="container footer-inner">
        <div className="footer-top">
          <button className="footer-logo" onClick={() => scrollTo('home')} aria-label="Back to top">
            <span className="footer-logo-mark"><img src={brandImage} alt="" /></span>
            SideQuest Tech
          </button>
          <div className="footer-links">
            <button onClick={() => scrollTo('services')}>Services</button>
            <button onClick={() => scrollTo('process')}>Process</button>
            <button onClick={() => scrollTo('concepts')}>Concepts</button>
          </div>
          <div className="footer-right">
            <button className="footer-login" onClick={onLogin}>Client login</button>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="footer-contact">
            <span><MapPin size={11} /> Cape Town, South Africa</span>
            <a href="mailto:hello@sidequesttech.co.za"><Mail size={11} /> hello@sidequesttech.co.za</a>
          </div>
          <span className="footer-copyright">© {new Date().getFullYear()} SideQuest Tech Pty Ltd. All rights reserved.</span>
        </div>
      </div>
    </footer>
  )
}

/* ── Site (public view) ───────────────────────────────────────── */
interface SiteProps {
  onStart: (service?: string) => void
  onLogin: () => void
}

function Site({ onStart, onLogin }: SiteProps): React.ReactElement {
  return (
    <>
      <Navbar onStart={onStart} onLogin={onLogin} />
      <main>
        <Hero onStart={onStart} />
        <Services onSelect={onStart} />
        <Values />
        <Process />
        <section id="concepts" className="concepts-section">
          <ConceptsSection />
        </section>
        <ClosingCTA onStart={onStart} />
      </main>
      <Footer onLogin={onLogin} />
    </>
  )
}

/* ── Field + wizard form helpers ──────────────────────────────── */
interface FieldProps {
  label: string
  name: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
  type?: string
  required?: boolean
  placeholder?: string
  children?: React.ReactNode
}

function Field({ label, name, value, onChange, type = 'text', required, placeholder, children }: FieldProps): React.ReactElement {
  return (
    <label className="field">
      <span>{label}{required && <b> *</b>}</span>
      {children || (
        type === 'textarea'
          ? <textarea name={name} value={value || ''} onChange={onChange as React.ChangeEventHandler<HTMLTextAreaElement>} placeholder={placeholder} />
          : <input type={type} name={name} value={value || ''} onChange={onChange as React.ChangeEventHandler<HTMLInputElement>} placeholder={placeholder} />
      )}
    </label>
  )
}

interface SelectFieldProps {
  label: string
  name: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  options: string[]
  required?: boolean
}

function SelectField({ label, name, value, onChange, options, required }: SelectFieldProps): React.ReactElement {
  return (
    <Field label={label} name={name} value={value} onChange={onChange as any} required={required}>
      <select name={name} value={value || ''} onChange={onChange}>
        <option value="">Select an option</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </Field>
  )
}

interface ConditionalQuestionsProps {
  data: Record<string, string>
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
}

function ConditionalQuestions({ data, onChange }: ConditionalQuestionsProps): React.ReactElement {
  if (data.need === 'website') return <><SelectField label="What kind of website is it?" name="projectType" value={data.projectType} onChange={onChange as any} required options={['Business','Personal brand','Ecommerce','School','Church','Restaurant','Other']} /><SelectField label="Do you need online payments?" name="payments" value={data.payments} onChange={onChange as any} options={['Yes','No','Not sure']} /><SelectField label="Do you need booking?" name="booking" value={data.booking} onChange={onChange as any} options={['Yes','No','Not sure']} /><SelectField label="Do you need an admin dashboard?" name="dashboard" value={data.dashboard} onChange={onChange as any} options={['Yes','No','Not sure']} /><SelectField label="Do you already have branding?" name="branding" value={data.branding} onChange={onChange as any} options={['Yes','No','Partially']} /></>
  if (data.need === 'app') return <><SelectField label="Where should it work?" name="platform" value={data.platform} onChange={onChange as any} required options={['Mobile','Web','Both']} /><Field label="Who will use it?" name="users" value={data.users} onChange={onChange} required placeholder="Customers, staff, members..." /><Field label="What main problem should it solve?" name="problem" value={data.problem} onChange={onChange} required type="textarea" /><SelectField label="Do you need login accounts?" name="accounts" value={data.accounts} onChange={onChange as any} options={['Yes','No','Not sure']} /><Field label="Special features" name="features" value={data.features} onChange={onChange} placeholder="Payments, maps, chat, notifications, AI..." /></>
  if (data.need === 'automation') return <><Field label="What repetitive task do you want to reduce?" name="repetitiveTask" value={data.repetitiveTask} onChange={onChange} required type="textarea" /><Field label="Which tools do you currently use?" name="currentTools" value={data.currentTools} onChange={onChange} placeholder="Excel, email, accounting software..." /><Field label="What should the automation produce?" name="automationOutputs" value={data.automationOutputs} onChange={onChange} placeholder="Reports, emails, dashboards, integrations..." /></>
  if (data.need === 'existing') return <><Field label="What is broken or frustrating?" name="broken" value={data.broken} onChange={onChange} required type="textarea" /><Field label="What technology is it built with, if known?" name="technology" value={data.technology} onChange={onChange} /><SelectField label="Is the issue urgent?" name="issueUrgent" value={data.issueUrgent} onChange={onChange as any} options={['Yes','No','Not sure']} /><Field label="What kind of help do you need?" name="fixScope" value={data.fixScope} onChange={onChange} placeholder="Redesign, performance, bug fixes, new features..." /></>
  if (data.need === 'unsure') return <><Field label="Tell us about your business or idea" name="businessIdea" value={data.businessIdea} onChange={onChange} required type="textarea" /><Field label="What problem are you trying to solve?" name="problem" value={data.problem} onChange={onChange} required type="textarea" /><Field label="What result would make this successful?" name="desiredResult" value={data.desiredResult} onChange={onChange} required type="textarea" /></>
  return <><Field label="Tell us about the idea or system" name="businessIdea" value={data.businessIdea} onChange={onChange} required type="textarea" placeholder="What are you building, and who is it for?" /><Field label="What problem should it solve?" name="problem" value={data.problem} onChange={onChange} required type="textarea" /><Field label="What would a successful outcome look like?" name="desiredResult" value={data.desiredResult} onChange={onChange} type="textarea" /></>
}

const stepNames = ['Project type', 'Project details', 'Budget & timing', 'Contact details', 'Review']

interface ProjectWizardProps {
  initialService: string
  onClose: () => void
  onSubmitted?: () => void
}

interface SubmittedRequest extends Record<string, any> {
  fullName?: string
  reference: string
}

function ProjectWizard({ initialService, onClose, onSubmitted }: ProjectWizardProps): React.ReactElement {
  const [step, setStep] = useState(0)
  const [data, setData] = useState<Record<string, string>>({ ...emptyForm, need: initialService || '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState<SubmittedRequest | null>(null)

  useEffect(() => { document.body.classList.add('modal-open'); return () => document.body.classList.remove('modal-open') }, [])

  const change = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setData(d => ({ ...d, [e.target.name]: e.target.value })); setError('')
  }

  const validate = (): string => {
    if (step === 0 && !data.need) return 'Choose the option that best matches your project.'
    if (step === 1) {
      const req = data.need === 'website' ? ['projectType'] : data.need === 'app' ? ['platform','users','problem'] : data.need === 'automation' ? ['repetitiveTask'] : data.need === 'existing' ? ['broken'] : data.need === 'unsure' ? ['businessIdea','problem','desiredResult'] : ['businessIdea','problem']
      if (req.some(k => !data[k]?.trim())) return 'Complete the required project details to continue.'
    }
    if (step === 2 && (!data.budget || !data.launchDate || !data.urgency || !data.mustHave.trim())) return 'Complete the required budget and timing fields.'
    if (step === 3 && (!data.fullName.trim() || !/^\S+@\S+\.\S+$/.test(data.email) || !data.phone.trim() || !data.contactMethod)) return 'Enter a valid name, email, phone number and contact preference.'
    return ''
  }

  const next = () => { const msg = validate(); if (msg) return setError(msg); setStep(s => Math.min(4, s + 1)); setError('') }

  const submit = async () => {
    setSubmitting(true)
    const stamp = Date.now(), ref = `SQT-${new Date().getFullYear()}-${String(stamp).slice(-6)}`
    const request: SubmittedRequest = { ...data, id: stamp, reference: ref, status: 'New', createdAt: new Date().toISOString(), adminNotes: '' }
    try {
      await fetch('/api/requests', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(request) })
      await fetch('/api/send-email', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(request) })
    } catch (err) { logger.error('Request submission failed', { message: (err as Error).message }) }
    setSuccess(request); setSubmitting(false); onSubmitted?.()
  }

  const answers = Object.entries(data).filter(([key, value]) => value && !['need','fullName','company','email','phone','contactMethod','notes'].includes(key))

  if (success) return (
    <div className="modal-shell">
      <div className="wizard success-card">
        <button className="modal-close" aria-label="Close" onClick={onClose}><X /></button>
        <div className="success-icon"><Check /></div>
        <div className="eyebrow">Request received</div>
        <h2>Thank you, {success.fullName.split(' ')[0]}.</h2>
        <p>Your project profile is safely stored. Our team will use it to understand the opportunity before reaching out.</p>
        <div className="reference"><small>Your reference number</small><strong>{success.reference}</strong></div>
        <button className="btn" onClick={onClose}>Return to website</button>
      </div>
    </div>
  )

  return (
    <div className="modal-shell">
      <div className="wizard">
        <div className="wizard-head">
          <div><Logo /><span>Project request</span></div>
          <button className="modal-close" aria-label="Close project request" onClick={onClose}><X /></button>
        </div>
        <div className="wizard-progress">
          {stepNames.map((name, i) => (
            <div className={`${i <= step ? 'active' : ''} ${i < step ? 'done' : ''}`} key={name}>
              <span>{i < step ? <Check /> : i + 1}</span>
              <small>{name}</small>
            </div>
          ))}
        </div>
        <div className="wizard-body">
          {step === 0 && <><div className="wizard-title"><span>01</span><div><h2>What do you need help with?</h2><p>Choose the closest fit. You can add context in the next step.</p></div></div><div className="option-grid">{needOptions.map(([value, label]) => <button key={value} onClick={() => { setData(d => ({ ...d, need: value })); setError('') }} className={data.need === value ? 'selected' : ''}><span><CircleDot /></span>{label}<Check /></button>)}</div></>}
          {step === 1 && <><div className="wizard-title"><span>02</span><div><h2>Tell us a little more</h2><p>Plain language is perfect. We will help shape the technical details.</p></div></div><div className="form-grid"><ConditionalQuestions data={data} onChange={change} /></div></>}
          {step === 2 && <><div className="wizard-title"><span>03</span><div><h2>Budget and timing</h2><p>This helps us recommend a realistic delivery path.</p></div></div><div className="form-grid"><SelectField label="Budget range" name="budget" value={data.budget} onChange={change as any} required options={['Under R25,000','R25,000 - R60,000','R60,000 - R150,000','R150,000+','Not sure yet']} /><Field label="Desired launch date" name="launchDate" value={data.launchDate} onChange={change} type="date" required /><SelectField label="Urgency level" name="urgency" value={data.urgency} onChange={change as any} required options={['Flexible','Standard','High','Urgent']} /><Field label="Must-have features" name="mustHave" value={data.mustHave} onChange={change} type="textarea" required /><Field label="Nice-to-have features" name="niceToHave" value={data.niceToHave} onChange={change} type="textarea" /></div></>}
          {step === 3 && <><div className="wizard-title"><span>04</span><div><h2>How can we reach you?</h2><p>We will only use these details to discuss your request.</p></div></div><div className="form-grid"><Field label="Full name" name="fullName" value={data.fullName} onChange={change} required /><Field label="Company name" name="company" value={data.company} onChange={change} /><Field label="Email" name="email" value={data.email} onChange={change} type="email" required /><Field label="Phone number" name="phone" value={data.phone} onChange={change} type="tel" required /><SelectField label="Preferred contact method" name="contactMethod" value={data.contactMethod} onChange={change as any} required options={['Email','Phone','WhatsApp']} /><Field label="Extra notes" name="notes" value={data.notes} onChange={change} type="textarea" /></div></>}
          {step === 4 && <><div className="wizard-title"><span>05</span><div><h2>Review your request</h2><p>Check the essentials before sending it to the SideQuest Tech team.</p></div></div><div className="review-grid"><div className="review-card"><small>Project</small><h3>{serviceLabel(data.need)}</h3><p>{data.problem || data.businessIdea || data.repetitiveTask || data.broken}</p></div><div className="review-card"><small>Budget and timing</small><h3>{data.budget}</h3><p>Target: {data.launchDate} · {data.urgency} urgency</p></div><div className="review-card"><small>Contact</small><h3>{data.fullName}</h3><p>{data.company || 'Independent project'}<br />{data.email} · {data.phone}</p></div><div className="review-card review-wide"><small>Project profile</small>{answers.map(([key, value]) => <div className="answer-row" key={key}><span>{key.replace(/([A-Z])/g,' $1')}</span><p>{value}</p></div>)}</div>{data.notes && <div className="review-card review-wide"><small>Extra notes</small><p>{data.notes}</p></div>}</div></>}
          {error && <div className="form-error">{error}</div>}
        </div>
        <div className="wizard-footer">
          <button className="btn btn-secondary" onClick={() => step === 0 ? onClose() : setStep(s => s - 1)}>
            <ChevronLeft /> {step === 0 ? 'Cancel' : 'Back'}
          </button>
          {step < 4
            ? <button className="btn" onClick={next}>Continue <ChevronRight /></button>
            : <button className="btn" onClick={submit} disabled={submitting}>
                {submitting ? <><span className="spinner" /> Sending request</> : <>Submit Request <ArrowRight /></>}
              </button>
          }
        </div>
      </div>
    </div>
  )
}

/* ── Unified login — auth-switch style ────────────────────────── */
type AppView = 'site' | 'login' | 'dashboard' | 'client-dashboard'

interface UnifiedLoginProps {
  setView: (view: AppView) => void
  onStart?: (service?: string) => void
}

function UnifiedLogin({ setView, onStart }: UnifiedLoginProps): React.ReactElement {
  const [tab, setTab] = useState('login')
  const [email, setEmail] = useState(''), [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState(''), [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState(''), [loading, setLoading] = useState(false)
  const [mustChange, setMustChange] = useState(false), [pendingToken, setPendingToken] = useState<string | null>(null)
  const [forgotStep, setForgotStep] = useState<'idle' | 'form' | 'sent'>('idle')
  const [forgotEmail, setForgotEmail] = useState('')

  const login = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const res  = await fetch('/api/login', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ email: email.trim().toLowerCase(), password }) })
      const data = await res.json()
      if (!data.ok) { setError(data.error || 'Invalid email or password.'); return }
      if (data.role === 'admin') { sessionStore.set(true); setView('dashboard') }
      else if (data.client.mustChangePassword) { setPendingToken(data.token); setMustChange(true) }
      else { clientSessionStore.setToken(data.token); setView('client-dashboard') }
    } catch { setError('Could not reach the server. Please try again.') }
    finally { setLoading(false) }
  }

  const changePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setError('')
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return }
    if (newPassword.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    try {
      const res  = await fetch('/api/change-password', { method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${pendingToken}`}, body:JSON.stringify({ currentPassword: password, newPassword }) })
      const data = await res.json()
      if (!data.ok) { setError(data.error || 'Failed to update password'); return }
      clientSessionStore.setToken(pendingToken!); setView('client-dashboard')
    } catch { setError('Could not reach the server. Please try again.') }
    finally { setLoading(false) }
  }

  const sendForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      await fetch('/api/forgot-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: forgotEmail.trim().toLowerCase() }) })
      setForgotStep('sent')
    } catch { setError('Could not reach the server. Please try again.') }
    finally { setLoading(false) }
  }

  return (
    <div className="auth-screen">
      <button className="auth-back-btn" onClick={() => { setView('site'); setForgotStep('idle') }}>
        <ChevronLeft size={13} /> Back to site
      </button>

      <div className="auth-card">
        <div className="auth-card-glow" aria-hidden="true" />

        <div className="auth-brand">
          <img src={brandImage} alt="" />
          <span className="auth-brand-name">SideQuest Tech</span>
        </div>

        {!mustChange && forgotStep === 'idle' && (
          <div className="auth-tabs">
            <div
              className="auth-tab-pill"
              style={{ transform: tab === 'start' ? 'translateX(100%)' : 'translateX(0)' }}
            />
            <button className={`auth-tab-btn${tab === 'login' ? ' active' : ''}`} onClick={() => setTab('login')}>
              Client Login
            </button>
            <button className={`auth-tab-btn${tab === 'start' ? ' active' : ''}`} onClick={() => setTab('start')}>
              Start a Project
            </button>
          </div>
        )}

        {mustChange && (
          <form className="auth-form" onSubmit={changePassword}>
            <p style={{ color: 'var(--ink-2)', fontSize: 13, marginBottom: 4 }}>
              First login — set a new password to continue.
            </p>
            <div className="auth-field">
              <label>New password</label>
              <input type="password" value={newPassword} onChange={e => { setNewPassword(e.target.value); setError('') }} required />
            </div>
            <div className="auth-field">
              <label>Confirm new password</label>
              <input type="password" value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); setError('') }} required />
            </div>
            {error && <div className="auth-error">{error}</div>}
            <button className="btn auth-submit" type="submit" disabled={loading}>
              {loading ? 'Saving…' : <>Set password &amp; continue <ArrowRight size={14} /></>}
            </button>
          </form>
        )}

        {forgotStep === 'form' && (
          <form className="auth-form" onSubmit={sendForgotPassword}>
            <p className="auth-forgot-hint">Enter your email and we'll send you a temporary password.</p>
            <div className="auth-field">
              <label>Email address</label>
              <input type="email" value={forgotEmail} onChange={e => { setForgotEmail(e.target.value); setError('') }} placeholder="you@company.com" required autoFocus />
            </div>
            {error && <div className="auth-error">{error}</div>}
            <button className="btn auth-submit" type="submit" disabled={loading}>
              {loading ? 'Sending…' : <>Send temporary password <ArrowRight size={14} /></>}
            </button>
            <button type="button" className="auth-link-btn" onClick={() => { setForgotStep('idle'); setError('') }}>
              Back to login
            </button>
          </form>
        )}

        {forgotStep === 'sent' && (
          <div className="auth-form">
            <p className="auth-forgot-hint">If that email is on file, a temporary password is on its way. Check your inbox.</p>
            <button type="button" className="btn auth-submit" onClick={() => { setForgotStep('idle'); setForgotEmail('') }}>
              Back to login
            </button>
          </div>
        )}

        {!mustChange && forgotStep === 'idle' && tab === 'login' && (
          <form className="auth-form" onSubmit={login}>
            <div className="auth-field">
              <label>Email address</label>
              <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError('') }} placeholder="you@company.com" required />
            </div>
            <div className="auth-field">
              <label>Password</label>
              <input type="password" value={password} onChange={e => { setPassword(e.target.value); setError('') }} placeholder="••••••••" required />
            </div>
            {error && <div className="auth-error">{error}</div>}
            <button className="btn auth-submit" type="submit" disabled={loading}>
              {loading ? 'Signing in…' : <>Sign in <ArrowRight size={14} /></>}
            </button>
            <button type="button" className="auth-link-btn" onClick={() => { setForgotStep('form'); setForgotEmail(email); setError('') }}>
              Forgot password?
            </button>
          </form>
        )}

        {!mustChange && forgotStep === 'idle' && tab === 'start' && (
          <div className="auth-start-panel">
            <p className="auth-start-text">
              Tell us what you need. We will respond within 24 hours with a clear plan and timeline.
            </p>
            <button className="btn auth-submit" onClick={() => { setView('site'); onStart?.() }}>
              Start a Project <ArrowRight size={14} />
            </button>
            <p className="auth-start-note">No account needed — just a quick brief.</p>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── App root ─────────────────────────────────────────────────── */
export default function App(): React.ReactElement {
  const [view, setView] = useState<AppView>(() => {
    if (sessionStore.get()) return 'dashboard'
    if (clientSessionStore.getPayload()) return 'client-dashboard'
    return 'site'
  })
  const [wizard, setWizard]   = useState(false)
  const [service, setService] = useState('')

  const openWizard = (choice = '') => { setService(choice); setWizard(true) }
  const logout     = () => { sessionStore.set(false); setView('site') }

  const content = view === 'login'
    ? <UnifiedLogin setView={setView} onStart={openWizard} />
    : view === 'dashboard'
      ? <CrmDashboard onLogout={logout} onClose={() => setView('site')} />
      : view === 'client-dashboard'
        ? <ClientDashboard setView={setView} />
        : (
          <>
            <Site onStart={openWizard} onLogin={() => setView('login')} />
            {wizard && (
              <ProjectWizard
                initialService={service}
                onClose={() => setWizard(false)}
              />
            )}
          </>
        )

  return <>{content}</>
}
