import { useEffect, useRef } from 'react'
import { useGame } from '../game/state'
import { missionsById } from '../missions'
import { colors } from '../theme/colors'
import Button from './components/Button'
import Panel from './components/Panel'
import CoachButton from './CoachButton'
import { COACH_ENABLED } from '../config/features'

export default function Debrief() {
  const debrief = useGame((s) => s.debrief)
  const setScreen = useGame((s) => s.setScreen)
  const resetRun = useGame((s) => s.resetRun)
  const loadMission = useGame((s) => s.loadMission)
  const setPaused = useGame((s) => s.setPaused)
  const mission = useGame((s) => s.mission)
  const mode = useGame((s) => s.mode)
  const vignette = useGame((s) => s.vignette)
  const conceptsObserved = useGame((s) => s.conceptsObserved)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const isWatch = mode === 'watch'

  useEffect(() => {
    if (!debrief) return
    const canvas = canvasRef.current
    if (!canvas) return
    const parent = canvas.parentElement
    if (!parent) return
    const dpr = window.devicePixelRatio || 1
    const w = parent.clientWidth
    const h = 180
    canvas.width = w * dpr
    canvas.height = h * dpr
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.resetTransform()
    ctx.scale(dpr, dpr)
    ctx.fillStyle = colors.bg
    ctx.fillRect(0, 0, w, h)
    // Axes
    ctx.strokeStyle = colors.dim
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(40, 10)
    ctx.lineTo(40, h - 30)
    ctx.lineTo(w - 10, h - 30)
    ctx.stroke()
    ctx.fillStyle = colors.dim
    ctx.font = '10px "JetBrains Mono", monospace'
    ctx.fillText('range (km)', 10, 12)

    const samples = debrief.rangeSamples
    if (samples.length >= 2) {
      const tMax = samples[samples.length - 1].t || 1
      const rMax = Math.max(...samples.map((s) => s.range), 1)
      const toX = (t: number) => 40 + ((w - 50) * t) / tMax
      const toY = (r: number) => h - 30 - ((h - 40) * r) / rMax
      ctx.strokeStyle = colors.cyan
      ctx.lineWidth = 1.2
      ctx.beginPath()
      for (let i = 0; i < samples.length; i++) {
        const p = { x: toX(samples[i].t), y: toY(samples[i].range) }
        if (i === 0) ctx.moveTo(p.x, p.y)
        else ctx.lineTo(p.x, p.y)
      }
      ctx.stroke()

      // Attribution overlay (scaled 0..100)
      ctx.strokeStyle = colors.amber
      ctx.lineWidth = 1
      ctx.beginPath()
      const aMax = 100
      for (let i = 0; i < debrief.attributionSamples.length; i++) {
        const a = debrief.attributionSamples[i]
        const p = { x: toX(a.t), y: h - 30 - ((h - 40) * a.attribution) / aMax }
        if (i === 0) ctx.moveTo(p.x, p.y)
        else ctx.lineTo(p.x, p.y)
      }
      ctx.stroke()

      // Link status strip
      const stripY = h - 24
      for (let i = 0; i < debrief.linkSamples.length; i++) {
        const l = debrief.linkSamples[i]
        const nextT = debrief.linkSamples[i + 1]?.t ?? tMax
        const x0 = toX(l.t)
        const x1 = toX(nextT)
        ctx.fillStyle =
          l.status === 'nominal' ? colors.green : l.status === 'degraded' ? colors.amber : colors.red
        ctx.fillRect(x0, stripY, Math.max(1, x1 - x0), 6)
      }
    }

    // Axis labels
    ctx.fillStyle = colors.dim
    ctx.fillText('t', w - 20, h - 15)
  }, [debrief])

  if (!debrief) return null

  const restart = () => {
    resetRun()
  }
  const nextMission = () => {
    if (!mission) return
    const allIds = ['m1_first_light', 'm2_quiet_inspector', 'm3_contested_approach']
    const idx = allIds.indexOf(mission.id)
    if (idx >= 0 && idx < allIds.length - 1) {
      const nxt = missionsById[allIds[idx + 1]]
      if (nxt) {
        loadMission(nxt)
        setScreen('brief')
        setPaused(true)
      }
    } else {
      setScreen('menu')
    }
  }

  const good = debrief.status === 'success'

  return (
    <div className="mx-auto flex h-full w-full max-w-5xl flex-col gap-4 overflow-y-auto p-6">
      <header className="flex items-baseline justify-between">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-mc-dim">
            {isWatch ? 'Watch debrief' : 'Debrief'}
          </div>
          <div className="text-3xl text-mc-cyan">{debrief.missionName}</div>
          {isWatch && vignette && (
            <div className="mt-1 font-mono text-xs text-mc-amber">{vignette.subtitle}</div>
          )}
        </div>
        <div
          className={`font-mono text-lg uppercase tracking-[0.3em] ${
            isWatch ? 'text-mc-amber' : good ? 'text-mc-green' : 'text-mc-red'
          }`}
        >
          {isWatch ? 'COMPLETE' : debrief.status}
        </div>
      </header>

      {isWatch && vignette && (
        <Panel title="Outro">
          <div className="space-y-2 p-4 text-sm leading-relaxed text-mc-text">
            <div className="font-mono text-lg text-mc-cyan">{vignette.outro.title}</div>
            <div>{vignette.outro.body}</div>
            {vignette.outro.citation && (
              <div className="text-[10px] text-mc-dim">Source: {vignette.outro.citation}</div>
            )}
          </div>
        </Panel>
      )}

      {isWatch && vignette && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Panel title="Learning objectives">
            <ul className="list-inside list-disc space-y-1 p-3 text-xs text-mc-text">
              {vignette.learningObjectives.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
          </Panel>
          <Panel title="Key concepts observed">
            <ul className="list-inside list-disc space-y-1 p-3 text-xs text-mc-text">
              {conceptsObserved.length === 0 && (
                <li className="text-mc-dim">No teaching pauses reached in this playback.</li>
              )}
              {conceptsObserved.map((c, i) => (
                <li key={`${c}-${i}`}>{c}</li>
              ))}
            </ul>
          </Panel>
        </div>
      )}

      <Panel title="Timeline">
        <div className="p-3">
          <canvas ref={canvasRef} />
          <div className="mt-1 flex gap-4 font-mono text-[10px] uppercase tracking-widest text-mc-dim">
            <span className="text-mc-cyan">range</span>
            <span className="text-mc-amber">attribution</span>
            <span>link: </span>
            <span className="text-mc-green">nominal</span>
            <span className="text-mc-amber">degraded</span>
            <span className="text-mc-red">denied</span>
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-2 gap-4">
        <Panel title="Key stats">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 p-3 font-mono text-xs text-mc-text">
            <span className="text-mc-dim">total &Delta;v</span>
            <span>{debrief.totalDvUsed.toFixed(1)} m/s</span>
            <span className="text-mc-dim">end clock</span>
            <span>T+{Math.round(debrief.endTimeSec)}s</span>
            <span className="text-mc-dim">actions</span>
            <span>{debrief.actionsTaken.length}</span>
          </div>
        </Panel>
        <Panel title="Notes">
          <ul className="list-inside list-disc space-y-1 p-3 text-xs text-mc-text">
            {debrief.notes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </Panel>
      </div>

      {debrief.realWorldCallout && (
        <Panel title="In the real world">
          <div className="space-y-2 p-3 text-xs">
            <div className="leading-relaxed text-mc-text">{debrief.realWorldCallout.text}</div>
            <div className="flex flex-wrap gap-2">
              {debrief.realWorldCallout.cite.map((c) => (
                <a
                  key={c.label}
                  href={c.url}
                  target="_blank"
                  rel="noreferrer"
                  className="border border-mc-cyan/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-mc-cyan hover:bg-mc-cyan/10"
                >
                  {c.label}
                </a>
              ))}
            </div>
          </div>
        </Panel>
      )}

      {COACH_ENABLED && mission && mission.id !== 'm0_primer' && <CoachButton />}

      <div className="flex justify-end gap-2">
        <Button onClick={() => setScreen('menu')}>Menu</Button>
        <Button onClick={restart}>Retry</Button>
        <Button onClick={nextMission} variant="warn">Next Mission &rarr;</Button>
      </div>
    </div>
  )
}
