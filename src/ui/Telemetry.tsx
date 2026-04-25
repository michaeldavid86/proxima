import { useGame } from '../game/state'
import { norm, sub } from '../physics/vec'
import { fmtClock } from '../game/events'
import Gauge from './components/Gauge'
import Chip, { type ChipTone } from './components/Chip'
import Panel from './components/Panel'
import OperationalLifeGauge from './OperationalLifeGauge'
import CoverageGauge from './CoverageGauge'

export default function Telemetry() {
  const mission = useGame((s) => s.mission)
  const spacecraft = useGame((s) => s.spacecraft)
  const attribution = useGame((s) => s.attributionRisk)
  const link = useGame((s) => s.linkStatus)
  const simTime = useGame((s) => s.simTimeSec)
  const holdTimer = useGame((s) => s.holdTimerSec)
  const totalDvUsed = useGame((s) => s.totalDvUsed)
  if (!mission) return null
  const player = spacecraft[mission.playerId]
  const target = spacecraft[mission.targetId]
  if (!player || !target) return null

  const rangeM = norm(sub(player.rEci, target.rEci))
  const rangeKm = rangeM / 1000
  // Range rate: derivative sign of relative distance. Use radial component.
  const rel = sub(target.rEci, player.rEci) // target - player
  const relV = sub(target.vEci, player.vEci)
  const rn = norm(rel)
  const rangeRateMs = rn === 0 ? 0 : -(rel[0] * relV[0] + rel[1] * relV[1] + rel[2] * relV[2]) / rn
  // Positive = closing

  const budgetMs = 400 // typical — used only for the gauge scale
  const dvRemain = Math.max(0, budgetMs - totalDvUsed)

  // Next event: if mission has holdStation and we're in the window, countdown to success;
  // otherwise countdown to mission time limit.
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
        <Gauge
          label="&Delta;v budget"
          value={dvRemain}
          max={budgetMs}
          unit="m/s"
          format={(v) => v.toFixed(1)}
          tone="cyan"
          warnAt={0.8}
        />
        <Gauge
          label="Propellant"
          value={player.propellantMass}
          max={Math.max(player.propellantMass + 1, 200)}
          unit="kg"
          format={(v) => v.toFixed(1)}
          tone="cyan"
        />
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
