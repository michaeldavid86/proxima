// Passive safety check.
//
// Given the post-burn state of the chase, propagate forward without any
// further inputs (free drift) and check whether the resulting trajectory
// would: (1) collide with the target, (2) enter a keep-out zone, or
// (3) escape past a safety horizon. Used pedagogically: a maneuver that
// looks fine in the short term may set up a downstream conjunction if a
// follow-on burn is missed. The 10-to-1 rule + passive safety together are
// the standard "guardrails" of undergraduate RPO instruction.
import { propagateState } from '../physics/kepler'
import { norm, sub } from '../physics/vec'
import { relativePosInRic } from '../physics/frames'
import type { SpacecraftState } from '../game/state'
import { isInsideZone, type KeepZone } from './keep-zones'

export type PassiveSafetyReason =
  | 'safe'
  | 'collision'
  | 'keep_out_violation'
  | 'escape'

export interface PassiveSafetyResult {
  isSafe: boolean
  reason: PassiveSafetyReason
  timeToEventSec?: number
  closestApproachM?: number
  description: string
  violatedZoneId?: string
}

// Sample step and thresholds.
const SAMPLE_STEP_SEC = 10
const COLLISION_RANGE_M = 100 // < 100 m counts as collision in the safety check
const ESCAPE_RANGE_M = 5_000_000 // 5,000 km — clearly out of proximity

export interface PassiveSafetyInputs {
  postBurnState: SpacecraftState
  targetState: SpacecraftState
  horizonSec: number // typically 2 orbital periods
  keepZones: KeepZone[]
}

export const checkPassiveSafety = (
  inp: PassiveSafetyInputs,
): PassiveSafetyResult => {
  const { postBurnState, targetState, horizonSec, keepZones } = inp
  let minRange = Number.POSITIVE_INFINITY
  let minRangeT = 0
  let chaseSv = { r: postBurnState.rEci, v: postBurnState.vEci }
  let targetSv = { r: targetState.rEci, v: targetState.vEci }
  for (let t = 0; t <= horizonSec; t += SAMPLE_STEP_SEC) {
    if (t > 0) {
      chaseSv = propagateState(chaseSv, SAMPLE_STEP_SEC)
      targetSv = propagateState(targetSv, SAMPLE_STEP_SEC)
    }
    const range = norm(sub(chaseSv.r, targetSv.r))
    if (range < minRange) {
      minRange = range
      minRangeT = t
    }
    if (range < COLLISION_RANGE_M) {
      return {
        isSafe: false,
        reason: 'collision',
        timeToEventSec: t,
        closestApproachM: range,
        description: `Free-drift conjunction at ${range.toFixed(0)} m in ${(t / 60).toFixed(
          1,
        )} min if no further burns.`,
      }
    }
    if (keepZones.length > 0) {
      const ricPos = relativePosInRic(chaseSv.r, targetSv.r, targetSv.v)
      for (const zone of keepZones) {
        if (zone.type === 'keep_out' && isInsideZone(ricPos, zone)) {
          return {
            isSafe: false,
            reason: 'keep_out_violation',
            timeToEventSec: t,
            closestApproachM: minRange,
            description: `Free-drift enters "${zone.label}" keep-out zone in ${(t / 60).toFixed(
              1,
            )} min.`,
            violatedZoneId: zone.id,
          }
        }
      }
    }
    if (range > ESCAPE_RANGE_M) {
      // Stop propagating if we've drifted way out. Doesn't count as unsafe;
      // most missions would consider this fine, just not actionable.
      return {
        isSafe: true,
        reason: 'escape',
        timeToEventSec: t,
        closestApproachM: minRange,
        description: `Free-drift opens to ${(range / 1000).toFixed(0)} km over ${(t / 60).toFixed(
          0,
        )} min without conjunction.`,
      }
    }
  }
  return {
    isSafe: true,
    reason: 'safe',
    timeToEventSec: horizonSec,
    closestApproachM: minRange,
    description: `Free-drift safe through ${(horizonSec / 3600).toFixed(1)} h. Closest approach ${(
      minRange / 1000
    ).toFixed(2)} km at ${(minRangeT / 60).toFixed(1)} min.`,
  }
}
