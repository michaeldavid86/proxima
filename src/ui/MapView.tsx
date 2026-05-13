// MapView — Canvas 2D orbital map.
// World coordinates = ECI meters projected to the XY plane (we drop z for the
// top-down view; inclined orbits appear as squashed ellipses, which is
// informative in its own right).
import { useEffect, useRef, useState } from 'react'
import { MU_EARTH, R_EARTH } from '../physics/constants'
import {
  coeToState,
  meanMotionFromA,
  periodFromA,
  stateToCoe,
  type COE,
} from '../physics/orbital-elements'
import { propagateState } from '../physics/kepler'
import { norm, sub, type Vec3 } from '../physics/vec'
import { applyImpulseEci, burnFromRic } from '../physics/maneuver'
import { useGame, type SpacecraftState } from '../game/state'
import { computeManeuverPreview } from '../game/maneuver-preview'
import { colors, assetColor } from '../theme/colors'

interface ViewState {
  // World coords centered on screen, meters.
  centerX: number
  centerY: number
  // pixels per meter
  zoom: number
}

const initialViewFor = (a: number) => {
  // Frame the orbit: pad to 1.3x radius.
  const extent = a * 1.3
  return {
    extent,
  }
}

const worldToScreen = (wx: number, wy: number, vs: ViewState, w: number, h: number) => {
  const sx = (wx - vs.centerX) * vs.zoom + w / 2
  const sy = -(wy - vs.centerY) * vs.zoom + h / 2
  return { x: sx, y: sy }
}

const screenToWorld = (sx: number, sy: number, vs: ViewState, w: number, h: number) => {
  const wx = (sx - w / 2) / vs.zoom + vs.centerX
  const wy = -((sy - h / 2) / vs.zoom) + vs.centerY
  return { x: wx, y: wy }
}

// Sample an orbit into 2D (x,y) points in ECI meters by stepping nu.
const sampleOrbitXY = (coe: COE, samples = 180): [number, number][] => {
  const pts: [number, number][] = []
  for (let i = 0; i <= samples; i++) {
    const nu = (i / samples) * 2 * Math.PI
    const sv = coeToState({ ...coe, nu })
    pts.push([sv.r[0], sv.r[1]])
  }
  return pts
}

const sideColor = (
  side: SpacecraftState['side'],
  isMissionTarget = false,
  assetIdx: number | null = null,
) => {
  if (assetIdx !== null) return assetColor(assetIdx)
  if (side === 'blue') return colors.friendly
  if (side === 'red') return colors.adversary
  // Neutral: render mission targets amber so they match the ProxView target
  // marker and the narration that calls them out as "amber".
  return isMissionTarget ? colors.amber : colors.neutral
}

type DirId = 'prograde' | 'retrograde' | 'radial_out' | 'radial_in' | 'normal' | 'anti_normal'

const dirRic = (d: DirId): Vec3 => {
  switch (d) {
    case 'prograde':
      return [0, 1, 0]
    case 'retrograde':
      return [0, -1, 0]
    case 'radial_out':
      return [1, 0, 0]
    case 'radial_in':
      return [-1, 0, 0]
    case 'normal':
      return [0, 0, 1]
    case 'anti_normal':
      return [0, 0, -1]
  }
}

const dirLabel = (d: DirId): string => {
  switch (d) {
    case 'prograde':
      return 'Prograde'
    case 'retrograde':
      return 'Retrograde'
    case 'radial_out':
      return 'Radial Out'
    case 'radial_in':
      return 'Radial In'
    case 'normal':
      return 'Normal'
    case 'anti_normal':
      return 'Anti-Normal'
  }
}

export default function MapView() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const viewRef = useRef<ViewState>({ centerX: 0, centerY: 0, zoom: 1e-6 })
  const initedRef = useRef(false)
  const dragRef = useRef<{ x: number; y: number } | null>(null)
  const [, setVer] = useState(0)
  const rerender = () => setVer((v) => v + 1)

  const mission = useGame((s) => s.mission)
  const spacecraft = useGame((s) => s.spacecraft)
  const simTime = useGame((s) => s.simTimeSec)
  const plannedManeuver = useGame((s) => s.plannedManeuver)
  const setPlannedManeuver = useGame((s) => s.setPlannedManeuver)
  const plannedManeuverPreview = useGame((s) => s.plannedManeuverPreview)
  const mode = useGame((s) => s.mode)
  const activeAssetId = useGame((s) => s.activeAssetId)
  const readOnly = mode === 'watch'
  // Resolved controller = active asset if multi-asset, else player.
  const controllerId = activeAssetId ?? mission?.playerId ?? ''
  const assetIdxOf = (id: string): number | null => {
    if (!mission?.assets) return null
    const idx = mission.assets.indexOf(id)
    return idx < 0 ? null : idx
  }

  const [dir, setDir] = useState<DirId>('prograde')
  const [dvMag, setDvMag] = useState<number>(10)
  const [burnOffsetSec, setBurnOffsetSec] = useState<number>(30)
  const [clickedNu, setClickedNu] = useState<number | null>(null)
  const commitLog = useGame((s) => s.pushLog)
  const setPlannedManeuverPreview = useGame((s) => s.setPlannedManeuverPreview)

  // v1.3 — live maneuver preview. Recompute whenever direction, magnitude, or
  // burn timing changes. The preview is a pure visualization; nothing in the
  // sim reads it. Cleared on Watch-mode entry and when the panel is hidden.
  useEffect(() => {
    if (!mission || readOnly) {
      setPlannedManeuverPreview(null)
      return
    }
    if (dvMag <= 0) {
      setPlannedManeuverPreview(null)
      return
    }
    const dv = dirRic(dir).map((x) => x * dvMag) as Vec3
    const state = useGame.getState()
    const preview = computeManeuverPreview(state, controllerId, dv, burnOffsetSec)
    setPlannedManeuverPreview(preview)
  }, [mission, readOnly, dir, dvMag, burnOffsetSec, controllerId, setPlannedManeuverPreview])

  // Clear preview when the component unmounts.
  useEffect(() => {
    return () => setPlannedManeuverPreview(null)
  }, [setPlannedManeuverPreview])

  // Frame the view for this mission once it loads.
  useEffect(() => {
    if (!mission || initedRef.current) return
    const playerLoadout = mission.spacecraft.find((s) => s.id === mission.playerId)
    if (!playerLoadout) return
    const { extent } = initialViewFor(playerLoadout.coe.a)
    const container = containerRef.current
    const minSide = Math.min(container?.clientWidth ?? 800, container?.clientHeight ?? 600)
    viewRef.current = {
      centerX: 0,
      centerY: 0,
      zoom: (minSide * 0.95) / (2 * extent),
    }
    initedRef.current = true
    rerender()
  }, [mission])

  // Reset the init flag when mission changes.
  useEffect(() => {
    initedRef.current = false
  }, [mission?.id])

  // Redraw on any state change (ticker triggers via simTime).
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
    const vs = viewRef.current

    // Background
    ctx.fillStyle = colors.bg
    ctx.fillRect(0, 0, W, H)

    // Subtle radial grid: concentric circles every 1000 km (LEO) or 10,000 km (GEO)
    const playerA =
      (mission && spacecraft[mission.playerId]
        ? norm(spacecraft[mission.playerId].rEci)
        : R_EARTH + 500_000) || R_EARTH + 500_000
    const isGeo = playerA > R_EARTH + 10_000_000
    const ringStepM = isGeo ? 10_000_000 : 1_000_000
    ctx.lineWidth = 1
    ctx.strokeStyle = colors.gridStrong
    const maxRing = Math.min(playerA * 2, R_EARTH * 12)
    for (let r = ringStepM; r <= maxRing; r += ringStepM) {
      const a = worldToScreen(r, 0, vs, W, H)
      const o = worldToScreen(0, 0, vs, W, H)
      const px = Math.hypot(a.x - o.x, a.y - o.y)
      ctx.beginPath()
      ctx.arc(o.x, o.y, px, 0, 2 * Math.PI)
      ctx.stroke()
    }

    // Earth — drawn as a shaded sphere with continent silhouettes and an
    // atmospheric halo. The top-down map looks down on the orbital plane
    // (the equator for 0° inclination), so we project the equirectangular
    // continent canvas onto the disk as a polar-style view: the visible disk
    // is the northern hemisphere with longitude 0 facing right. This is a
    // schematic projection, not a geographer's view; it reads as Earth at a
    // glance, which is what matters for the trainer.
    const earthCenter = worldToScreen(0, 0, vs, W, H)
    const earthPx = R_EARTH * vs.zoom
    {
      // Outer atmosphere halo (semi-transparent cyan ring).
      const haloGrad = ctx.createRadialGradient(
        earthCenter.x,
        earthCenter.y,
        earthPx * 0.95,
        earthCenter.x,
        earthCenter.y,
        earthPx * 1.18,
      )
      haloGrad.addColorStop(0, 'rgba(95, 179, 255, 0.18)')
      haloGrad.addColorStop(1, 'rgba(95, 179, 255, 0)')
      ctx.beginPath()
      ctx.arc(earthCenter.x, earthCenter.y, earthPx * 1.18, 0, 2 * Math.PI)
      ctx.fillStyle = haloGrad
      ctx.fill()

      // Ocean fill — radial gradient suggests a lit sphere.
      const oceanGrad = ctx.createRadialGradient(
        earthCenter.x - earthPx * 0.35,
        earthCenter.y - earthPx * 0.35,
        earthPx * 0.05,
        earthCenter.x,
        earthCenter.y,
        earthPx * 1.05,
      )
      oceanGrad.addColorStop(0, '#1d4f8a')
      oceanGrad.addColorStop(0.55, '#103a6e')
      oceanGrad.addColorStop(0.9, '#0a2238')
      oceanGrad.addColorStop(1, '#06182b')
      ctx.beginPath()
      ctx.arc(earthCenter.x, earthCenter.y, earthPx, 0, 2 * Math.PI)
      ctx.fillStyle = oceanGrad
      ctx.fill()

      // Stylized continents inside the disk. Drawn as soft amorphous shapes
      // in green/tan rather than projecting the full equirectangular map,
      // which would be misleading at top-down orbital scale. Land masses are
      // placed at fixed angles around the disk so the planet always reads
      // as Earth-like regardless of the camera orientation.
      ctx.save()
      ctx.beginPath()
      ctx.arc(earthCenter.x, earthCenter.y, earthPx * 0.985, 0, 2 * Math.PI)
      ctx.clip()
      const cx = earthCenter.x
      const cy = earthCenter.y
      const r = earthPx
      // Helper: draw a soft blob at polar (angle, radial fraction) with given size.
      const blob = (
        angleRad: number,
        radial: number,
        rx: number,
        ry: number,
        rot: number,
        color: string,
      ) => {
        const px = cx + Math.cos(angleRad) * radial * r
        const py = cy + Math.sin(angleRad) * radial * r
        ctx.save()
        ctx.translate(px, py)
        ctx.rotate(rot)
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.ellipse(0, 0, rx * r, ry * r, 0, 0, 2 * Math.PI)
        ctx.fill()
        ctx.restore()
      }
      // Major land masses (rough placements for visual identifiability).
      // Greens — temperate / equatorial vegetation.
      blob(-2.5, 0.38, 0.22, 0.16, 0.4, '#3d5a3a') // North America
      blob(-1.6, 0.55, 0.14, 0.22, -0.1, '#3a5538') // South America
      blob(0.0, 0.36, 0.18, 0.14, 0.2, '#3d5a3a') // Africa upper
      blob(0.45, 0.55, 0.12, 0.18, 0.1, '#3d5a3a') // Africa lower
      blob(1.0, 0.32, 0.24, 0.14, 0.3, '#3d5a3a') // Asia
      blob(1.9, 0.6, 0.13, 0.09, -0.2, '#3d5a3a') // Australia
      blob(-2.2, 0.18, 0.10, 0.08, 0.0, '#3d5a3a') // Europe
      // Desert tan overlay
      ctx.globalAlpha = 0.55
      blob(0.05, 0.34, 0.16, 0.07, 0.15, '#a07a4a') // Sahara
      blob(1.05, 0.30, 0.18, 0.06, 0.3, '#a07a4a') // Central Asia / Gobi
      blob(1.9, 0.6, 0.09, 0.05, -0.2, '#a07a4a') // Outback
      ctx.globalAlpha = 1
      // Polar ice (top and bottom of disk)
      const ice = ctx.createRadialGradient(cx, cy, earthPx * 0.7, cx, cy, earthPx)
      ice.addColorStop(0, 'rgba(255,255,255,0)')
      ice.addColorStop(0.9, 'rgba(255,255,255,0)')
      ice.addColorStop(1, 'rgba(255,255,255,0.4)')
      ctx.fillStyle = ice
      ctx.beginPath()
      ctx.arc(cx, cy, earthPx, 0, 2 * Math.PI)
      ctx.fill()
      ctx.restore()

      // Highlight (specular-like) toward the sun direction (top-left).
      const highlight = ctx.createRadialGradient(
        cx - earthPx * 0.45,
        cy - earthPx * 0.45,
        0,
        cx - earthPx * 0.45,
        cy - earthPx * 0.45,
        earthPx * 0.65,
      )
      highlight.addColorStop(0, 'rgba(255,255,255,0.18)')
      highlight.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.save()
      ctx.beginPath()
      ctx.arc(cx, cy, earthPx, 0, 2 * Math.PI)
      ctx.clip()
      ctx.fillStyle = highlight
      ctx.fillRect(cx - earthPx, cy - earthPx, earthPx * 2, earthPx * 2)
      ctx.restore()

      // Rim line
      ctx.strokeStyle = '#1a4267'
      ctx.lineWidth = 1.2
      ctx.beginPath()
      ctx.arc(cx, cy, earthPx, 0, 2 * Math.PI)
      ctx.stroke()
    }

    // Draw each spacecraft's current orbit (computed live from state vector).
    for (const s of Object.values(spacecraft)) {
      const coe = stateToCoe({ r: s.rEci, v: s.vEci })
      const pts = sampleOrbitXY(coe)
      ctx.beginPath()
      for (let i = 0; i < pts.length; i++) {
        const p = worldToScreen(pts[i][0], pts[i][1], vs, W, H)
        if (i === 0) ctx.moveTo(p.x, p.y)
        else ctx.lineTo(p.x, p.y)
      }
      const isTgt = mission?.targetId === s.id
      const aidx = assetIdxOf(s.id)
      ctx.strokeStyle = sideColor(s.side, isTgt, aidx)
      ctx.globalAlpha = s.id === controllerId ? 0.85 : 0.55
      ctx.lineWidth = s.id === controllerId ? 2 : 1.2
      ctx.stroke()
      ctx.globalAlpha = 1
    }

    // If there's a planned maneuver OR a live preview, draw the predicted
    // post-burn orbit dashed in amber, plus a burn-point marker and a small
    // thrust-direction arrow. Preview takes priority over committed when both
    // exist (the player is mid-edit).
    const previewSource: {
      burnPointEci: [number, number, number]
      projectedElements: COE
      thrustVectorEci: [number, number, number]
      dvMag: number
    } | null = (() => {
      if (plannedManeuverPreview && plannedManeuverPreview.dvMag > 0)
        return {
          burnPointEci: plannedManeuverPreview.burnPointEci,
          projectedElements: plannedManeuverPreview.projectedElements,
          thrustVectorEci: plannedManeuverPreview.thrustVectorEci,
          dvMag: plannedManeuverPreview.dvMag,
        }
      if (mission && plannedManeuver) {
        const ship = spacecraft[plannedManeuver.shipId]
        if (ship) {
          const dtToBurn = Math.max(0, plannedManeuver.burnTimeSec - simTime)
          const svAtBurn = propagateState({ r: ship.rEci, v: ship.vEci }, dtToBurn)
          const burn = burnFromRic(svAtBurn.r, svAtBurn.v, plannedManeuver.dvRic)
          const vAfter = applyImpulseEci(svAtBurn.v, burn)
          const coeAfter = stateToCoe({ r: svAtBurn.r, v: vAfter })
          const dvMag = Math.hypot(...plannedManeuver.dvRic)
          return {
            burnPointEci: svAtBurn.r,
            projectedElements: coeAfter,
            thrustVectorEci: [
              burn.dvEci[0] / (dvMag || 1),
              burn.dvEci[1] / (dvMag || 1),
              burn.dvEci[2] / (dvMag || 1),
            ],
            dvMag,
          }
        }
      }
      return null
    })()

    if (previewSource) {
      const coeAfter = previewSource.projectedElements
      if (Number.isFinite(coeAfter.a) && coeAfter.e < 1) {
        const pts = sampleOrbitXY(coeAfter)
        ctx.save()
        ctx.setLineDash([6, 4])
        ctx.strokeStyle = colors.amber
        ctx.lineWidth = 1.4
        ctx.beginPath()
        for (let i = 0; i < pts.length; i++) {
          const p = worldToScreen(pts[i][0], pts[i][1], vs, W, H)
          if (i === 0) ctx.moveTo(p.x, p.y)
          else ctx.lineTo(p.x, p.y)
        }
        ctx.stroke()
        ctx.restore()
      }
      // Burn-point chevron marker
      const node = worldToScreen(
        previewSource.burnPointEci[0],
        previewSource.burnPointEci[1],
        vs,
        W,
        H,
      )
      ctx.fillStyle = colors.amber
      ctx.beginPath()
      ctx.arc(node.x, node.y, 5, 0, 2 * Math.PI)
      ctx.fill()
      ctx.strokeStyle = colors.amber
      ctx.lineWidth = 1
      ctx.strokeRect(node.x - 8, node.y - 8, 16, 16)

      // Thrust direction arrow in screen space (red, length ~22 px).
      const tvX = previewSource.thrustVectorEci[0]
      const tvY = previewSource.thrustVectorEci[1]
      const tvMag = Math.hypot(tvX, tvY) || 1
      const headX = node.x + (tvX / tvMag) * 22
      const headY = node.y - (tvY / tvMag) * 22
      ctx.strokeStyle = colors.red
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(node.x, node.y)
      ctx.lineTo(headX, headY)
      ctx.stroke()
      // Arrowhead
      const ang = Math.atan2(headY - node.y, headX - node.x)
      ctx.beginPath()
      ctx.moveTo(headX, headY)
      ctx.lineTo(headX - 6 * Math.cos(ang - Math.PI / 6), headY - 6 * Math.sin(ang - Math.PI / 6))
      ctx.lineTo(headX - 6 * Math.cos(ang + Math.PI / 6), headY - 6 * Math.sin(ang + Math.PI / 6))
      ctx.closePath()
      ctx.fillStyle = colors.red
      ctx.fill()
    }

    // Closest-approach markers: compute using sampled orbital positions of player vs target.
    if (mission && spacecraft[mission.playerId] && spacecraft[mission.targetId]) {
      const p = spacecraft[mission.playerId]
      const t = spacecraft[mission.targetId]
      const coeP = stateToCoe({ r: p.rEci, v: p.vEci })
      const coeT = stateToCoe({ r: t.rEci, v: t.vEci })
      const Tp = periodFromA(coeP.a)
      const Tt = periodFromA(coeT.a)
      const horizon = Math.max(Tp, Tt) * 1.2
      const steps = 240
      let minR = Infinity
      let minT = 0
      let minPp: Vec3 = p.rEci
      let minTp: Vec3 = t.rEci
      for (let i = 0; i <= steps; i++) {
        const tau = (i / steps) * horizon
        const sp = propagateState({ r: p.rEci, v: p.vEci }, tau)
        const st = propagateState({ r: t.rEci, v: t.vEci }, tau)
        const r = norm(sub(sp.r, st.r))
        if (r < minR) {
          minR = r
          minT = tau
          minPp = sp.r
          minTp = st.r
        }
      }
      if (minT > 0 && Number.isFinite(minR)) {
        const a = worldToScreen(minPp[0], minPp[1], vs, W, H)
        const b = worldToScreen(minTp[0], minTp[1], vs, W, H)
        ctx.strokeStyle = colors.magenta
        ctx.fillStyle = colors.magenta
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.arc(a.x, a.y, 4, 0, 2 * Math.PI)
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(b.x, b.y, 4, 0, 2 * Math.PI)
        ctx.stroke()
        ctx.save()
        ctx.setLineDash([2, 4])
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.stroke()
        ctx.restore()
        ctx.font = '10px "JetBrains Mono", monospace'
        ctx.fillStyle = colors.magenta
        const mx = (a.x + b.x) / 2
        const my = (a.y + b.y) / 2
        ctx.fillText(`CPA ${(minR / 1000).toFixed(1)} km in ${(minT / 60).toFixed(1)} min`, mx + 8, my)
      }
    }

    // Spacecraft icons + labels + heading arrows
    for (const s of Object.values(spacecraft)) {
      const isTarget = mission?.targetId === s.id
      const aidx = assetIdxOf(s.id)
      const p = worldToScreen(s.rEci[0], s.rEci[1], vs, W, H)
      ctx.fillStyle = sideColor(s.side, isTarget, aidx)
      const iconR = s.id === controllerId ? 6 : 4
      ctx.beginPath()
      ctx.arc(p.x, p.y, iconR, 0, 2 * Math.PI)
      ctx.fill()
      // Active asset gets a ring around its icon
      if (s.id === controllerId && aidx !== null) {
        ctx.strokeStyle = sideColor(s.side, isTarget, aidx)
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.arc(p.x, p.y, iconR + 4, 0, 2 * Math.PI)
        ctx.stroke()
      }
      // Heading arrow
      const vNorm = norm([s.vEci[0], s.vEci[1], 0])
      if (vNorm > 0) {
        const head = {
          x: p.x + (s.vEci[0] / vNorm) * 18,
          y: p.y - (s.vEci[1] / vNorm) * 18,
        }
        ctx.strokeStyle = sideColor(s.side, isTarget, aidx)
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(p.x, p.y)
        ctx.lineTo(head.x, head.y)
        ctx.stroke()
      }
      ctx.font = '11px "JetBrains Mono", monospace'
      ctx.fillStyle = colors.text
      ctx.fillText(s.name, p.x + 8, p.y - 8)
    }

    // Click-snap reticle
    if (clickedNu !== null && mission) {
      const ship = spacecraft[mission.playerId]
      if (ship) {
        const coe = stateToCoe({ r: ship.rEci, v: ship.vEci })
        const sv = coeToState({ ...coe, nu: clickedNu })
        const p = worldToScreen(sv.r[0], sv.r[1], vs, W, H)
        ctx.strokeStyle = colors.amber
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.arc(p.x, p.y, 7, 0, 2 * Math.PI)
        ctx.stroke()
      }
    }

    // Scale bar
    const targetPx = 120
    const worldPerPx = 1 / vs.zoom
    let scaleKm = (targetPx * worldPerPx) / 1000
    // Round to a nice number
    const pow = Math.pow(10, Math.floor(Math.log10(scaleKm)))
    const nice = [1, 2, 5, 10].find((n) => n * pow >= scaleKm) ?? 10
    scaleKm = nice * pow
    const barPx = (scaleKm * 1000) * vs.zoom
    ctx.fillStyle = colors.text
    ctx.font = '10px "JetBrains Mono", monospace'
    ctx.fillText(`${scaleKm} km`, 16, H - 18)
    ctx.strokeStyle = colors.text
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(16, H - 10)
    ctx.lineTo(16 + barPx, H - 10)
    ctx.stroke()
  }, [mission, spacecraft, simTime, plannedManeuver, plannedManeuverPreview, clickedNu])

  // Mouse handlers
  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault()
    const vs = viewRef.current
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const world = screenToWorld(mx, my, vs, rect.width, rect.height)
    const factor = e.deltaY > 0 ? 1 / 1.15 : 1.15
    vs.zoom = Math.max(1e-9, Math.min(1e-3, vs.zoom * factor))
    // Zoom to cursor: adjust center so world point under cursor stays put.
    const newWorld = screenToWorld(mx, my, vs, rect.width, rect.height)
    vs.centerX += world.x - newWorld.x
    vs.centerY += world.y - newWorld.y
    rerender()
  }
  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    dragRef.current = { x: e.clientX, y: e.clientY }
  }
  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragRef.current) return
    const vs = viewRef.current
    const dx = e.clientX - dragRef.current.x
    const dy = e.clientY - dragRef.current.y
    dragRef.current = { x: e.clientX, y: e.clientY }
    vs.centerX -= dx / vs.zoom
    vs.centerY += dy / vs.zoom
    rerender()
  }
  const onMouseUp = () => {
    dragRef.current = null
  }

  // Click on orbit to place node: snap to the nearest nu of the active asset's orbit.
  const onClickCanvas = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mission || readOnly) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const world = screenToWorld(mx, my, viewRef.current, rect.width, rect.height)
    const ship = spacecraft[controllerId]
    if (!ship) return
    const coe = stateToCoe({ r: ship.rEci, v: ship.vEci })
    // Sample nu and find closest point.
    const samples = 360
    let bestNu = coe.nu
    let bestD = Infinity
    for (let i = 0; i < samples; i++) {
      const nu = (i / samples) * 2 * Math.PI
      const sv = coeToState({ ...coe, nu })
      const d = Math.hypot(sv.r[0] - world.x, sv.r[1] - world.y)
      if (d < bestD) {
        bestD = d
        bestNu = nu
      }
    }
    // Convert nu advance to time via mean motion.
    const dNu = (bestNu - coe.nu + 2 * Math.PI) % (2 * Math.PI)
    // Approximate time via eccentric-anomaly mean-anomaly derivation at nu_current.
    // For small e this is fine; for pedagogy we accept a simple approximation:
    const n = meanMotionFromA(coe.a, MU_EARTH)
    const tWait = dNu / n
    setClickedNu(bestNu)
    setBurnOffsetSec(Math.max(5, Math.round(tWait)))
  }

  const planCommit = () => {
    if (!mission) return
    const ship = spacecraft[controllerId]
    if (!ship) return
    const dv = dirRic(dir).map((x) => x * dvMag) as Vec3
    const burnTimeSec = simTime + Math.max(0, burnOffsetSec)
    setPlannedManeuver({ shipId: controllerId, burnTimeSec, dvRic: dv })
    commitLog({
      t: simTime,
      text: `${ship.name}: burn queued ${dirLabel(dir)} ${dvMag.toFixed(1)} m/s in ${Math.round(burnOffsetSec)} s.`,
      tone: 'info',
    })
  }
  const planCancel = () => {
    setPlannedManeuver(null)
    setClickedNu(null)
  }

  let relKm = 0
  let relVMs = 0
  if (mission && spacecraft[controllerId] && spacecraft[mission.targetId]) {
    const p = spacecraft[controllerId]
    const t = spacecraft[mission.targetId]
    relKm = norm(sub(p.rEci, t.rEci)) / 1000
    relVMs = norm(sub(p.vEci, t.vEci))
  }

  return (
    <div className="relative h-full w-full" ref={containerRef}>
      <div
        className="h-full w-full"
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onClick={onClickCanvas}
      >
        <canvas ref={canvasRef} />
      </div>

      <div className="absolute left-3 top-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-mc-dim">
        <span>Map</span>
        <span className="text-mc-cyan">ECI&middot;XY</span>
        <span>rng {relKm.toFixed(2)} km</span>
        <span>|v_rel| {relVMs.toFixed(2)} m/s</span>
      </div>

      {!readOnly && (
      <div className="pointer-events-auto absolute bottom-3 right-3 w-64 border border-mc-cyan/30 bg-panel-fill p-3 text-xs">
        <div className="panel-title mb-2">Plan Maneuver</div>
        <div className="mb-2 grid grid-cols-2 gap-1">
          {(['prograde', 'retrograde', 'radial_out', 'radial_in', 'normal', 'anti_normal'] as DirId[]).map(
            (d) => (
              <button
                key={d}
                className={`btn !py-1 !text-[10px] ${dir === d ? '!bg-mc-cyan/20 !ring-1 !ring-mc-cyan' : ''}`}
                onClick={() => setDir(d)}
              >
                {dirLabel(d)}
              </button>
            ),
          )}
        </div>
        <label className="mb-1 flex items-center justify-between">
          <span className="text-mc-dim">&Delta;v (m/s)</span>
          <input
            type="number"
            value={dvMag}
            min={0}
            step={0.5}
            className="w-16 border border-mc-cyan/30 bg-transparent px-1 text-right font-mono text-mc-text"
            onChange={(e) => setDvMag(Math.max(0, Number(e.target.value)))}
          />
        </label>
        <label className="mb-2 flex items-center justify-between">
          <span className="text-mc-dim">Burn in (s)</span>
          <input
            type="number"
            value={burnOffsetSec}
            min={0}
            step={5}
            className="w-16 border border-mc-cyan/30 bg-transparent px-1 text-right font-mono text-mc-text"
            onChange={(e) => setBurnOffsetSec(Math.max(0, Number(e.target.value)))}
          />
        </label>
        <div className="mb-2 text-[10px] text-mc-dim">Click an orbit point to set burn time.</div>
        <div className="flex gap-1">
          <button className="btn flex-1 !py-1 !text-[10px]" onClick={planCommit}>Commit</button>
          <button className="btn flex-1 !py-1 !text-[10px]" onClick={planCancel}>Cancel</button>
        </div>
      </div>
      )}
    </div>
  )
}

