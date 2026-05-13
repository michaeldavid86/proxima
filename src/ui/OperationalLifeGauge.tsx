import { useGame } from '../game/state'
import { fmtLife, fmtLifeDelta, ANNUAL_SK_MS } from '../game/operational-life'

// Transient chip shows for 2 seconds of real time. We approximate by checking
// that the sim time has advanced less than 2 sim seconds at 1x warp; but for
// speed-warp scrubbing we also cap the chip lifetime to 30 sim seconds so it
// doesn't linger through a 1000x jump.
const CHIP_LIFETIME_SEC = 30

export default function OperationalLifeGauge() {
  const life = useGame((s) => s.operationalLife)
  const simTime = useGame((s) => s.simTimeSec)
  const totalDvUsed = useGame((s) => s.totalDvUsed)
  const preview = useGame((s) => s.plannedManeuverPreview)

  if (life.initialYears === 0) return null

  const current = fmtLife(life.currentYears)
  const rate = ANNUAL_SK_MS[life.regime]
  const pct = life.initialYears > 0 ? life.currentYears / life.initialYears : 0
  const tone =
    pct > 0.6 ? 'bg-mc-green' : pct > 0.3 ? 'bg-mc-amber' : 'bg-mc-red'
  const showChip =
    Math.abs(life.lastDeltaYears) > 0 &&
    simTime - life.lastDeltaAtSec < CHIP_LIFETIME_SEC &&
    simTime - life.lastDeltaAtSec >= 0

  // Projected life if the cadet commits the currently-planned maneuver.
  // `preview.costYears` already accounts for delta-V cost against the regime
  // station-keeping rate, so we just subtract.
  const isPlanning = preview !== null && preview.dvMag > 0 && preview.costYears > 0
  const projectedYears = isPlanning
    ? Math.max(0, life.currentYears - preview.costYears)
    : life.currentYears
  const projected = fmtLife(projectedYears)
  const projectedPct =
    life.initialYears > 0
      ? Math.max(0, Math.min(1, projectedYears / life.initialYears))
      : 0

  return (
    <div className="relative flex flex-col gap-1 border border-mc-amber/40 bg-mc-amber/5 p-2">
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest text-mc-dim">
          Operational Life
        </span>
        <span className="font-mono text-sm text-mc-amber">
          {current.value}
          <span className="ml-1 text-[10px] text-mc-dim">{current.unit}</span>
        </span>
      </div>
      <div className="relative h-1 w-full overflow-hidden bg-mc-grid">
        <div
          className={`h-full ${tone}`}
          style={{ width: `${Math.max(0, Math.min(1, pct)) * 100}%` }}
        />
        {/* Projected-after-burn marker: a narrow amber band where the bar
            will end up if the planned burn is committed. */}
        {isPlanning && (
          <div
            className="absolute top-0 h-full border-r-2 border-mc-red bg-mc-red/30"
            style={{
              left: `${projectedPct * 100}%`,
              width: `${Math.max(0, pct - projectedPct) * 100}%`,
            }}
            title={`After burn: ${projected.value} ${projected.unit}`}
          />
        )}
      </div>
      <div className="font-mono text-[9px] text-mc-dim">
        {Math.max(0, (life.initialYears - life.currentYears) * rate).toFixed(1)} m/s spent ·{' '}
        {life.regime} SK @ {rate} m/s/yr
      </div>
      {isPlanning && (
        <div className="font-mono text-[10px] text-mc-amber">
          after burn → {projected.value} {projected.unit}
          <span className="ml-2 text-mc-red">
            ({fmtLifeDelta(-preview.costYears)})
          </span>
        </div>
      )}
      {showChip && life.lastDeltaYears < 0 && (
        <div className="pointer-events-none absolute -right-1 -top-3 border border-mc-red/60 bg-panel-fill px-1 py-0.5 font-mono text-[10px] text-mc-red shadow-glow">
          {fmtLifeDelta(life.lastDeltaYears)}
        </div>
      )}
      {/* Show total-dv used as a sanity cross-check */}
      <div className="sr-only">{totalDvUsed.toFixed(1)}</div>
    </div>
  )
}
