// ProxView — target-centered RIC proximity view.
// Axes: +V-bar right (along target velocity), +R-bar up (radial outward).
// Z (cross-track) is not drawn; it's a 2D projection onto the V-R plane.
import { useEffect, useRef, useState } from 'react'
import { useGame } from '../game/state'
import { computeManeuverPreview } from '../game/maneuver-preview'
import { colors } from '../theme/colors'
import { MU_EARTH } from '../physics/constants'
import { meanMotionFromA, stateToCoe } from '../physics/orbital-elements'
import { cwPropagate } from '../physics/cw'
import { relativePosInRic, relativeVelInRic } from '../physics/frames'
import { norm, type Vec3 } from '../physics/vec'

interface ViewState {
  // Half-extent of view in meters (±halfExtent along each axis)
  halfExtent: number
}

// Convert RIC (x=R, y=V) to screen. V-bar horizontal right, R-bar vertical up.
const ricToScreen = (
  rRic: number,
  vRic: number,
  w: number,
  h: number,
  halfExtent: number,
) => {
  const px = w / 2 + (vRic / halfExtent) * (w / 2) * 0.92
  const py = h / 2 - (rRic / halfExtent) * (h / 2) * 0.92
  return { x: px, y: py }
}

type RicDir = 'R+' | 'R-' | 'V+' | 'V-' | 'H+' | 'H-'
const dvFromRicDir = (d: RicDir, mag: number): Vec3 => {
  switch (d) {
    case 'R+':
      return [mag, 0, 0]
    case 'R-':
      return [-mag, 0, 0]
    case 'V+':
      return [0, mag, 0]
    case 'V-':
      return [0, -mag, 0]
    case 'H+':
      return [0, 0, mag]
    case 'H-':
      return [0, 0, -mag]
  }
}
const dirNice = (d: RicDir): string =>
  ({
    'R+': '+R-bar (radial out)',
    'R-': '-R-bar (radial in)',
    'V+': '+V-bar (prograde)',
    'V-': '-V-bar (retrograde)',
    'H+': '+H (cross-track)',
    'H-': '-H (anti-cross-track)',
  }[d])

const MAX_HISTORY = 300

export default function ProxView() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const historyRef = useRef<{ t: number; rRic: [number, number]; vRic: [number, number] }[]>([])
  const viewRef = useRef<ViewState>({ halfExtent: 50_000 })
  const [, setVer] = useState(0)

  const mission = useGame((s) => s.mission)
  const spacecraft = useGame((s) => s.spacecraft)
  const simTime = useGame((s) => s.simTimeSec)
  const plannedManeuver = useGame((s) => s.plannedManeuver)
  const setPlannedManeuver = useGame((s) => s.setPlannedManeuver)
  const plannedManeuverPreview = useGame((s) => s.plannedManeuverPreview)
  const pushLog = useGame((s) => s.pushLog)
  const mode = useGame((s) => s.mode)
  const activeAssetId = useGame((s) => s.activeAssetId)
  const readOnly = mode === 'watch'
  const controllerId = activeAssetId ?? mission?.playerId ?? ''
  const [dir, setDir] = useState<RicDir>('V-')
  const [dvMag, setDvMag] = useState(0.5)
  const [burnOffsetSec, setBurnOffsetSec] = useState(10)
  const setPlannedManeuverPreview = useGame((s) => s.setPlannedManeuverPreview)

  // v1.3 — live maneuver preview from the RIC impulse panel.
  useEffect(() => {
    if (!mission || readOnly) {
      setPlannedManeuverPreview(null)
      return
    }
    if (dvMag <= 0) {
      setPlannedManeuverPreview(null)
      return
    }
    const dv = dvFromRicDir(dir, dvMag)
    const state = useGame.getState()
    const preview = computeManeuverPreview(state, controllerId, dv, burnOffsetSec)
    setPlannedManeuverPreview(preview)
  }, [mission, readOnly, dir, dvMag, burnOffsetSec, controllerId, setPlannedManeuverPreview])

  useEffect(() => {
    return () => setPlannedManeuverPreview(null)
  }, [setPlannedManeuverPreview])

  // Reset history on mission change.
  useEffect(() => {
    historyRef.current = []
    viewRef.current.halfExtent = 50_000
  }, [mission?.id])

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container || !mission) return
    const target = spacecraft[mission.targetId]
    const chaser = spacecraft[controllerId]
    if (!target || !chaser) return

    // Push a sample of chaser in target RIC.
    const rRic = relativePosInRic(chaser.rEci, target.rEci, target.vEci)
    const vRic = relativeVelInRic(chaser.rEci, chaser.vEci, target.rEci, target.vEci)
    const hist = historyRef.current
    const last = hist.at(-1)
    if (!last || simTime - last.t > 1.0) {
      hist.push({
        t: simTime,
        rRic: [rRic[0], rRic[1]],
        vRic: [vRic[0], vRic[1]],
      })
      if (hist.length > MAX_HISTORY) hist.shift()
    }

    // Adaptive extent: keep the chaser + a margin visible.
    const rMag = norm(rRic)
    const desired = Math.max(rMag * 1.4, 1_000) // at least 1 km window
    const prev = viewRef.current.halfExtent
    // Smooth toward desired (10% per frame)
    viewRef.current.halfExtent = prev + (desired - prev) * 0.1

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
    const he = viewRef.current.halfExtent

    // Background
    ctx.fillStyle = colors.bg
    ctx.fillRect(0, 0, W, H)

    // Grid: pick a nice step
    const stepKmCandidates = [0.1, 0.5, 1, 2, 5, 10, 20, 50, 100, 200]
    const targetPx = 80
    const stepM = (() => {
      for (const k of stepKmCandidates) {
        const m = k * 1000
        const px = (m / he) * (W / 2) * 0.92
        if (px >= targetPx) return m
      }
      return 100_000
    })()
    ctx.strokeStyle = colors.gridStrong
    ctx.lineWidth = 1
    const nGrid = Math.ceil(he / stepM) + 1
    for (let i = -nGrid; i <= nGrid; i++) {
      const v = i * stepM
      const a = ricToScreen(0, v, W, H, he)
      const b = ricToScreen(v, 0, W, H, he)
      ctx.beginPath()
      ctx.moveTo(a.x, 0)
      ctx.lineTo(a.x, H)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, b.y)
      ctx.lineTo(W, b.y)
      ctx.stroke()
    }
    // Origin axes highlight
    ctx.strokeStyle = colors.dim
    ctx.lineWidth = 1
    const origin = ricToScreen(0, 0, W, H, he)
    ctx.beginPath()
    ctx.moveTo(0, origin.y)
    ctx.lineTo(W, origin.y)
    ctx.moveTo(origin.x, 0)
    ctx.lineTo(origin.x, H)
    ctx.stroke()

    // Axis labels
    ctx.fillStyle = colors.dim
    ctx.font = '10px "JetBrains Mono", monospace'
    ctx.fillText('+V-bar (in-track)', W - 130, origin.y - 6)
    ctx.fillText('+R-bar (out)', origin.x + 8, 12)
    ctx.fillText('-V-bar', 8, origin.y - 6)
    ctx.fillText('-R-bar (toward Earth)', origin.x + 8, H - 6)

    // Approach corridors: ±10° cones from +V-bar and +R-bar
    const coneDeg = 10
    const coneRad = (coneDeg * Math.PI) / 180
    const corridorRadius = he * 0.9
    // +V-bar corridor (right)
    ctx.fillStyle = 'rgba(0, 212, 255, 0.06)'
    ctx.beginPath()
    ctx.moveTo(origin.x, origin.y)
    const p1 = {
      x: origin.x + Math.cos(coneRad) * (corridorRadius / he) * (W / 2) * 0.92,
      y: origin.y - Math.sin(coneRad) * (corridorRadius / he) * (W / 2) * 0.92,
    }
    const p2 = {
      x: origin.x + Math.cos(-coneRad) * (corridorRadius / he) * (W / 2) * 0.92,
      y: origin.y - Math.sin(-coneRad) * (corridorRadius / he) * (W / 2) * 0.92,
    }
    ctx.lineTo(p1.x, p1.y)
    ctx.lineTo(p2.x, p2.y)
    ctx.closePath()
    ctx.fill()
    // -V-bar corridor
    ctx.beginPath()
    ctx.moveTo(origin.x, origin.y)
    const p3 = {
      x: origin.x - Math.cos(coneRad) * (corridorRadius / he) * (W / 2) * 0.92,
      y: origin.y - Math.sin(coneRad) * (corridorRadius / he) * (W / 2) * 0.92,
    }
    const p4 = {
      x: origin.x - Math.cos(-coneRad) * (corridorRadius / he) * (W / 2) * 0.92,
      y: origin.y - Math.sin(-coneRad) * (corridorRadius / he) * (W / 2) * 0.92,
    }
    ctx.lineTo(p3.x, p3.y)
    ctx.lineTo(p4.x, p4.y)
    ctx.closePath()
    ctx.fill()

    // Scale label
    ctx.fillStyle = colors.dim
    ctx.font = '10px "JetBrains Mono", monospace'
    const stepLabel = stepM >= 1000 ? `${stepM / 1000} km` : `${stepM} m`
    ctx.fillText(`grid: ${stepLabel}`, 8, H - 8)

    // Target at origin
    ctx.fillStyle = colors.amber
    ctx.beginPath()
    ctx.arc(origin.x, origin.y, 5, 0, 2 * Math.PI)
    ctx.fill()
    ctx.strokeStyle = colors.amber
    ctx.strokeRect(origin.x - 9, origin.y - 9, 18, 18)
    ctx.fillStyle = colors.text
    ctx.fillText(target.name, origin.x + 12, origin.y - 10)

    // Past trajectory (solid)
    ctx.strokeStyle = colors.cyan
    ctx.lineWidth = 1.2
    ctx.beginPath()
    for (let i = 0; i < hist.length; i++) {
      const h0 = hist[i]
      const p = ricToScreen(h0.rRic[0], h0.rRic[1], W, H, he)
      if (i === 0) ctx.moveTo(p.x, p.y)
      else ctx.lineTo(p.x, p.y)
    }
    ctx.stroke()

    // Future predicted trajectory via CW propagation (dashed)
    const tCoe = stateToCoe({ r: target.rEci, v: target.vEci }, MU_EARTH)
    const n = meanMotionFromA(tCoe.a, MU_EARTH)
    const r0: Vec3 = [rRic[0], rRic[1], rRic[2]]
    const v0: Vec3 = [vRic[0], vRic[1], vRic[2]]
    const horizonSec = Math.min(
      Math.max(600, ((2 * Math.PI) / n) * 0.5),
      ((2 * Math.PI) / n) * 0.9,
    )
    const futureSteps = 80
    ctx.save()
    ctx.setLineDash([4, 4])
    ctx.strokeStyle = colors.cyanDim
    ctx.beginPath()
    for (let i = 0; i <= futureSteps; i++) {
      const tau = (i / futureSteps) * horizonSec
      const s = cwPropagate({ r: r0, v: v0 }, n, tau)
      const p = ricToScreen(s.r[0], s.r[1], W, H, he)
      if (i === 0) ctx.moveTo(p.x, p.y)
      else ctx.lineTo(p.x, p.y)
    }
    ctx.stroke()
    ctx.restore()

    // Preview planned RIC burn effect: the live preview (player-adjusted)
    // takes priority over the committed plannedManeuver, so they see the new
    // trajectory the moment they touch the panel.
    const burnSpec: { dt: number; dvRic: Vec3 } | null = plannedManeuverPreview
      ? {
          dt: plannedManeuverPreview.burnOffsetSec,
          dvRic: plannedManeuverPreview.dvRic,
        }
      : plannedManeuver
        ? {
            dt: Math.max(0, plannedManeuver.burnTimeSec - simTime),
            dvRic: plannedManeuver.dvRic,
          }
        : null
    if (burnSpec && (burnSpec.dvRic[0] !== 0 || burnSpec.dvRic[1] !== 0 || burnSpec.dvRic[2] !== 0)) {
      const dt = burnSpec.dt
      if (dt <= horizonSec) {
        const sAtBurn = cwPropagate({ r: r0, v: v0 }, n, dt)
        const burn = burnSpec.dvRic
        const postR = sAtBurn.r
        const postV: Vec3 = [
          sAtBurn.v[0] + burn[0],
          sAtBurn.v[1] + burn[1],
          sAtBurn.v[2] + burn[2],
        ]
        // Halo pass (semitransparent amber glow under the dashed line).
        ctx.save()
        ctx.strokeStyle = 'rgba(255, 184, 0, 0.25)'
        ctx.lineWidth = 6
        ctx.beginPath()
        for (let i = 0; i <= futureSteps; i++) {
          const tau = (i / futureSteps) * horizonSec
          const s = cwPropagate({ r: postR, v: postV }, n, tau)
          const p = ricToScreen(s.r[0], s.r[1], W, H, he)
          if (i === 0) ctx.moveTo(p.x, p.y)
          else ctx.lineTo(p.x, p.y)
        }
        ctx.stroke()
        // Main dashed trajectory.
        ctx.setLineDash([8, 5])
        ctx.strokeStyle = colors.amber
        ctx.lineWidth = 2.2
        ctx.beginPath()
        for (let i = 0; i <= futureSteps; i++) {
          const tau = (i / futureSteps) * horizonSec
          const s = cwPropagate({ r: postR, v: postV }, n, tau)
          const p = ricToScreen(s.r[0], s.r[1], W, H, he)
          if (i === 0) ctx.moveTo(p.x, p.y)
          else ctx.lineTo(p.x, p.y)
        }
        ctx.stroke()
        ctx.restore()
        const nodePx = ricToScreen(sAtBurn.r[0], sAtBurn.r[1], W, H, he)
        ctx.fillStyle = colors.amber
        ctx.beginPath()
        ctx.arc(nodePx.x, nodePx.y, 4, 0, 2 * Math.PI)
        ctx.fill()
      }
    }

    // Chaser marker at current position
    const chaserPx = ricToScreen(rRic[0], rRic[1], W, H, he)
    ctx.fillStyle = colors.cyan
    ctx.beginPath()
    ctx.arc(chaserPx.x, chaserPx.y, 5, 0, 2 * Math.PI)
    ctx.fill()
    // Velocity arrow
    const vScreen = {
      x: (vRic[1] / Math.max(0.5, Math.sqrt(vRic[0] ** 2 + vRic[1] ** 2))) * 18,
      y: -(vRic[0] / Math.max(0.5, Math.sqrt(vRic[0] ** 2 + vRic[1] ** 2))) * 18,
    }
    ctx.strokeStyle = colors.cyan
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(chaserPx.x, chaserPx.y)
    ctx.lineTo(chaserPx.x + vScreen.x, chaserPx.y + vScreen.y)
    ctx.stroke()
    ctx.fillStyle = colors.text
    ctx.fillText(chaser.name, chaserPx.x + 8, chaserPx.y - 8)

    setVer((v) => v + 1)
  }, [mission, spacecraft, simTime, plannedManeuver, plannedManeuverPreview])

  const commitPlannedManeuver = useGame((s) => s.commitPlannedManeuver)
  const commit = () => {
    if (!mission || dvMag <= 0) return
    commitPlannedManeuver()
  }
  const cancel = () => {
    setPlannedManeuver(null)
    setPlannedManeuverPreview(null)
    setDvMag(0)
  }
  // keep these bound so they are exercised in callbacks elsewhere
  void pushLog
  void dvFromRicDir
  void dirNice
  void simTime
  void controllerId
  void burnOffsetSec

  // Short readout overlay
  let rangeKm = 0
  let rangeRateMs = 0
  if (mission) {
    const target = spacecraft[mission.targetId]
    const chaser = spacecraft[controllerId]
    if (target && chaser) {
      const rRic = relativePosInRic(chaser.rEci, target.rEci, target.vEci)
      const vRic = relativeVelInRic(chaser.rEci, chaser.vEci, target.rEci, target.vEci)
      rangeKm = norm(rRic) / 1000
      const rn = norm(rRic) || 1
      rangeRateMs = -(rRic[0] * vRic[0] + rRic[1] * vRic[1] + rRic[2] * vRic[2]) / rn
    }
  }

  return (
    <div className="relative h-full w-full" ref={containerRef}>
      <canvas ref={canvasRef} />
      <div className="absolute left-3 top-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-mc-dim">
        <span>Prox</span>
        <span className="text-mc-cyan">RIC &middot; target-centered</span>
        <span>rng {rangeKm.toFixed(3)} km</span>
        <span>rate {rangeRateMs > 0 ? '+' : ''}{rangeRateMs.toFixed(2)} m/s</span>
      </div>
      {!readOnly && (
      <div className="pointer-events-auto absolute bottom-3 right-3 w-72 border border-mc-cyan/30 bg-panel-fill p-3 text-xs">
        <div className="mb-2 flex items-center justify-between">
          <div className="panel-title">RIC Impulse</div>
          {plannedManeuverPreview && dvMag > 0 && (
            <span className="chip border-mc-amber/60 text-mc-amber">PREVIEW</span>
          )}
        </div>
        <div className="mb-2 grid grid-cols-3 gap-1">
          {(['V+', 'V-', 'R+', 'R-', 'H+', 'H-'] as RicDir[]).map((d) => (
            <button
              key={d}
              className={`btn !py-1 !text-[10px] ${dir === d ? '!bg-mc-cyan/20 !ring-1 !ring-mc-cyan' : ''}`}
              onClick={() => setDir(d)}
            >
              {d}
            </button>
          ))}
        </div>
        <label className="mb-1 flex items-center justify-between">
          <span className="text-mc-dim">&Delta;v (m/s)</span>
          <input
            type="number"
            value={dvMag}
            min={0}
            step={0.1}
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
            step={1}
            className="w-16 border border-mc-cyan/30 bg-transparent px-1 text-right font-mono text-mc-text"
            onChange={(e) => setBurnOffsetSec(Math.max(0, Number(e.target.value)))}
          />
        </label>

        {plannedManeuverPreview && dvMag > 0 ? (
          <div className="mb-2 border border-mc-amber/40 bg-mc-amber/5 p-2 font-mono text-[10px]">
            <div className="mb-1 text-mc-amber">Projected effect</div>
            <div className="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-0.5">
              <span className="text-mc-dim">Δv used</span>
              <span className="text-mc-text">{plannedManeuverPreview.dvMag.toFixed(2)} m/s</span>
              {plannedManeuverPreview.costYears > 0 && (
                <>
                  <span className="text-mc-dim">Life cost</span>
                  <span className="text-mc-red">
                    -{(plannedManeuverPreview.costYears * 12).toFixed(1)} mo
                  </span>
                </>
              )}
            </div>
            <div className="mt-1 text-[10px] text-mc-dim">
              Watch the dashed amber trajectory in this view.
            </div>
          </div>
        ) : (
          <div className="mb-2 text-[10px] text-mc-dim">
            Adjust Δv to preview the post-burn trajectory.
          </div>
        )}

        <div className="flex gap-1">
          <button
            className="btn btn-warn flex-1 !py-1 !text-[10px]"
            onClick={commit}
            disabled={dvMag <= 0}
          >
            Commit Maneuver
          </button>
          <button className="btn flex-1 !py-1 !text-[10px]" onClick={cancel}>
            Cancel
          </button>
        </div>
      </div>
      )}
    </div>
  )
}
