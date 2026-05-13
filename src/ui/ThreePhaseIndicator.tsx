// Top-bar widget showing the four phases of rendezvous. Highlights the
// current phase, dims completed phases, leaves future phases muted.
import { useEffect, useState } from 'react'
import { useGame } from '../game/state'
import { stateToCoe } from '../physics/orbital-elements'
import { norm, sub } from '../physics/vec'
import {
  derivePhase,
  phaseDescription,
  phaseLabel,
  PHASES_ORDER,
  type RpoPhase,
} from '../engagement/rpo-phase'

export default function ThreePhaseIndicator() {
  const mission = useGame((s) => s.mission)
  const spacecraft = useGame((s) => s.spacecraft)
  const activeAssetId = useGame((s) => s.activeAssetId)
  const rpoPhase = useGame((s) => s.rpoPhase)
  const setRpoPhase = useGame((s) => s.setRpoPhase)
  const markPlaneMatchingExited = useGame((s) => s.markPlaneMatchingExited)
  const markCloseInReached = useGame((s) => s.markCloseInReached)
  const [tooltipFor, setTooltipFor] = useState<RpoPhase | null>(null)

  // Derive current phase from orbital state each render. Cheap; phases are
  // discrete so the state update only fires on actual phase change. Also
  // records v1.4 per-run flags used by Plane Matched / Close-In badges.
  useEffect(() => {
    if (!mission) return
    const target = spacecraft[mission.targetId]
    const chase = spacecraft[activeAssetId ?? mission.playerId]
    if (!target || !chase) return
    const range = norm(sub(chase.rEci, target.rEci))
    const phase = derivePhase(
      stateToCoe({ r: chase.rEci, v: chase.vEci }),
      stateToCoe({ r: target.rEci, v: target.vEci }),
      range,
    )
    if (phase !== rpoPhase) {
      // Transitioning OUT of plane_matching counts toward the Plane Matched
      // badge. Reaching close_in counts toward Close-In.
      if (rpoPhase === 'plane_matching' && phase !== 'plane_matching') {
        markPlaneMatchingExited()
      }
      if (phase === 'close_in') markCloseInReached()
      setRpoPhase(phase)
    }
  }, [mission, spacecraft, activeAssetId, rpoPhase, setRpoPhase, markPlaneMatchingExited, markCloseInReached])

  if (!mission) return null
  const currentIdx = PHASES_ORDER.indexOf(rpoPhase)

  return (
    <div className="flex items-center gap-1 border-b border-mc-cyan/20 bg-panel-bg/60 px-4 py-1.5">
      <span className="panel-title mr-3">RPO Phase</span>
      {PHASES_ORDER.map((p, idx) => {
        const isCurrent = p === rpoPhase
        const isPast = idx < currentIdx
        const cls = isCurrent
          ? 'border-mc-cyan bg-mc-cyan/15 text-mc-cyan'
          : isPast
            ? 'border-mc-cyan/30 text-mc-cyan/60'
            : 'border-mc-dim/30 text-mc-dim'
        return (
          <div
            key={p}
            className="relative flex items-center"
            onMouseEnter={() => setTooltipFor(p)}
            onMouseLeave={() => setTooltipFor(null)}
          >
            <button
              className={`border px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest transition-colors ${cls}`}
            >
              {idx + 1}. {phaseLabel(p)}
            </button>
            {idx < PHASES_ORDER.length - 1 && (
              <span className="px-1 font-mono text-[10px] text-mc-dim">›</span>
            )}
            {tooltipFor === p && (
              <div className="absolute left-0 top-full z-30 mt-1 w-64 border border-mc-cyan/40 bg-panel-fill p-2 text-[10px] leading-snug text-mc-text shadow-glow">
                {phaseDescription(p)}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
