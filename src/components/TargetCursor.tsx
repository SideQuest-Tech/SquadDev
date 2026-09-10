import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { gsap } from 'gsap'
import './TargetCursor.css'

// Based on the React Bits Target Cursor JavaScript/CSS implementation.
const getContainingBlock = (element: Element | null): Element | null => {
  let node: Element | null = element?.parentElement ?? null
  while (node && node !== document.documentElement) {
    const style = getComputedStyle(node)
    if (
      style.transform !== 'none' ||
      style.perspective !== 'none' ||
      style.filter !== 'none' ||
      style.willChange.includes('transform') ||
      style.willChange.includes('perspective') ||
      style.willChange.includes('filter') ||
      /paint|layout|strict|content/.test(style.contain)
    ) return node
    node = node.parentElement
  }
  return null
}

const getContainingBlockOffset = (block: Element | null): { x: number; y: number } => {
  if (!block) return { x: 0, y: 0 }
  const rect = block.getBoundingClientRect()
  return { x: rect.left + (block as HTMLElement).clientLeft, y: rect.top + (block as HTMLElement).clientTop }
}

interface TargetCursorProps {
  targetSelector?: string
  spinDuration?: number
  hideDefaultCursor?: boolean
  hoverDuration?: number
  parallaxOn?: boolean
  forceEnabled?: boolean
}

export default function TargetCursor({
  targetSelector = '.cursor-target',
  spinDuration = 2,
  hideDefaultCursor = true,
  hoverDuration = 0.2,
  parallaxOn = true,
  forceEnabled
}: TargetCursorProps) {
  const cursorRef = useRef<HTMLDivElement>(null)
  const cornersRef = useRef<NodeListOf<Element> | null>(null)
  const spinTl = useRef<gsap.core.Timeline | null>(null)
  const containingBlockRef = useRef<Element | null>(null)
  const targetCornerPositionsRef = useRef<{ x: number; y: number }[] | null>(null)
  const tickerFnRef = useRef<(() => void) | null>(null)
  const activeStrengthRef = useRef(0)
  const [capable, setCapable] = useState(false)

  useEffect(() => {
    const desktopQuery = window.matchMedia('(min-width: 769px) and (hover: hover) and (pointer: fine)')
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => {
      const hasTouch = navigator.maxTouchPoints > 0 || 'ontouchstart' in window
      setCapable(desktopQuery.matches && !motionQuery.matches && !hasTouch)
    }
    update()
    desktopQuery.addEventListener?.('change', update)
    motionQuery.addEventListener?.('change', update)
    return () => {
      desktopQuery.removeEventListener?.('change', update)
      motionQuery.removeEventListener?.('change', update)
    }
  }, [])

  const constants = useMemo(() => ({ borderWidth: 3, cornerSize: 12 }), [])

  const moveCursor = useCallback((x: number, y: number) => {
    if (!cursorRef.current) return
    const offset = getContainingBlockOffset(containingBlockRef.current)
    gsap.to(cursorRef.current, { x: x - offset.x, y: y - offset.y, duration: 0.1, ease: 'power3.out' })
  }, [])

  const enabled = capable && forceEnabled !== false

  useEffect(() => {
    if (!enabled || !cursorRef.current) return

    const cursor = cursorRef.current
    const originalCursor = document.body.style.cursor
    if (hideDefaultCursor) {
      document.body.style.cursor = 'none'
      document.documentElement.classList.add('target-cursor-enabled')
    }

    cornersRef.current = cursor.querySelectorAll('.target-cursor-corner')
    containingBlockRef.current = getContainingBlock(cursor)
    const getOffset = () => getContainingBlockOffset(containingBlockRef.current)
    let activeTarget: Element | null = null
    let currentLeaveHandler: (() => void) | null = null
    let resumeTimeout: ReturnType<typeof setTimeout> | null = null

    const cleanupTarget = (target: Element) => {
      if (currentLeaveHandler) target.removeEventListener('mouseleave', currentLeaveHandler)
      currentLeaveHandler = null
    }

    const offset = getOffset()
    gsap.set(cursor, {
      xPercent: -50,
      yPercent: -50,
      x: window.innerWidth / 2 - offset.x,
      y: window.innerHeight / 2 - offset.y,
      autoAlpha: 1
    })

    const createSpinTimeline = () => {
      spinTl.current?.kill()
      spinTl.current = gsap.timeline({ repeat: -1 })
        .to(cursor, { rotation: '+=360', duration: spinDuration, ease: 'none' })
    }
    createSpinTimeline()

    const tickerFn = () => {
      if (!targetCornerPositionsRef.current || !cursorRef.current || !cornersRef.current) return
      const strength = activeStrengthRef.current
      if (strength === 0) return
      const cursorX = gsap.getProperty(cursorRef.current, 'x') as number
      const cursorY = gsap.getProperty(cursorRef.current, 'y') as number
      Array.from(cornersRef.current).forEach((corner, i) => {
        const currentX = gsap.getProperty(corner, 'x') as number
        const currentY = gsap.getProperty(corner, 'y') as number
        const targetX = targetCornerPositionsRef.current![i].x - cursorX
        const targetY = targetCornerPositionsRef.current![i].y - cursorY
        const duration = strength >= 0.99 ? (parallaxOn ? 0.2 : 0) : 0.05
        gsap.to(corner, {
          x: currentX + (targetX - currentX) * strength,
          y: currentY + (targetY - currentY) * strength,
          duration,
          ease: duration === 0 ? 'none' : 'power1.out',
          overwrite: 'auto'
        })
      })
    }
    tickerFnRef.current = tickerFn

    const moveHandler = (event: MouseEvent) => moveCursor(event.clientX, event.clientY)
    const scrollHandler = () => {
      if (!activeTarget || !cursorRef.current) return
      const currentOffset = getOffset()
      const mouseX = (gsap.getProperty(cursorRef.current, 'x') as number) + currentOffset.x
      const mouseY = (gsap.getProperty(cursorRef.current, 'y') as number) + currentOffset.y
      const underMouse = document.elementFromPoint(mouseX, mouseY)
      if (!underMouse || (underMouse !== activeTarget && underMouse.closest(targetSelector) !== activeTarget)) {
        currentLeaveHandler?.()
      }
    }
    const mouseDownHandler = () => {
      gsap.to(cursorRef.current, { scale: 0.9, duration: 0.2 })
    }
    const mouseUpHandler = () => {
      gsap.to(cursorRef.current, { scale: 1, duration: 0.2 })
    }

    const editableSelector = 'input, textarea, select, [contenteditable="true"]'
    let editableHovered = false
    let editableFocused = false
    const updateEditableVisibility = () => {
      gsap.to(cursor, {
        autoAlpha: editableHovered || editableFocused ? 0 : 1,
        duration: 0.12,
        ease: 'power2.out',
        overwrite: 'auto'
      })
    }
    const editableOverHandler = (event: MouseEvent) => {
      if (!(event.target as Element).closest?.(editableSelector)) return
      editableHovered = true
      updateEditableVisibility()
    }
    const editableOutHandler = (event: MouseEvent) => {
      const editable = (event.target as Element).closest?.(editableSelector)
      if (!editable || (event.relatedTarget as Element)?.closest?.(editableSelector) === editable) return
      editableHovered = false
      updateEditableVisibility()
    }
    const focusInHandler = (event: FocusEvent) => {
      if (!(event.target as Element).matches?.(editableSelector)) return
      editableFocused = true
      updateEditableVisibility()
    }
    const focusOutHandler = (event: FocusEvent) => {
      if (!(event.target as Element).matches?.(editableSelector)) return
      editableFocused = false
      updateEditableVisibility()
    }

    const enterHandler = (event: MouseEvent) => {
      const target = (event.target as Element).closest?.(targetSelector)
      if (!target || !cursorRef.current || !cornersRef.current || activeTarget === target) return
      if (activeTarget) cleanupTarget(activeTarget)
      if (resumeTimeout) clearTimeout(resumeTimeout)
      resumeTimeout = null
      activeTarget = target

      const corners = Array.from(cornersRef.current)
      corners.forEach(corner => gsap.killTweensOf(corner))
      gsap.killTweensOf(cursorRef.current, 'rotation')
      spinTl.current?.pause()
      gsap.set(cursorRef.current, { rotation: 0 })

      const rect = target.getBoundingClientRect()
      const currentOffset = getOffset()
      const cursorX = gsap.getProperty(cursorRef.current, 'x') as number
      const cursorY = gsap.getProperty(cursorRef.current, 'y') as number
      const { borderWidth, cornerSize } = constants
      targetCornerPositionsRef.current = [
        { x: rect.left - borderWidth - currentOffset.x, y: rect.top - borderWidth - currentOffset.y },
        { x: rect.right + borderWidth - cornerSize - currentOffset.x, y: rect.top - borderWidth - currentOffset.y },
        { x: rect.right + borderWidth - cornerSize - currentOffset.x, y: rect.bottom + borderWidth - cornerSize - currentOffset.y },
        { x: rect.left - borderWidth - currentOffset.x, y: rect.bottom + borderWidth - cornerSize - currentOffset.y }
      ]
      gsap.ticker.add(tickerFnRef.current!)
      gsap.to(activeStrengthRef, { current: 1, duration: hoverDuration, ease: 'power2.out' })
      corners.forEach((corner, i) => gsap.to(corner, {
        x: targetCornerPositionsRef.current![i].x - cursorX,
        y: targetCornerPositionsRef.current![i].y - cursorY,
        duration: hoverDuration,
        ease: 'power2.out'
      }))

      const leaveHandler = () => {
        gsap.ticker.remove(tickerFnRef.current!)
        targetCornerPositionsRef.current = null
        gsap.set(activeStrengthRef, { current: 0, overwrite: true })
        activeTarget = null
        const positions = [
          { x: -cornerSize * 1.5, y: -cornerSize * 1.5 },
          { x: cornerSize * 0.5, y: -cornerSize * 1.5 },
          { x: cornerSize * 0.5, y: cornerSize * 0.5 },
          { x: -cornerSize * 1.5, y: cornerSize * 0.5 }
        ]
        corners.forEach((corner, index) => gsap.to(corner, {
          ...positions[index], duration: 0.3, ease: 'power3.out', overwrite: true
        }))
        resumeTimeout = setTimeout(() => {
          if (!activeTarget && cursorRef.current) createSpinTimeline()
          resumeTimeout = null
        }, 50)
        cleanupTarget(target)
      }
      currentLeaveHandler = leaveHandler
      target.addEventListener('mouseleave', leaveHandler)
    }

    const resizeHandler = () => { containingBlockRef.current = getContainingBlock(cursor) }
    window.addEventListener('mousemove', moveHandler)
    window.addEventListener('mouseover', enterHandler, { passive: true })
    window.addEventListener('scroll', scrollHandler, { passive: true })
    window.addEventListener('resize', resizeHandler)
    window.addEventListener('mousedown', mouseDownHandler)
    window.addEventListener('mouseup', mouseUpHandler)
    document.addEventListener('mouseover', editableOverHandler as EventListener)
    document.addEventListener('mouseout', editableOutHandler as EventListener)
    document.addEventListener('focusin', focusInHandler as EventListener)
    document.addEventListener('focusout', focusOutHandler as EventListener)

    return () => {
      if (tickerFnRef.current) gsap.ticker.remove(tickerFnRef.current)
      window.removeEventListener('mousemove', moveHandler)
      window.removeEventListener('mouseover', enterHandler)
      window.removeEventListener('scroll', scrollHandler)
      window.removeEventListener('resize', resizeHandler)
      window.removeEventListener('mousedown', mouseDownHandler)
      window.removeEventListener('mouseup', mouseUpHandler)
      document.removeEventListener('mouseover', editableOverHandler as EventListener)
      document.removeEventListener('mouseout', editableOutHandler as EventListener)
      document.removeEventListener('focusin', focusInHandler as EventListener)
      document.removeEventListener('focusout', focusOutHandler as EventListener)
      if (activeTarget) cleanupTarget(activeTarget)
      if (resumeTimeout) clearTimeout(resumeTimeout)
      spinTl.current?.kill()
      gsap.killTweensOf(cursor)
      document.body.style.cursor = originalCursor
      document.documentElement.classList.remove('target-cursor-enabled')
      targetCornerPositionsRef.current = null
      activeStrengthRef.current = 0
    }
  }, [constants, enabled, hideDefaultCursor, hoverDuration, moveCursor, parallaxOn, spinDuration, targetSelector])

  if (!capable || forceEnabled === false) return null

  return <div ref={cursorRef} className="target-cursor-wrapper" aria-hidden="true">
    <div className="target-cursor-corner corner-tl" />
    <div className="target-cursor-corner corner-tr" />
    <div className="target-cursor-corner corner-br" />
    <div className="target-cursor-corner corner-bl" />
  </div>
}
