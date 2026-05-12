// CW-based math for the three foundational RPO trajectories taught in Core
// Astro. Uses the existing physics/cw.ts state transition matrix for accurate
// propagation. The reference orbit used for n (mean motion) is a 400 km
// circular LEO.
import { cwPropagate } from '../physics/cw'
import { meanMotionFromA } from '../physics/orbital-elements'
import { R_EARTH } from '../physics/constants'
import type { TrajectoryFamily, TrajectoryParams, TrajectoryResult } from './types'

// Reference orbit: 400 km circular LEO. Chosen to match Mission 0 and so cadets
// can correlate the sandbox with what they fly in the missions.
export const SANDBOX_REF_A = R_EARTH + 400_000
export const SANDBOX_N = meanMotionFromA(SANDBOX_REF_A)
export const SANDBOX_PERIOD = (2 * Math.PI) / SANDBOX_N

const SAMPLES = 200

const computeMinRange = (samples: { r: number; v: number }[]): number => {
  let min = Infinity
  for (const s of samples) {
    const d = Math.hypot(s.r, s.v)
    if (d < min) min = d
  }
  return min
}

// Family: Perch
// The chaser holds at a fixed V-bar offset. In RIC the position is
// (0, y_offset, 0) with zero relative velocity. No insertion impulse is
// required if the chaser is *already* at the perch. To make the sandbox
// interesting we treat the cadet as having entered the perch from a
// coorbital co-located state. The simplest CW interpretation: a hop from
// (0, 0, 0) to (0, y_offset, 0) over a quarter period via a two-impulse
// solution (standard textbook result).
const perchTrajectory = (params: TrajectoryParams): TrajectoryResult => {
  const yOffset = params.vbarOffsetM
  // Two-impulse hop to V-bar (Glide-slope-like).
  // For a quarter-period transfer between coorbital points, the required
  // initial velocity in RIC is approximately:
  //   vy_0 = y_offset * n / 4   (textbook approximation)
  // Plus a non-zero vx_0 for shaping. We use a simple rendezvous solver:
  // initial v = -y_offset * n / 4 along V-bar, then arrival burn nulls v.
  const T = SANDBOX_PERIOD / 4
  // Use closed-form: from (0,0,0,vy0) at t=0 to (0,y_offset,0,0) at t=T.
  // The CW solution gives vy0 = y_offset / ((4*sin(nT) - 3*nT) / n).
  const nT = SANDBOX_N * T
  const vy0 = yOffset / ((4 * Math.sin(nT) - 3 * nT) / SANDBOX_N)

  const samples: TrajectoryResult['samples'] = []
  // Propagate forward from t=0 with initial state (0,0,0)+(0,vy0,0). After T,
  // arrive at perch. After perch, hold (zero motion).
  for (let i = 0; i <= SAMPLES; i++) {
    const tau = (i / SAMPLES) * SANDBOX_PERIOD
    if (tau <= T) {
      const s = cwPropagate({ r: [0, 0, 0], v: [0, vy0, 0] }, SANDBOX_N, tau)
      samples.push({ t: tau, r: s.r[0], v: s.r[1] })
    } else {
      // After arrival, second impulse nulls velocity; chaser is stationary in RIC.
      samples.push({ t: tau, r: 0, v: yOffset })
    }
  }
  // Total delta-V: |vy0| (start) + |arrival burn|.
  // At arrival, the state from propagation has velocity (vx_T, vy_T) which must
  // be nulled. We compute the magnitude of that velocity:
  const arrived = cwPropagate({ r: [0, 0, 0], v: [0, vy0, 0] }, SANDBOX_N, T)
  const arrivalVMag = Math.hypot(arrived.v[0], arrived.v[1])

  return {
    samples,
    insertionDvMs: Math.abs(vy0),
    exitDvMs: arrivalVMag,
    driftRateMs: 0,
    periodSec: SANDBOX_PERIOD,
    minRangeM: computeMinRange(samples.map((s) => ({ r: s.r, v: s.v }))),
  }
}

// Family: Linear Drift
// Chaser begins at (delta_r, 0, 0) in RIC with zero relative velocity.
// Under CW, the chaser drifts along V-bar at rate -1.5 * n * delta_r.
// Insertion delta-V to enter linear drift from a co-located coorbital state =
// 1.5 * n * delta_r along radial (the impulse that produces the same final
// position when applied at the coorbital starting point).
const linearDriftTrajectory = (params: TrajectoryParams): TrajectoryResult => {
  const deltaR = params.radialOffsetM
  const samples: TrajectoryResult['samples'] = []
  for (let i = 0; i <= SAMPLES; i++) {
    const tau = (i / SAMPLES) * SANDBOX_PERIOD
    // From initial state (deltaR, 0, 0) and zero RIC velocity, propagate.
    const s = cwPropagate({ r: [deltaR, 0, 0], v: [0, 0, 0] }, SANDBOX_N, tau)
    samples.push({ t: tau, r: s.r[0], v: s.r[1] })
  }
  // Drift rate along V-bar (signed).
  const driftRateMs = -1.5 * SANDBOX_N * deltaR
  // Insertion impulse = 1.5 * n * delta_r (radial).
  const insertionDvMs = Math.abs(1.5 * SANDBOX_N * deltaR)
  return {
    samples,
    insertionDvMs,
    exitDvMs: insertionDvMs, // Symmetric for return-to-coorbital.
    driftRateMs,
    periodSec: SANDBOX_PERIOD,
    minRangeM: computeMinRange(samples.map((s) => ({ r: s.r, v: s.v }))),
  }
}

// Family: Natural Motion Circumnavigation
// 2:1 ellipse in V-R plane. ICs from CW: position (0, y_0, 0), velocity
// (n*y_0/2, 0, 0) where y_0 sets the V-bar semi-axis = y_0 and R-bar
// semi-axis = y_0/2. We parameterize by R-bar amplitude A_r so y_0 = 2*A_r.
const nmcTrajectory = (params: TrajectoryParams): TrajectoryResult => {
  const A_r = Math.abs(params.nmcAmplitudeM)
  const y0 = 2 * A_r
  // CW ICs for centered NMC ellipse with semi-axes (A_r along R-bar, 2*A_r
  // along V-bar): r0 = (0, y0, 0), v0 = (n * y0 / 2, 0, 0).
  // This produces:
  //   x(t) = A_r * sin(nt)
  //   y(t) = y0 * cos(nt)
  const vx0 = (SANDBOX_N * y0) / 2
  const samples: TrajectoryResult['samples'] = []
  for (let i = 0; i <= SAMPLES; i++) {
    const tau = (i / SAMPLES) * SANDBOX_PERIOD
    const s = cwPropagate({ r: [0, y0, 0], v: [vx0, 0, 0] }, SANDBOX_N, tau)
    samples.push({ t: tau, r: s.r[0], v: s.r[1] })
  }
  // Insertion delta-V from coorbital co-located = magnitude of v0.
  const insertionDvMs = Math.abs(vx0)
  return {
    samples,
    insertionDvMs,
    exitDvMs: insertionDvMs,
    driftRateMs: 0,
    periodSec: SANDBOX_PERIOD,
    minRangeM: computeMinRange(samples.map((s) => ({ r: s.r, v: s.v }))),
  }
}

export const computeTrajectory = (
  family: TrajectoryFamily,
  params: TrajectoryParams,
): TrajectoryResult => {
  switch (family) {
    case 'perch':
      return perchTrajectory(params)
    case 'linear_drift':
      return linearDriftTrajectory(params)
    case 'nmc':
      return nmcTrajectory(params)
  }
}

export const familyDefaultParams = (family: TrajectoryFamily): TrajectoryParams => {
  switch (family) {
    case 'perch':
      return { vbarOffsetM: 5_000, radialOffsetM: 0, nmcAmplitudeM: 0 }
    case 'linear_drift':
      return { vbarOffsetM: 0, radialOffsetM: 2_000, nmcAmplitudeM: 0 }
    case 'nmc':
      return { vbarOffsetM: 0, radialOffsetM: 0, nmcAmplitudeM: 5_000 }
  }
}

export const familyLabel = (f: TrajectoryFamily): string =>
  ({
    perch: 'Perch (co-orbital hold)',
    linear_drift: 'Linear Drift (radial offset)',
    nmc: 'Natural Motion Circumnavigation (NMC)',
  })[f]

export const familyTeachingCard = (f: TrajectoryFamily): { title: string; body: string; realWorld: string; citation: string } => {
  switch (f) {
    case 'perch':
      return {
        title: 'Perch',
        body:
          'A perch holds the chaser at a fixed V-bar offset from the target. In ' +
          'the rotating RIC frame, it looks stationary. In ECI, both spacecraft ' +
          'share the same orbit. This is the cheapest steady-state hold but ' +
          'offers a single fixed viewing geometry.',
        realWorld: 'Used for inspection from a known, predictable geometry where the operator wants a continuous fixed-angle view.',
        citation: 'Vallado, Fundamentals of Astrodynamics §6.7',
      }
    case 'linear_drift':
      return {
        title: 'Linear Drift',
        body:
          'If the chaser is in a slightly higher orbit (positive R-bar offset), ' +
          'it moves slower than the target and drifts behind. If lower, it ' +
          'drifts ahead. This is the most common natural relative motion. The ' +
          'CW equations give the drift rate as -1.5 * n * delta_r along V-bar.',
        realWorld: 'A spacecraft inserted without exact co-orbit matching naturally enters linear drift. Operators use it to close on a target from behind cheaply.',
        citation: 'Vallado §6.7, Curtis Ch. 7',
      }
    case 'nmc':
      return {
        title: 'Natural Motion Circumnavigation',
        body:
          'An NMC orbits the target without consuming propellant once ' +
          'established. The 2:1 V-bar to R-bar shape comes from CW physics: ' +
          'the V-bar semi-axis is twice the R-bar amplitude. NMCs are used ' +
          'for long-duration inspection where varied viewing geometry is ' +
          'desired.',
        realWorld: 'Long-duration inspections (commercial servicing, GSSAP) often choose NMC for natural sweep through angles without burning fuel.',
        citation: 'Curtis Ch. 7',
      }
  }
}
