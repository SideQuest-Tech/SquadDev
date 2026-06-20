import { Globe2, Smartphone, Boxes, Workflow, Rocket, PenTool, MessagesSquare, Wrench } from 'lucide-react'

export const services = [
  { name: 'Website Development', short: 'website', icon: Globe2, description: 'Fast, accessible websites designed to turn attention into measurable business.' },
  { name: 'Mobile App Development', short: 'app', icon: Smartphone, description: 'Thoughtful mobile experiences built for daily use, performance and growth.' },
  { name: 'Custom Software', short: 'software', icon: Boxes, description: 'Purpose-built platforms that fit your workflows instead of fighting them.' },
  { name: 'Business Automation', short: 'automation', icon: Workflow, description: 'Connected tools and workflows that reduce repetitive work and costly errors.' },
  { name: 'MVP Development', short: 'mvp', icon: Rocket, description: 'Focused first versions that help you test, learn and reach the market sooner.' },
  { name: 'UI/UX Design', short: 'design', icon: PenTool, description: 'Clear, polished interfaces that make complex products feel simple.' },
  { name: 'Technical Consulting', short: 'consulting', icon: MessagesSquare, description: 'Practical technical direction for architecture, delivery and product decisions.' },
  { name: 'System Maintenance', short: 'existing', icon: Wrench, description: 'Reliable support, upgrades and improvements for software already in production.' }
]

export const needOptions = [
  ['website', 'I need a website'], ['app', 'I need a mobile app'], ['software', 'I need custom software'],
  ['automation', 'I need automation'], ['existing', 'I need help fixing an existing system'],
  ['mvp', 'I need an MVP'], ['unsure', 'I am not sure yet']
]

export const serviceLabel = (value) => needOptions.find(([key]) => key === value)?.[1] || services.find(s => s.short === value)?.name || value || 'Not specified'
