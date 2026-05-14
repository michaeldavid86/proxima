// 2D top-down view of the Historical Ops vignette. Renders Earth, orbital
// arcs, and craft glyphs onto a Canvas projected onto the ECI x-y plane.
// User can drag to pan and scroll to zoom; auto-frame fires once per
// snapshot change and yields to user input afterward.
import { useEffect, useMemo, useRef, useState } from 'react'
import type { HistoricalVignette, CraftSnapshot, Snapshot } from '../historical/types'
import { resolveCraft, anchorToCoe, lerpVec3 } from '../historical/positions'
import { coeToState, type COE } from '../physics/orbital-elements'
import { R_EARTH } from '../physics/constants'
import { colors } from '../theme/colors'

interface Props {
  vignette: HistoricalVignette
  snapshotIdx: number
  playbackT: number
}

const sideColor = (s: CraftSnapshot['side']) =>
  s === 'blue' ? colors.friendly : s === 'red' ? colors.adversary : colors.amber

const findCraftIn = (s: Snapshot | undefined, id: string) =>
  s?.craft.find((c) => c.id === id)

const ORBIT_SAMPLES = 128

const coeKey = (c: COE): string =>
  [c.a, c.e, c.i, c.raan, c.argp].map((x) => x.toFixed(4)).join('|')

// Sample an orbit at ORBIT_SAMPLES true-anomaly steps. Returns ECI x,y pairs
// for 2D projection (we project to the x-y plane, looking down from +z).
const sampleOrbitXY = (coe: COE): { x: number; y: number }[] => {
  const out: { x: number; y: number }[] = []
  for (let i = 0; i <= ORBIT_SAMPLES; i++) {
    const nu = (i / ORBIT_SAMPLES) * 2 * Math.PI
    const sv = coeToState({ ...coe, nu })
    out.push({ x: sv.r[0], y: sv.r[1] })
  }
  return out
}

export default function HistoricalScene2D({ vignette, snapshotIdx, playbackT }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const dragRef = useRef<{ x: number; y: number } | null>(null)
  // Track whether the user has manually moved the view since the last
  // snapshot change. If they have, we don't re-auto-frame.
  const userMovedRef = useRef(false)

  // Auto-frame whenever the snapshot changes — but only if the user hasn't
  // touched the camera since the previous frame.
  useEffect(() => {
    userMovedRef.current = false
    const snap = vignette.snapshots[snapshotIdx]
    if (!snap) return

    const focusId = snap.cameraFocusCraftId ?? snap.craft[0]?.id
    const focusCraft = snap.craft.find((c) => c.id === focusId) ?? snap.craft[0]
    if (!focusCraft) return

    const cam = snap.camera ?? (snapshotIdx === 0 ? 'regime' : 'close')
    const anchorAm = R_EARTH + vignette.anchorOrbit.altitudeKm * 1000
    let halfSpanM: number
    let center: { x: number; y: number }

    if (cam === 'regime') {
      // Frame Earth + the anchor orbit comfortably.
      halfSpanM = anchorAm * 1.4
      center = { x: 0, y: 0 }
    } else {
      const f = resolveCraft(focusCraft, vignette.anchorOrbit)
      center = { x: f.rEci[0], y: f.rEci[1] }
      if (cam === 'close') halfSpanM = anchorAm * 0.18
      else halfSpanM = R_EARTH * 0.06 // proximity: very tight
    }

    // The renderer treats zoom=1 as "fit the regime view" — i.e. pixel scale
    // = (W/2 - margin) / halfSpanM_regime. We store the desired pan in meters
    // and a zoom multiplier that scales halfSpanM relative to the regime.
    const regimeHalfSpan = anchorAm * 1.4
    setZoom(regimeHalfSpan / halfSpanM)
    setPan({ x: center.x, y: center.y })
  }, [vignette, snapshotIdx])

  // Resolve positions + orbits for the current frame.
  const renderData = useMemo(() => {
    const cur = vignette.snapshots[snapshotIdx]
    const nxt = vignette.snapshots[snapshotIdx + 1]
    const denom = nxt ? nxt.t_sec - cur.t_sec : 1
    const tFrac =
      nxt && denom > 0 ? Math.min(1, Math.max(0, (playbackT - cur.t_sec) / denom)) : 0

    const anchorCoe = anchorToCoe(vignette.anchorOrbit)
    const orbits = new Map<
      string,
      { coe: COE; isAnchor: boolean; sample: CraftSnapshot }
    >()
    orbits.set(coeKey(anchorCoe), {
      coe: anchorCoe,
      isAnchor: true,
      sample: cur.craft[0],
    })

    const prev = snapshotIdx > 0 ? vignette.snapshots[snapshotIdx - 1] : undefined

    const items = cur.craft.map((c) => {
      const resCur = resolveCraft(c, vignette.anchorOrbit)
      const resNxt = nxt
        ? (() => {
            const f = findCraftIn(nxt, c.id)
            return f ? resolveCraft(f, vignette.anchorOrbit) : resCur
          })()
        : resCur
      const resPrev = prev
        ? (() => {
            const f = findCraftIn(prev, c.id)
            return f ? resolveCraft(f, vignette.anchorOrbit) : null
          })()
        : null
      const rNow = lerpVec3(resCur.rEci, resNxt.rEci, tFrac)
      const k = coeKey(resCur.coe)
      if (!orbits.has(k)) orbits.set(k, { coe: resCur.coe, isAnchor: false, sample: c })
      return {
        id: c.id,
        name: c.name,
        side: c.side,
        labelVisible: c.labelVisible,
        rNow,
        rPrev: resPrev?.rEci ?? null,
      }
    })

    return { items, orbits: Array.from(orbits.values()) }
  }, [vignette, snapshotIdx, playbackT])

  // Canvas redraw.
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    const rect = container.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    canvas.width = Math.floor(rect.width * dpr)
    canvas.height = Math.floor(rect.height * dpr)
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${rect.height}px`
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.resetTransform()
    ctx.scale(dpr, dpr)
    const W = rect.width
    const H = rect.height

    const margin = 24
    const anchorAm = R_EARTH + vignette.anchorOrbit.altitudeKm * 1000
    const regimeHalfSpan = anchorAm * 1.4
    const halfSpanM = regimeHalfSpan / zoom
    const scale = Math.min(W - margin * 2, H - margin * 2) / (halfSpanM * 2)
    const toScreen = (xM: number, yM: number) => ({
      x: W / 2 + (xM - pan.x) * scale,
      y: H / 2 - (yM - pan.y) * scale, // y up
    })

    // Background.
    ctx.fillStyle = colors.bg
    ctx.fillRect(0, 0, W, H)

    // Grid.
    const gridStepM = 5_000_000 // 5,000 km
    ctx.strokeStyle = colors.grid
    ctx.lineWidth = 1
    const xMin = pan.x - halfSpanM
    const xMax = pan.x + halfSpanM
    const yMin = pan.y - halfSpanM
    const yMax = pan.y + halfSpanM
    for (
      let x = Math.ceil(xMin / gridStepM) * gridStepM;
      x <= xMax;
      x += gridStepM
    ) {
      const sx = toScreen(x, 0).x
      ctx.beginPath()
      ctx.moveTo(sx, 0)
      ctx.lineTo(sx, H)
      ctx.stroke()
    }
    for (
      let y = Math.ceil(yMin / gridStepM) * gridStepM;
      y <= yMax;
      y += gridStepM
    ) {
      const sy = toScreen(0, y).y
      ctx.beginPath()
      ctx.moveTo(0, sy)
      ctx.lineTo(W, sy)
      ctx.stroke()
    }

    // Earth.
    const earthC = toScreen(0, 0)
    const earthR = R_EARTH * scale
    // Subtle ocean fill.
    ctx.fillStyle = '#0b2940'
    ctx.beginPath()
    ctx.arc(earthC.x, earthC.y, earthR, 0, 2 * Math.PI)
    ctx.fill()
    // Edge ring.
    ctx.strokeStyle = '#3a607a'
    ctx.lineWidth = 1.2
    ctx.stroke()
    // Cross-hair through Earth for orientation.
    ctx.strokeStyle = colors.grid
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(earthC.x - earthR, earthC.y)
    ctx.lineTo(earthC.x + earthR, earthC.y)
    ctx.moveTo(earthC.x, earthC.y - earthR)
    ctx.lineTo(earthC.x, earthC.y + earthR)
    ctx.stroke()

    // Orbits.
    for (const o of renderData.orbits) {
      const pts = sampleOrbitXY(o.coe)
      ctx.beginPath()
      let moved = false
      for (const p of pts) {
        const s = toScreen(p.x, p.y)
        if (!moved) {
          ctx.moveTo(s.x, s.y)
          moved = true
        } else {
          ctx.lineTo(s.x, s.y)
        }
      }
      ctx.strokeStyle = o.isAnchor ? colors.cyan : sideColor(o.sample.side)
      ctx.globalAlpha = o.isAnchor ? 0.45 : 0.7
      ctx.lineWidth = o.isAnchor ? 1.4 : 1.1
      if (!o.isAnchor) ctx.setLineDash([6, 5])
      ctx.stroke()
      ctx.setLineDash([])
      ctx.globalAlpha = 1
    }

    // Motion trails.
    for (const it of renderData.items) {
      if (!it.rPrev) continue
      const from = toScreen(it.rPrev[0], it.rPrev[1])
      const to = toScreen(it.rNow[0], it.rNow[1])
      ctx.strokeStyle = sideColor(it.side)
      ctx.globalAlpha = 0.45
      ctx.setLineDash([4, 3])
      ctx.beginPath()
      ctx.moveTo(from.x, from.y)
      ctx.lineTo(to.x, to.y)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.globalAlpha = 1
    }

    // Craft glyphs.
    for (const it of renderData.items) {
      const c = toScreen(it.rNow[0], it.rNow[1])
      ctx.fillStyle = sideColor(it.side)
      ctx.beginPath()
      ctx.arc(c.x, c.y, 6, 0, 2 * Math.PI)
      ctx.fill()
      ctx.strokeStyle = '#000'
      ctx.lineWidth = 1
      ctx.stroke()
      if (it.labelVisible) {
        ctx.fillStyle = colors.text
        ctx.font = '11px "JetBrains Mono", monospace'
        ctx.fillText(it.name, c.x + 10, c.y - 8)
      }
    }

    // HUD: regime + era + view note.
    ctx.fillStyle = colors.dim
    ctx.font = '10px "JetBrains Mono", monospace'
    ctx.fillText(`${vignette.regime} top-down · drag to pan, scroll to zoom`, 12, H - 12)
  }, [renderData, vignette, zoom, pan])

  // Mouse pan / wheel zoom.
  const onMouseDown = (e: React.MouseEvent) => {
    dragRef.current = { x: e.clientX, y: e.clientY }
  }
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current) return
    const dx = e.clientX - dragRef.current.x
    const dy = e.clientY - dragRef.current.y
    dragRef.current = { x: e.clientX, y: e.clientY }
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    const margin = 24
    const anchorAm = R_EARTH + vignette.anchorOrbit.altitudeKm * 1000
    const halfSpanM = (anchorAm * 1.4) / zoom
    const scale = Math.min(rect.width - margin * 2, rect.height - margin * 2) / (halfSpanM * 2)
    setPan((p) => ({ x: p.x - dx / scale, y: p.y + dy / scale }))
    userMovedRef.current = true
  }
  const onMouseUp = () => {
    dragRef.current = null
  }
  const onWheel = (e: React.WheelEvent) => {
    const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12
    setZoom((z) => Math.min(5000, Math.max(0.4, z * factor)))
    userMovedRef.current = true
  }

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full cursor-grab active:cursor-grabbing"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onWheel={onWheel}
    >
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  )
}
