import { useGame } from '../game/state'
import Button from './components/Button'
import Panel from './components/Panel'
import { R_EARTH } from '../physics/constants'

export default function Brief() {
  const mission = useGame((s) => s.mission)
  const mode = useGame((s) => s.mode)
  const vignette = useGame((s) => s.vignette)
  const setScreen = useGame((s) => s.setScreen)
  const setPaused = useGame((s) => s.setPaused)
  if (!mission) return null
  const isWatch = mode === 'watch'

  const start = () => {
    setScreen('game')
    // In Watch mode we start paused with the intro narration showing; cadet
    // clicks Play in WatchControls to begin. In Play mode we also start paused
    // so the player can plan a first burn.
    setPaused(true)
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-5xl flex-col gap-4 p-6">
      <header className="flex items-baseline justify-between">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-mc-dim">
            {isWatch ? 'Watch briefing' : 'Mission brief'}
          </div>
          <div className="text-3xl text-mc-cyan">{mission.name}</div>
          {isWatch && vignette && (
            <div className="mt-1 font-mono text-xs text-mc-amber">{vignette.subtitle}</div>
          )}
        </div>
        <Button onClick={() => setScreen('menu')}>&larr; Menu</Button>
      </header>

      {isWatch && vignette ? (
        <Panel title={vignette.intro.title}>
          <div className="space-y-3 p-4 text-sm leading-relaxed text-mc-text">
            <div>{vignette.intro.body}</div>
            {vignette.learningObjectives.length > 0 && (
              <div>
                <div className="panel-title mt-2 mb-1">Learning objectives</div>
                <ul className="list-inside list-disc text-xs">
                  {vignette.learningObjectives.map((o) => (
                    <li key={o}>{o}</li>
                  ))}
                </ul>
              </div>
            )}
            {vignette.intro.citation && (
              <div className="text-[10px] text-mc-dim">Source: {vignette.intro.citation}</div>
            )}
          </div>
        </Panel>
      ) : (
        <Panel title="Situation">
          <div className="p-4 text-sm leading-relaxed text-mc-text">{mission.brief}</div>
        </Panel>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Panel title="Loadout">
          <div className="p-3 text-xs">
            {mission.spacecraft.map((s) => (
              <div key={s.id} className="mb-3 border border-mc-cyan/20 p-2">
                <div className="font-mono text-mc-cyan">
                  {s.name}{' '}
                  <span className="ml-2 text-[10px] uppercase tracking-widest text-mc-dim">
                    {s.side} / {s.regime}
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-0.5 font-mono text-[11px] text-mc-text">
                  <span className="text-mc-dim">altitude</span>
                  <span>{((s.coe.a - R_EARTH) / 1000).toFixed(0)} km</span>
                  <span className="text-mc-dim">eccentricity</span>
                  <span>{s.coe.e.toFixed(4)}</span>
                  <span className="text-mc-dim">inclination</span>
                  <span>{((s.coe.i * 180) / Math.PI).toFixed(1)}&deg;</span>
                  <span className="text-mc-dim">true anomaly</span>
                  <span>{((s.coe.nu * 180) / Math.PI).toFixed(1)}&deg;</span>
                  <span className="text-mc-dim">dry mass</span>
                  <span>{s.dryMass} kg</span>
                  <span className="text-mc-dim">propellant</span>
                  <span>{s.propellantMass} kg</span>
                  <span className="text-mc-dim">Isp</span>
                  <span>{s.isp} s</span>
                  <span className="text-mc-dim">power</span>
                  <span>{s.power} W</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <div className="flex flex-col gap-4">
          <Panel title="Teaching targets">
            <ul className="list-inside list-disc space-y-1 p-3 text-xs text-mc-text">
              {mission.teachingTargets.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </Panel>
          {mission.initialGuidance && !isWatch && (
            <Panel title="Tip">
              <div className="p-3 text-xs italic text-mc-amber">{mission.initialGuidance}</div>
            </Panel>
          )}
          {!isWatch && (
            <Panel title="Victory conditions">
              <div className="p-3 font-mono text-[11px] text-mc-text">
                {mission.success.kind === 'holdStation' && (
                  <div>
                    Hold range &lt; {mission.success.rangeKmMax} km and relative speed &lt;{' '}
                    {mission.success.relSpeedMsMax} m/s for {mission.success.holdSeconds}s.
                  </div>
                )}
                {mission.success.kind === 'inspectionProfile' && (
                  <div>
                    V-bar station at {mission.success.vbarKm} km for{' '}
                    {Math.round(mission.success.holdSeconds / 60)} min, collect, depart past{' '}
                    {mission.success.departRangeKm} km.
                    <div className="mt-1 text-mc-dim">
                      Attribution &le; {mission.success.attributionMax} throughout.
                    </div>
                  </div>
                )}
                {mission.success.kind === 'maintainLinkDepart' && (
                  <div>
                    Maintain link (not Denied) for{' '}
                    {Math.round(mission.success.missionDurationSec / 60)} min and end with
                    adversary range &gt; {mission.success.departRangeKm} km.
                  </div>
                )}
                {mission.success.kind === 'observationCoverage' && (
                  <div>
                    Keep observation coverage &ge; {mission.success.coveragePctRequired}% for{' '}
                    {Math.round(mission.success.missionDurationSec / 60)} min using coordinated assets.
                    {mission.success.lowWaterFailPct !== undefined && (
                      <div className="mt-1 text-mc-dim">
                        Hard floor: coverage dropping below {mission.success.lowWaterFailPct}% fails the mission.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Panel>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={start} variant={isWatch ? 'warn' : 'default'}>
          {isWatch ? '▶ Begin Watch' : 'Launch Mission →'}
        </Button>
      </div>
    </div>
  )
}
