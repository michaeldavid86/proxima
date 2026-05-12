// Trajectory Sandbox types. The sandbox is a teaching surface: a target in the
// RIC frame and a chaser executing one of three foundational relative-motion
// trajectories from Core Astro (perch, linear drift, NMC).
export type TrajectoryFamily = 'perch' | 'linear_drift' | 'nmc'

export interface TrajectoryParams {
  // Perch: V-bar offset of the chaser, in meters (positive = ahead of target).
  vbarOffsetM: number
  // Linear drift: radial offset of the chaser at insertion, in meters
  // (positive = higher orbit).
  radialOffsetM: number
  // NMC: half-amplitude of the cross-axis (radial) oscillation in meters.
  // The full V-bar amplitude is 2 * this value.
  nmcAmplitudeM: number
}

export interface TrajectoryResult {
  // RIC-frame trajectory: array of (t, x_R, y_V) points sampled over one
  // reference orbital period.
  samples: { t: number; r: number; v: number }[]
  // Insertion delta-V at t=0 (m/s).
  insertionDvMs: number
  // Departure / exit delta-V (m/s). For perch, the cost to leave a perch back
  // to a coorbital state. For NMC and linear drift, optional / zero.
  exitDvMs: number
  // Drift rate (V-bar m/s). Only meaningful for linear drift.
  driftRateMs: number
  // Period of motion in seconds (for NMC = reference orbital period).
  periodSec: number
  // Closest approach to target (m).
  minRangeM: number
}
