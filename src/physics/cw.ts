// Clohessy-Wiltshire linearized relative motion in a target-centered RIC frame
// (Radial, In-track, Cross-track).
// Convention: x = radial (R-bar), y = in-track (V-bar), z = cross-track.
// Mean motion n = sqrt(mu / r_target^3).
// Reference: Vallado §6.7 with the spec's matrix explicitly transcribed.
import { type Vec3 } from './vec'

export interface CwState {
  r: Vec3 // relative position (m) in RIC
  v: Vec3 // relative velocity (m/s) in RIC
}

// State transition matrix elements for time t and mean motion n.
// rNew = Phi_rr * r0 + Phi_rv * v0
// vNew = Phi_vr * r0 + Phi_vv * v0
export const cwPropagate = (state: CwState, n: number, t: number): CwState => {
  const nt = n * t
  const s = Math.sin(nt)
  const c = Math.cos(nt)

  const { r: r0, v: v0 } = state

  // Phi_rr row-by-row application
  const rx = (4 - 3 * c) * r0[0] + (s / n) * v0[0] + ((2 * (1 - c)) / n) * v0[1]
  const ry =
    6 * (s - nt) * r0[0] + r0[1] + (-2 * (1 - c) / n) * v0[0] + ((4 * s - 3 * nt) / n) * v0[1]
  const rz = c * r0[2] + (s / n) * v0[2]

  const vx = 3 * n * s * r0[0] + c * v0[0] + 2 * s * v0[1]
  const vy = 6 * n * (c - 1) * r0[0] - 2 * s * v0[0] + (4 * c - 3) * v0[1]
  const vz = -n * s * r0[2] + c * v0[2]

  return { r: [rx, ry, rz], v: [vx, vy, vz] }
}

// Convenience: propagate just a position and return relative distance.
export const cwRange = (state: CwState, n: number, t: number): number => {
  const s = cwPropagate(state, n, t)
  return Math.sqrt(s.r[0] ** 2 + s.r[1] ** 2 + s.r[2] ** 2)
}
