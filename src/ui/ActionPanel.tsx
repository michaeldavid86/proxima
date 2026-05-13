// Tactical Actions panel — planning model.
//
// Clicks select / deselect actions into a "plan." A footer at the bottom of
// the panel shows the plan size, lets the player Clear all selections, and
// Commit the plan in a single batch (firing each action through the existing
// actionRunner.invokeAction).
//
// Each action card shows:
//   1. Name + cost
//   2. Description (what it does in operational terms)
//   3. Effect-if-committed line: "Will turn ON" / "Will turn OFF" / "Will fire
//      once" / "Already used this mission" depending on duration + state.
//   4. Status badges: ON (currently active), ★ recommended, ✓ planned
//
// In Watch mode the entire panel is read-only.
import { useMemo, useState } from 'react'
import { actionsCatalog, categoryLabel, type ActionCategory, type ActionDef } from '../game/actions'
import { useGame } from '../game/state'
import { vignettesById } from '../vignettes'
import Panel from './components/Panel'
import Button from './components/Button'

const TABS: ActionCategory[] = [
  'orbital',
  'orbital_def',
  'ew_off',
  'ew_def',
  'cyber',
  'passive_def',
  'active_def',
]

const SHORT_TAB: Record<ActionCategory, string> = {
  orbital: 'ORB',
  orbital_def: 'ORB-D',
  ew_off: 'EW',
  ew_def: 'EW-D',
  cyber: 'CYB',
  passive_def: 'PASS',
  active_def: 'ACT',
}

const formatCost = (def: ActionDef) => {
  const parts: string[] = []
  if (def.cost.powerW) parts.push(`${def.cost.powerW} W`)
  if (def.cost.attributionDelta) parts.push(`+${def.cost.attributionDelta} attr`)
  if (def.cost.attributionPerMin) parts.push(`+${def.cost.attributionPerMin}/min`)
  if (def.cost.dvBudgetHintMs) parts.push(`~${def.cost.dvBudgetHintMs} m/s`)
  if (def.cost.oncePerMission) parts.push('one-shot')
  return parts.join(' · ')
}

// Plain-English summary of what will happen if this action is committed,
// given the current state. Drives the "see what's going to happen" requirement.
const effectPreview = (
  def: ActionDef,
  isActive: boolean,
  alreadyUsedOnceMission: boolean,
): string => {
  if (def.disabled) return 'Disabled in this mission'
  if (def.cost.oncePerMission && alreadyUsedOnceMission)
    return 'Already used this mission'
  switch (def.duration) {
    case 'untilCancelled':
      return isActive ? 'Will turn OFF on commit' : 'Will turn ON on commit'
    case 'oneTurn':
      return isActive
        ? 'Already running this turn'
        : 'Will fire for 1 turn (~60 s)'
    case 'one-shot':
      return 'Will fire once on commit'
    default:
      return 'Will fire once on commit'
  }
}

export default function ActionPanel() {
  const [tab, setTab] = useState<ActionCategory>('orbital')
  const activeEffects = useGame((s) => s.activeEffects)
  const mode = useGame((s) => s.mode)
  const vignette = useGame((s) => s.vignette)
  const mission = useGame((s) => s.mission)
  const currentPhase = useGame((s) => s.currentPhase)
  const plannedActions = useGame((s) => s.plannedActions)
  const togglePlannedAction = useGame((s) => s.togglePlannedAction)
  const clearPlannedActions = useGame((s) => s.clearPlannedActions)
  const commitPlannedActions = useGame((s) => s.commitPlannedActions)
  const actionsTaken = useGame((s) => s.actionsTaken)
  const readOnly = mode === 'watch'

  // Recommended action source: vignette in Watch mode, or the mission's
  // registered vignette in Play mode (so Mission 3 still highlights Emcon
  // etc. during the Contested phase even without Watch loaded).
  const sourceVignette = useMemo(() => {
    if (vignette) return vignette
    if (mission?.vignetteId) return vignettesById[mission.vignetteId] ?? null
    return null
  }, [vignette, mission])

  const recommendedSet = useMemo(() => {
    if (!sourceVignette || !currentPhase) return new Set<string>()
    return new Set(sourceVignette.recommendedActions[currentPhase] ?? [])
  }, [sourceVignette, currentPhase])

  const visible = useMemo(() => actionsCatalog.filter((a) => a.category === tab), [tab])

  const onCardClick = (id: string, disabled: boolean) => {
    if (readOnly || disabled) return
    togglePlannedAction(id)
  }

  // Aggregate "what the plan will cost" preview.
  const planSummary = useMemo(() => {
    let attrDelta = 0
    let attrPerMin = 0
    let powerW = 0
    let dvHint = 0
    const planned = Array.from(plannedActions)
    for (const id of planned) {
      const def = actionsCatalog.find((a) => a.id === id)
      if (!def) continue
      attrDelta += def.cost.attributionDelta ?? 0
      attrPerMin += def.cost.attributionPerMin ?? 0
      powerW += def.cost.powerW ?? 0
      dvHint += def.cost.dvBudgetHintMs ?? 0
    }
    return { count: planned.length, attrDelta, attrPerMin, powerW, dvHint }
  }, [plannedActions])

  return (
    <Panel title="Tactical Actions">
      <div className="flex flex-wrap gap-1 border-b border-mc-cyan/20 px-2 py-1">
        {TABS.map((c) => (
          <button
            key={c}
            onClick={() => setTab(c)}
            className={`font-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 border ${
              tab === c
                ? 'border-mc-cyan text-mc-cyan bg-mc-cyan/10'
                : 'border-mc-cyan/30 text-mc-dim hover:text-mc-cyan'
            }`}
            title={categoryLabel(c)}
          >
            {SHORT_TAB[c]}
          </button>
        ))}
      </div>
      <div className="max-h-56 overflow-y-auto p-2">
        <div className="grid gap-1">
          {visible.map((a) => {
            const active = !!activeEffects[a.id]
            const planned = plannedActions.has(a.id)
            const recommended = recommendedSet.has(a.id)
            const alreadyUsed =
              !!a.cost.oncePerMission &&
              actionsTaken.some((x) => x.actionId === a.id)
            const reason = sourceVignette?.actionReasons?.[a.id]
            const effect = effectPreview(a, active, alreadyUsed)
            const fullTitle = reason
              ? `${a.description}\n\nRecommended: ${reason}\n\nClick to ${planned ? 'unselect' : 'select'} for commit.`
              : `${a.description}\n\nClick to ${planned ? 'unselect' : 'select'} for commit.`

            // Border/background by state. Order: planned (amber) wins over
            // active (cyan) wins over default. Both can be true (queued to toggle off).
            let borderCls = 'border-mc-cyan/30 hover:bg-mc-cyan/5'
            if (a.disabled) borderCls = 'border-mc-dim/40 text-mc-dim cursor-not-allowed'
            else if (readOnly) borderCls = 'border-mc-cyan/20 text-mc-text cursor-default'
            else if (planned) borderCls = 'border-mc-amber bg-mc-amber/10'
            else if (active) borderCls = 'border-mc-cyan/70 bg-mc-cyan/10'

            const planMark = planned ? '✓' : '○'

            // Effect tone: amber for "will change something", dim for no-op.
            const effectToneCls =
              effect.startsWith('Will') ? 'text-mc-amber' : 'text-mc-dim'

            return (
              <button
                key={a.id}
                onClick={() => onCardClick(a.id, !!a.disabled)}
                disabled={a.disabled || readOnly}
                title={fullTitle}
                className={`relative flex flex-col items-start border px-2 py-1.5 text-left transition-colors ${borderCls} ${recommended ? 'ring-1 ring-mc-cyan shadow-glow' : ''}`}
              >
                {recommended && (
                  <span
                    className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center bg-mc-cyan font-mono text-[9px] text-black"
                    title="Recommended for current mission phase"
                  >
                    ★
                  </span>
                )}
                <div className="flex w-full items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 font-mono text-[11px] text-mc-cyan">
                    <span
                      className={`inline-block w-3 text-center text-[10px] ${
                        planned ? 'text-mc-amber' : 'text-mc-dim'
                      }`}
                    >
                      {planMark}
                    </span>
                    {a.name}
                    {active && (
                      <span className="ml-1 border border-mc-green/60 px-1 text-[8px] uppercase tracking-widest text-mc-green">
                        ON
                      </span>
                    )}
                  </span>
                  <span className="font-mono text-[9px] text-mc-dim">{formatCost(a)}</span>
                </div>
                <span className="mt-0.5 font-mono text-[10px] text-mc-dim leading-tight">
                  {a.description}
                </span>
                <span className={`mt-1 font-mono text-[10px] leading-tight ${effectToneCls}`}>
                  {effect}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Planning footer: shows what's queued and gives commit/clear controls. */}
      <div className="border-t border-mc-cyan/20 bg-panel-bg/60 p-2">
        <div className="flex items-baseline justify-between">
          <span className="panel-title text-mc-amber">Plan</span>
          <span className="font-mono text-[10px] text-mc-dim">
            {planSummary.count === 0
              ? 'no actions selected'
              : `${planSummary.count} selected`}
          </span>
        </div>
        {planSummary.count > 0 && (
          <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-0.5 font-mono text-[10px] text-mc-dim">
            {planSummary.attrDelta > 0 && (
              <>
                <span>+attribution (one-time)</span>
                <span className="text-right text-mc-amber">+{planSummary.attrDelta}</span>
              </>
            )}
            {planSummary.attrPerMin > 0 && (
              <>
                <span>+attribution (per min)</span>
                <span className="text-right text-mc-amber">+{planSummary.attrPerMin}/min</span>
              </>
            )}
            {planSummary.powerW > 0 && (
              <>
                <span>power draw</span>
                <span className="text-right text-mc-text">{planSummary.powerW} W</span>
              </>
            )}
            {planSummary.dvHint > 0 && (
              <>
                <span>est. delta-V</span>
                <span className="text-right text-mc-text">~{planSummary.dvHint} m/s</span>
              </>
            )}
          </div>
        )}
        <div className="mt-2 flex gap-1">
          <Button
            onClick={clearPlannedActions}
            disabled={planSummary.count === 0 || readOnly}
            className="flex-1 !py-1 !text-[10px]"
          >
            Clear
          </Button>
          <Button
            variant="warn"
            onClick={commitPlannedActions}
            disabled={planSummary.count === 0 || readOnly}
            className="flex-1 !py-1 !text-[10px]"
          >
            Commit ({planSummary.count})
          </Button>
        </div>
      </div>
    </Panel>
  )
}
