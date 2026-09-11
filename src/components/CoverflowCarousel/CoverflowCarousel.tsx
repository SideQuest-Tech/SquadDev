import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ArrowLeft, ArrowRight, ExternalLink } from 'lucide-react'
import * as Sentry from '@sentry/react'
import { concepts } from '../../data/concepts'
import './CoverflowCarousel.css'

const N = concepts.length

function relOffset(index: number, active: number): number {
  let off = (index - active + N) % N
  if (off > N / 2) off -= N
  return off
}

interface CardVisualProps {
  scale: number
  rotateY: number
  x: number
  opacity: number
  zIndex: number
}

function cardProps(offset: number): CardVisualProps {
  const abs = Math.abs(offset)
  if (abs === 0) return { scale: 1, rotateY: 0, x: 0, opacity: 1, zIndex: 10 }
  if (abs === 1) return { scale: 0.78, rotateY: offset > 0 ? -32 : 32, x: offset > 0 ? 300 : -300, opacity: 0.6, zIndex: 6 }
  return { scale: 0.6, rotateY: offset > 0 ? -48 : 48, x: offset > 0 ? 520 : -520, opacity: 0.15, zIndex: 2 }
}

interface DragState {
  startX: number
  id: number
  moved: boolean
}

export default function CoverflowCarousel(): React.ReactElement {
  const [active, setActive] = useState(0)
  const activeRef = useRef(0)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const dragRef = useRef<DragState | null>(null)
  const [interacted, setInteracted] = useState(false)

  const positionCards = (targetActive: number, animate = true) => {
    cardRefs.current.forEach((card, i) => {
      if (!card) return
      const { scale, rotateY, x, opacity, zIndex } = cardProps(relOffset(i, targetActive))
      card.style.zIndex = String(zIndex)
      if (animate) {
        gsap.to(card, { scale, rotateY, x, opacity, duration: 0.4, ease: 'power2.out', overwrite: true })
      } else {
        gsap.set(card, { scale, rotateY, x, opacity })
      }
    })
  }

  useLayoutEffect(() => {
    positionCards(0, false)
  }, [])

  const goTo = (index: number) => {
    const next = ((index % N) + N) % N
    activeRef.current = next
    setActive(next)
    setInteracted(true)
    positionCards(next, true)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(activeRef.current - 1) }
      if (e.key === 'ArrowRight') { e.preventDefault(); goTo(activeRef.current + 1) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    e.currentTarget.setPointerCapture?.(e.pointerId)
    dragRef.current = { startX: e.clientX, id: e.pointerId, moved: false }
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current
    if (!d || d.id !== e.pointerId) return
    const dx = e.clientX - d.startX
    if (Math.abs(dx) > 6) d.moved = true
    cardRefs.current.forEach((card, i) => {
      if (!card) return
      const off = relOffset(i, activeRef.current)
      const { x, scale, rotateY, opacity, zIndex } = cardProps(off)
      card.style.zIndex = String(zIndex)
      gsap.to(card, {
        x: x + dx * 0.14,
        scale,
        rotateY: rotateY - dx * 0.018,
        opacity,
        duration: 0.08,
        ease: 'none',
        overwrite: true
      })
    })
  }

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current
    if (!d || d.id !== e.pointerId) return
    dragRef.current = null
    const dx = e.clientX - d.startX
    if (d.moved && Math.abs(dx) > 40) {
      goTo(activeRef.current + (dx < 0 ? 1 : -1))
    } else {
      positionCards(activeRef.current, true)
    }
  }

  const activeConcept = concepts[active]

  return (
    <div className="coverflow-wrapper">
      <div
        className="coverflow-track"
        role="region"
        aria-label="Concept showcase"
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {concepts.map((concept, i) => (
          <div
            key={concept.id}
            ref={el => { cardRefs.current[i] = el }}
            className={`coverflow-card${i === active ? ' is-active' : ''}`}
            onClick={() => { if (i !== active) { Sentry.metrics.increment('site.concept_viewed', 1, { tags: { concept: concept.name } }); goTo(i) } }}
          >
            <div className="cf-bar">
              <span className="cf-dots"><i /><i /><i /></span>
              <small>{concept.frameLabel}</small>
            </div>
            <div className="cf-preview">
              <img
                src={concept.previewImage}
                alt={`${concept.name} preview`}
                draggable={false}
                loading={i === 0 ? 'eager' : 'lazy'}
              />
            </div>
          </div>
        ))}
      </div>

      {!interacted && (
        <p className="cf-hint" aria-hidden="true">
          <ArrowLeft size={12} /> drag to explore <ArrowRight size={12} />
        </p>
      )}

      <div className="cf-info" key={activeConcept.id}>
        <p className="cf-category">{activeConcept.category}</p>
        <h3 className="cf-name">{activeConcept.name}</h3>
        <a className="btn" href={activeConcept.url} target="_blank" rel="noopener noreferrer" onClick={() => Sentry.metrics.increment('site.concept_link_clicked', 1, { tags: { concept: activeConcept.name } })}>
          View Concept <ExternalLink size={13} />
        </a>
      </div>

      <div className="cf-dots-nav">
        {concepts.map((c, i) => (
          <button
            key={c.id}
            className={`cf-dot${i === active ? ' active' : ''}`}
            onClick={() => { Sentry.metrics.increment('site.concept_viewed', 1, { tags: { concept: concepts[i].name } }); goTo(i) }}
            aria-label={`Show ${c.name}`}
          />
        ))}
      </div>
    </div>
  )
}
