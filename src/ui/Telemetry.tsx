import { useGame } from '../game/state'
import { norm, sub } from '../physics/vec'
import { fmtClock } from '../game/events'
import Gauge from './components/Gauge'
import Chip, { type ChipTone } from './components/Chip'
import Panel from './components/Panel'
import OperationalLifeGauge from './OperationalLifeGauge'
import CoverageGauge from './CoverageGauge'
import { propellantUsed } from '../physics/maneuver'

export default function Telemetry() {
  const mission = useGame((s) => s.mission)
  const spacecraft = useGame((s) => s.spacecraft)
  const attribution = useGame((s) => s.attributionRisk)
  const link = useGame((s) => s.linkStatus)
  const simTime = useGame((s) => s.simTimeSec)
  const holdTimer = useGame((s) => s.holdTimerSec)
  const totalDvUsed = useGame((s) => s.totalDvUsed)
  const preview = useGame((s) => s.plannedManeuverPreview)
  if (!mission) return null
  const player = spacecraft[mission.playerId]
  const target = spacecraft[mission.targetId]
  if (!player || !target) return null

  const rangeM = norm(sub(player.rEci, target.rEci))
  const rangeKm = rangeM / 1000
  // Range rate: derivative sign of relative distance. Use radial component.
  const rel = sub(target.rEci, player.rEci)
  const relV = sub(target.vEci, player.vEci)
  const rn = norm(rel)
  const rangeRateMs = rn === 0 ? 0 : -(rel[0] * relV[0] + rel[1] * relV[1] + rel[2] * relV[2]) / rn

  const budgetMs = 400
  const dvRemain = Math.max(0, budgetMs - totalDvUsed)

  // Projected values when a maneuver is being planned. We compute them here
  // so the Telemetry panel itself can show "now → after burn" hints under
  // the affected gauges — gives the cadet a direct read on whether the
  // planned commit is worth the cost.
  const isPlanning = preview !== null && preview.dvMag > 0
  let projectedDvRemain = dvRemain
  let projectedPropellantKg = player.propellantMass
  if (isPlanning && preview) {
    projectedDvRemain = Math.max(0, budgetMs - (totalDvUsed + preview.dvMag))
    const dm = propellantUsed(player.mass, preview.dvMag, player.isp)
    projectedPropellantKg = Math.max(0, player.propellantMass - dm)
  }

  const holdTarget =
    mission.success.kind === 'holdStation'
      ? mission.success.holdSeconds
      : mission.success.kind === 'inspectionProfile'
        ? mission.success.holdSeconds
        : 0

  const linkTone: ChipTone =
    link === 'nominal' ? 'green' : link === 'degraded' ? 'amber' : 'red'

  return (
    <Panel title="Telemetry">
      {isPlanning && (
        <div className="flex items-center justify-between border-b border-mc-amber/40 bg-mc-amber/5 px-3 py-1">
          <span className="font-mono text-[10px] uppercase tracking-widest text-mc-amber">
            Preview Active
          </span>
          <span className="font-mono text-[10px] text-mc-dim">
            "after" values show post-burn state
          </span>
        </div>
      )}
      <div className="flex flex-col gap-2 px-3 pt-3">
        <OperationalLifeGauge />
        <CoverageGauge />
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 p-3 text-xs">
        <Gauge
          label="Range"
          value={rangeKm}
          max={Math.max(rangeKm * 1.1, 50)}
          unit="km"
          format={(v) => v.toFixed(2)}
          tone="cyan"
        />
        <div className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-[10px] uppercase tracking-widest text-mc-dim">Rate</span>
            <span className={`font-mono text-xs ${rangeRateMs > 0 ? 'text-mc-amber' : 'text-mc-green'}`}>
              {rangeRateMs > 0 ? '-' : '+'}
              {Math.abs(rangeRateMs).toFixed(2)}
              <span className="ml-1 text-mc-dim">m/s</span>
            </span>
          </div>
          <div className="text-[10px] text-mc-dim">{rangeRateMs > 0 ? 'closing' : 'opening'}</div>
        </div>
        <div className="flex flex-col gap-0.5">
          <Gauge
            label="&Delta;v budget"
            value={dvRemain}
            max={budgetMs}
            unit="m/s"
            format={(v) => v.toFixed(1)}
            tone="cyan"
            warnAt={0.8}
          />
          {isPlanning && (
            <span className="font-mono text-[9px] text-mc-amber">
              after burn → {projectedDvRemain.toFixed(1)} m/s
            </span>
          )}
        </div>
        <div className="flex flex-col gap-0.5">
          <Gauge
            label="Propellant"
            value={player.propellantMass}
            max={Math.max(player.propellantMass + 1, 200)}
            unit="kg"
            format={(v) => v.toFixed(1)}
            tone="cyan"
          />
          {isPlanning && (
            <span className="font-mono text-[9px] text-mc-amber">
              after burn → {projectedPropellantKg.toFixed(1)} kg
            </span>
          )}
        </div>
        <Gauge
          label="Attribution"
          value={attribution}
          max={100}
          unit=""
          format={(v) => v.toFixed(0)}
          tone={attribution > 70 ? 'red' : attribution > 40 ? 'amber' : 'green'}
        />
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[10px] uppercase tracking-widest text-mc-dim">Link</span>
          <Chip tone={linkTone}>{link}</Chip>
        </div>
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[10px] uppercase tracking-widest text-mc-dim">Clock</span>
          <span className="font-mono text-xs text-mc-text">T + {fmtClock(simTime)}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[10px] uppercase tracking-widest text-mc-dim">Hold</span>
          <span className="font-mono text-xs text-mc-text">
            {fmtClock(holdTimer)}
            {holdTarget ? <span className="ml-1 text-mc-dim">/ {fmtClock(holdTarget)}</span> : null}
          </span>
        </div>
      </div>
    </Panel>
  )
}
