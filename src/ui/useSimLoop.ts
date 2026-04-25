import { useEffect, useRef } from 'react'
import { stepFromRealTime } from '../game/turn'
import { useGame } from '../game/state'

// Drive the simulation from a requestAnimationFrame loop. Only active while a
// mission is loaded and the game screen is visible. Paused flag is checked
// inside stepFromRealTime, so we don't stop the rAF — that way UI updates (and
// sim-time freeze) remain smooth when paused.
export const useSimLoop = () => {
  const applyStateUpdate = useGame((s) => s.applyStateUpdate)
  const last = useRef<number | null>(null)

  useEffect(() => {
    let raf = 0
    const tick = (now: number) => {
      const prev = last.current ?? now
      last.current = now
      const dt = Math.min(0.1, (now - prev) / 1000) // clamp to 100ms
      applyStateUpdate((state) => stepFromRealTime({ state, realDtSec: dt }))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [applyStateUpdate])
}
