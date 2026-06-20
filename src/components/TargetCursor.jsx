import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { gsap } from 'gsap'
import './TargetCursor.css'

// Based on the React Bits Target Cursor JavaScript/CSS implementation.
const getContainingBlock = element => {
  let node = element?.parentElement
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

const getContainingBlockOffset = block => {
  if (!block) return { x: 0, y: 0 }
  const rect = block.getBoundingClientRect()
  return { x: rect.left + block.clientLeft, y: rect.top + block.clientTop }
}

export default function TargetCursor({
  targetSelector = '.cursor-target',
  spinDuration = 2,
  hideDefaultCursor = true,
  hoverDuration = 0.2,
  parallaxOn = true
}) {
  const cursorRef = useRef(null)
  const cornersRef = useRef(null)
  const spinTl = useRef(null)
  const containingBlockRef = useRef(null)
  const targetCornerPositionsRef = useRef(null)
  const tickerFnRef = useRef(null)
  const activeStrengthRef = useRef(0)
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const desktopQuery = window.matchMedia('(min-width: 769px) and (hover: hover) and (pointer: fine)')
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => {
      const hasTouch = navigator.maxTouchPoints > 0 || 'ontouchstart' in window
      setEnabled(desktopQuery.matches && !motionQuery.matches && !hasTouch)
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

  const moveCursor = useCallback((x, y) => {
    if (!cursorRef.current) return
    const offset = getContainingBlockOffset(containingBlockRef.current)
    gsap.to(cursorRef.current, { x: x - offset.x, y: y - offset.y, duration: 0.1, ease: 'power3.out' })
  }, [])

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
    let activeTarget = null
    let currentLeaveHandler = null
    let resumeTimeout = null

    const cleanupTarget = target => {
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
      const cursorX = gsap.getProperty(cursorRef.current, 'x')
      const cursorY = gsap.getProperty(cursorRef.current, 'y')
      Array.from(cornersRef.current).forEach((corner, i) => {
        const currentX = gsap.getProperty(corner, 'x')
        const currentY = gsap.getProperty(corner, 'y')
        const targetX = targetCornerPositionsRef.current[i].x - cursorX
        const targetY = targetCornerPositionsRef.current[i].y - cursorY
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

    const moveHandler = event => moveCursor(event.clientX, event.clientY)
    const scrollHandler = () => {
      if (!activeTarget || !cursorRef.current) return
      const currentOffset = getOffset()
      const mouseX = gsap.getProperty(cursorRef.current, 'x') + currentOffset.x
      const mouseY = gsap.getProperty(cursorRef.current, 'y') + currentOffset.y
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
    const editableOverHandler = event => {
      if (!event.target.closest?.(editableSelector)) return
      editableHovered = true
      updateEditableVisibility()
    }
    const editableOutHandler = event => {
      const editable = event.target.closest?.(editableSelector)
      if (!editable || event.relatedTarget?.closest?.(editableSelector) === editable) return
      editableHovered = false
      updateEditableVisibility()
    }
    const focusInHandler = event => {
      if (!event.target.matches?.(editableSelector)) return
      editableFocused = true
      updateEditableVisibility()
    }
    const focusOutHandler = event => {
      if (!event.target.matches?.(editableSelector)) return
      editableFocused = false
      updateEditableVisibility()
    }

    const enterHandler = event => {
      const target = event.target.closest?.(targetSelector)
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
      const cursorX = gsap.getProperty(cursorRef.current, 'x')
      const cursorY = gsap.getProperty(cursorRef.current, 'y')
      const { borderWidth, cornerSize } = constants
      targetCornerPositionsRef.current = [
        { x: rect.left - borderWidth - currentOffset.x, y: rect.top - borderWidth - currentOffset.y },
        { x: rect.right + borderWidth - cornerSize - currentOffset.x, y: rect.top - borderWidth - currentOffset.y },
        { x: rect.right + borderWidth - cornerSize - currentOffset.x, y: rect.bottom + borderWidth - cornerSize - currentOffset.y },
        { x: rect.left - borderWidth - currentOffset.x, y: rect.bottom + borderWidth - cornerSize - currentOffset.y }
      ]
      gsap.ticker.add(tickerFnRef.current)
      gsap.to(activeStrengthRef, { current: 1, duration: hoverDuration, ease: 'power2.out' })
      corners.forEach((corner, i) => gsap.to(corner, {
        x: targetCornerPositionsRef.current[i].x - cursorX,
        y: targetCornerPositionsRef.current[i].y - cursorY,
        duration: hoverDuration,
        ease: 'power2.out'
      }))

      const leaveHandler = () => {
        gsap.ticker.remove(tickerFnRef.current)
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
    document.addEventListener('mouseover', editableOverHandler)
    document.addEventListener('mouseout', editableOutHandler)
    document.addEventListener('focusin', focusInHandler)
    document.addEventListener('focusout', focusOutHandler)

    return () => {
      gsap.ticker.remove(tickerFnRef.current)
      window.removeEventListener('mousemove', moveHandler)
      window.removeEventListener('mouseover', enterHandler)
      window.removeEventListener('scroll', scrollHandler)
      window.removeEventListener('resize', resizeHandler)
      window.removeEventListener('mousedown', mouseDownHandler)
      window.removeEventListener('mouseup', mouseUpHandler)
      document.removeEventListener('mouseover', editableOverHandler)
      document.removeEventListener('mouseout', editableOutHandler)
      document.removeEventListener('focusin', focusInHandler)
      document.removeEventListener('focusout', focusOutHandler)
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

  if (!enabled) return null

  return <div ref={cursorRef} className="target-cursor-wrapper" aria-hidden="true">
    <div className="target-cursor-corner corner-tl" />
    <div className="target-cursor-corner corner-tr" />
    <div className="target-cursor-corner corner-br" />
    <div className="target-cursor-corner corner-bl" />
  </div>
}
