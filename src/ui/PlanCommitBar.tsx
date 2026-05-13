// Unified "what is currently planned, hit one button to send it all" bar.
// Pinned above the log strip in GameScreen. Hidden in Watch mode and hidden
// when nothing is planned.
//
// It bridges the two existing planning surfaces:
//   1. MapView's Plan Maneuver panel + ProxView's RIC Impulse panel write to
//      `plannedManeuverPreview` as the player adjusts inputs.
//   2. ActionPanel writes to `plannedActions` as the player selects.
// The bar surfaces both as a single coherent "plan," and gives the player
// one Commit / Clear pair that operates on the whole plan.
import { useGame } from '../game/state'
import { actionsCatalog } from '../game/actions'
import Button from './components/Button'

const fmtBurnIn = (sec: number): string => {
  if (sec < 60) return `${sec.toFixed(0)} s`
  if (sec < 3600) return `${(sec / 60).toFixed(1)} min`
  return `${(sec / 3600).toFixed(1)} h`
}

// Human-readable summary of the maneuver direction from its RIC components.
const maneuverDirLabel = (dvRic: [number, number, number]): string => {
  const [r, i, c] = dvRic
  const ax = Math.abs(r) >= Math.abs(i) && Math.abs(r) >= Math.abs(c)
    ? 'radial'
    : Math.abs(i) >= Math.abs(c)
      ? 'in-track'
      : 'cross-track'
  if (ax === 'in-track') return i > 0 ? 'Prograde' : 'Retrograde'
  if (ax === 'radial') return r > 0 ? 'Radial out' : 'Radial in'
  return c > 0 ? 'Cross-track +' : 'Cross-track -'
}

export default function PlanCommitBar() {
  const mode = useGame((s) => s.mode)
  const preview = useGame((s) => s.plannedManeuverPreview)
  const plannedActions = useGame((s) => s.plannedActions)
  const setPlannedManeuverPreview = useGame((s) => s.setPlannedManeuverPreview)
  const clearPlannedActions = useGame((s) => s.clearPlannedActions)
  const commitAllPlanned = useGame((s) => s.commitAllPlanned)
  if (mode === 'watch') return null

  const hasManeuver = preview !== null && preview.dvMag > 0
  const plannedActionCount = plannedActions.size
  const hasAnything = hasManeuver || plannedActionCount > 0
  if (!hasAnything) return null

  const actionNames = Array.from(plannedActions)
    .map((id) => actionsCatalog.find((a) => a.id === id)?.name ?? id)
    .slice(0, 3)
  const remainder = plannedActionCount - actionNames.length

  const onClear = () => {
    setPlannedManeuverPreview(null)
    clearPlannedActions()
  }

  return (
    <div className="flex items-center gap-4 border-y border-mc-amber/50 bg-mc-amber/5 px-4 py-2">
      <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-mc-amber">
        Plan ready
      </span>
      <div className="flex flex-1 flex-wrap items-baseline gap-x-4 gap-y-1 font-mono text-[11px]">
        {hasManeuver && (
          <span className="flex items-baseline gap-2">
            <span className="text-mc-dim">Maneuver</span>
            <span className="text-mc-text">
              {maneuverDirLabel(preview.dvRic as [number, number, number])}{' '}
              <span className="text-mc-amber">{preview.dvMag.toFixed(2)} m/s</span>
              <span className="ml-1 text-mc-dim">in {fmtBurnIn(preview.burnOffsetSec)}</span>
            </span>
            {preview.costYears > 0 && (
              <span className="text-mc-red">
                -{(preview.costYears * 12).toFixed(1)} mo life
              </span>
            )}
          </span>
        )}
        {plannedActionCount > 0 && (
          <span className="flex items-baseline gap-2">
            <span className="text-mc-dim">Actions</span>
            <span className="text-mc-text">
              {actionNames.join(', ')}
              {remainder > 0 && <span className="text-mc-dim"> +{remainder} more</span>}
            </span>
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button onClick={onClear} className="!py-1 !text-[10px]">
          Clear All
        </Button>
        <Button onClick={commitAllPlanned} variant="warn" className="!py-1 !text-[10px]">
          ▶ Commit All
        </Button>
      </div>
    </div>
  )
}
