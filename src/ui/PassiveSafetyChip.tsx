// Inline chip embedded in the ManeuverCostPopup: takes the currently-planned
// post-burn state, propagates two orbital periods of free drift, and reports
// whether the maneuver is passively safe (no collision or keep-out violation
// even if no follow-on burns are made).
import { useEffect, useMemo } from 'react'
import { useGame } from '../game/state'
import { checkPassiveSafety } from '../engagement/passive-safety'
import { applyImpulseEci, burnFromRic } from '../physics/maneuver'
import { propagateState } from '../physics/kepler'
import { periodFromA, stateToCoe } from '../physics/orbital-elements'

export default function PassiveSafetyChip() {
  const preview = useGame((s) => s.plannedManeuverPreview)
  const mission = useGame((s) => s.mission)
  const spacecraft = useGame((s) => s.spacecraft)
  const setPassiveSafety = useGame((s) => s.setPassiveSafety)

  // Compute passive safety only when a meaningful preview exists.
  const result = useMemo(() => {
    if (!preview || preview.dvMag <= 0 || !mission) return null
    const chase = spacecraft[preview.craftId]
    const target = spacecraft[mission.targetId]
    if (!chase || !target) return null
    // Project the chase forward to the burn time and apply the impulse.
    const sAtBurn = propagateState({ r: chase.rEci, v: chase.vEci }, preview.burnOffsetSec)
    const tAtBurn = propagateState({ r: target.rEci, v: target.vEci }, preview.burnOffsetSec)
    const burn = burnFromRic(sAtBurn.r, sAtBurn.v, preview.dvRic)
    const vAfter = applyImpulseEci(sAtBurn.v, burn)
    const postBurn = { ...chase, rEci: sAtBurn.r, vEci: vAfter }
    const targetAtBurn = { ...target, rEci: tAtBurn.r, vEci: tAtBurn.v }
    const horizonSec = periodFromA(stateToCoe({ r: tAtBurn.r, v: tAtBurn.v }).a) * 2
    return checkPassiveSafety({
      postBurnState: postBurn,
      targetState: targetAtBurn,
      horizonSec,
      keepZones: mission.keepZones ?? [],
    })
  }, [preview, mission, spacecraft])

  // Mirror into store so other UI (e.g., PlanCommitBar) can react if it wants.
  useEffect(() => {
    setPassiveSafety(result)
  }, [result, setPassiveSafety])

  if (!result) return null
  const ok = result.isSafe && result.reason !== 'keep_out_violation'
  const tone = ok
    ? 'border-mc-green/60 text-mc-green'
    : 'border-mc-red/60 text-mc-red'
  const icon = ok ? '✓' : '⚠'
  const labelHead = ok ? 'Passive Safety:' : 'Passive Safety:'

  return (
    <div className={`mt-2 flex items-start gap-2 border px-2 py-1 font-mono text-[10px] ${tone}`}>
      <span className="font-bold">{icon}</span>
      <span>
        <span className="font-bold">{labelHead}</span>{' '}
        <span>{result.description}</span>
      </span>
    </div>
  )
}
