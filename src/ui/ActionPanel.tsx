import { useMemo, useState } from 'react'
import { actionsCatalog, categoryLabel, type ActionCategory, type ActionDef } from '../game/actions'
import { useGame } from '../game/state'
import { invokeAction } from '../game/actionRunner'
import { vignettesById } from '../vignettes'
import Panel from './components/Panel'

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

export default function ActionPanel() {
  const [tab, setTab] = useState<ActionCategory>('orbital')
  const applyStateUpdate = useGame((s) => s.applyStateUpdate)
  const pushLog = useGame((s) => s.pushLog)
  const activeEffects = useGame((s) => s.activeEffects)
  const mode = useGame((s) => s.mode)
  const vignette = useGame((s) => s.vignette)
  const mission = useGame((s) => s.mission)
  const currentPhase = useGame((s) => s.currentPhase)
  const readOnly = mode === 'watch'

  // Play mode still picks up recommendations from the mission's registered
  // vignette, so cadets sandbox-playing Mission 3 see Emcon/Point-Away highlighted
  // when range goes contested.
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

  const onClick = (id: string) => {
    if (readOnly) return
    applyStateUpdate((state) => {
      const out = invokeAction(state, id)
      if (!out) return {}
      queueMicrotask(() =>
        pushLog({ t: state.simTimeSec, text: out.logText, tone: out.tone ?? 'info' }),
      )
      return out.patch
    })
  }

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
      <div className="max-h-60 overflow-y-auto p-2">
        <div className="grid gap-1">
          {visible.map((a) => {
            const active = !!activeEffects[a.id]
            const recommended = recommendedSet.has(a.id)
            const reason = sourceVignette?.actionReasons?.[a.id]
            const title = reason ? `${a.description}\n\nRecommended: ${reason}` : a.description
            return (
              <button
                key={a.id}
                onClick={() => onClick(a.id)}
                disabled={a.disabled || readOnly}
                title={title}
                className={`relative flex flex-col items-start border px-2 py-1 text-left transition-colors ${
                  active
                    ? 'border-mc-cyan bg-mc-cyan/15'
                    : a.disabled
                      ? 'border-mc-dim/40 text-mc-dim'
                      : readOnly
                        ? 'border-mc-cyan/20 text-mc-text cursor-default'
                        : 'border-mc-cyan/30 hover:bg-mc-cyan/5'
                } ${recommended ? 'ring-1 ring-mc-cyan shadow-glow' : ''}`}
              >
                {recommended && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center bg-mc-cyan font-mono text-[9px] text-black">
                    ★
                  </span>
                )}
                <div className="flex w-full items-center justify-between gap-2">
                  <span className="font-mono text-[11px] text-mc-cyan">
                    {a.name}
                    {active && <span className="ml-2 text-[9px] uppercase tracking-widest text-mc-green">ON</span>}
                  </span>
                  <span className="font-mono text-[9px] text-mc-dim">{formatCost(a)}</span>
                </div>
                <span className="font-mono text-[10px] text-mc-dim leading-tight">
                  {a.description}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </Panel>
  )
}
