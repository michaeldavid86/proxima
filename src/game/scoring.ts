// Mission-success and mission-failure evaluation. Pure functions of the
// current state + mission; returns next mission status and updated accumulators.
import { norm, sub } from '../physics/vec'
import type { SpacecraftState } from './state'
import type { Mission } from '../missions/types'

interface CoverageIn {
  currentPct: number
  lowWaterMark: number
}

export interface ScoringInputs {
  mission: Mission
  simTimeSec: number
  dt: number
  player: SpacecraftState
  target: SpacecraftState
  attributionRisk: number
  linkDenied: boolean
  linkDeniedStreakSec: number
  holdTimerSec: number
  inspectionCollected: boolean
  collectActive: boolean
  // v1.2: multi-asset missions pass observation coverage for coverage scoring.
  coverage?: CoverageIn
  // v1.2: per-asset propellant so we can fail on either exhausted in M4.
  assetPropellantKg?: Record<string, number>
}

export interface ScoringOutputs {
  holdTimerSec: number
  inspectionCollected: boolean
  linkDeniedStreakSec: number
  status: 'active' | 'success' | 'failure'
  failureReason?: string
  successNote?: string
}

export const scoreTick = (inp: ScoringInputs): ScoringOutputs => {
  const {
    mission,
    simTimeSec,
    dt,
    player,
    target,
    attributionRisk,
    linkDenied,
    linkDeniedStreakSec,
    holdTimerSec,
    inspectionCollected,
    collectActive,
  } = inp
  const rangeM = norm(sub(player.rEci, target.rEci))
  const rangeKm = rangeM / 1000
  const relSpeedMs = norm(sub(player.vEci, target.vEci))

  // Generic collision / min-range / propellant failures.
  if (mission.failure.collisionRangeM && rangeM < mission.failure.collisionRangeM) {
    const vLimit = mission.failure.collisionRelSpeedMs ?? Infinity
    if (relSpeedMs > vLimit)
      return {
        holdTimerSec,
        inspectionCollected,
        linkDeniedStreakSec,
        status: 'failure',
        failureReason: `Collision at ${rangeM.toFixed(1)} m with ${relSpeedMs.toFixed(2)} m/s rel speed.`,
      }
  }
  if (mission.failure.rangeKmMin && rangeKm < mission.failure.rangeKmMin) {
    return {
      holdTimerSec,
      inspectionCollected,
      linkDeniedStreakSec,
      status: 'failure',
      failureReason: `Range fell below safety floor of ${mission.failure.rangeKmMin} km.`,
    }
  }
  if (player.propellantMass <= 0.001) {
    // Only a failure if we are not already in a success pose (otherwise we can
    // still coast to station for a holdStation-type mission).
    const inHold =
      mission.success.kind === 'holdStation' &&
      rangeKm <= mission.success.rangeKmMax &&
      relSpeedMs <= mission.success.relSpeedMsMax
    if (!inHold)
      return {
        holdTimerSec,
        inspectionCollected,
        linkDeniedStreakSec,
        status: 'failure',
        failureReason: 'Propellant exhausted before rendezvous.',
      }
  }
  // Attribution hard-fail
  if (mission.failure.attributionMax && attributionRisk >= mission.failure.attributionMax) {
    return {
      holdTimerSec,
      inspectionCollected,
      linkDeniedStreakSec,
      status: 'failure',
      failureReason: `Attribution reached ${attributionRisk.toFixed(0)} — target flees.`,
    }
  }

  // Link-denied streak
  let streak = linkDeniedStreakSec
  if (linkDenied) streak += dt
  else streak = 0
  if (
    mission.failure.linkDeniedMaxSec &&
    streak >= mission.failure.linkDeniedMaxSec
  ) {
    return {
      holdTimerSec,
      inspectionCollected,
      linkDeniedStreakSec: streak,
      status: 'failure',
      failureReason: `Link denied for more than ${Math.round(mission.failure.linkDeniedMaxSec / 60)} minutes.`,
    }
  }

  // Success tracks
  if (mission.success.kind === 'holdStation') {
    const { rangeKmMax, relSpeedMsMax, holdSeconds, rangeKmMin } = mission.success
    const inBox =
      rangeKm <= rangeKmMax &&
      relSpeedMs <= relSpeedMsMax &&
      (rangeKmMin === undefined || rangeKm >= rangeKmMin)
    const next = inBox ? holdTimerSec + dt : 0
    if (next >= holdSeconds) {
      return {
        holdTimerSec: next,
        inspectionCollected,
        linkDeniedStreakSec: streak,
        status: 'success',
        successNote: `Held station at ${rangeKm.toFixed(2)} km for ${holdSeconds}s.`,
      }
    }
    return {
      holdTimerSec: next,
      inspectionCollected,
      linkDeniedStreakSec: streak,
      status: 'active',
    }
  }

  if (mission.success.kind === 'inspectionProfile') {
    const { vbarKm, vbarToleranceKm, holdSeconds, attributionMax, departRangeKm } =
      mission.success
    // V-bar station keeping: we approximate by checking range ~ vbarKm and
    // cross-attribution threshold.
    const inCorridor =
      Math.abs(rangeKm - vbarKm) <= vbarToleranceKm && attributionRisk <= attributionMax
    const next = inCorridor ? holdTimerSec + dt : 0
    // Inspection collect opportunity while inside corridor.
    let collected = inspectionCollected
    if (inCorridor && collectActive) collected = true
    const held = next >= holdSeconds
    if (collected && held && rangeKm >= departRangeKm) {
      return {
        holdTimerSec: next,
        inspectionCollected: collected,
        linkDeniedStreakSec: streak,
        status: 'success',
        successNote: `Inspection completed and departed to ${rangeKm.toFixed(0)} km.`,
      }
    }
    return {
      holdTimerSec: next,
      inspectionCollected: collected,
      linkDeniedStreakSec: streak,
      status: 'active',
    }
  }

  if (mission.success.kind === 'observationCoverage' && inp.coverage) {
    const { coveragePctRequired, missionDurationSec, lowWaterFailPct } = mission.success
    // Per-asset propellant failure
    if (mission.assets && inp.assetPropellantKg) {
      for (const aid of mission.assets) {
        if ((inp.assetPropellantKg[aid] ?? 0) <= 0.001) {
          return {
            holdTimerSec,
            inspectionCollected,
            linkDeniedStreakSec,
            status: 'failure',
            failureReason: `${aid} propellant exhausted before mission end.`,
          }
        }
      }
    }
    // Low-water-mark hard fail
    if (lowWaterFailPct !== undefined && inp.coverage.lowWaterMark < lowWaterFailPct) {
      return {
        holdTimerSec,
        inspectionCollected,
        linkDeniedStreakSec,
        status: 'failure',
        failureReason: `Coverage dropped below ${lowWaterFailPct}% (hard floor).`,
      }
    }
    // Success only at mission-duration tick.
    if (simTimeSec >= missionDurationSec) {
      if (inp.coverage.currentPct >= coveragePctRequired) {
        return {
          holdTimerSec,
          inspectionCollected,
          linkDeniedStreakSec,
          status: 'success',
          successNote: `Final coverage ${inp.coverage.currentPct.toFixed(1)}%.`,
        }
      }
      return {
        holdTimerSec,
        inspectionCollected,
        linkDeniedStreakSec,
        status: 'failure',
        failureReason: `Final coverage ${inp.coverage.currentPct.toFixed(
          1,
        )}% below required ${coveragePctRequired}%.`,
      }
    }
    return {
      holdTimerSec,
      inspectionCollected,
      linkDeniedStreakSec,
      status: 'active',
    }
  }

  if (mission.success.kind === 'maintainLinkDepart') {
    const { missionDurationSec, departRangeKm } = mission.success
    if (
      simTimeSec >= missionDurationSec &&
      rangeKm >= departRangeKm &&
      !linkDenied
    ) {
      return {
        holdTimerSec,
        inspectionCollected,
        linkDeniedStreakSec: streak,
        status: 'success',
        successNote: `Mission window survived; adversary at ${rangeKm.toFixed(0)} km at call.`,
      }
    }
    return {
      holdTimerSec,
      inspectionCollected,
      linkDeniedStreakSec: streak,
      status: 'active',
    }
  }

  return {
    holdTimerSec,
    inspectionCollected,
    linkDeniedStreakSec: streak,
    status: 'active',
  }
}
