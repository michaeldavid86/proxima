import { useGame } from '../game/state'

export default function CoverageGauge() {
  const mission = useGame((s) => s.mission)
  const cov = useGame((s) => s.observationCoverage)
  if (!mission?.assets) return null

  const required =
    mission.success.kind === 'observationCoverage' ? mission.success.coveragePctRequired : 85
  const floor =
    mission.success.kind === 'observationCoverage' ? mission.success.lowWaterFailPct ?? 50 : 50

  const pct = cov.currentPct
  const lwm = cov.lowWaterMark
  const tone = pct >= required ? 'bg-mc-green' : pct >= floor ? 'bg-mc-amber' : 'bg-mc-red'

  return (
    <div className="flex flex-col gap-1 border border-mc-cyan/30 bg-mc-cyan/5 p-2">
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest text-mc-dim">
          Observation Coverage
        </span>
        <span className="font-mono text-sm text-mc-cyan">
          {pct.toFixed(1)}
          <span className="ml-1 text-[10px] text-mc-dim">%</span>
        </span>
      </div>
      <div className="relative h-1.5 w-full overflow-hidden bg-mc-grid">
        <div className={`h-full ${tone}`} style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
        {/* Required threshold marker */}
        <div
          className="absolute top-0 h-full w-px bg-mc-green/80"
          style={{ left: `${required}%` }}
          title={`Required ${required}%`}
        />
        {/* Hard floor marker */}
        <div
          className="absolute top-0 h-full w-px bg-mc-red/80"
          style={{ left: `${floor}%` }}
          title={`Hard floor ${floor}%`}
        />
      </div>
      <div className="font-mono text-[9px] text-mc-dim">
        low water mark {lwm.toFixed(1)}% · need &ge; {required}% (floor {floor}%)
      </div>
    </div>
  )
}
