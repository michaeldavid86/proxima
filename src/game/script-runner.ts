// Vignette script runner — fires waypoints at their scheduled sim time.
//
// Design: the runner is a pure function over the current GameStore state.
// simStep (turn.ts) calls `runScriptWaypoints(state, dt)` inside each sub-step
// immediately after simulation propagation. Waypoints whose t_sim falls
// inside [simTime - dt, simTime] and are not yet fired are applied in order.
//
// Idempotence: each waypoint carries a unique id; we track a Set of fired ids
// in state. The runner never re-fires. This is also how scrub-restart works:
// resetRun() wipes the Set, then the loop naturally catches all waypoints up
// to the scrub target as sim time advances.

import { applyImpulseEci, propellantUsed } from '../physics/maneuver'
import { ricBasisOf, ricToEci } from '../physics/frames'
import type { Vec3 } from '../physics/vec'
import { lifeYearsFromDv, budgetFromMass } from './operational-life'
import { actionsById } from './actions'
import { invokeAction } from './actionRunner'
import type { GameStore, SpacecraftState } from './state'
import type { ManeuverDirection, Waypoint } from '../vignettes/types'

// Resolve a direction label to a unit vector in the appropriate RIC frame.
// For target-relative directions (vbar_*, rbar_*), the basis is the target
// spacecraft's RIC; for own-frame directions, it is the commanding ship's own.
const resolveDirectionEci = (
  direction: ManeuverDirection,
  ship: SpacecraftState,
  target: SpacecraftState | null,
): Vec3 => {
  const targetRelative =
    direction === 'vbar_plus' ||
    direction === 'vbar_minus' ||
    direction === 'rbar_plus' ||
    direction === 'rbar_minus'
  const basisShip = targetRelative && target ? target : ship
  const basis = ricBasisOf(basisShip.rEci, basisShip.vEci)
  // Map label to RIC-frame unit vector.
  let ric: Vec3
  switch (direction) {
    case 'prograde':
      ric = [0, 1, 0]
      break
    case 'retrograde':
      ric = [0, -1, 0]
      break
    case 'radial_out':
      ric = [1, 0, 0]
      break
    case 'radial_in':
      ric = [-1, 0, 0]
      break
    case 'normal':
      ric = [0, 0, 1]
      break
    case 'anti_normal':
      ric = [0, 0, -1]
      break
    case 'vbar_plus':
      ric = [0, 1, 0]
      break
    case 'vbar_minus':
      ric = [0, -1, 0]
      break
    case 'rbar_plus':
      ric = [1, 0, 0]
      break
    case 'rbar_minus':
      ric = [-1, 0, 0]
      break
  }
  return ricToEci(ric, basis) as Vec3
}

const applyManeuverFromWaypoint = (
  state: GameStore,
  wp: Waypoint,
): Partial<GameStore> => {
  if (!wp.maneuver) return {}
  const ship = state.spacecraft[wp.maneuver.craftId]
  if (!ship) return {}
  const target = state.mission ? state.spacecraft[state.mission.targetId] ?? null : null
  const dirEci = resolveDirectionEci(wp.maneuver.direction, ship, target)
  const dvMag = wp.maneuver.dv_mps
  const dvEci: Vec3 = [dirEci[0] * dvMag, dirEci[1] * dvMag, dirEci[2] * dvMag]
  const vNew = applyImpulseEci(ship.vEci, { dvEci })
  const dm = propellantUsed(ship.mass, dvMag, ship.isp)
  const propNew = Math.max(0, ship.propellantMass - dm)
  const massNew = ship.dryMass + propNew
  const updated: SpacecraftState = {
    ...ship,
    vEci: vNew,
    propellantMass: propNew,
    mass: massNew,
  }

  const patch: Partial<GameStore> = {
    spacecraft: { ...state.spacecraft, [wp.maneuver.craftId]: updated },
    log: [
      ...state.log.slice(-199),
      {
        t: state.simTimeSec,
        text: `${ship.name}: ${wp.maneuver.label} (${dvMag.toFixed(2)} m/s).`,
        tone: 'info',
      },
    ],
  }

  // Only update budget/life when the commanding ship is the player.
  const craftId = wp.maneuver.craftId
  if (state.mission && craftId === state.mission.playerId) {
    const totalDvUsed = state.totalDvUsed + dvMag
    patch.totalDvUsed = totalDvUsed
    patch.dvSamples = [...state.dvSamples, { t: state.simTimeSec, dvUsed: totalDvUsed }]
    // Operational-life update. Use the MISSION-START loadout (never the
    // current ship mass) so we always subtract totalDvUsed from the same
    // reference budget and avoid compounding per-burn.
    const loadout = state.mission.spacecraft.find((s) => s.id === craftId)
    if (loadout) {
      const initialBudget = budgetFromMass(loadout.dryMass, loadout.propellantMass, loadout.isp)
      const remaining = Math.max(0, initialBudget - totalDvUsed)
      const yearsNew = lifeYearsFromDv(remaining, state.operationalLife.regime)
      const deltaYears = yearsNew - state.operationalLife.currentYears
      patch.operationalLife = {
        ...state.operationalLife,
        currentYears: yearsNew,
        lastDeltaYears: deltaYears,
        lastDeltaAtSec: state.simTimeSec,
      }
    }
  }
  return patch
}

const applyActionFromWaypoint = (state: GameStore, wp: Waypoint): Partial<GameStore> => {
  if (!wp.action) return {}
  const out = invokeAction(state, wp.action.actionId)
  if (!out) return {}
  const patch = { ...out.patch }
  patch.log = [
    ...state.log.slice(-199),
    { t: state.simTimeSec, text: out.logText, tone: out.tone ?? 'info' },
  ]
  void actionsById // keep import even if not directly used
  return patch
}

// Main entry point: consume any waypoints whose t_sim has passed.
export const runScriptWaypoints = (state: GameStore): Partial<GameStore> => {
  const v = state.vignette
  if (!v) return {}
  let patch: Partial<GameStore> = {}
  let working: GameStore = state
  const fired = new Set(state.firedWaypointIds)

  for (const wp of v.waypoints) {
    if (wp.t_sim > working.simTimeSec + 0.5) break // waypoints are sorted by t_sim
    if (fired.has(wp.id)) continue

    // Apply waypoint.
    switch (wp.kind) {
      case 'maneuver': {
        const p = applyManeuverFromWaypoint(working, wp)
        working = { ...working, ...p }
        Object.assign(patch, p)
        break
      }
      case 'action': {
        const p = applyActionFromWaypoint(working, wp)
        working = { ...working, ...p }
        Object.assign(patch, p)
        break
      }
      case 'narration': {
        if (wp.narration) {
          working = { ...working, activeNarration: wp.narration }
          patch.activeNarration = wp.narration
        }
        break
      }
      case 'teach_pause': {
        if (wp.teach) {
          working = { ...working, activeTeachingModal: wp.teach, paused: true }
          patch.activeTeachingModal = wp.teach
          patch.paused = true
          // Record concept observed for debrief.
          const concepts = [...working.conceptsObserved, wp.teach.title]
          working = { ...working, conceptsObserved: concepts }
          patch.conceptsObserved = concepts
        }
        break
      }
      case 'view_change': {
        if (wp.viewChange) {
          working = { ...working, viewMode: wp.viewChange }
          patch.viewMode = wp.viewChange
        }
        break
      }
      case 'phase_marker': {
        if (wp.phase) {
          working = { ...working, currentPhase: wp.phase }
          patch.currentPhase = wp.phase
        }
        break
      }
    }
    fired.add(wp.id)
  }

  if (fired.size !== state.firedWaypointIds.size) {
    patch.firedWaypointIds = fired
  }
  return patch
}

// Check if the vignette has completed (all waypoints fired, past last t_sim).
export const vignetteCompleted = (state: GameStore): boolean => {
  const v = state.vignette
  if (!v || v.waypoints.length === 0) return false
  const last = v.waypoints[v.waypoints.length - 1]
  return state.simTimeSec >= last.t_sim && state.firedWaypointIds.size >= v.waypoints.length
}
