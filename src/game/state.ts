import { create } from 'zustand'
import { MU_EARTH } from '../physics/constants'
import { coeToState, stateToCoe } from '../physics/orbital-elements'
import type { Vec3 } from '../physics/vec'
import type {
  EmitterConfig,
  GroundStation,
  Mission,
  SensorConfig,
  SpacecraftLoadout,
} from '../missions/types'
import type { NarrationBlock, VignetteScript } from '../vignettes/types'
import { budgetFromMass, lifeYearsFromDv } from './operational-life'

export type LinkStatus = 'nominal' | 'degraded' | 'denied'
export type MissionStatus = 'active' | 'success' | 'failure'
export type ViewMode = 'map' | 'prox'
// v1.3: 2D vs 3D rendering. Default '2d' preserves v1.2 behavior exactly.
export type ViewMode3D = '2d' | '3d'
export type ScalePreset = 'regime' | 'close' | 'proximity' | 'free'
export type Screen = 'menu' | 'brief' | 'game' | 'debrief' | 'historical' | 'sandbox'
// v1.1: widened to include Watch-mode speeds (0.5, 2, 4) alongside Play-mode warps.
export type TimeWarp = 0.5 | 1 | 2 | 4 | 10 | 100 | 1000
export type GameMode = 'play' | 'watch'

export interface SpacecraftState {
  id: string
  name: string
  side: 'blue' | 'red' | 'neutral'
  regime: 'LEO' | 'GEO'
  rEci: Vec3
  vEci: Vec3
  mass: number
  dryMass: number
  propellantMass: number
  isp: number
  power: number
  sensors: SensorConfig[]
  emitters: EmitterConfig[]
  boresightRic: Vec3
  hardened: boolean
  status: 'nominal' | 'degraded' | 'lost'
}

// Planned maneuver: a scheduled impulse at a future sim time, expressed in the
// ship's own RIC frame at burn time.
export interface PlannedManeuver {
  shipId: string
  burnTimeSec: number // absolute sim time
  dvRic: Vec3
}

// v1.3 maneuver preview. Computed live from the maneuver panel inputs (before
// commit). Purely a visualization aid — sim never reads this. Once the player
// hits "Commit," the preview becomes a PlannedManeuver and the preview clears.
import type { COE } from '../physics/orbital-elements'
export interface PlannedManeuverPreview {
  craftId: string
  dvRic: Vec3
  burnOffsetSec: number
  // Derived (recomputed on each change):
  currentElements: COE
  projectedElements: COE
  burnPointEci: Vec3
  thrustVectorEci: Vec3
  dvMag: number
  timeToAchieveSec: number
  costYears: number
}

// Planned tactical action: a named effect selected for this turn.
export interface PlannedAction {
  shipId: string
  actionId: string
  // Optional target id — e.g. for jam, point-away, etc.
  targetId?: string
}

export interface LogEvent {
  t: number
  text: string
  tone?: 'info' | 'warn' | 'danger' | 'success'
}

export interface DebriefData {
  status: MissionStatus
  endTimeSec: number
  totalDvUsed: number
  actionsTaken: { actionId: string; t: number }[]
  rangeSamples: { t: number; range: number }[]
  dvSamples: { t: number; dvUsed: number }[]
  attributionSamples: { t: number; attribution: number }[]
  linkSamples: { t: number; status: LinkStatus }[]
  notes: string[]
  realWorldCallout: Mission['realWorldCallout'] | null
  missionName: string
}

export interface GameState {
  screen: Screen
  missionId: string | null
  mission: Mission | null
  turn: number
  simTimeSec: number
  paused: boolean
  timeWarp: TimeWarp
  spacecraft: Record<string, SpacecraftState>
  plannedManeuver: PlannedManeuver | null
  // Active tactical-action effects (set by actions, cleared by expirations)
  activeEffects: Record<string, ActiveEffect>
  attributionRisk: number // 0..100
  linkStatus: LinkStatus
  log: LogEvent[]
  viewMode: ViewMode
  debrief: DebriefData | null
  missionStatus: MissionStatus
  // Accumulators
  totalDvUsed: number // m/s (magnitude-summed)
  holdTimerSec: number // seconds of contiguous success-condition hold
  inspectionCollected: boolean
  linkDeniedStreakSec: number
  actionsTaken: { actionId: string; t: number }[]
  rangeSamples: { t: number; range: number }[]
  dvSamples: { t: number; dvUsed: number }[]
  attributionSamples: { t: number; attribution: number }[]
  linkSamples: { t: number; status: LinkStatus }[]
  adversaryScriptIdx: number
  groundStation: GroundStation | null
  // v1.2 Historical Ops
  activeHistoricalId: string | null
  historicalSnapshotIdx: number
  historicalPlaybackTimeSec: number
  historicalPaused: boolean
  historicalSpeed: 0.5 | 1 | 2 | 4
  historicalPromptIdx: number
  historicalInstructorView: boolean
  // v1.2 Multi-asset missions
  activeAssetId: string | null
  perAssetDvUsed: Record<string, number>
  observationCoverage: {
    totalTicks: number
    coveredTicks: number
    currentPct: number
    lowWaterMark: number
    samples: { t: number; pct: number }[]
  }
  // v1.2 AI Coach
  coachRequest: {
    status: 'idle' | 'pending' | 'success' | 'error'
    response: string | null
    error: string | null
  }
  // v1.3 3D layer
  viewMode3D: ViewMode3D
  scalePreset: ScalePreset
  plannedManeuverPreview: PlannedManeuverPreview | null
  // v1.1 Watch mode
  mode: GameMode
  vignette: VignetteScript | null
  firedWaypointIds: Set<string>
  activeNarration: NarrationBlock | null
  activeTeachingModal: NarrationBlock | null
  currentPhase: string | null
  conceptsObserved: string[]
  operationalLife: {
    initialYears: number
    currentYears: number
    lastDeltaYears: number
    lastDeltaAtSec: number // sim time when last burn fired, for transient chip timing
    regime: 'LEO' | 'GEO'
  }
}

export interface ActiveEffect {
  id: string // same as action id
  shipId: string // source
  startedAt: number
  endsAt: number | null // null = until explicitly ended
  payload?: Record<string, unknown>
}

const loadoutToSpacecraft = (l: SpacecraftLoadout): SpacecraftState => {
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

export const initialGameState = (): GameState => ({
  screen: 'menu',
  missionId: null,
  mission: null,
  turn: 0,
  simTimeSec: 0,
  paused: true,
  timeWarp: 1,
  spacecraft: {},
  plannedManeuver: null,
  activeEffects: {},
  attributionRisk: 0,
  linkStatus: 'nominal',
  log: [],
  viewMode: 'map',
  debrief: null,
  missionStatus: 'active',
  totalDvUsed: 0,
  holdTimerSec: 0,
  inspectionCollected: false,
  linkDeniedStreakSec: 0,
  actionsTaken: [],
  rangeSamples: [],
  dvSamples: [],
  attributionSamples: [],
  linkSamples: [],
  adversaryScriptIdx: 0,
  groundStation: null,
  mode: 'play',
  vignette: null,
  firedWaypointIds: new Set<string>(),
  activeNarration: null,
  activeTeachingModal: null,
  currentPhase: null,
  conceptsObserved: [],
  operationalLife: {
    initialYears: 0,
    currentYears: 0,
    lastDeltaYears: 0,
    lastDeltaAtSec: -Infinity,
    regime: 'LEO',
  },
  activeHistoricalId: null,
  historicalSnapshotIdx: 0,
  historicalPlaybackTimeSec: 0,
  historicalPaused: true,
  historicalSpeed: 1,
  historicalPromptIdx: 0,
  historicalInstructorView: false,
  activeAssetId: null,
  perAssetDvUsed: {},
  observationCoverage: {
    totalTicks: 0,
    coveredTicks: 0,
    currentPct: 100,
    lowWaterMark: 100,
    samples: [],
  },
  coachRequest: {
    status: 'idle',
    response: null,
    error: null,
  },
  viewMode3D: '2d',
  scalePreset: 'regime',
  plannedManeuverPreview: null,
})

// Seed operational-life state from a mission's player loadout.
export const opLifeFromLoadout = (l: SpacecraftLoadout): GameState['operationalLife'] => {
  const budget = budgetFromMass(l.dryMass, l.propellantMass, l.isp)
  const years = lifeYearsFromDv(budget, l.regime)
  return {
    initialYears: years,
    currentYears: years,
    lastDeltaYears: 0,
    lastDeltaAtSec: -Infinity,
    regime: l.regime,
  }
}

// The full store type combines state + actions.
export interface GameStore extends GameState {
  setScreen: (s: Screen) => void
  loadMission: (m: Mission, opts?: { mode?: GameMode; vignette?: VignetteScript | null }) => void
  setPaused: (p: boolean) => void
  togglePaused: () => void
  setTimeWarp: (t: TimeWarp) => void
  setViewMode: (v: ViewMode) => void
  setPlannedManeuver: (m: PlannedManeuver | null) => void
  commitManeuver: () => void // no-op; impulse is applied by the sim tick at burn time
  pushLog: (e: LogEvent) => void
  applyStateUpdate: (fn: (s: GameStore) => Partial<GameStore>) => void
  setActiveEffect: (id: string, eff: ActiveEffect | null) => void
  endMission: (status: MissionStatus, debrief: DebriefData) => void
  resetRun: () => void
  dismissTeachingModal: () => void
  setVignetteMode: (mode: GameMode, v?: VignetteScript | null) => void
  // v1.2
  openHistorical: (id: string) => void
  closeHistorical: () => void
  setHistoricalPaused: (p: boolean) => void
  setHistoricalSpeed: (s: 0.5 | 1 | 2 | 4) => void
  setHistoricalSnapshot: (idx: number) => void
  tickHistorical: (dtSec: number) => void
  setHistoricalPrompt: (idx: number) => void
  toggleInstructorView: () => void
  setActiveAsset: (id: string) => void
  setCoachRequest: (r: Partial<GameState['coachRequest']>) => void
  setViewMode3D: (m: ViewMode3D) => void
  setScalePreset: (p: ScalePreset) => void
  setPlannedManeuverPreview: (p: PlannedManeuverPreview | null) => void
}

const buildMissionInit = (
  m: Mission,
  mode: GameMode,
  vignette: VignetteScript | null,
): Partial<GameState> => {
  const spacecraft: Record<string, SpacecraftState> = {}
  for (const l of m.spacecraft) spacecraft[l.id] = loadoutToSpacecraft(l)
  const player = m.spacecraft.find((s) => s.id === m.playerId) ?? m.spacecraft[0]
  const perAssetDvUsed: Record<string, number> = {}
  if (m.assets) {
    for (const id of m.assets) perAssetDvUsed[id] = 0
  }
  return {
    ...initialGameState(),
    missionId: m.id,
    mission: m,
    spacecraft,
    viewMode: m.initialViewMode ?? 'map',
    groundStation: m.groundStation ?? null,
    mode,
    vignette: vignette ?? null,
    activeNarration: vignette?.intro ?? null,
    currentPhase: null,
    operationalLife: opLifeFromLoadout(player),
    activeAssetId: m.assets ? m.assets[0] : null,
    perAssetDvUsed,
  }
}

export const useGame = create<GameStore>()((set) => ({
  ...initialGameState(),
  setScreen: (s) => set({ screen: s }),
  loadMission: (m, opts) => {
    const mode = opts?.mode ?? 'play'
    const vignette = opts?.vignette ?? null
    set(buildMissionInit(m, mode, vignette))
  },
  setPaused: (p) => set({ paused: p }),
  togglePaused: () => set((s) => ({ paused: !s.paused })),
  setTimeWarp: (t) => set({ timeWarp: t }),
  setViewMode: (v) => set({ viewMode: v }),
  setPlannedManeuver: (mm) => set({ plannedManeuver: mm }),
  commitManeuver: () => set({}),
  pushLog: (e) => set((s) => ({ log: [...s.log.slice(-199), e] })),
  applyStateUpdate: (fn) => set((s) => fn(s)),
  setActiveEffect: (id, eff) =>
    set((s) => {
      const next = { ...s.activeEffects }
      if (eff === null) delete next[id]
      else next[id] = eff
      return { activeEffects: next }
    }),
  endMission: (status, debrief) =>
    set({ missionStatus: status, debrief, screen: 'debrief', paused: true }),
  resetRun: () =>
    set((s) => {
      if (!s.mission) return {}
      return {
        ...buildMissionInit(s.mission, s.mode, s.vignette),
        screen: 'game',
        paused: true,
      }
    }),
  dismissTeachingModal: () => set({ activeTeachingModal: null, paused: false }),
  setVignetteMode: (mode, v = null) => set({ mode, vignette: v }),
  openHistorical: (id) =>
    set({
      screen: 'historical',
      activeHistoricalId: id,
      historicalSnapshotIdx: 0,
      historicalPlaybackTimeSec: 0,
      historicalPaused: true,
      historicalSpeed: 1,
      historicalPromptIdx: 0,
      historicalInstructorView: false,
    }),
  closeHistorical: () =>
    set({
      screen: 'menu',
      activeHistoricalId: null,
      historicalSnapshotIdx: 0,
      historicalPlaybackTimeSec: 0,
      historicalPaused: true,
      historicalPromptIdx: 0,
      historicalInstructorView: false,
    }),
  setHistoricalPaused: (p) => set({ historicalPaused: p }),
  setHistoricalSpeed: (s) => set({ historicalSpeed: s }),
  setHistoricalSnapshot: (idx) => set({ historicalSnapshotIdx: idx }),
  tickHistorical: (dtSec) =>
    set((s) => ({ historicalPlaybackTimeSec: s.historicalPlaybackTimeSec + dtSec })),
  setHistoricalPrompt: (idx) => set({ historicalPromptIdx: idx }),
  toggleInstructorView: () =>
    set((s) => ({ historicalInstructorView: !s.historicalInstructorView })),
  setActiveAsset: (id) => set({ activeAssetId: id }),
  setCoachRequest: (r) =>
    set((s) => ({ coachRequest: { ...s.coachRequest, ...r } })),
  setViewMode3D: (m) => set({ viewMode3D: m }),
  setScalePreset: (p) => set({ scalePreset: p }),
  setPlannedManeuverPreview: (p) => set({ plannedManeuverPreview: p }),
}))

// A small helper to recover a ship's COE from its current state vector.
export const coeOf = (sc: SpacecraftState) =>
  stateToCoe({ r: sc.rEci, v: sc.vEci }, MU_EARTH)
