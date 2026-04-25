import { useEffect } from 'react'
import { useGame, type TimeWarp } from '../game/state'
import { phaseMarkers } from '../vignettes/types'
import Button from './components/Button'
import Panel from './components/Panel'
import { fmtClock } from '../game/events'

const WATCH_SPEEDS: TimeWarp[] = [0.5, 1, 2, 4]

export default function WatchControls() {
  const vignette = useGame((s) => s.vignette)
  const paused = useGame((s) => s.paused)
  const togglePaused = useGame((s) => s.togglePaused)
  const timeWarp = useGame((s) => s.timeWarp)
  const setTimeWarp = useGame((s) => s.setTimeWarp)
  const simTime = useGame((s) => s.simTimeSec)
  const setScreen = useGame((s) => s.setScreen)
  const firedWaypointIds = useGame((s) => s.firedWaypointIds)
  const resetRun = useGame((s) => s.resetRun)
  const applyStateUpdate = useGame((s) => s.applyStateUpdate)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return
      if (e.code === 'Space') {
        e.preventDefault()
        togglePaused()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [togglePaused])

  if (!vignette) return null
  const total = vignette.totalDurationSec || 1
  const pct = Math.min(1, simTime / total)
  const markers = phaseMarkers(vignette)

  const skipToNextPause = () => {
    const next = vignette.waypoints.find(
      (w) => w.kind === 'teach_pause' && !firedWaypointIds.has(w.id),
    )
    if (!next) return
    // Advance sim time directly to (next.t_sim - 0.1) so the script runner
    // on the next tick will fire all intermediate waypoints, then the pause.
    applyStateUpdate(() => ({ simTimeSec: Math.max(0, next.t_sim - 0.1), paused: false }))
  }

  const scrubTo = (targetT: number) => {
    // Reset and replay. Only allow scrubbing backward, or within already-fired
    // range. Forward scrubbing beyond firedWaypointIds would require a deeper
    // replay; we scope it to the current sim time.
    if (targetT < simTime) {
      resetRun()
      // Then set timeWarp up and unpause so the sim replays.
      // For simplicity the user will unpause manually and use 4x.
      applyStateUpdate(() => ({ paused: true, timeWarp: 4, simTimeSec: 0 }))
      return
    }
    applyStateUpdate(() => ({ simTimeSec: Math.min(targetT, total), paused: false }))
  }

  return (
    <Panel title="Watch Controls">
      <div className="flex flex-col gap-3 p-3">
        <div className="flex items-center gap-1">
          <Button
            variant={paused ? 'warn' : 'default'}
            onClick={togglePaused}
            className="flex-1"
          >
            {paused ? '▶ Play' : '❚❚ Pause'}
          </Button>
          <Button onClick={skipToNextPause} className="flex-1 !text-[10px]" title="Skip to next teaching pause">
            ⏭ Next Pause
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <span className="panel-title mr-2">Speed</span>
          {WATCH_SPEEDS.map((w) => (
            <Button
              key={w}
              active={timeWarp === w}
              onClick={() => setTimeWarp(w)}
              className="flex-1 !py-1 !text-[10px]"
            >
              {w}x
            </Button>
          ))}
        </div>
        <div>
          <div className="mb-1 flex justify-between font-mono text-[10px] text-mc-dim">
            <span>T+{fmtClock(simTime)}</span>
            <span>{fmtClock(total)}</span>
          </div>
          <div
            className="relative h-2 cursor-pointer bg-mc-grid"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              const frac = (e.clientX - rect.left) / rect.width
              scrubTo(Math.max(0, Math.min(1, frac)) * total)
            }}
          >
            <div className="h-full bg-mc-cyan" style={{ width: `${pct * 100}%` }} />
            {markers.map((m) => (
              <div
                key={m.id}
                className="absolute -top-1 h-3 w-0.5 bg-mc-amber"
                style={{ left: `${(m.t_sim / total) * 100}%` }}
                title={m.phase}
              />
            ))}
          </div>
          <div className="mt-1 font-mono text-[10px] text-mc-dim">
            Markers = phase transitions. Click to scrub (back only).
          </div>
        </div>
        <Button
          variant="danger"
          onClick={() => {
            if (confirm('Exit vignette and return to menu?')) setScreen('menu')
          }}
          className="!text-[10px]"
        >
          ✕ Exit Vignette
        </Button>
      </div>
    </Panel>
  )
}
