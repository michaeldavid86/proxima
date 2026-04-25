// ECI <-> RIC (Radial, In-track, Cross-track) frame conversions.
// RIC per spec: x = Radial (R-bar, out), y = In-track (V-bar, along velocity),
// z = Cross-track (orbit-normal).
import { cross, dot, norm, normalize, sub, type Vec3 } from './vec'

export interface RicBasis {
  xHat: Vec3 // Radial (R-bar): unit vector away from Earth
  yHat: Vec3 // In-track (V-bar): unit vector along the velocity direction
  zHat: Vec3 // Cross-track: orbit-normal (r x v direction)
}

export const ricBasisOf = (rEci: Vec3, vEci: Vec3): RicBasis => {
  const xHat = normalize(rEci)
  const zHat = normalize(cross(rEci, vEci))
  const yHat = normalize(cross(zHat, xHat))
  return { xHat, yHat, zHat }
}

// Project an ECI-frame vector into RIC coordinates (dimensionless projection).
export const eciToRic = (v: Vec3, basis: RicBasis): Vec3 => [
  dot(v, basis.xHat),
  dot(v, basis.yHat),
  dot(v, basis.zHat),
]

// Express a RIC-frame vector in ECI coordinates.
export const ricToEci = (v: Vec3, basis: RicBasis): Vec3 => [
  v[0] * basis.xHat[0] + v[1] * basis.yHat[0] + v[2] * basis.zHat[0],
  v[0] * basis.xHat[1] + v[1] * basis.yHat[1] + v[2] * basis.zHat[1],
  v[0] * basis.xHat[2] + v[1] * basis.yHat[2] + v[2] * basis.zHat[2],
]

// Relative position of chaser w.r.t. target, expressed in target's RIC frame.
export const relativePosInRic = (
  rChaser: Vec3,
  rTarget: Vec3,
  vTarget: Vec3,
): Vec3 => {
  const basis = ricBasisOf(rTarget, vTarget)
  return eciToRic(sub(rChaser, rTarget), basis)
}

// Relative velocity of chaser w.r.t. target in target's RIC frame.
// v_rel_RIC = R_ECI_to_RIC * (v_chaser - v_target) - omega x r_rel_RIC
export const relativeVelInRic = (
  rChaser: Vec3,
  vChaser: Vec3,
  rTarget: Vec3,
  vTarget: Vec3,
): Vec3 => {
  const basis = ricBasisOf(rTarget, vTarget)
  const dvEci = sub(vChaser, vTarget)
  const dvRic = eciToRic(dvEci, basis)
  const rRelRic = eciToRic(sub(rChaser, rTarget), basis)
  // Angular velocity of RIC frame w.r.t. ECI, expressed in RIC: along +z, magnitude = n.
  const rMag = norm(rTarget)
  const hMag = norm(cross(rTarget, vTarget))
  const nAng = hMag / (rMag * rMag)
  const omega: Vec3 = [0, 0, nAng]
  const corr: Vec3 = [
    omega[1] * rRelRic[2] - omega[2] * rRelRic[1],
    omega[2] * rRelRic[0] - omega[0] * rRelRic[2],
    omega[0] * rRelRic[1] - omega[1] * rRelRic[0],
  ]
  return [dvRic[0] - corr[0], dvRic[1] - corr[1], dvRic[2] - corr[2]]
}
