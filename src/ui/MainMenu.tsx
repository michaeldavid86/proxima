import { useState } from 'react'
import { missions } from '../missions'
import { useGame, type GameMode } from '../game/state'
import { vignettesById } from '../vignettes'
import { historicalVignettes } from '../historical'
import Button from './components/Button'
import Panel from './components/Panel'
import References from './References'
import type { Mission } from '../missions/types'

export default function MainMenu() {
  const loadMission = useGame((s) => s.loadMission)
  const setScreen = useGame((s) => s.setScreen)
  const openHistorical = useGame((s) => s.openHistorical)
  const [refsOpen, setRefsOpen] = useState(false)

  const onLaunch = (m: Mission, mode: GameMode) => {
    const vignette = m.vignetteId ? vignettesById[m.vignetteId] ?? null : null
    loadMission(m, { mode, vignette: mode === 'watch' ? vignette : null })
    setScreen('brief')
  }

  return (
    <div className="flex h-full w-full flex-col items-center gap-10 overflow-y-auto p-8">
      <header className="text-center">
        <div className="font-mono text-[11px] uppercase tracking-[0.5em] text-mc-cyan/70">
          Rendezvous &amp; Proximity Operations Trainer &mdash; v1.3 Astro Edition
        </div>
        <div className="mt-2 text-5xl font-semibold tracking-[0.2em] text-mc-cyan">PROXIMA</div>
        <div className="mt-2 font-mono text-xs text-mc-dim">
          Physics-first counterspace training. All scenarios drawn from public sources.
        </div>
      </header>

      <section className="w-full max-w-6xl">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="panel-title">Missions</h2>
          <span className="font-mono text-[10px] text-mc-dim">Watch to learn, Play to drive.</span>
        </div>
        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {missions.map((m, idx) => {
            const isPrimer = m.watchOnly
            const runtime =
              m.id === 'm0_primer'
                ? '5 min'
                : m.id === 'm1_first_light'
                  ? '6 min'
                  : m.id === 'm2_quiet_inspector'
                    ? '8 min'
                    : m.id === 'm3_contested_approach'
                      ? '7 min'
                      : '10 min'
            const isNew = m.id === 'm4_handoff'
            return (
              <Panel
                key={m.id}
                title={isPrimer ? 'Primer' : `Mission ${idx}`}
                className="h-full"
                accessory={isNew ? <span className="chip border-mc-green/60 text-mc-green">NEW</span> : undefined}
              >
                <div className="flex h-full flex-col gap-3 p-3">
                  <div className="font-mono text-sm text-mc-cyan">{m.name}</div>
                  <div className="text-xs leading-relaxed text-mc-text line-clamp-5">{m.brief}</div>
                  <div className="mt-auto flex flex-col gap-2 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-mc-dim">
                        {m.spacecraft[0].regime}
                      </span>
                      {m.vignetteId && (
                        <span className="chip border-mc-amber/60 text-mc-amber">Watch: {runtime}</span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {m.vignetteId && (
                        <Button
                          variant="warn"
                          className="flex-1 !py-1 !text-[10px]"
                          onClick={() => onLaunch(m, 'watch')}
                        >
                          ▶ Watch
                        </Button>
                      )}
                      {!isPrimer && (
                        <Button
                          className="flex-1 !py-1 !text-[10px]"
                          onClick={() => onLaunch(m, 'play')}
                        >
                          Play →
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Panel>
            )
          })}
        </div>
      </section>

      <section className="w-full max-w-6xl">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="panel-title">
            <span className="chip mr-2 border-mc-green/60 text-mc-green">NEW</span>
            RPO Trajectory Sandbox
          </h2>
          <span className="font-mono text-[10px] text-mc-dim">
            Explore the three foundational RPO relative motion trajectories from Core Astro.
          </span>
        </div>
        <button
          onClick={() => setScreen('sandbox')}
          className="group flex w-full items-start gap-4 border border-mc-amber/30 bg-panel-fill p-4 text-left transition-colors hover:border-mc-amber hover:bg-mc-amber/5"
        >
          <span className="text-3xl">🛰️</span>
          <div className="flex flex-1 flex-col gap-1">
            <div className="font-mono text-sm text-mc-amber">Trajectory Sandbox</div>
            <div className="text-xs leading-relaxed text-mc-text">
              Perch, linear drift, natural-motion circumnavigation. Adjust the parameter, watch the
              chaser trajectory in the RIC frame, and see the CW-computed delta-V to enter and exit.
            </div>
            <div className="mt-1 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-mc-dim">
              <span>RIC frame · interactive · no scoring</span>
            </div>
          </div>
          <span className="font-mono text-[10px] text-mc-amber">Open →</span>
        </button>
      </section>

      <section className="w-full max-w-6xl">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="panel-title">
            <span className="chip mr-2 border-mc-green/60 text-mc-green">NEW</span>
            Historical Ops
          </h2>
          <span className="font-mono text-[10px] text-mc-dim">
            2-3 minute classroom drop-ins. Public sources only.
          </span>
        </div>
        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {historicalVignettes.map((h) => (
            <button
              key={h.id}
              onClick={() => openHistorical(h.id)}
              className="group flex flex-col items-start gap-2 border border-mc-amber/30 bg-panel-fill p-3 text-left transition-colors hover:border-mc-amber hover:bg-mc-amber/5"
            >
              <div className="flex w-full items-start justify-between">
                <span className="text-2xl">{h.thumbnail}</span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-mc-dim">
                  {h.regime}
                </span>
              </div>
              <div className="font-mono text-sm text-mc-amber">{h.title}</div>
              <div className="text-[11px] text-mc-text leading-snug">{h.subtitle}</div>
              <div className="mt-auto flex w-full items-center justify-between pt-1">
                <span className="font-mono text-[10px] text-mc-dim">{h.era}</span>
                <span className="font-mono text-[10px] text-mc-amber">
                  {Math.round(h.estimatedRuntimeSec / 60)} min →
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      <footer className="flex items-center gap-6 font-mono text-[10px] uppercase tracking-widest text-mc-dim">
        <span>Space / 1-4 &mdash; pause &amp; time warp in Play</span>
        <span>Start with the Primer if this is your first time.</span>
        <button onClick={() => setRefsOpen(true)} className="text-mc-cyan hover:underline">
          References
        </button>
      </footer>
      {refsOpen && <References onClose={() => setRefsOpen(false)} />}
    </div>
  )
}
