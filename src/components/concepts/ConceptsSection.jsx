import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, ExternalLink } from 'lucide-react'
import { concepts } from '../../data/concepts'
import './ConceptsSection.css'

const wrapIndex = index => (index + concepts.length) % concepts.length

const relativeIndex = (index, active) => {
  let offset = (index - active + concepts.length) % concepts.length
  if (offset > concepts.length / 2) offset -= concepts.length
  return offset
}

export default function ConceptsSection() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [interacted, setInteracted] = useState(false)
  const stageRef = useRef(null)
  const slideRefs = useRef([])
  const activeRef = useRef(0)
  const dragRef = useRef(null)
  const suppressClickRef = useRef(false)
  const wheelRef = useRef({ amount: 0, timeout: null })

  const positionSlides = useCallback((dragPixels = 0) => {
    const firstSlide = slideRefs.current[0]
    if (!firstSlide) return

    const cardWidth = firstSlide.offsetWidth || 1
    const compact = window.innerWidth <= 700
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const dragOffset = dragPixels / cardWidth
    const spacing = cardWidth * (compact ? 0.84 : 0.64)

    slideRefs.current.forEach((slide, index) => {
      if (!slide) return
      const offset = relativeIndex(index, activeRef.current) + dragOffset
      const distance = Math.abs(offset)
      const depth = reducedMotion ? 0 : -Math.min(distance, 2) * (compact ? 54 : 120)
      const rotation = reducedMotion ? 0 : -offset * (compact ? 11 : 25)
      const scale = Math.max(compact ? 0.86 : 0.8, 1 - distance * (compact ? 0.055 : 0.09))
      const opacity = Math.max(0.14, 1 - distance * (compact ? 0.3 : 0.23))

      slide.style.setProperty('--concept-x', `${offset * spacing}px`)
      slide.style.setProperty('--concept-z', `${depth}px`)
      slide.style.setProperty('--concept-rotate', `${rotation}deg`)
      slide.style.setProperty('--concept-scale', scale)
      slide.style.setProperty('--concept-opacity', opacity)
      slide.style.zIndex = String(Math.max(1, Math.round(20 - distance * 5)))
    })
  }, [])

  const selectIndex = useCallback((nextIndex) => {
    const wrapped = wrapIndex(nextIndex)
    activeRef.current = wrapped
    setActiveIndex(wrapped)
    setInteracted(true)
    requestAnimationFrame(() => positionSlides(0))
  }, [positionSlides])

  useEffect(() => {
    activeRef.current = activeIndex
    positionSlides(0)
  }, [activeIndex, positionSlides])

  useEffect(() => {
    let resizeFrame
    const resize = () => {
      cancelAnimationFrame(resizeFrame)
      resizeFrame = requestAnimationFrame(() => positionSlides(0))
    }
    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(resizeFrame)
      window.removeEventListener('resize', resize)
    }
  }, [positionSlides])

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return undefined

    const onWheel = event => {
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return
      event.preventDefault()
      wheelRef.current.amount += event.deltaX
      clearTimeout(wheelRef.current.timeout)
      wheelRef.current.timeout = setTimeout(() => {
        if (Math.abs(wheelRef.current.amount) > 18) {
          selectIndex(activeRef.current + (wheelRef.current.amount > 0 ? 1 : -1))
        }
        wheelRef.current.amount = 0
      }, 80)
    }

    stage.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      clearTimeout(wheelRef.current.timeout)
      stage.removeEventListener('wheel', onWheel)
    }
  }, [selectIndex])

  const onPointerDown = event => {
    if (event.button !== undefined && event.button !== 0) return
    event.currentTarget.setPointerCapture?.(event.pointerId)
    dragRef.current = {
      id: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastTime: performance.now(),
      velocity: 0,
      horizontal: false,
      cancelled: false,
      moved: false
    }
  }

  const onPointerMove = event => {
    const drag = dragRef.current
    if (!drag || drag.id !== event.pointerId || drag.cancelled) return
    const deltaX = event.clientX - drag.startX
    const deltaY = event.clientY - drag.startY

    if (!drag.horizontal) {
      if (Math.abs(deltaX) < 6 && Math.abs(deltaY) < 6) return
      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        drag.cancelled = true
        return
      }
      drag.horizontal = true
      stageRef.current?.classList.add('is-dragging')
    }

    const now = performance.now()
    drag.velocity = (event.clientX - drag.lastX) / Math.max(1, now - drag.lastTime)
    drag.lastX = event.clientX
    drag.lastTime = now
    drag.moved = Math.abs(deltaX) > 7
    positionSlides(deltaX)
  }

  const finishPointer = (event, cancelled = false) => {
    const drag = dragRef.current
    if (!drag || drag.id !== event.pointerId) return
    const deltaX = event.clientX - drag.startX
    const cardWidth = slideRefs.current[0]?.offsetWidth || 1
    const shouldMove = !cancelled && !drag.cancelled && drag.horizontal && (Math.abs(deltaX) > cardWidth * 0.14 || Math.abs(drag.velocity) > 0.42)

    suppressClickRef.current = drag.moved
    stageRef.current?.classList.remove('is-dragging')
    dragRef.current = null

    if (shouldMove) selectIndex(activeRef.current + (deltaX < 0 ? 1 : -1))
    else positionSlides(0)
  }

  const onSlideClick = index => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false
      return
    }
    if (index !== activeRef.current) selectIndex(index)
  }

  const onKeyDown = event => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      selectIndex(activeRef.current - 1)
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      selectIndex(activeRef.current + 1)
    }
  }

  const activeConcept = concepts[activeIndex]

  return <section id="concepts" className="section concepts-section section-grid">
    <div className="container concepts-heading">
      <div>
        <div className="eyebrow">Concepts / 04</div>
        <h2>We do not just talk about ideas.<span>We build them.</span></h2>
        <p>Selected concepts and independent builds, designed and engineered as working digital experiences.</p>
      </div>
      <div className="concepts-system" aria-hidden="true"><span>sidequest-tech / concepts</span><span><i /> SYSTEM: READY</span></div>
    </div>

    <div className="concept-coverflow" role="region" aria-roledescription="carousel" aria-label="SideQuest Tech concept showcase" tabIndex={0} onKeyDown={onKeyDown}>
      <div className="concept-stage-shell">
        <div ref={stageRef} className="concept-stage" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={event => finishPointer(event)} onPointerCancel={event => finishPointer(event, true)}>
          {concepts.map((concept, index) => {
            const selected = index === activeIndex
            return <button
              type="button"
              ref={element => { slideRefs.current[index] = element }}
              className={`concept-slide cursor-target ${selected ? 'is-active' : ''}`}
              key={concept.id}
              onClick={() => onSlideClick(index)}
              aria-label={`${selected ? 'Current concept' : 'Select concept'}: ${concept.name}`}
              aria-hidden={!selected}
              tabIndex={selected ? 0 : -1}
            >
              <span className="concept-browser">
                <span className="concept-browser-bar"><span className="browser-dots"><i /><i /><i /></span><small>{concept.frameLabel}</small><b>LIVE PREVIEW</b></span>
                <span className="concept-preview"><img src={concept.previewImage} alt={`${concept.name} website homepage preview`} loading={index === 0 ? 'eager' : 'lazy'} fetchPriority={index === 0 ? 'high' : 'auto'} decoding="async" draggable="false" /></span>
              </span>
            </button>
          })}
        </div>
        {!interacted && <div className="concept-drag-hint" aria-hidden="true"><ArrowLeft /> Drag to explore <ArrowRight /></div>}
      </div>

      <div className="container concept-details">
        <div className="concept-info" key={activeConcept.id} aria-live="polite">
          <span className="concept-category">{activeConcept.category}</span>
          <h3>{activeConcept.name}</h3>
          <p>{activeConcept.description}</p>
          <dl>{activeConcept.meta.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
        </div>

        <div className="concept-actions">
          <a className="btn cursor-target" href={activeConcept.url} target="_blank" rel="noopener noreferrer">View Concept <ExternalLink /></a>
          <div className="concept-navigation">
            <button className="concept-arrow cursor-target" type="button" aria-label="Previous concept" onClick={() => selectIndex(activeRef.current - 1)}><ArrowLeft /></button>
            <div className="concept-progress" aria-label={`Concept ${activeIndex + 1} of ${concepts.length}`}>
              <strong>{String(activeIndex + 1).padStart(2, '0')}</strong>
              <span>{concepts.map((concept, index) => <button className={index === activeIndex ? 'active' : ''} type="button" key={concept.id} aria-label={`Show ${concept.name}`} onClick={() => selectIndex(index)}><i /></button>)}</span>
              <small>{String(concepts.length).padStart(2, '0')}</small>
            </div>
            <button className="concept-arrow cursor-target" type="button" aria-label="Next concept" onClick={() => selectIndex(activeRef.current + 1)}><ArrowRight /></button>
          </div>
        </div>
      </div>
    </div>
  </section>
}
