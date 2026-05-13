// Compact card showing what the currently-being-planned maneuver will do:
// delta-V, time to achieve, operational-life cost, and projected orbit
// elements (periapsis, apoapsis, period). Reads `plannedManeuverPreview` from
// state; renders nothing when there's no preview.
import { useGame } from '../game/state'
import { R_EARTH } from '../physics/constants'
import { periodFromA } from '../physics/orbital-elements'
import { fmtLifeDelta } from '../game/operational-life'
import PassiveSafetyChip from './PassiveSafetyChip'

const fmtMinutes = (sec: number): string => {
  if (sec < 60) return `${sec.toFixed(0)} s`
  if (sec < 3600) return `${(sec / 60).toFixed(1)} min`
  return `${(sec / 3600).toFixed(1)} h`
}

const fmtAltKm = (a: number, e: number, kind: 'peri' | 'apo'): string => {
  const r = kind === 'peri' ? a * (1 - e) : a * (1 + e)
  return `${((r - R_EARTH) / 1000).toFixed(0)} km`
}

// Identify whether the burn happens at periapsis, apoapsis, or somewhere else.
const burnPointLabel = (preview: { currentElements: { e: number; nu: number } }): string => {
  if (preview.currentElements.e < 0.001) return '—' // circular: no apsidal labels
  const nu = preview.currentElements.nu
  // We're describing the orbit AT BURN TIME, which is the post-propagation
  // state's true anomaly. Practical thresholds:
  if (nu < 0.2 || nu > 2 * Math.PI - 0.2) return 'Periapsis'
  if (Math.abs(nu - Math.PI) < 0.2) return 'Apoapsis'
  return `ν = ${((nu * 180) / Math.PI).toFixed(0)}°`
}

export default function ManeuverCostPopup() {
  const p = useGame((s) => s.plannedManeuverPreview)
  const mission = useGame((s) => s.mission)
  if (!p || p.dvMag === 0) return null
  const isPlayer = mission?.playerId === p.craftId

  const cur = p.currentElements
  const proj = p.projectedElements
  const periChanged = Math.abs(cur.a * (1 - cur.e) - proj.a * (1 - proj.e)) > 1000
  const apoChanged = Math.abs(cur.a * (1 + cur.e) - proj.a * (1 + proj.e)) > 1000
  const periodNow = periodFromA(cur.a)
  const periodNext = Number.isFinite(proj.a) ? periodFromA(proj.a) : NaN

  // Direction summary: pull out the dominant axis from dvRic for human label.
  const dvNames: Array<{ name: string; v: number }> = [
    { name: 'Radial-out', v: p.dvRic[0] },
    { name: 'Radial-in', v: -p.dvRic[0] },
    { name: 'Prograde', v: p.dvRic[1] },
    { name: 'Retrograde', v: -p.dvRic[1] },
    { name: 'Normal', v: p.dvRic[2] },
    { name: 'Anti-normal', v: -p.dvRic[2] },
  ]
  const top = dvNames.reduce((a, b) => (b.v > a.v ? b : a), { name: '—', v: -Infinity })

  return (
    <div className="pointer-events-auto w-72 border border-mc-amber/60 bg-panel-fill p-3 font-mono text-[11px] shadow-glow">
      <div className="panel-title mb-2 text-mc-amber">Planned Maneuver</div>
      <div className="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-0.5 text-[11px]">
        <span className="text-mc-dim">Direction</span>
        <span className="text-mc-text">{top.name}</span>
        <span className="text-mc-dim">&Delta;v</span>
        <span className="text-mc-amber">{p.dvMag.toFixed(2)} m/s</span>
        <span className="text-mc-dim">Burn point</span>
        <span className="text-mc-text">{burnPointLabel(p)}</span>
        <span className="text-mc-dim">Burn in</span>
        <span className="text-mc-text">{fmtMinutes(p.burnOffsetSec)}</span>
        <span className="text-mc-dim">Time to achieve</span>
        <span className="text-mc-text">{fmtMinutes(p.timeToAchieveSec)}</span>
        {isPlayer && p.costYears > 0 && (
          <>
            <span className="text-mc-dim">Life cost</span>
            <span className="text-mc-red">{fmtLifeDelta(-p.costYears)}</span>
          </>
        )}
      </div>
      <div className="mt-2 border-t border-mc-cyan/20 pt-2">
        <div className="panel-title mb-1 text-mc-cyan">Result</div>
        <div className="grid grid-cols-[max-content_1fr_1fr] gap-x-2 gap-y-0.5 text-[10px]">
          <span></span>
          <span className="text-mc-dim">now</span>
          <span className="text-mc-dim">after</span>
          <span className="text-mc-dim">Peri</span>
          <span className="text-mc-text">{fmtAltKm(cur.a, cur.e, 'peri')}</span>
          <span className={periChanged ? 'text-mc-amber' : 'text-mc-text'}>
            {Number.isFinite(proj.a) ? fmtAltKm(proj.a, proj.e, 'peri') : '—'}
          </span>
          <span className="text-mc-dim">Apo</span>
          <span className="text-mc-text">{fmtAltKm(cur.a, cur.e, 'apo')}</span>
          <span className={apoChanged ? 'text-mc-amber' : 'text-mc-text'}>
            {Number.isFinite(proj.a) ? fmtAltKm(proj.a, proj.e, 'apo') : '—'}
          </span>
          <span className="text-mc-dim">Period</span>
          <span className="text-mc-text">{fmtMinutes(periodNow)}</span>
          <span className={Math.abs(periodNow - periodNext) > 60 ? 'text-mc-amber' : 'text-mc-text'}>
            {Number.isFinite(periodNext) ? fmtMinutes(periodNext) : '—'}
          </span>
        </div>
      </div>
      <PassiveSafetyChip />
    </div>
  )
}
