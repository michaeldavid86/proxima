// Standalone maneuver-planner panel. Originally lived inside MapView; pulled
// out here so the same UI is available in 3D mode and any other view. The
// component owns its own panel state (direction, dv magnitude, burn-in time)
// and writes the live preview into the global plannedManeuverPreview slice.
// Commit promotes the preview into a real plannedManeuver.
//
// Mounted by GameScreen as a floating overlay (bottom-right of the canvas
// area) whenever the player can plan a maneuver. Hidden in Watch mode and in
// 2D Prox view (which has its own target-RIC-frame impulse panel).
import { useEffect, useState } from 'react'
import { useGame } from '../game/state'
import { computeManeuverPreview } from '../game/maneuver-preview'
import { R_EARTH } from '../physics/constants'
import type { Vec3 } from '../physics/vec'

type DirId =
  | 'prograde'
  | 'retrograde'
  | 'radial_out'
  | 'radial_in'
  | 'normal'
  | 'anti_normal'

const dirRic = (d: DirId): Vec3 => {
  switch (d) {
    case 'prograde':
      return [0, 1, 0]
    case 'retrograde':
      return [0, -1, 0]
    case 'radial_out':
      return [1, 0, 0]
    case 'radial_in':
      return [-1, 0, 0]
    case 'normal':
      return [0, 0, 1]
    case 'anti_normal':
      return [0, 0, -1]
  }
}

const dirLabel = (d: DirId): string => {
  switch (d) {
    case 'prograde':
      return 'Prograde'
    case 'retrograde':
      return 'Retrograde'
    case 'radial_out':
      return 'Radial Out'
    case 'radial_in':
      return 'Radial In'
    case 'normal':
      return 'Normal'
    case 'anti_normal':
      return 'Anti-Normal'
  }
}

export default function ManeuverPlannerPanel() {
  const mission = useGame((s) => s.mission)
  const mode = useGame((s) => s.mode)
  const activeAssetId = useGame((s) => s.activeAssetId)
  const plannedManeuverPreview = useGame((s) => s.plannedManeuverPreview)
  const setPlannedManeuver = useGame((s) => s.setPlannedManeuver)
  const setPlannedManeuverPreview = useGame((s) => s.setPlannedManeuverPreview)
  const commitPlannedManeuver = useGame((s) => s.commitPlannedManeuver)
  const readOnly = mode === 'watch'
  const controllerId = activeAssetId ?? mission?.playerId ?? ''

  const [dir, setDir] = useState<DirId>('prograde')
  const [dvMag, setDvMag] = useState<number>(10)
  const [burnOffsetSec, setBurnOffsetSec] = useState<number>(30)

  // Live preview: update whenever direction, magnitude, or burn time changes.
  useEffect(() => {
    if (!mission || readOnly) {
      setPlannedManeuverPreview(null)
      return
    }
    if (dvMag <= 0) {
      setPlannedManeuverPreview(null)
      return
    }
    const dv = dirRic(dir).map((x) => x * dvMag) as Vec3
    const state = useGame.getState()
    const preview = computeManeuverPreview(state, controllerId, dv, burnOffsetSec)
    setPlannedManeuverPreview(preview)
  }, [mission, readOnly, dir, dvMag, burnOffsetSec, controllerId, setPlannedManeuverPreview])

  // Clear preview on unmount.
  useEffect(() => {
    return () => setPlannedManeuverPreview(null)
  }, [setPlannedManeuverPreview])

  if (!mission || readOnly) return null

  const planCommit = () => {
    if (dvMag <= 0) return
    commitPlannedManeuver()
  }
  const planCancel = () => {
    setPlannedManeuver(null)
    setPlannedManeuverPreview(null)
    setDvMag(0)
  }

  const cur = plannedManeuverPreview?.currentElements
  const proj = plannedManeuverPreview?.projectedElements

  return (
    <div className="pointer-events-auto w-72 border border-mc-cyan/30 bg-panel-fill p-3 text-xs">
      <div className="mb-2 flex items-center justify-between">
        <div className="panel-title">Plan Maneuver</div>
        {plannedManeuverPreview && dvMag > 0 && (
          <span className="chip border-mc-amber/60 text-mc-amber">PREVIEW</span>
        )}
      </div>
      <div className="mb-2 grid grid-cols-2 gap-1">
        {(
          [
            'prograde',
            'retrograde',
            'radial_out',
            'radial_in',
            'normal',
            'anti_normal',
          ] as DirId[]
        ).map((d) => (
          <button
            key={d}
            className={`btn !py-1 !text-[10px] ${
              dir === d ? '!bg-mc-cyan/40 !ring-2 !ring-mc-cyan' : ''
            }`}
            onClick={() => setDir(d)}
          >
            {dirLabel(d)}
          </button>
        ))}
      </div>
      <label className="mb-1 flex items-center justify-between">
        <span className="text-mc-dim">&Delta;v (m/s)</span>
        <input
          type="number"
          value={dvMag}
          min={0}
          step={0.5}
          className="w-16 border border-mc-cyan/30 bg-transparent px-1 text-right font-mono text-mc-text"
          onChange={(e) => setDvMag(Math.max(0, Number(e.target.value)))}
        />
      </label>
      <label className="mb-2 flex items-center justify-between">
        <span className="text-mc-dim">Burn in (s)</span>
        <input
          type="number"
          value={burnOffsetSec}
          min={0}
          step={5}
          className="w-16 border border-mc-cyan/30 bg-transparent px-1 text-right font-mono text-mc-text"
          onChange={(e) => setBurnOffsetSec(Math.max(0, Number(e.target.value)))}
        />
      </label>

      {plannedManeuverPreview && dvMag > 0 && cur && proj ? (
        <div className="mb-2 border border-mc-amber/40 bg-mc-amber/5 p-2 font-mono text-[10px]">
          <div className="mb-1 text-mc-amber">Projected effect</div>
          <div className="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-0.5">
            <span className="text-mc-dim">Δv used</span>
            <span className="text-mc-text">{plannedManeuverPreview.dvMag.toFixed(2)} m/s</span>
            {plannedManeuverPreview.costYears > 0 && (
              <>
                <span className="text-mc-dim">Life cost</span>
                <span className="text-mc-red">
                  -{(plannedManeuverPreview.costYears * 12).toFixed(1)} mo
                </span>
              </>
            )}
            <span className="text-mc-dim">Peri (now → next)</span>
            <span className="text-mc-text">
              {((cur.a * (1 - cur.e) - R_EARTH) / 1000).toFixed(0)} →{' '}
              {Number.isFinite(proj.a)
                ? ((proj.a * (1 - proj.e) - R_EARTH) / 1000).toFixed(0)
                : '—'}{' '}
              km
            </span>
            <span className="text-mc-dim">Apo (now → next)</span>
            <span className="text-mc-text">
              {((cur.a * (1 + cur.e) - R_EARTH) / 1000).toFixed(0)} →{' '}
              {Number.isFinite(proj.a)
                ? ((proj.a * (1 + proj.e) - R_EARTH) / 1000).toFixed(0)
                : '—'}{' '}
              km
            </span>
          </div>
          <div className="mt-1 text-[10px] text-mc-dim">
            Watch the dashed amber orbit and the Telemetry preview.
          </div>
        </div>
      ) : (
        <div className="mb-2 text-[10px] text-mc-dim">
          Adjust Δv to preview the new orbit.
        </div>
      )}

      <div className="flex gap-1">
        <button
          className="btn btn-warn flex-1 !py-1 !text-[10px]"
          onClick={planCommit}
          disabled={dvMag <= 0}
        >
          Commit Maneuver
        </button>
        <button className="btn flex-1 !py-1 !text-[10px]" onClick={planCancel}>
          Cancel
        </button>
      </div>
    </div>
  )
}
