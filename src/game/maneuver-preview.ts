// Compute the live preview fields for a candidate maneuver before the player
// commits it. Pure function over the physics engine. The preview is purely a
// visualization aid; nothing in this file ever advances the sim.
import { propagateState } from '../physics/kepler'
import { applyImpulseEci, burnFromRic } from '../physics/maneuver'
import { ricToEci, ricBasisOf } from '../physics/frames'
import { stateToCoe, periodFromA } from '../physics/orbital-elements'
import type { Vec3 } from '../physics/vec'
import { budgetFromMass, lifeYearsFromDv } from './operational-life'
import type {
  GameState,
  PlannedManeuverPreview,
  SpacecraftState,
} from './state'

export const computeManeuverPreview = (
  state: GameState,
  craftId: string,
  dvRic: Vec3,
  burnOffsetSec: number,
): PlannedManeuverPreview | null => {
  const ship: SpacecraftState | undefined = state.spacecraft[craftId]
  const mission = state.mission
  if (!ship || !mission) return null

  // Current orbit (live from state vector).
  const currentElements = stateToCoe({ r: ship.rEci, v: ship.vEci })

  // Propagate to burn point.
  const dt = Math.max(0, burnOffsetSec)
  const atBurn = propagateState({ r: ship.rEci, v: ship.vEci }, dt)
  // Apply impulse in RIC at the burn instant.
  const burn = burnFromRic(atBurn.r, atBurn.v, dvRic)
  const vAfter = applyImpulseEci(atBurn.v, burn)
  const projectedElements = stateToCoe({ r: atBurn.r, v: vAfter })

  // Thrust direction in ECI (unit vector).
  const dvMag = Math.hypot(dvRic[0], dvRic[1], dvRic[2])
  let thrustVectorEci: Vec3 = [0, 0, 0]
  if (dvMag > 0) {
    const basis = ricBasisOf(atBurn.r, atBurn.v)
    const unitRic: Vec3 = [dvRic[0] / dvMag, dvRic[1] / dvMag, dvRic[2] / dvMag]
    thrustVectorEci = ricToEci(unitRic, basis) as Vec3
  }

  // Time-to-achieve heuristic. For a typical Hohmann-style maneuver, half the
  // period of the post-burn orbit is when the spacecraft reaches the opposite
  // apse — that's when a follow-on circularization burn would fire. For a
  // plane-change or pure radial impulse, this metric is less meaningful, but
  // it gives a useful sense of "how long until the maneuver has manifested."
  const timeToAchieveSec = projectedElements.a > 0 ? periodFromA(projectedElements.a) / 2 : 0

  // Operational-life cost = additional delta-V / annual SK rate for player only.
  let costYears = 0
  if (craftId === mission.playerId && dvMag > 0) {
    const loadout = mission.spacecraft.find((s) => s.id === craftId)
    if (loadout) {
      const initialBudget = budgetFromMass(loadout.dryMass, loadout.propellantMass, loadout.isp)
      const remainingNow = Math.max(0, initialBudget - state.totalDvUsed)
      const remainingAfter = Math.max(0, initialBudget - state.totalDvUsed - dvMag)
      const yearsNow = lifeYearsFromDv(remainingNow, state.operationalLife.regime)
      const yearsAfter = lifeYearsFromDv(remainingAfter, state.operationalLife.regime)
      costYears = yearsNow - yearsAfter
    }
  }

  return {
    craftId,
    dvRic,
    burnOffsetSec: dt,
    currentElements,
    projectedElements,
    burnPointEci: atBurn.r,
    thrustVectorEci,
    dvMag,
    timeToAchieveSec,
    costYears,
  }
}
