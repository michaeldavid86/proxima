import { useEffect } from 'react'
import { useGame, type TimeWarp } from '../game/state'
import Button from './components/Button'
import Panel from './components/Panel'

const WARPS: TimeWarp[] = [1, 10, 100, 1000]

export default function TurnControls() {
  const paused = useGame((s) => s.paused)
  const togglePaused = useGame((s) => s.togglePaused)
  const timeWarp = useGame((s) => s.timeWarp)
  const setTimeWarp = useGame((s) => s.setTimeWarp)
  const viewMode = useGame((s) => s.viewMode)
  const setViewMode = useGame((s) => s.setViewMode)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return
      if (e.code === 'Space') {
        e.preventDefault()
        togglePaused()
      } else if (e.code === 'Digit1') setTimeWarp(1)
      else if (e.code === 'Digit2') setTimeWarp(10)
      else if (e.code === 'Digit3') setTimeWarp(100)
      else if (e.code === 'Digit4') setTimeWarp(1000)
      else if (e.code === 'KeyM') setViewMode('map')
      else if (e.code === 'KeyP') setViewMode('prox')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [togglePaused, setTimeWarp, setViewMode])

  return (
    <Panel title="Controls">
      <div className="flex flex-col gap-2 p-3">
        <div className="flex gap-1">
          <Button variant={paused ? 'warn' : 'default'} onClick={togglePaused} className="flex-1">
            {paused ? '► Run' : '❚❚ Pause'}
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <span className="panel-title mr-2">Warp</span>
          {WARPS.map((w) => (
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
        <div className="flex items-center gap-1">
          <span className="panel-title mr-2">View</span>
          <Button active={viewMode === 'map'} onClick={() => setViewMode('map')} className="flex-1 !py-1 !text-[10px]">
            Map
          </Button>
          <Button active={viewMode === 'prox'} onClick={() => setViewMode('prox')} className="flex-1 !py-1 !text-[10px]">
            Prox
          </Button>
        </div>
      </div>
    </Panel>
  )
}
