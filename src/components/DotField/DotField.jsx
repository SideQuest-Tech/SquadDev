import { memo, useEffect, useRef } from 'react'
import './DotField.css'

const TWO_PI = Math.PI * 2

const DotField = memo(({
  dotRadius = 1.5,
  dotSpacing = 14,
  cursorRadius = 500,
  cursorForce = 0.1,
  bulgeOnly = true,
  bulgeStrength = 67,
  glowRadius = 160,
  sparkle = false,
  waveAmplitude = 0,
  gradientFrom = 'rgba(168, 85, 247, 0.35)',
  gradientTo = 'rgba(180, 151, 207, 0.25)',
  glowColor = '#120F17',
  ...rest
}) => {
  const canvasRef = useRef(null)
  const glowRef = useRef(null)
  const dotsRef = useRef([])
  const mouseRef = useRef({ x: -9999, y: -9999, prevX: -9999, prevY: -9999, speed: 0 })
  const rafRef = useRef(null)
  const sizeRef = useRef({ w: 0, h: 0, offsetX: 0, offsetY: 0 })
  const glowOpacity = useRef(0)
  const engagement = useRef(0)
  const propsRef = useRef({})
  propsRef.current = { dotRadius, dotSpacing, cursorRadius, cursorForce, bulgeOnly, bulgeStrength, sparkle, waveAmplitude, gradientFrom, gradientTo }
  const rebuildRef = useRef(null)
  const glowIdRef = useRef(`dot-field-glow-${Math.random().toString(36).slice(2, 9)}`)

  useEffect(() => {
    const canvas = canvasRef.current
    const glowEl = glowRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let resizeTimer

    function resize() {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(doResize, 100)
    }

    function doResize() {
      const rect = canvas.parentElement.getBoundingClientRect()
      const w = rect.width
      const h = rect.height
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      sizeRef.current = { w, h, offsetX: rect.left + window.scrollX, offsetY: rect.top + window.scrollY }
      buildDots(w, h)
    }

    function buildDots(w, h) {
      const p = propsRef.current
      const step = p.dotRadius + p.dotSpacing
      const cols = Math.floor(w / step)
      const rows = Math.floor(h / step)
      const padX = (w % step) / 2
      const padY = (h % step) / 2
      const dots = new Array(rows * cols)
      let idx = 0
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const ax = padX + col * step + step / 2
          const ay = padY + row * step + step / 2
          dots[idx++] = { ax, ay, sx: ax, sy: ay, vx: 0, vy: 0, x: ax, y: ay }
        }
      }
      dotsRef.current = dots
    }

    function onMouseMove(event) {
      const s = sizeRef.current
      mouseRef.current.x = event.pageX - s.offsetX
      mouseRef.current.y = event.pageY - s.offsetY
    }

    function updateMouseSpeed() {
      const m = mouseRef.current
      const dx = m.prevX - m.x
      const dy = m.prevY - m.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      m.speed += (dist - m.speed) * 0.5
      if (m.speed < 0.001) m.speed = 0
      m.prevX = m.x
      m.prevY = m.y
    }

    const speedInterval = setInterval(updateMouseSpeed, 20)
    let frameCount = 0

    function tick() {
      frameCount++
      const dots = dotsRef.current
      const m = mouseRef.current
      const { w, h } = sizeRef.current
      const p = propsRef.current
      const t = frameCount * 0.02
      const targetEngagement = Math.min(m.speed / 5, 1)
      engagement.current += (targetEngagement - engagement.current) * 0.06
      if (engagement.current < 0.001) engagement.current = 0
      const engaged = engagement.current
      glowOpacity.current += (engaged - glowOpacity.current) * 0.08

      if (glowEl) {
        glowEl.setAttribute('cx', m.x)
        glowEl.setAttribute('cy', m.y)
        glowEl.style.opacity = glowOpacity.current
      }

      ctx.clearRect(0, 0, w, h)
      const gradient = ctx.createLinearGradient(0, 0, w, h)
      gradient.addColorStop(0, p.gradientFrom)
      gradient.addColorStop(1, p.gradientTo)
      ctx.fillStyle = gradient
      const cursorRadiusSq = p.cursorRadius * p.cursorRadius
      const radius = p.dotRadius / 2
      ctx.beginPath()

      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i]
        const dx = m.x - dot.ax
        const dy = m.y - dot.ay
        const distSq = dx * dx + dy * dy

        if (distSq < cursorRadiusSq && engaged > 0.01) {
          const dist = Math.sqrt(distSq)
          if (p.bulgeOnly) {
            const proximity = 1 - dist / p.cursorRadius
            const push = proximity * proximity * p.bulgeStrength * engaged
            const angle = Math.atan2(dy, dx)
            dot.sx += (dot.ax - Math.cos(angle) * push - dot.sx) * 0.15
            dot.sy += (dot.ay - Math.sin(angle) * push - dot.sy) * 0.15
          } else {
            const angle = Math.atan2(dy, dx)
            const move = (500 / dist) * (m.speed * p.cursorForce)
            dot.vx += Math.cos(angle) * -move
            dot.vy += Math.sin(angle) * -move
          }
        } else if (p.bulgeOnly) {
          dot.sx += (dot.ax - dot.sx) * 0.1
          dot.sy += (dot.ay - dot.sy) * 0.1
        }

        if (!p.bulgeOnly) {
          dot.vx *= 0.9
          dot.vy *= 0.9
          dot.x = dot.ax + dot.vx
          dot.y = dot.ay + dot.vy
          dot.sx += (dot.x - dot.sx) * 0.1
          dot.sy += (dot.y - dot.sy) * 0.1
        }

        let drawX = dot.sx
        let drawY = dot.sy
        if (p.waveAmplitude > 0) {
          drawY += Math.sin(dot.ax * 0.03 + t) * p.waveAmplitude
          drawX += Math.cos(dot.ay * 0.03 + t * 0.7) * p.waveAmplitude * 0.5
        }

        if (p.sparkle) {
          const hash = ((i * 2654435761) ^ (frameCount >> 3)) >>> 0
          const sparkleRadius = hash % 100 < 3 ? radius * 1.8 : radius
          ctx.moveTo(drawX + sparkleRadius, drawY)
          ctx.arc(drawX, drawY, sparkleRadius, 0, TWO_PI)
        } else {
          ctx.moveTo(drawX + radius, drawY)
          ctx.arc(drawX, drawY, radius, 0, TWO_PI)
        }
      }
      ctx.fill()
      rafRef.current = requestAnimationFrame(tick)
    }

    doResize()
    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', onMouseMove, { passive: true })
    rafRef.current = requestAnimationFrame(tick)
    rebuildRef.current = () => {
      const { w, h } = sizeRef.current
      if (w > 0 && h > 0) buildDots(w, h)
    }

    return () => {
      cancelAnimationFrame(rafRef.current)
      clearInterval(speedInterval)
      clearTimeout(resizeTimer)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMouseMove)
    }
  }, [])

  useEffect(() => {
    rebuildRef.current?.()
  }, [dotRadius, dotSpacing])

  return <div className="dot-field-container" {...rest}>
    <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
      <defs><radialGradient id={glowIdRef.current}><stop offset="0%" stopColor={glowColor} /><stop offset="100%" stopColor="transparent" /></radialGradient></defs>
      <circle ref={glowRef} cx="-9999" cy="-9999" r={glowRadius} fill={`url(#${glowIdRef.current})`} style={{ opacity: 0, willChange: 'opacity' }} />
    </svg>
  </div>
})

DotField.displayName = 'DotField'
export default DotField
