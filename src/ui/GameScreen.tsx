import { useEffect, useState } from 'react'
import { useGame } from '../game/state'
import { useSimLoop } from './useSimLoop'
import MapView from './MapView'
import ProxView from './ProxView'
import Telemetry from './Telemetry'
import TurnControls from './TurnControls'
import WatchControls from './WatchControls'
import ActionPanel from './ActionPanel'
import NarrationPanel from './NarrationPanel'
import TeachingModal from './TeachingModal'
import LogStrip from './LogStrip'
import AssetSelector from './AssetSelector'
import Button from './components/Button'
import { fmtClock } from '../game/events'
import { norm, sub } from '../physics/vec'

export default function GameScreen() {
  useSimLoop()
  const mission = useGame((s) => s.mission)
  const viewMode = useGame((s) => s.viewMode)
  const setViewMode = useGame((s) => s.setViewMode)
  const simTime = useGame((s) => s.simTimeSec)
  const timeWarp = useGame((s) => s.timeWarp)
  const paused = useGame((s) => s.paused)
  const setScreen = useGame((s) => s.setScreen)
  const spacecraft = useGame((s) => s.spacecraft)
  const mode = useGame((s) => s.mode)
  const isWatch = mode === 'watch'

  // Auto-switch to ProxView when range < 50 km (Play mode only; in Watch the
  // script controls view changes via view_change waypoints).
  useEffect(() => {
    if (!mission || isWatch) return
    const a = spacecraft[mission.playerId]
    const b = spacecraft[mission.targetId]
    if (!a || !b) return
    const rKm = norm(sub(a.rEci, b.rEci)) / 1000
    if (rKm < 50 && viewMode === 'map') setViewMode('prox')
    else if (rKm > 80 && viewMode === 'prox') setViewMode('map')
  }, [mission, spacecraft, viewMode, setViewMode, isWatch])

  const [hintDismissed, setHintDismissed] = useState(false)
  useEffect(() => {
    setHintDismissed(false)
  }, [mission?.id])

  if (!mission) return null
  const showHint = !isWatch && !hintDismissed && mission.initialGuidance && simTime < 15

  return (
    <div className="flex h-full w-full flex-col">
      <header className="flex items-center justify-between border-b border-mc-cyan/20 bg-panel-fill px-4 py-2">
        <div className="flex items-center gap-4">
          <span className="font-mono text-xs uppercase tracking-widest text-mc-cyan">PROXIMA</span>
          <span className="font-mono text-xs text-mc-dim">&rarr;</span>
          <span className="font-mono text-sm text-mc-text">{mission.name}</span>
          {isWatch && <span className="chip border-mc-amber/60 text-mc-amber">WATCH</span>}
        </div>
        <div className="flex items-center gap-4 font-mono text-xs">
          <span className="text-mc-dim">T+</span>
          <span className="text-mc-cyan">{fmtClock(simTime)}</span>
          <span className="text-mc-dim">warp</span>
          <span className="text-mc-cyan">{timeWarp}x</span>
          <span className={paused ? 'text-mc-amber' : 'text-mc-green'}>
            {paused ? 'PAUSED' : 'RUN'}
          </span>
          <Button className="ml-2" onClick={() => setScreen('menu')}>
            ✕ Abort
          </Button>
        </div>
      </header>
      <AssetSelector />
      <div className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="relative flex-1">
            {viewMode === 'map' ? <MapView /> : <ProxView />}
            {showHint && (
              <div className="pointer-events-auto absolute left-1/2 top-4 z-10 max-w-xl -translate-x-1/2 border border-mc-amber/60 bg-panel-fill px-4 py-2 shadow-glow">
                <div className="flex items-start gap-3">
                  <span className="panel-title mt-0.5 text-mc-amber">Tip</span>
                  <span className="flex-1 text-xs text-mc-text">{mission.initialGuidance}</span>
                  <button
                    onClick={() => setHintDismissed(true)}
                    className="font-mono text-[10px] uppercase tracking-widest text-mc-amber hover:text-mc-cyan"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
          </div>
          <LogStrip />
        </div>
        <aside className="flex w-[340px] flex-col gap-2 border-l border-mc-cyan/20 bg-panel-fill p-2">
          <Telemetry />
          {isWatch ? <NarrationPanel /> : <ActionPanel />}
          {isWatch ? <WatchControls /> : <TurnControls />}
        </aside>
      </div>
      <TeachingModal />
    </div>
  )
}
