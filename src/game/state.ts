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
import type { CatsAngleResult } from '../engagement/cats'
import type { PassiveSafetyResult } from '../engagement/passive-safety'
import type { BadgeUnlock } from '../progression/types'
import { loadBadgeUnlocks, saveBadgeUnlocks } from '../progression/storage'

export type LinkStatus = 'nominal' | 'degraded' | 'denied'
export type MissionStatus = 'active' | 'success' | 'failure'
export type ViewMode = 'map' | 'prox'
// v1.3: 2D vs 3D rendering. Default '2d' preserves v1.2 behavior exactly.
export type ViewMode3D = '2d' | '3d'
export type ScalePreset = 'regime' | 'close' | 'proximity' | 'free'
export type Screen = 'menu' | 'brief' | 'game' | 'debrief' | 'historical' | 'sandbox' | 'learning'
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
  // v1.3+ tactical-action planning. Cadets select a set of actions to commit
  // as a single batch rather than firing each one immediately on click. This
  // mirrors the maneuver planner's commit/cancel pattern.
  plannedActions: Set<string>
  // v1.4 engagement considerations. All advisory; no scoring impact in v1.4.
  catsAngle: CatsAngleResult | null
  passiveSafety: PassiveSafetyResult | null
  tenToOneShownThisRun: boolean
  // v1.4 RPO phase indicator (separate from the existing `currentPhase` which
  // is used by Watch vignettes). This one is derived from orbital geometry.
  rpoPhase: 'plane_matching' | 'shape_align' | 'phasing' | 'close_in'
  // v1.4 Learning Track. Reading-list sidebar and section nav use this slice.
  // Persists for the session only; not part of the mission state.
  learning: {
    activeSection: number
    completed: boolean[]
    problemAnswers: Record<string, { correct: boolean; firstTry: boolean }>
  }
  // v1.4 Progression. Unlocked badges are persisted to localStorage. The
  // toast queue holds newly-unlocked badge ids for transient display; the UI
  // drains it as each toast finishes.
  badges: {
    unlocked: Record<string, BadgeUnlock>
    toastQueue: string[]
  }
  // Per-run tracking for badges that observe behavior across a single mission.
  runTracking: {
    tenToOneViolatedThisRun: boolean
    reachedCloseInThisRun: boolean
    exitedPlaneMatchingThisRun: boolean
  }
  // Discovery tracking that persists across runs (in-memory; not localStorage
  // by design — re-derived when the user revisits).
  historicalsOpened: Set<string>
  sandboxModesVisited: Set<'perch' | 'drift' | 'nmc'>
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
  plannedActions: new Set<string>(),
  catsAngle: null,
  passiveSafety: null,
  tenToOneShownThisRun: false,
  rpoPhase: 'phasing',
  learning: {
    activeSection: 0,
    completed: [],
    problemAnswers: {},
  },
  badges: {
    unlocked: loadBadgeUnlocks(),
    toastQueue: [],
  },
  runTracking: {
    tenToOneViolatedThisRun: false,
    reachedCloseInThisRun: false,
    exitedPlaneMatchingThisRun: false,
  },
  historicalsOpened: new Set<string>(),
  sandboxModesVisited: new Set<'perch' | 'drift' | 'nmc'>(),
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
  togglePlannedAction: (id: string) => void
  clearPlannedActions: () => void
  commitPlannedActions: () => void
  // v1.3+ unified planning commits.
  // commitPlannedManeuver: take the live preview and convert it into a real
  // scheduled plannedManeuver that the sim will fire at burn time.
  commitPlannedManeuver: () => void
  // commitAllPlanned: run commitPlannedManeuver + commitPlannedActions in one
  // call, used by the PlanCommitBar's "Commit All" button.
  commitAllPlanned: () => void
  // v1.4 engagement state setters.
  setCatsAngle: (r: CatsAngleResult | null) => void
  setPassiveSafety: (r: PassiveSafetyResult | null) => void
  setTenToOneShown: (v: boolean) => void
  setRpoPhase: (p: GameState['rpoPhase']) => void
  // v1.4 Learning Track setters.
  setLearningSection: (i: number) => void
  markLearningSectionDone: (i: number) => void
  recordProblemAnswer: (problemId: string, correct: boolean) => void
  // v1.4 Progression setters.
  unlockBadge: (id: string) => void
  dismissBadgeToast: (id: string) => void
  markHistoricalOpened: (id: string) => void
  markSandboxModeVisited: (mode: 'perch' | 'drift' | 'nmc') => void
  markTenToOneViolated: () => void
  markCloseInReached: () => void
  markPlaneMatchingExited: () => void
  resetRunTracking: () => void
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
    const cur = useGame.getState()
    set({
      ...buildMissionInit(m, mode, vignette),
      // Preserve session-persistent progression state across mission boundaries.
      badges: cur.badges,
      historicalsOpened: cur.historicalsOpened,
      sandboxModesVisited: cur.sandboxModesVisited,
      // Reset per-run badge tracking on each new mission.
      runTracking: {
        tenToOneViolatedThisRun: false,
        reachedCloseInThisRun: false,
        exitedPlaneMatchingThisRun: false,
      },
    })
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
  endMission: (status, debrief) => {
    set({ missionStatus: status, debrief, screen: 'debrief', paused: true })
    queueMicrotask(() => {
      const st = useGame.getState()
      if (status !== 'success') return
      const id = st.missionId
      // Mission completion badges.
      if (id === 'm0_primer') st.unlockBadge('primer_watched')
      else if (id === 'm1_first_light') st.unlockBadge('m1_complete')
      else if (id === 'm2_quiet_inspector') st.unlockBadge('m2_complete')
      else if (id === 'm3_contested_approach') st.unlockBadge('m3_complete')
      else if (id === 'm4_handoff') st.unlockBadge('m4_complete')
      // Discipline / discovery badges that observe whole-mission behavior.
      if (!st.runTracking.tenToOneViolatedThisRun && id && id !== 'm0_primer') {
        st.unlockBadge('within_the_rule')
      }
      if (st.runTracking.exitedPlaneMatchingThisRun) st.unlockBadge('plane_match')
      if (st.runTracking.reachedCloseInThisRun) st.unlockBadge('close_in')
      // Efficient Op: spent less than one year of operational life.
      const spent = st.operationalLife.initialYears - st.operationalLife.currentYears
      if (id && id !== 'm0_primer' && spent < 1) st.unlockBadge('efficient_op')
    })
  },
  resetRun: () =>
    set((s) => {
      if (!s.mission) return {}
      return {
        ...buildMissionInit(s.mission, s.mode, s.vignette),
        screen: 'game',
        paused: true,
        // Preserve session-persistent progression state on retry.
        badges: s.badges,
        historicalsOpened: s.historicalsOpened,
        sandboxModesVisited: s.sandboxModesVisited,
      }
    }),
  dismissTeachingModal: () => set({ activeTeachingModal: null, paused: false }),
  setVignetteMode: (mode, v = null) => set({ mode, vignette: v }),
  openHistorical: (id) => {
    set((s) => {
      const opened = new Set(s.historicalsOpened)
      opened.add(id)
      return {
        screen: 'historical',
        activeHistoricalId: id,
        historicalSnapshotIdx: 0,
        historicalPlaybackTimeSec: 0,
        historicalPaused: true,
        historicalSpeed: 1,
        historicalPromptIdx: 0,
        historicalInstructorView: false,
        historicalsOpened: opened,
      }
    })
    // Defer to next tick so the badge toast appears after the screen flip.
    queueMicrotask(() => {
      const st = useGame.getState()
      // Historian: 5 historical vignettes total.
      if (st.historicalsOpened.size >= 5) st.unlockBadge('historian')
    })
  },
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
  togglePlannedAction: (id) =>
    set((s) => {
      const next = new Set(s.plannedActions)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return { plannedActions: next }
    }),
  clearPlannedActions: () => set({ plannedActions: new Set<string>() }),
  commitPlannedManeuver: () => {
    const s = useGame.getState()
    const preview = s.plannedManeuverPreview
    if (!preview || preview.dvMag <= 0) return
    const ship = s.spacecraft[preview.craftId]
    const burnTimeSec = s.simTimeSec + Math.max(0, preview.burnOffsetSec)
    set({
      plannedManeuver: {
        shipId: preview.craftId,
        burnTimeSec,
        dvRic: preview.dvRic,
      },
      plannedManeuverPreview: null,
    })
    queueMicrotask(() => {
      const st = useGame.getState()
      st.pushLog({
        t: s.simTimeSec,
        text: `${ship?.name ?? preview.craftId}: maneuver queued (${preview.dvMag.toFixed(
          2,
        )} m/s, ignites in ${Math.round(preview.burnOffsetSec)} s).`,
        tone: 'info',
      })
      // Discipline badges, evaluated at commit time.
      if (st.catsAngle?.favorability === 'favorable') st.unlockBadge('sun_at_back')
      if (st.passiveSafety?.reason === 'safe') st.unlockBadge('passive_safe')
    })
  },
  commitAllPlanned: () => {
    useGame.getState().commitPlannedManeuver()
    useGame.getState().commitPlannedActions()
  },
  setCatsAngle: (r) => set({ catsAngle: r }),
  setPassiveSafety: (r) => set({ passiveSafety: r }),
  setTenToOneShown: (v) => set({ tenToOneShownThisRun: v }),
  setRpoPhase: (p) => set({ rpoPhase: p }),
  setLearningSection: (i) =>
    set((s) => ({
      learning: { ...s.learning, activeSection: i },
    })),
  markLearningSectionDone: (i) => {
    set((s) => {
      const next = s.learning.completed.slice()
      next[i] = true
      return { learning: { ...s.learning, completed: next } }
    })
    queueMicrotask(() => {
      const st = useGame.getState()
      // 10 sections total — guard against length growth.
      const minSections = 10
      const done = st.learning.completed.filter(Boolean).length
      if (done >= minSections) st.unlockBadge('learning_complete')
    })
  },
  recordProblemAnswer: (problemId, correct) => {
    set((s) => {
      const prior = s.learning.problemAnswers[problemId]
      const firstTry = !prior && correct
      return {
        learning: {
          ...s.learning,
          problemAnswers: {
            ...s.learning.problemAnswers,
            [problemId]: { correct, firstTry: prior?.firstTry ?? firstTry },
          },
        },
      }
    })
    queueMicrotask(() => {
      const st = useGame.getState()
      const rec = st.learning.problemAnswers[problemId]
      if (!rec || !rec.correct || !rec.firstTry) {
        // Quiz Ace still possible if every quiz question was correct.
        const quizIds = ['q1_ric', 'q2_cw', 'q3_coes', 'q4_cats', 'q5_passive_safety']
        if (quizIds.every((qid) => st.learning.problemAnswers[qid]?.correct)) {
          st.unlockBadge('quiz_ace')
        }
        return
      }
      if (problemId === 'p1_perch') st.unlockBadge('perch_master')
      else if (problemId === 'p2_drift') st.unlockBadge('drift_master')
      else if (problemId === 'p3_nmc') st.unlockBadge('nmc_master')
      // Quiz: all 5 correct.
      const quizIds = ['q1_ric', 'q2_cw', 'q3_coes', 'q4_cats', 'q5_passive_safety']
      if (quizIds.every((qid) => st.learning.problemAnswers[qid]?.correct)) {
        st.unlockBadge('quiz_ace')
      }
    })
  },
  unlockBadge: (id) =>
    set((s) => {
      if (s.badges.unlocked[id]) return {}
      const next = { ...s.badges.unlocked, [id]: { id, unlockedAt: Date.now() } }
      saveBadgeUnlocks(next)
      return {
        badges: {
          unlocked: next,
          toastQueue: [...s.badges.toastQueue, id],
        },
      }
    }),
  dismissBadgeToast: (id) =>
    set((s) => ({
      badges: {
        ...s.badges,
        toastQueue: s.badges.toastQueue.filter((x) => x !== id),
      },
    })),
  markHistoricalOpened: (id) =>
    set((s) => {
      if (s.historicalsOpened.has(id)) return {}
      const next = new Set(s.historicalsOpened)
      next.add(id)
      return { historicalsOpened: next }
    }),
  markSandboxModeVisited: (mode) => {
    set((s) => {
      if (s.sandboxModesVisited.has(mode)) return {}
      const next = new Set(s.sandboxModesVisited)
      next.add(mode)
      return { sandboxModesVisited: next }
    })
    queueMicrotask(() => {
      const st = useGame.getState()
      if (st.sandboxModesVisited.size >= 3) st.unlockBadge('sandbox_explorer')
    })
  },
  markTenToOneViolated: () =>
    set((s) => ({ runTracking: { ...s.runTracking, tenToOneViolatedThisRun: true } })),
  markCloseInReached: () =>
    set((s) => ({ runTracking: { ...s.runTracking, reachedCloseInThisRun: true } })),
  markPlaneMatchingExited: () =>
    set((s) => ({ runTracking: { ...s.runTracking, exitedPlaneMatchingThisRun: true } })),
  resetRunTracking: () =>
    set({
      runTracking: {
        tenToOneViolatedThisRun: false,
        reachedCloseInThisRun: false,
        exitedPlaneMatchingThisRun: false,
      },
    }),
  commitPlannedActions: () => {
    // Lazy import to avoid a state.ts <-> actionRunner.ts cycle.
    void import('./actionRunner').then(({ invokeAction }) => {
      const ids = Array.from(useGame.getState().plannedActions)
      for (const id of ids) {
        // Each call reads the latest state through Zustand's set callback so
        // sequential effects (e.g. emcon + freq_hop) see each other's patches.
        useGame.setState((state) => {
          const store = state as GameStore
          const out = invokeAction(store, id)
          if (!out) return {}
          if (out.logText) {
            queueMicrotask(() =>
              useGame
                .getState()
                .pushLog({ t: store.simTimeSec, text: out.logText, tone: out.tone ?? 'info' }),
            )
          }
          return out.patch
        })
      }
      // Clear the plan after committing.
      set({ plannedActions: new Set<string>() })
    })
  },
}))

// A small helper to recover a ship's COE from its current state vector.
export const coeOf = (sc: SpacecraftState) =>
  stateToCoe({ r: sc.rEci, v: sc.vEci }, MU_EARTH)
