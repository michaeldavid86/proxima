// Compact CATS-angle readout for the Telemetry sidebar. Updates each sim
// tick. Bar fills green / amber / red based on favorability bands.
import { useEffect } from 'react'
import { useGame } from '../game/state'
import { computeCatsAngle } from '../engagement/cats'

const toneOf = (f: 'favorable' | 'marginal' | 'unfavorable') =>
  f === 'favorable'
    ? { bar: 'bg-mc-green', text: 'text-mc-green', label: 'favorable' }
    : f === 'marginal'
      ? { bar: 'bg-mc-amber', text: 'text-mc-amber', label: 'marginal' }
      : { bar: 'bg-mc-red', text: 'text-mc-red', label: 'unfavorable' }

export default function CatsAnglePanel() {
  const mission = useGame((s) => s.mission)
  const spacecraft = useGame((s) => s.spacecraft)
  const activeAssetId = useGame((s) => s.activeAssetId)
  const simTime = useGame((s) => s.simTimeSec)
  const cats = useGame((s) => s.catsAngle)
  const setCatsAngle = useGame((s) => s.setCatsAngle)

  // Recompute CATS angle whenever sim state changes. Cheap operation; safe to
  // run every render.
  useEffect(() => {
    if (!mission) {
      setCatsAngle(null)
      return
    }
    const target = spacecraft[mission.targetId]
    const chase = spacecraft[activeAssetId ?? mission.playerId]
    if (!target || !chase) {
      setCatsAngle(null)
      return
    }
    setCatsAngle(computeCatsAngle(target, chase, simTime))
  }, [mission, spacecraft, activeAssetId, simTime, setCatsAngle])

  if (!cats) return null
  const tone = toneOf(cats.favorability)
  // 0..180 → 0..1 fill, inverted so favorable (low) fills more bar.
  const fillPct = Math.max(0, Math.min(100, ((180 - cats.angleDeg) / 180) * 100))

  return (
    <div className="flex flex-col gap-1 border border-mc-cyan/30 bg-mc-cyan/5 p-2">
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest text-mc-dim">
          CATS Angle
        </span>
        <span className={`font-mono text-sm ${tone.text}`}>
          {cats.angleDeg.toFixed(0)}
          <span className="ml-1 text-[10px] text-mc-dim">°</span>
        </span>
      </div>
      <div className="relative h-1.5 w-full overflow-hidden bg-mc-grid">
        <div className={`h-full ${tone.bar}`} style={{ width: `${fillPct}%` }} />
        {/* favorability band edges */}
        <div
          className="absolute top-0 h-full w-px bg-mc-green/60"
          style={{ left: `${((180 - 30) / 180) * 100}%` }}
          title="30° / favorable boundary"
        />
        <div
          className="absolute top-0 h-full w-px bg-mc-amber/60"
          style={{ left: `${((180 - 90) / 180) * 100}%` }}
          title="90° / unfavorable boundary"
        />
      </div>
      <div className="font-mono text-[9px] text-mc-dim">
        {tone.label} · &lt;30° favorable · &gt;90° unfavorable
      </div>
    </div>
  )
}
