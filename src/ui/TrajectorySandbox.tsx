// Trajectory Sandbox screen. Cadets pick one of three foundational RPO
// trajectory families (perch / linear drift / NMC) and adjust a single
// parameter. The sandbox renders the resulting chaser trajectory in the RIC
// frame and displays the CW-computed delta-V required to enter and exit.
import { useEffect, useMemo, useRef, useState } from 'react'
import { useGame } from '../game/state'
import {
  computeTrajectory,
  familyDefaultParams,
  familyLabel,
  familyTeachingCard,
  SANDBOX_PERIOD,
} from '../sandbox/trajectories'
import type { TrajectoryFamily, TrajectoryParams } from '../sandbox/types'
import { colors } from '../theme/colors'
import Panel from './components/Panel'
import Button from './components/Button'

const FAMILIES: TrajectoryFamily[] = ['perch', 'linear_drift', 'nmc']

export default function TrajectorySandbox() {
  const setScreen = useGame((s) => s.setScreen)
  const [family, setFamily] = useState<TrajectoryFamily>('linear_drift')
  const [params, setParams] = useState<TrajectoryParams>(familyDefaultParams('linear_drift'))
  const [playing, setPlaying] = useState(false)
  const [tNow, setTNow] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const result = useMemo(() => computeTrajectory(family, params), [family, params])
  const card = useMemo(() => familyTeachingCard(family), [family])
  const lastFrameRef = useRef<number | null>(null)

  // Reset parameters and clock when family changes.
  useEffect(() => {
    setParams(familyDefaultParams(family))
    setTNow(0)
  }, [family])

  // Playback ticker (real-time, 4x speed by default so a full period takes ~1.4 min).
  useEffect(() => {
    if (!playing) {
      lastFrameRef.current = null
      return
    }
    let raf = 0
    const tick = (now: number) => {
      const prev = lastFrameRef.current ?? now
      lastFrameRef.current = now
      const realDt = Math.min(0.1, (now - prev) / 1000)
      setTNow((t) => (t + realDt * 60) % SANDBOX_PERIOD) // sim factor 60x
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing])

  // Canvas draw.
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

    // Background
    ctx.fillStyle = colors.bg
    ctx.fillRect(0, 0, W, H)

    // Adaptive extent: fit bounding box of trajectory + 25%.
    let maxAbsR = 0
    let maxAbsV = 0
    for (const s of result.samples) {
      maxAbsR = Math.max(maxAbsR, Math.abs(s.r))
      maxAbsV = Math.max(maxAbsV, Math.abs(s.v))
    }
    const ext = Math.max(maxAbsR, maxAbsV, 1000) * 1.25
    const scale = Math.min(W, H) / (2 * ext) * 0.85

    // RIC plot mapping: V-bar (y_RIC) -> +X screen; R-bar (x_RIC) -> -Y screen (up).
    const toScreen = (rRic: number, vRic: number): { x: number; y: number } => ({
      x: W / 2 + vRic * scale,
      y: H / 2 - rRic * scale,
    })

    // Grid: 1 km lines, with stronger every 5 km.
    ctx.lineWidth = 1
    const stepM = ext > 20_000 ? 5_000 : 1_000
    ctx.strokeStyle = colors.gridStrong
    for (let v = -ext; v <= ext; v += stepM) {
      const p = toScreen(0, v)
      ctx.beginPath()
      ctx.moveTo(p.x, 0)
      ctx.lineTo(p.x, H)
      ctx.stroke()
      const q = toScreen(v, 0)
      ctx.beginPath()
      ctx.moveTo(0, q.y)
      ctx.lineTo(W, q.y)
      ctx.stroke()
    }

    // Axes
    ctx.strokeStyle = colors.dim
    ctx.lineWidth = 1.2
    ctx.beginPath()
    ctx.moveTo(0, H / 2)
    ctx.lineTo(W, H / 2)
    ctx.moveTo(W / 2, 0)
    ctx.lineTo(W / 2, H)
    ctx.stroke()
    ctx.fillStyle = colors.dim
    ctx.font = '11px "JetBrains Mono", monospace'
    ctx.fillText('+V-bar (in-track) →', W - 150, H / 2 - 8)
    ctx.fillText('+R-bar (out)', W / 2 + 8, 14)
    ctx.fillText('-R-bar (Earth)', W / 2 + 8, H - 8)
    ctx.fillText(`grid: ${stepM >= 1000 ? stepM / 1000 + ' km' : stepM + ' m'}`, 8, H - 8)

    // Target marker at origin
    const o = toScreen(0, 0)
    ctx.fillStyle = colors.amber
    ctx.beginPath()
    ctx.arc(o.x, o.y, 5, 0, 2 * Math.PI)
    ctx.fill()
    ctx.strokeStyle = colors.amber
    ctx.strokeRect(o.x - 8, o.y - 8, 16, 16)
    ctx.fillText('Target', o.x + 12, o.y - 8)

    // Chaser trajectory
    ctx.strokeStyle = colors.cyan
    ctx.lineWidth = 1.5
    ctx.beginPath()
    result.samples.forEach((s, i) => {
      const p = toScreen(s.r, s.v)
      if (i === 0) ctx.moveTo(p.x, p.y)
      else ctx.lineTo(p.x, p.y)
    })
    ctx.stroke()

    // Current position dot (if playing)
    const idx = Math.floor((tNow / SANDBOX_PERIOD) * result.samples.length) % result.samples.length
    const cur = result.samples[idx]
    if (cur) {
      const p = toScreen(cur.r, cur.v)
      ctx.fillStyle = colors.cyan
      ctx.beginPath()
      ctx.arc(p.x, p.y, 5, 0, 2 * Math.PI)
      ctx.fill()
    }
  }, [result, tNow])

  return (
    <div className="flex h-full w-full flex-col">
      <header className="flex items-center justify-between border-b border-mc-cyan/20 bg-panel-fill px-4 py-2">
        <div className="flex items-center gap-4">
          <span className="chip border-mc-amber/60 text-mc-amber">Trajectory Sandbox</span>
          <span className="font-mono text-sm text-mc-text">{familyLabel(family)}</span>
        </div>
        <Button onClick={() => setScreen('menu')}>✕ Close</Button>
      </header>
      <div className="flex min-h-0 flex-1">
        <div className="relative flex-[7] border-r border-mc-cyan/20" ref={containerRef}>
          <canvas ref={canvasRef} className="absolute inset-0" />
        </div>
        <aside className="flex w-[360px] flex-col gap-2 bg-panel-fill p-2">
          <Panel title="Trajectory Family">
            <div className="flex flex-col gap-1 p-2">
              {FAMILIES.map((f) => (
                <button
                  key={f}
                  onClick={() => setFamily(f)}
                  className={`flex items-center gap-2 border px-3 py-2 text-left font-mono text-[11px] transition-colors ${
                    family === f
                      ? 'border-mc-cyan bg-mc-cyan/10 text-mc-cyan'
                      : 'border-mc-cyan/20 text-mc-text hover:bg-mc-cyan/5'
                  }`}
                >
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${
                      family === f ? 'bg-mc-cyan' : 'bg-mc-dim'
                    }`}
                  />
                  {familyLabel(f)}
                </button>
              ))}
            </div>
          </Panel>

          <Panel title="Parameters">
            <div className="flex flex-col gap-3 p-3 text-xs">
              {family === 'perch' && (
                <label className="flex flex-col gap-1">
                  <span className="flex items-baseline justify-between">
                    <span className="text-mc-dim">V-bar offset</span>
                    <span className="font-mono text-mc-cyan">
                      {(params.vbarOffsetM / 1000).toFixed(1)} km
                    </span>
                  </span>
                  <input
                    type="range"
                    min={-50_000}
                    max={50_000}
                    step={500}
                    value={params.vbarOffsetM}
                    onChange={(e) =>
                      setParams((p) => ({ ...p, vbarOffsetM: Number(e.target.value) }))
                    }
                    className="w-full accent-mc-cyan"
                  />
                </label>
              )}
              {family === 'linear_drift' && (
                <label className="flex flex-col gap-1">
                  <span className="flex items-baseline justify-between">
                    <span className="text-mc-dim">R-bar offset</span>
                    <span className="font-mono text-mc-cyan">
                      {(params.radialOffsetM / 1000).toFixed(2)} km
                    </span>
                  </span>
                  <input
                    type="range"
                    min={-10_000}
                    max={10_000}
                    step={100}
                    value={params.radialOffsetM}
                    onChange={(e) =>
                      setParams((p) => ({ ...p, radialOffsetM: Number(e.target.value) }))
                    }
                    className="w-full accent-mc-cyan"
                  />
                </label>
              )}
              {family === 'nmc' && (
                <label className="flex flex-col gap-1">
                  <span className="flex items-baseline justify-between">
                    <span className="text-mc-dim">R-bar amplitude</span>
                    <span className="font-mono text-mc-cyan">
                      {(params.nmcAmplitudeM / 1000).toFixed(1)} km
                    </span>
                  </span>
                  <input
                    type="range"
                    min={1_000}
                    max={20_000}
                    step={250}
                    value={params.nmcAmplitudeM}
                    onChange={(e) =>
                      setParams((p) => ({ ...p, nmcAmplitudeM: Number(e.target.value) }))
                    }
                    className="w-full accent-mc-cyan"
                  />
                </label>
              )}
              <div className="mt-2 flex gap-1">
                <Button onClick={() => setPlaying((p) => !p)} className="flex-1 !text-[10px]">
                  {playing ? '❚❚ Pause' : '▶ Play'}
                </Button>
                <Button onClick={() => setTNow(0)} className="flex-1 !text-[10px]">
                  ↺ Reset
                </Button>
              </div>
            </div>
          </Panel>

          <Panel title="Computed">
            <div className="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-0.5 p-3 font-mono text-[11px]">
              <span className="text-mc-dim">Δv to insert</span>
              <span className="text-mc-amber">{result.insertionDvMs.toFixed(3)} m/s</span>
              <span className="text-mc-dim">Δv to exit</span>
              <span className="text-mc-amber">{result.exitDvMs.toFixed(3)} m/s</span>
              {family === 'linear_drift' && (
                <>
                  <span className="text-mc-dim">Drift rate</span>
                  <span className="text-mc-text">
                    {((result.driftRateMs * 60) / 1000).toFixed(3)} km/min
                  </span>
                </>
              )}
              <span className="text-mc-dim">Min range</span>
              <span className="text-mc-text">
                {(result.minRangeM / 1000).toFixed(2)} km
              </span>
              <span className="text-mc-dim">Period</span>
              <span className="text-mc-text">{(result.periodSec / 60).toFixed(1)} min</span>
            </div>
          </Panel>

          <Panel title={card.title}>
            <div className="space-y-2 p-3 text-xs leading-relaxed text-mc-text">
              <div>{card.body}</div>
              <div className="border border-mc-amber/40 bg-mc-amber/5 p-2 font-mono text-[10px] text-mc-amber">
                Real-world use: {card.realWorld}
              </div>
              <div className="text-[10px] text-mc-dim">Source: {card.citation}</div>
            </div>
          </Panel>
        </aside>
      </div>
    </div>
  )
}
