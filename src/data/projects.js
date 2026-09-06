import { CodeXml, Compass, FlaskConical, LifeBuoy, Map, PenTool, Rocket } from 'lucide-react'
import { services } from '../data'

// The seven stages mirror the "How we work" section on the public site, so a client
// sees the same language in the tracker that they read before they hired us.
// More than one stage can be active at a time (for example a redesign running
// alongside an integration build).
export const stageDefinitions = [
  { id: 'discovery', name: 'Discovery', icon: Compass, blurb: 'Understand the goal, context and real constraints.' },
  { id: 'planning', name: 'Planning', icon: Map, blurb: 'Define the path, scope and delivery priorities.' },
  { id: 'design', name: 'Design', icon: PenTool, blurb: 'Shape clear user journeys and polished interfaces.' },
  { id: 'development', name: 'Development', icon: CodeXml, blurb: 'Build in focused, testable and visible increments.' },
  { id: 'testing', name: 'Testing', icon: FlaskConical, blurb: 'Check quality, performance and edge cases.' },
  { id: 'launch', name: 'Launch', icon: Rocket, blurb: 'Move to production with a controlled release.' },
  { id: 'support', name: 'Support', icon: LifeBuoy, blurb: 'Monitor, improve and grow the product with you.' }
]

export const stageStatuses = [['upcoming', 'Up next'], ['active', 'In progress'], ['complete', 'Complete']]
export const healthOptions = ['On track', 'Needs your input', 'At risk']
export const deliverableStatuses = ['Scheduled', 'In progress', 'In review', 'Awaiting your approval', 'Approved', 'Complete', 'On hold']
export const updateTypes = [['milestone', 'Milestone'], ['update', 'Update'], ['decision', 'Decision'], ['needs-you', 'Needs you']]

export const defaultTeam = [
  { name: 'Nathan', role: 'Engineer' },
  { name: 'Kgosi', role: 'Engineer' },
  { name: 'Lwazi', role: 'Engineer' },
  { name: 'Siphosethu', role: 'Engineer' }
]

// Seed data. The live copy lives in the project store (local storage) and is edited from the
// admin Projects view; this file only provides the starting point and can restore it.
export const projects = [
  {
    id: 'internet-athi-website',
    reference: 'SQT-2026-140809',
    accessCode: 'ATHI-2026',
    name: 'Internet Athi official website',
    tagline: 'A living archive for the Polymorphism era',
    service: 'website',
    serviceLabel: 'Website Development',
    summary: 'An art-directed archive built around the debut album Polymorphism: album and video pages, live dates fed by Bandsintown onto an interactive South Africa map, the artist story, a fan community signup and booking enquiries.',
    client: { name: 'Internet Athi', contact: 'Athi', company: 'Internet Athi', email: 'team@internetathi.com', location: 'Cape Town, South Africa' },
    startedAt: '2026-07-20',
    targetLaunch: '2026-09-16',
    lastUpdated: '2026-09-06',
    health: 'On track',
    domain: 'internetathi.com',
    buildLabel: 'internet-athi / redesign',
    team: defaultTeam,
    cadence: 'A written update every Friday. Any of us can be reached on the shared email, and we call at each stage handover.',
    links: [
      { label: 'Live preview', url: 'https://at-umber-eight.vercel.app/', note: 'Current build of the site' },
      { label: 'Bandsintown, Cape Town listings', url: 'https://www.bandsintown.com/c/cape-town-south-africa', note: 'Where your events live today' },
      { label: 'Production domain', url: 'https://internetathi.com', note: 'Goes live on 16 September' },
      { label: 'Polymorphism on Spotify', url: 'https://open.spotify.com/album/2pduDMmEcftxkrJNIgZYS3', note: 'Linked from the Listen page' }
    ],
    stages: [
      {
        id: 'discovery', status: 'complete', startedAt: '2026-07-20', completedAt: '2026-07-27',
        summary: 'We mapped what the site needs to do for the Polymorphism release and the live calendar.',
        tasks: [
          'Kick-off session on goals for the album cycle and the live calendar',
          'Audit of every official link: Spotify, Apple Music, YouTube, SoundCloud, Instagram and the Linktree',
          'Content inventory: one album, four releases, five music videos and press coverage',
          'Gaps logged: no press kit, technical rider or stage plot supplied yet'
        ]
      },
      {
        id: 'planning', status: 'complete', startedAt: '2026-07-28', completedAt: '2026-08-03',
        summary: 'Five routes, one verified content file and a static build that stays cheap to host.',
        tasks: [
          'Sitemap agreed: Home, Listen, Live, Story and Book',
          'Single content file so live dates and links change in one place',
          'Stack chosen: React, TypeScript and Vite on Vercel with serverless functions',
          'Type-checked content model so a missing date or link fails the build, never the visitor',
          'Delivery plan and payment schedule signed off'
        ]
      },
      {
        id: 'design', status: 'active', startedAt: '2026-08-04',
        note: 'First round approved on 14 August. A second round started on 6 September after the live preview review.',
        summary: 'A second design round after the live preview: a sharper home stage, clearer navigation and a live page built around Bandsintown.',
        tasks: [
          { label: 'First design round approved on 14 August', done: true },
          { label: 'Redesign direction agreed from your preview feedback', done: true },
          { label: 'Home stage and navigation refreshed', done: false },
          { label: 'Live page layout for Bandsintown-fed events and the map', done: false },
          { label: 'Mobile layouts re-checked from 320px phones up', done: false },
          { label: 'Redesign signed off by you', done: false }
        ]
      },
      {
        id: 'development', status: 'active', startedAt: '2026-08-09',
        note: 'First build shipped to the preview on 5 September. The Bandsintown integration and the redesigned pages started on 6 September.',
        summary: 'Bandsintown becomes the single source of truth for live dates, and the redesigned pages get built.',
        tasks: [
          { label: 'First build of the archive, map and fan tools on the preview site', done: true },
          { label: 'Bandsintown artist page confirmed as the source of live dates', done: true },
          { label: 'Events API connected through a serverless function with caching', done: false },
          { label: 'Events placed on the South Africa map with ticket and directions links', done: false },
          { label: 'Fallback to the last good copy of the dates if Bandsintown is unavailable', done: false },
          { label: 'Past events archive themselves using Bandsintown end times', done: false },
          { label: 'Redesigned home, navigation and live pages built out', done: false },
          { label: 'Community signup, city requests and analytics reconnected on the new layouts', done: false }
        ]
      },
      {
        id: 'testing', status: 'upcoming', plannedFrom: '2026-09-11',
        summary: 'Every route checked again on real devices, plus the Bandsintown sync under real conditions.',
        tasks: [
          'Browser QA across phones, tablets and desktops',
          'Accessibility audit with axe on every route',
          'Lighthouse checks on the production preview',
          'Bandsintown sync tested for a new event, a changed date, a cancellation and a sold-out show',
          'Community signup and city request forms re-tested end to end',
          'Reduced-motion and keyboard checks on the redesigned home stage'
        ]
      },
      {
        id: 'launch', status: 'upcoming', plannedFrom: '2026-09-14',
        summary: 'Go-live on internetathi.com by 16 September.',
        tasks: [
          'Final content sign-off from you',
          'Production build verified and environment variables confirmed in Vercel',
          'internetathi.com pointed to Vercel with HTTPS',
          'Go-live and smoke test on the live domain',
          'Bandsintown sync confirmed on the live site',
          'Content guide and repository handover'
        ]
      },
      {
        id: 'support', status: 'upcoming', plannedFrom: '2026-09-17',
        summary: 'Thirty days of post-launch care, with the Bandsintown sync watched weekly.',
        tasks: [
          '30-day care window for fixes and small changes',
          'Weekly check that Bandsintown dates match the site',
          'Review community and city-request numbers after Joy of Jazz on 25 September',
          'Monthly content rhythm agreed'
        ]
      }
    ],
    updates: [
      { id: 'u15', date: '2026-09-06', type: 'needs-you', author: 'Siphosethu', title: 'What we need from you this week', body: 'Confirm your Bandsintown artist page and add us as a manager so the events feed can be connected. Send your notes on the redesign preview by 9 September, and point internetathi.com to Vercel by 12 September so the 16 September launch holds.' },
      { id: 'u14', date: '2026-09-06', type: 'decision', author: 'Nathan', title: 'Bandsintown will feed the live dates', body: 'Your events already live on Bandsintown, so the site will read them from there instead of a hand-edited list. New dates, changes and cancellations will show on the Live page and the map without a code change. If Bandsintown is ever unreachable, the site falls back to the last good copy.' },
      { id: 'u13', date: '2026-09-06', type: 'update', author: 'Kgosi', title: 'Redesign round two and a new launch date', body: 'With the preview reviewed, we are refreshing the home stage, navigation and live page. The launch target moves to 16 September to fit the redesign and the integration, with testing from 11 September.' },
      { id: 'u12', date: '2026-09-05', type: 'milestone', author: 'Lwazi', title: 'First production build passed every check', body: 'The build passed type checks, lint and the full QA run, and it is live on the preview link. Supabase is running with the schema applied and the Vercel environment variables are in place.' },
      { id: 'u10', date: '2026-09-01', type: 'update', author: 'Lwazi', title: 'Lighthouse and accessibility results', body: 'Performance 98, accessibility 100, best practices 100 and SEO 100 on the preview. The axe audit reported no violations across all five routes.' },
      { id: 'u09', date: '2026-08-27', type: 'update', author: 'Siphosethu', title: 'Cross-device QA complete', body: 'We ran every page through 18 screen sizes and captured a screenshot of each. Three spacing fixes on small phones and one map zoom issue for Cape Town were found and resolved.' },
      { id: 'u08', date: '2026-08-20', type: 'decision', author: 'Siphosethu', title: 'Booking form will open a prepared email for now', body: 'No form service was approved yet, so the Book page validates the enquiry and opens a ready-to-send email to bookings@internetathi.com. It never pretends to submit. We can switch to a hosted endpoint whenever one is approved.' },
      { id: 'u07', date: '2026-08-17', type: 'milestone', author: 'Lwazi', title: 'Community signup and city requests are working', body: 'Fans can join the community and ask for a show in their city. The public map only ever shows city counts, never names or contact details. Repeat requests from the same person are merged so demand reflects real fans.' },
      { id: 'u06', date: '2026-08-15', type: 'update', author: 'Kgosi', title: 'Map refinements and the new menu', body: 'Province outlines are cleaner, the arrow prompt was removed, and the menu was rebuilt with clearer icons. The Cape Town zoom now frames the city correctly.' },
      { id: 'u05', date: '2026-08-13', type: 'decision', author: 'Kgosi', title: 'Landing page direction changed', body: 'After your notes we replaced the first landing concept with the current home stage. The hero now leads with the Polymorphism artwork and a slow drift instead of a static grid.' },
      { id: 'u04', date: '2026-08-09', type: 'milestone', author: 'Nathan', title: 'First working build of the archive', body: 'All five routes render with real content, and the interactive live map is in place with the EZIKO Heritage Festival and Heat Festival dates.' },
      { id: 'u03', date: '2026-08-03', type: 'milestone', author: 'Siphosethu', title: 'Plan approved', body: 'Sitemap, content model, technology choices and the payment schedule were signed off on the planning call.' },
      { id: 'u02', date: '2026-07-27', type: 'update', author: 'Siphosethu', title: 'Discovery wrap-up', body: 'We consolidated every official link and release, mapped the live calendar and logged the press-kit gaps. Nothing will be faked on the site: where an asset is missing, the section is simply not shown.' },
      { id: 'u01', date: '2026-07-20', type: 'milestone', author: 'Siphosethu', title: 'Project kicked off', body: 'Reference SQT-2026-140809 opened, deposit received and the team assigned.' }
    ],
    deliverables: [
      { id: 'redesign', group: 'Design', name: 'Redesign direction', description: 'Refreshed home stage, navigation and live page, shaped by the preview review.', status: 'Awaiting your approval', date: '2026-09-06', approvable: true, note: 'Open the live preview, then approve the direction here or send your notes by 9 September.' },
      { id: 'home', group: 'Pages', name: 'Home stage', description: 'Polymorphism artwork, drift motion, the next live date and the community call to action.', status: 'In review', date: '2026-09-06', note: 'Second round in progress as part of the redesign.' },
      { id: 'listen', group: 'Pages', name: 'Listen', description: 'Album, full tracklist with video links and the discography surfer.', status: 'Approved', date: '2026-08-14' },
      { id: 'live', group: 'Pages', name: 'Live', description: 'Interactive South Africa map with upcoming and past dates, ticket and directions links.', status: 'In progress', date: '2026-09-06', note: 'Being rebuilt around the Bandsintown feed.' },
      { id: 'story', group: 'Pages', name: 'Story', description: 'Artist biography and the Polymorphism narrative.', status: 'Awaiting your approval', date: '2026-09-02', approvable: true, note: 'Copy was revised on 2 September with your quotes in place.' },
      { id: 'book', group: 'Pages', name: 'Book', description: 'Booking enquiry with validation that opens a prepared email.', status: 'Approved', date: '2026-08-28' },
      { id: 'bandsintown', group: 'Features', name: 'Bandsintown live dates sync', description: 'Events read from your Bandsintown page and shown on the Live page and the map, with a safe fallback.', status: 'In progress', date: '2026-09-06', note: 'Needs manager access to your Bandsintown artist page to connect the feed.' },
      { id: 'community', group: 'Features', name: 'Join the community', description: 'Fan signup with consent, stored securely in Supabase.', status: 'Approved', date: '2026-08-19' },
      { id: 'city-requests', group: 'Features', name: 'Bring Internet Athi to my city', description: 'City requests with an aggregate demand map.', status: 'Approved', date: '2026-08-19' },
      { id: 'seo', group: 'Features', name: 'Search and social sharing', description: 'Schema markup, sitemap, robots file and Open Graph images.', status: 'Complete', date: '2026-08-30' },
      { id: 'epk', group: 'Features', name: 'Press kit download', description: 'Electronic press kit, technical rider and stage plot.', status: 'On hold', note: 'Waiting for the PDFs from your side. No placeholder download is shown until they arrive.' },
      { id: 'build', group: 'Launch', name: 'Production build', description: 'Type-checked, linted and QA-verified build of the redesigned site.', status: 'Scheduled', date: '2026-09-15' },
      { id: 'domain', group: 'Launch', name: 'Domain and go-live', description: 'internetathi.com pointed to Vercel with HTTPS.', status: 'Scheduled', date: '2026-09-16' },
      { id: 'handover', group: 'Launch', name: 'Content guide and handover', description: 'How to update releases and links yourself, and how Bandsintown feeds the dates.', status: 'Scheduled', date: '2026-09-16' }
    ],
    actions: [
      { id: 'bandsintown-access', title: 'Confirm your Bandsintown artist page and add us as a manager', due: '2026-09-08', detail: 'Reply with the link to your artist page. Manager access lets us connect the events feed to the site.' },
      { id: 'redesign-feedback', title: 'Give your notes on the redesign preview', due: '2026-09-09', detail: 'Open the live preview, then approve the direction under Deliverables or reply with changes.', deliverableId: 'redesign' },
      { id: 'approve-story', title: 'Approve the Story page copy', due: '2026-09-09', detail: 'Open Deliverables and approve it, or reply to the Friday update with edits.', deliverableId: 'story' },
      { id: 'dns', title: 'Point internetathi.com to Vercel', due: '2026-09-12', detail: 'Add the A and CNAME records from our 4 September email, or share registrar access and we will do it with you on a call.' },
      { id: 'epk', title: 'Send the press kit, technical rider and stage plot', detail: 'Optional. Unblocks the press kit download on the Book page.', optional: true }
    ],
    keyDates: [
      { label: 'Project started', date: '2026-07-20' },
      { label: 'First design approved', date: '2026-08-14' },
      { label: 'Preview build reviewed', date: '2026-09-05' },
      { label: 'Testing starts', date: '2026-09-11' },
      { label: 'Launch', date: '2026-09-16', highlight: true, note: 'Site and infrastructure complete' },
      { label: 'Joy of Jazz, Johannesburg', date: '2026-09-25', note: 'First big traffic moment' }
    ],
    numbers: [
      { label: 'Routes built', value: '5' },
      { label: 'Screen sizes tested', value: '18' },
      { label: 'Lighthouse performance', value: '98' },
      { label: 'Serverless functions', value: '4' }
    ],
    payments: [
      { label: 'Deposit', share: '40%', status: 'Paid', date: '2026-07-20' },
      { label: 'Design sign-off', share: '30%', status: 'Paid', date: '2026-08-14' },
      { label: 'Launch', share: '30%', status: 'Due at go-live', date: '2026-09-16' }
    ]
  },
  {
    id: 'lumen-operations-dashboard',
    reference: 'SQT-2026-221604',
    accessCode: 'LUMEN-2026',
    name: 'Lumen Logistics operations dashboard',
    tagline: 'One screen for every shipment',
    service: 'software',
    serviceLabel: 'Custom Software',
    summary: 'A web operations dashboard that replaces the spreadsheets, email threads and WhatsApp groups dispatch teams use today, with role-based access, live shipment status and reporting.',
    client: { name: 'Naledi Mokoena', contact: 'Naledi', company: 'Lumen Logistics', email: 'naledi@lumenlogistics.co.za', location: 'Johannesburg, South Africa' },
    startedAt: '2026-08-24',
    targetLaunch: '2026-11-20',
    lastUpdated: '2026-09-04',
    health: 'On track',
    domain: 'ops.lumenlogistics.co.za',
    buildLabel: 'lumen-ops / design',
    team: [
      { name: 'Siphosethu', role: 'Engineer' },
      { name: 'Lwazi', role: 'Engineer' },
      { name: 'Kgosi', role: 'Engineer' }
    ],
    cadence: 'A written update every Friday and a design review every second Tuesday.',
    links: [
      { label: 'Planned dashboard address', url: 'https://lumenlogistics.co.za', note: 'Subdomain confirmed at launch' }
    ],
    stages: [
      {
        id: 'discovery', status: 'complete', startedAt: '2026-08-24', completedAt: '2026-08-31',
        summary: 'We shadowed dispatch for two days and mapped how a delivery moves from order to proof of delivery.',
        tasks: [
          'On-site sessions with operations managers and the dispatch team',
          'Six workflows mapped, from booking a shipment to closing a delivery',
          'Current tools audited: three spreadsheets, shared inbox and two WhatsApp groups',
          'Volume baseline captured at roughly 250 deliveries per week'
        ]
      },
      {
        id: 'planning', status: 'complete', startedAt: '2026-09-01', completedAt: '2026-09-04',
        summary: 'A phased release so the team gets value before the full system lands.',
        tasks: [
          'Phase one scoped: shipment board, status updates and driver assignment',
          'Three roles defined: admin, dispatcher and read-only manager',
          'Data model for shipments, drivers, customers and status history',
          'Reporting and customer notifications placed in phase two'
        ]
      },
      {
        id: 'design', status: 'active', startedAt: '2026-09-05',
        summary: 'Designing the shipment board first, because dispatch will live in it all day.',
        tasks: [
          { label: 'Information architecture and navigation agreed', done: true },
          { label: 'Shipment board wireframes reviewed with dispatch', done: true },
          { label: 'Shipment detail and status timeline screens', done: false },
          { label: 'Driver assignment flow', done: false },
          { label: 'Visual design system applied to the first four screens', done: false }
        ]
      },
      { id: 'development', status: 'upcoming', plannedFrom: '2026-09-22', summary: 'Phase one build in weekly increments you can click through.', tasks: ['Authentication and roles', 'Shipment board and detail views', 'Status history and audit trail', 'Weekly staging releases'] },
      { id: 'testing', status: 'upcoming', plannedFrom: '2026-10-27', summary: 'A pilot week with two dispatchers on real shipments.', tasks: ['Pilot with two dispatchers', 'Performance checks at 500 open shipments', 'Role and permission review'] },
      { id: 'launch', status: 'upcoming', plannedFrom: '2026-11-16', summary: 'Team rollout with side-by-side spreadsheets for one week.', tasks: ['Data import from current spreadsheets', 'Team training session', 'Go-live on the operations subdomain'] },
      { id: 'support', status: 'upcoming', plannedFrom: '2026-11-23', summary: 'Care window, then phase two planning.', tasks: ['30-day care window', 'Phase two scoping: reporting and customer notifications'] }
    ],
    updates: [
      { id: 'l05', date: '2026-09-04', type: 'milestone', author: 'Siphosethu', title: 'Plan approved, design starts Monday', body: 'Phase one scope, the three roles and the data model were signed off. Design begins with the shipment board on 5 September.' },
      { id: 'l04', date: '2026-09-03', type: 'needs-you', author: 'Siphosethu', title: 'Please confirm the status list', body: 'We proposed seven shipment statuses based on the discovery sessions. Confirm them under Deliverables or send changes before the first design review on 9 September.' },
      { id: 'l03', date: '2026-08-31', type: 'update', author: 'Siphosethu', title: 'Discovery wrap-up', body: 'Six workflows are documented with the people, tools and hand-offs in each. The biggest time loss is re-typing shipment updates across three places.' },
      { id: 'l02', date: '2026-08-26', type: 'decision', author: 'Lwazi', title: 'Web first, driver app later', body: 'Dispatch needs the desktop board first. A driver mobile view stays in phase two so phase one can launch in November.' },
      { id: 'l01', date: '2026-08-24', type: 'milestone', author: 'Siphosethu', title: 'Project kicked off', body: 'Reference SQT-2026-221604 opened, deposit received and on-site sessions booked.' }
    ],
    deliverables: [
      { id: 'workflows', group: 'Discovery', name: 'Workflow map', description: 'Six current-state workflows with pain points.', status: 'Approved', date: '2026-08-31' },
      { id: 'statuses', group: 'Planning', name: 'Shipment status list', description: 'Seven statuses from Booked to Delivered, plus Exception.', status: 'Awaiting your approval', date: '2026-09-03', approvable: true },
      { id: 'board', group: 'Design', name: 'Shipment board', description: 'The main dispatch screen with filters and quick status changes.', status: 'In review', date: '2026-09-05' },
      { id: 'detail', group: 'Design', name: 'Shipment detail', description: 'Timeline of every status change with who made it.', status: 'In progress' },
      { id: 'assign', group: 'Design', name: 'Driver assignment', description: 'Assign and reassign drivers with availability in view.', status: 'Scheduled', date: '2026-09-15' }
    ],
    actions: [
      { id: 'confirm-statuses', title: 'Confirm the shipment status list', due: '2026-09-09', detail: 'Approve it under Deliverables or reply with changes.', deliverableId: 'statuses' },
      { id: 'sample-data', title: 'Share one week of anonymised shipment data', due: '2026-09-12', detail: 'Lets us design with realistic volumes and edge cases.' }
    ],
    keyDates: [
      { label: 'Project started', date: '2026-08-24' },
      { label: 'First design review', date: '2026-09-09' },
      { label: 'Development starts', date: '2026-09-22' },
      { label: 'Target launch', date: '2026-11-20', highlight: true }
    ],
    numbers: [
      { label: 'Workflows mapped', value: '6' },
      { label: 'User roles', value: '3' },
      { label: 'Deliveries per week', value: '250' },
      { label: 'Screens designed', value: '2 of 11' }
    ],
    payments: [
      { label: 'Deposit', share: '40%', status: 'Paid', date: '2026-08-24' },
      { label: 'Design sign-off', share: '30%', status: 'Due 22 Sep', date: '2026-09-22' },
      { label: 'Launch', share: '30%', status: 'Due at go-live', date: '2026-11-20' }
    ]
  }
]

export const projectStages = project => project.stages.map((stage, index) => ({ ...stageDefinitions.find(definition => definition.id === stage.id), ...stage, index }))

// Every stage currently in progress, in process order.
export const activeStages = project => projectStages(project).filter(stage => stage.status === 'active')

// The furthest stage in progress, or the next one up if nothing is active.
export const activeStage = project => {
  const stages = projectStages(project)
  return activeStages(project).at(-1) || stages.find(stage => stage.status === 'upcoming') || stages.at(-1)
}

// Tasks can be plain strings (done follows the stage) or objects with their own done flag.
export const stageTasks = stage => (stage.tasks || []).map(task => {
  const label = typeof task === 'string' ? task : task.label
  const done = stage.status === 'complete' ? true : stage.status === 'upcoming' ? false : Boolean(typeof task === 'object' && task.done)
  return { label, done }
})

export const stageShare = stage => {
  const tasks = stageTasks(stage)
  return tasks.length ? tasks.filter(task => task.done).length / tasks.length : 0
}

export const projectProgress = project => {
  const stages = projectStages(project)
  const complete = stages.filter(stage => stage.status === 'complete').length
  const inProgress = activeStages(project).reduce((sum, stage) => sum + stageShare(stage), 0)
  return Math.round(((complete + inProgress) / stages.length) * 100)
}

const joinNames = values => values.length > 1 ? `${values.slice(0, -1).join(', ')} and ${values.at(-1)}` : values[0] || ''

// "Stage 4 of 7: Development" or "Stages 3 and 4 of 7: Design and Development".
export const stageLabel = project => {
  const current = activeStages(project)
  const total = project.stages.length
  if (current.length > 1) return `Stages ${joinNames(current.map(stage => stage.index + 1))} of ${total}: ${joinNames(current.map(stage => stage.name))}`
  const stage = activeStage(project)
  return `Stage ${stage.index + 1} of ${total}: ${stage.name}`
}

export const pendingActions = project => (project.actions || []).filter(action => !action.done)

export const dateLabel = value => {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'To be confirmed' : date.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })
}

export const shortDate = value => {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short' })
}

export const daysUntil = value => {
  const target = new Date(value)
  if (Number.isNaN(target.getTime())) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  return Math.round((target - today) / 86400000)
}

export const todayIso = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

const slug = value => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

// Short, sayable codes like LUMEN-2026, unique across the given projects.
export const generateAccessCode = (seedText, existing = []) => {
  const base = (String(seedText || '').match(/[A-Za-z]+/)?.[0] || 'CLIENT').toUpperCase().slice(0, 8)
  const year = new Date().getFullYear()
  let code = `${base}-${year}`
  let suffix = 2
  while (existing.some(project => project.accessCode === code)) code = `${base}-${year}-${suffix++}`
  return code
}

// A fresh project with the seven stages laid out and nothing else assumed.
export const makeProject = ({ name, clientName, company = '', email, service = 'website', targetLaunch = '', accessCode = '', summary = '' }, existing = []) => {
  const stamp = Date.now()
  const today = todayIso()
  const reference = `SQT-${new Date().getFullYear()}-${String(stamp).slice(-6)}`
  return {
    id: `project-${stamp.toString(36)}`,
    reference,
    accessCode: accessCode || generateAccessCode(company || clientName, existing),
    name,
    tagline: '',
    service,
    serviceLabel: services.find(item => item.short === service)?.name || 'Custom Software',
    summary,
    client: { name: clientName, contact: String(clientName || '').split(' ')[0], company, email, location: '' },
    startedAt: today,
    targetLaunch,
    lastUpdated: today,
    health: 'On track',
    domain: '',
    buildLabel: `${slug(company || name) || 'project'} / discovery`,
    team: defaultTeam,
    cadence: 'A written update every Friday, plus a short call at each stage handover.',
    links: [],
    stages: stageDefinitions.map((definition, index) => ({
      id: definition.id,
      status: index === 0 ? 'active' : 'upcoming',
      ...(index === 0 ? { startedAt: today } : {}),
      summary: '',
      tasks: []
    })),
    updates: [{ id: `u-${stamp.toString(36)}`, date: today, type: 'milestone', author: defaultTeam[0].name, title: 'Project kicked off', body: `Reference ${reference} opened and the team assigned.` }],
    deliverables: [],
    actions: [],
    keyDates: [{ label: 'Project started', date: today }],
    numbers: [],
    payments: []
  }
}
