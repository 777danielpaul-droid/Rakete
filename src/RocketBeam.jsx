import { useRef, useEffect, useState, useCallback } from 'react'

function pulse(t) {
  return 0.5 + 0.5 * Math.sin(t * 3.0) + 0.25 * Math.sin(t * 7.2 + 1.0) + 0.15 * Math.sin(t * 11.5 + 2.3)
}

function flicker(t) {
  return 0.7 + 0.3 * Math.sin(t * 9.0) + 0.2 * Math.sin(t * 17.3 + 0.7)
}

class Particle {
  constructor(x, y, isBeam, time) {
    this.x = x
    this.y = y
    this.isBeam = isBeam
    const spread = isBeam ? 0.15 : 1.0
    const angle = (Math.random() - 0.5) * spread
    const speed = isBeam ? Math.random() * 1.0 + 0.5 : Math.random() * 1.5 + 0.3
    this.vx = Math.sin(angle) * speed
    this.vy = isBeam ? Math.cos(angle) * speed + 0.8 : Math.random() * 1.0 + 0.3
    this.life = 1.0
    this.decay = isBeam ? Math.random() * 0.003 + 0.001 : Math.random() * 0.006 + 0.002
    this.size = isBeam ? Math.random() * 3.5 + 1.0 : Math.random() * 2.5 + 0.8
    this.birthTime = time

    const hue = isBeam ? 210 + Math.random() * 25 : 225 + Math.random() * 60
    const sat = 70 + Math.random() * 30
    const light = isBeam ? 55 + Math.random() * 35 : 45 + Math.random() * 45
    this.baseColor = { h: hue, s: sat, l: light }
  }

  update() {
    this.x += this.vx
    this.y += this.vy
    this.life -= this.decay
    if (!this.isBeam) {
      this.vx *= 0.992
      this.vy *= 0.997
    }
  }

  draw(ctx, t) {
    const p = pulse(t + this.birthTime)
    const f = flicker(t + this.birthTime)
    const alpha = Math.max(0, this.life * p * f)
    const s = this.size * this.life * (0.8 + 0.4 * p)

    const h = this.baseColor.h
    const s_ = this.baseColor.s
    const l = Math.min(98, this.baseColor.l + 20 * p)

    ctx.beginPath()
    ctx.arc(this.x, this.y, s, 0, Math.PI * 2)
    ctx.fillStyle = `hsla(${h}, ${s_}%, ${l}%, ${alpha})`
    ctx.fill()

    if (this.isBeam && alpha > 0.2) {
      ctx.beginPath()
      ctx.arc(this.x, this.y, s * 0.4, 0, Math.PI * 2)
      ctx.fillStyle = `hsla(${h + 15}, ${s_}%, ${Math.min(100, l + 25)}%, ${alpha * 0.7})`
      ctx.fill()
    }
  }
}

export default function RocketBeam() {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const [running, setRunning] = useState(false)

  const timeRef = useRef(0)
  const animIdRef = useRef(null)
  const particlesRef = useRef([])
  const beamParticlesRef = useRef([])
  const runningRef = useRef(false)

  const drawNozzle = useCallback((ctx, W, t) => {
    const cx = W / 2
    const ny = 45

    if (runningRef.current) {
      const p = pulse(t)
      const f = flicker(t)
      const glowR = 25 + 20 * p
      const glow = ctx.createRadialGradient(cx, ny, 0, cx, ny, glowR)
      glow.addColorStop(0, `rgba(200, 130, 255, ${0.9 * p * f})`)
      glow.addColorStop(0.3, `rgba(120, 80, 240, ${0.4 * p})`)
      glow.addColorStop(0.7, `rgba(60, 40, 180, ${0.15 * p})`)
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = glow
      ctx.fillRect(cx - glowR, ny - glowR, glowR * 2, glowR * 2)
    }

    ctx.beginPath()
    ctx.moveTo(cx - 10, ny - 12)
    ctx.lineTo(cx + 10, ny - 12)
    ctx.lineTo(cx + 7, ny + 4)
    ctx.lineTo(cx - 7, ny + 4)
    ctx.closePath()
    ctx.strokeStyle = runningRef.current
      ? `rgba(180, 130, 255, ${0.5 + 0.3 * pulse(t)})`
      : 'rgba(90, 70, 170, 0.25)'
    ctx.lineWidth = 1.2
    ctx.stroke()
  }, [])

  const drawBeam = useCallback((ctx, W, H, t) => {
    if (!runningRef.current) return
    const cx = W / 2
    const ny = 49
    const p = pulse(t)
    const f = flicker(t)

    const beamGrad1 = ctx.createLinearGradient(cx, ny, cx, H)
    beamGrad1.addColorStop(0, `rgba(170, 120, 255, ${0.85 * p * f})`)
    beamGrad1.addColorStop(0.1, `rgba(110, 80, 255, ${0.6 * p})`)
    beamGrad1.addColorStop(0.35, `rgba(60, 80, 220, ${0.3 * p})`)
    beamGrad1.addColorStop(0.65, `rgba(30, 45, 150, ${0.12 * p})`)
    beamGrad1.addColorStop(1, 'rgba(8, 10, 40, 0)')

    const w1 = 5 + 3 * p
    const w1b = 2 + 1.5 * p
    ctx.beginPath()
    ctx.moveTo(cx - w1, ny)
    ctx.lineTo(cx + w1, ny)
    ctx.lineTo(cx + w1b, H)
    ctx.lineTo(cx - w1b, H)
    ctx.closePath()
    ctx.fillStyle = beamGrad1
    ctx.fill()

    const beamGrad2 = ctx.createLinearGradient(cx, ny, cx, H * 0.9)
    beamGrad2.addColorStop(0, `rgba(200, 160, 255, ${0.6 * p * f})`)
    beamGrad2.addColorStop(0.2, `rgba(140, 110, 255, ${0.35 * p})`)
    beamGrad2.addColorStop(0.5, `rgba(80, 70, 220, ${0.15 * p})`)
    beamGrad2.addColorStop(1, 'rgba(20, 20, 80, 0)')

    const w2 = 2.5 + 1.5 * p
    const w2b = 1 + 0.8 * p
    ctx.beginPath()
    ctx.moveTo(cx - w2, ny)
    ctx.lineTo(cx + w2, ny)
    ctx.lineTo(cx + w2b, H * 0.9)
    ctx.lineTo(cx - w2b, H * 0.9)
    ctx.closePath()
    ctx.fillStyle = beamGrad2
    ctx.fill()

    const coreGrad = ctx.createLinearGradient(cx, ny, cx, H * 0.6)
    coreGrad.addColorStop(0, `rgba(240, 210, 255, ${0.7 * p * f})`)
    coreGrad.addColorStop(0.15, `rgba(190, 150, 255, ${0.4 * p})`)
    coreGrad.addColorStop(0.4, `rgba(120, 90, 240, ${0.18 * p})`)
    coreGrad.addColorStop(1, 'rgba(40, 30, 120, 0)')

    const wc = 1.2 + 0.8 * p
    const wcb = 0.4 + 0.3 * p
    ctx.beginPath()
    ctx.moveTo(cx - wc, ny)
    ctx.lineTo(cx + wc, ny)
    ctx.lineTo(cx + wcb, H * 0.6)
    ctx.lineTo(cx - wcb, H * 0.6)
    ctx.closePath()
    ctx.fillStyle = coreGrad
    ctx.fill()
  }, [])

  const spawnParticles = useCallback((W) => {
    if (!runningRef.current) return
    const cx = W / 2
    const ny = 49

    for (let i = 0; i < 4; i++) {
      beamParticlesRef.current.push(
        new Particle(cx + (Math.random() - 0.5) * 3, ny + Math.random() * 2, true, timeRef.current)
      )
    }

    for (let i = 0; i < 3; i++) {
      particlesRef.current.push(
        new Particle(cx + (Math.random() - 0.5) * 5, ny + 5 + Math.random() * 10, false, timeRef.current)
      )
    }
  }, [])

  const animate = useCallback(() => {
    if (!runningRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const W = canvas.width
    const H = canvas.height

    ctx.fillStyle = 'rgba(1, 1, 8, 0.12)'
    ctx.fillRect(0, 0, W, H)

    timeRef.current += 0.016
    const t = timeRef.current

    drawNozzle(ctx, W, t)
    drawBeam(ctx, W, H, t)
    spawnParticles(W)

    const beamParts = beamParticlesRef.current
    for (let i = beamParts.length - 1; i >= 0; i--) {
      beamParts[i].update()
      beamParts[i].draw(ctx, t)
      if (beamParts[i].life <= 0) beamParts.splice(i, 1)
    }

    const parts = particlesRef.current
    for (let i = parts.length - 1; i >= 0; i--) {
      parts[i].update()
      parts[i].draw(ctx, t)
      if (parts[i].life <= 0 || parts[i].y > H + 20) parts.splice(i, 1)
    }

    if (beamParts.length > 500) beamParts.splice(0, beamParts.length - 500)
    if (parts.length > 350) parts.splice(0, parts.length - 350)

    animIdRef.current = requestAnimationFrame(animate)
  }, [drawNozzle, drawBeam, spawnParticles])

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current

    if (!canvas || !container) return

    const resizeObserver = new ResizeObserver(() => {
      const rect = container.getBoundingClientRect()
      canvas.width = rect.width
      canvas.height = rect.height
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#010108'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      drawNozzle(ctx, canvas.width, timeRef.current)
    })

    resizeObserver.observe(container)

    function init() {
      const rect = container.getBoundingClientRect()
      canvas.width = rect.width
      canvas.height = rect.height
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#010108'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      drawNozzle(ctx, canvas.width, timeRef.current)
    }

    init()
    window.addEventListener('resize', init)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', init)
    }
  }, [drawNozzle])

  useEffect(() => {
    runningRef.current = running
    if (running) {
      animate()
    } else {
      if (animIdRef.current) cancelAnimationFrame(animIdRef.current)
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#010108'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      drawNozzle(ctx, canvas.width, timeRef.current)
    }
    return () => {
      if (animIdRef.current) cancelAnimationFrame(animIdRef.current)
    }
  }, [running, animate, drawNozzle])

  return (
    <div className="relative w-full max-w-xl mx-auto h-[650px] bg-[#010108] overflow-visible rounded-xl flex flex-col items-center">
      <div
        ref={containerRef}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: '100%',
          height: '100%',
          transform: 'rotate(-25deg)',
          transformOrigin: 'center top'
        }}
      >
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>
      <button
        onClick={() => setRunning(!running)}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 px-8 py-2.5 rounded-full text-sm text-[#c0a0ff] border border-[rgba(140,100,255,0.4)] backdrop-blur-md transition-all duration-300 hover:border-[rgba(160,120,255,0.6)] cursor-pointer"
        style={{
          background: running ? 'rgba(180,80,255,0.3)' : 'rgba(120,80,255,0.15)',
        }}
      >
        {running ? '⏹ Stoppen' : '▶ Starten'}
      </button>
    </div>
  )
}
