// Teaching modal that fires once per mission run when the 10-to-1 rule
// (Jack Anthony, "Astro Corner") is violated. Visible while the cadet is
// approaching the target too fast; dismissible.
import { useEffect, useState } from 'react'
import { useGame } from '../game/state'
import { checkTenToOne } from '../engagement/ten-to-one'
import { norm, sub } from '../physics/vec'
import Button from './components/Button'

export default function TenToOneRuleModal() {
  const mission = useGame((s) => s.mission)
  const spacecraft = useGame((s) => s.spacecraft)
  const activeAssetId = useGame((s) => s.activeAssetId)
  const shown = useGame((s) => s.tenToOneShownThisRun)
  const setShown = useGame((s) => s.setTenToOneShown)
  const markTenToOneViolated = useGame((s) => s.markTenToOneViolated)
  const [visible, setVisible] = useState(false)
  const [stats, setStats] = useState<{ rangeKm: number; rateMps: number; maxMps: number } | null>(
    null,
  )

  // Reset on mission change so each new run can trigger once.
  useEffect(() => {
    setShown(false)
    setVisible(false)
  }, [mission?.id, setShown])

  useEffect(() => {
    if (!mission || shown) return
    const target = spacecraft[mission.targetId]
    const chase = spacecraft[activeAssetId ?? mission.playerId]
    if (!target || !chase) return
    const rangeM = norm(sub(chase.rEci, target.rEci))
    // Closing positive: derivative of -range. Cheap finite-difference using
    // current velocities suffices.
    const rel = sub(target.rEci, chase.rEci)
    const relV = sub(target.vEci, chase.vEci)
    const rn = norm(rel)
    const rangeRateMs = rn === 0 ? 0 : -(rel[0] * relV[0] + rel[1] * relV[1] + rel[2] * relV[2]) / rn
    // Only consider once we're inside ~100 km (rule has no point at deep
    // distances) and we're closing meaningfully.
    if (rangeM > 100_000 || rangeRateMs < 1) return
    const r = checkTenToOne(rangeM, rangeRateMs)
    if (!r.compliant && r.ratio > 1.5) {
      setStats({
        rangeKm: rangeM / 1000,
        rateMps: rangeRateMs,
        maxMps: r.safeMaxRateMps,
      })
      setVisible(true)
      setShown(true)
      // Per-run flag for the Within the Rule badge (negative criterion).
      markTenToOneViolated()
    }
  }, [mission, spacecraft, activeAssetId, shown, setShown, markTenToOneViolated])

  const dismiss = () => setVisible(false)

  if (!visible || !stats) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
      <div className="w-full max-w-[640px] border border-mc-amber/60 bg-panel-fill shadow-glow">
        <div className="flex items-center justify-between border-b border-mc-amber/30 px-4 py-2">
          <span className="chip border-mc-amber/60 text-mc-amber">RPO Advisory</span>
          <span className="panel-title text-mc-amber">The 10-to-1 Rule</span>
        </div>
        <div className="space-y-3 p-5 text-sm leading-relaxed text-mc-text">
          <div>
            You are closing at <span className="text-mc-red">{stats.rateMps.toFixed(2)} m/s</span>{' '}
            with{' '}
            <span className="text-mc-amber">{stats.rangeKm.toFixed(2)} km</span> of range.
          </div>
          <div>
            The standard 10-to-1 rule recommends a maximum closure rate of{' '}
            <span className="text-mc-amber">{stats.maxMps.toFixed(2)} m/s</span> at this range,
            because each kilometer of separation should give you about a minute and a half of
            reaction time before contact. Slow your approach so you have time to react to
            attitude or sensor errors before any conjunction.
          </div>
          <div className="border border-mc-amber/30 bg-mc-amber/5 p-3 font-mono text-[11px]">
            Rule of thumb: <strong>closing rate (m/s) ≤ range (km) ÷ 10</strong>
          </div>
          <div className="text-[10px] text-mc-dim">
            Source: Jack Anthony, "Astro Corner — The 10-to-1 Rule"
          </div>
        </div>
        <div className="flex justify-end border-t border-mc-amber/30 p-3">
          <Button onClick={dismiss} variant="warn">
            Understood ▶
          </Button>
        </div>
      </div>
    </div>
  )
}
