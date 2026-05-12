// Integration test: drive each vignette through the sim loop and assert that
// every waypoint fires, the sim reaches the outro, and state stays finite.
// This does not render anything; it just exercises the deterministic runner.
import { describe, expect, it } from 'vitest'
import { missionsById } from '../missions'
import { vignettes } from './index'
import {
  initialGameState,
  opLifeFromLoadout,
  type GameStore,
  type SpacecraftState,
} from '../game/state'
import { coeToState } from '../physics/orbital-elements'
import { MU_EARTH } from '../physics/constants'
import { simStep } from '../game/turn'
import type { SpacecraftLoadout } from '../missions/types'

const loadoutToSc = (l: SpacecraftLoadout): SpacecraftState => {
  const { r, v } = coeToState(l.coe, MU_EARTH)
  return {
    id: l.id,
    name: l.name,
    side: l.side,
    regime: l.regime,
    rEci: r,
    vEci: v,
    mass: l.dryMass + l.propellantMass,
    dryMass: l.dryMass,
    propellantMass: l.propellantMass,
    isp: l.isp,
    power: l.power,
    sensors: l.sensors ?? [],
    emitters: (l.emitters ?? []).map((e) => ({ ...e })),
    boresightRic: l.boresightRic ?? [0, 1, 0],
    hardened: l.hardened ?? false,
    status: 'nominal',
  }
}

const buildInitialState = (vignetteId: string): GameStore => {
  const v = vignettes.find((x) => x.id === vignetteId)!
  const mission = missionsById[v.missionId]!
  const spacecraft: Record<string, SpacecraftState> = {}
  for (const l of mission.spacecraft) spacecraft[l.id] = loadoutToSc(l)
  const playerLoadout = mission.spacecraft.find((s) => s.id === mission.playerId)!

  const base: GameStore = {
    ...initialGameState(),
    screen: 'game',
    missionId: mission.id,
    mission,
    spacecraft,
    mode: 'watch',
    vignette: v,
    paused: false,
    viewMode: mission.initialViewMode ?? 'map',
    operationalLife: opLifeFromLoadout(playerLoadout),
    // stub actions (tests don't exercise them)
    setScreen: () => {},
    loadMission: () => {},
    setPaused: () => {},
    togglePaused: () => {},
    setTimeWarp: () => {},
    setViewMode: () => {},
    setPlannedManeuver: () => {},
    commitManeuver: () => {},
    pushLog: () => {},
    applyStateUpdate: () => {},
    setActiveEffect: () => {},
    endMission: () => {},
    resetRun: () => {},
    dismissTeachingModal: () => {},
    setVignetteMode: () => {},
    openHistorical: () => {},
    closeHistorical: () => {},
    setHistoricalPaused: () => {},
    setHistoricalSpeed: () => {},
    setHistoricalSnapshot: () => {},
    tickHistorical: () => {},
    setHistoricalPrompt: () => {},
    toggleInstructorView: () => {},
    setActiveAsset: () => {},
    setCoachRequest: () => {},
    setViewMode3D: () => {},
    setScalePreset: () => {},
    setPlannedManeuverPreview: () => {},
  }
  return base
}

// Drive sim forward in 30-second steps. If a teach_pause fires (paused=true),
// dismiss the modal and resume (mirrors what the user would do). Stop when
// the mission concludes or we exceed a safety cap.
const drive = (v: (typeof vignettes)[number]) => {
  let state = buildInitialState(v.id)
  const safetyCap = v.totalDurationSec * 4 + 1000
  let simTime = 0
  let iterations = 0
  const maxIterations = 5000

  while (state.missionStatus === 'active' && simTime < safetyCap && iterations < maxIterations) {
    iterations++
    const stepSize = state.paused ? 0 : 30

    if (state.paused && state.activeTeachingModal) {
      // Dismiss as the user would.
      state = { ...state, activeTeachingModal: null, paused: false }
      continue
    }
    if (state.paused) {
      // Safety: unpause if paused without a modal (shouldn't normally happen).
      state = { ...state, paused: false }
      continue
    }

    const patch = simStep(state, stepSize)
    state = { ...state, ...patch }
    simTime = state.simTimeSec
  }

  return { finalState: state, iterations }
}

describe('vignettes integration', () => {
  for (const v of vignettes) {
    it(`${v.id} runs to completion with all waypoints fired`, () => {
      const { finalState, iterations } = drive(v)

      // Every waypoint has fired.
      expect(finalState.firedWaypointIds.size).toBe(v.waypoints.length)
      for (const wp of v.waypoints) {
        expect(finalState.firedWaypointIds.has(wp.id)).toBe(true)
      }

      // Sim reached success (vignette completed).
      expect(finalState.missionStatus).toBe('success')

      // All spacecraft state vectors are finite (no NaN explosions).
      for (const s of Object.values(finalState.spacecraft)) {
        for (const x of s.rEci) expect(Number.isFinite(x)).toBe(true)
        for (const x of s.vEci) expect(Number.isFinite(x)).toBe(true)
        expect(s.propellantMass).toBeGreaterThanOrEqual(0)
      }

      // Operational life is non-negative and less than or equal to initial.
      expect(finalState.operationalLife.currentYears).toBeGreaterThanOrEqual(0)
      expect(finalState.operationalLife.currentYears).toBeLessThanOrEqual(
        finalState.operationalLife.initialYears + 1e-6,
      )

      // Concepts observed equals the number of teach_pause waypoints encountered.
      const teachPauses = v.waypoints.filter((w) => w.kind === 'teach_pause').length
      expect(finalState.conceptsObserved.length).toBe(teachPauses)

      // Finite iteration count (otherwise the loop infinite-paused somewhere).
      expect(iterations).toBeLessThan(5000)
    })
  }

  it('primer: ends with at least one LEO-rate worth of operational-life reduction', () => {
    const v = vignettes.find((x) => x.id === 'v0_primer')!
    const { finalState } = drive(v)
    const dropYears = finalState.operationalLife.initialYears - finalState.operationalLife.currentYears
    // 78 m/s spent / 30 m/s/yr LEO = 2.6 years.
    expect(dropYears).toBeGreaterThan(2)
    expect(dropYears).toBeLessThan(4)
  })

  it('mission 2 watch: collect action is applied', () => {
    const v = vignettes.find((x) => x.id === 'v2_quiet_inspector')!
    const { finalState } = drive(v)
    // inspection_collect should be in actionsTaken.
    const collects = finalState.actionsTaken.filter((a) => a.actionId === 'inspection_collect')
    expect(collects.length).toBeGreaterThanOrEqual(1)
  })

  it('mission 3 watch: point_away and frequency_agility are applied', () => {
    const v = vignettes.find((x) => x.id === 'v3_contested_approach')!
    const { finalState } = drive(v)
    const ids = finalState.actionsTaken.map((a) => a.actionId)
    expect(ids).toContain('threat_characterization')
    expect(ids).toContain('point_away')
    expect(ids).toContain('frequency_agility')
  })
})
