// CATS (Camera-Target-Sun) angle.
//
// Defined as the angle at the target vertex between the rho vector
// (target -> chase) and the target -> sun vector. A small CATS angle means
// the chase is on the sun-side of the target: the chase's camera sees the
// target's lit face and the sun is behind the camera (good imaging
// geometry). A large CATS angle means the target is between the sun and the
// chase: the chase sees the target's dark side and risks looking into the
// sun.
import { dot, norm, sub, type Vec3 } from '../physics/vec'
import type { SpacecraftState } from '../game/state'

export type CatsFavorability = 'favorable' | 'marginal' | 'unfavorable'

export interface CatsAngleResult {
  angleDeg: number
  favorability: CatsFavorability
  rhoVecEci: Vec3
  sunVecEci: Vec3 // unit vector from target toward sun
}

// Simplified sun position model.
//
// Sim time t=0 is treated as the March vernal equinox (sun crossing the
// celestial equator northbound). The ecliptic longitude advances at
// 360° / 365.25 days. The sun's ECI direction is obtained by rotating its
// ecliptic-plane direction about the ECI X axis by Earth's obliquity.
//
// This is good to ~5° accuracy, which the v1.4 spec accepts.
const ONE_AU_M = 1.495978707e11
const OBLIQUITY_RAD = (23.4392911 * Math.PI) / 180
const DAY_SEC = 86400
const TROPICAL_YEAR_SEC = 365.25 * DAY_SEC

export const sunDirectionEci = (simTimeSec: number): Vec3 => {
  const lambda = (2 * Math.PI * simTimeSec) / TROPICAL_YEAR_SEC
  const cosL = Math.cos(lambda)
  const sinL = Math.sin(lambda)
  const cosE = Math.cos(OBLIQUITY_RAD)
  const sinE = Math.sin(OBLIQUITY_RAD)
  // Rotate ecliptic-plane vector (cosL, sinL, 0) about X axis by obliquity.
  return [cosL, sinL * cosE, sinL * sinE]
}

// Approximate Earth-to-Sun ECI position (used by downstream renderers; for
// the angle calculation only the direction matters).
export const sunPositionEci = (simTimeSec: number): Vec3 => {
  const d = sunDirectionEci(simTimeSec)
  return [d[0] * ONE_AU_M, d[1] * ONE_AU_M, d[2] * ONE_AU_M]
}

const classifyAngle = (angleDeg: number): CatsFavorability => {
  if (angleDeg < 30) return 'favorable'
  if (angleDeg <= 90) return 'marginal'
  return 'unfavorable'
}

export const computeCatsAngle = (
  target: SpacecraftState,
  chase: SpacecraftState,
  simTimeSec: number,
): CatsAngleResult => {
  // rho: target -> chase
  const rho = sub(chase.rEci, target.rEci)
  const rhoMag = norm(rho)
  // Sun direction is essentially constant across the orbital geometry of any
  // mission (target is ~6,800 km from Earth, sun is 1.5e8 km away), so the
  // target-to-sun direction is the same as the Earth-to-sun direction to far
  // better than 1° precision. We just use the Earth-frame sun direction.
  const sunDir = sunDirectionEci(simTimeSec)
  const sunMag = norm(sunDir)
  if (rhoMag === 0 || sunMag === 0) {
    return {
      angleDeg: 0,
      favorability: 'favorable',
      rhoVecEci: rho,
      sunVecEci: sunDir,
    }
  }
  const cosA = Math.max(-1, Math.min(1, dot(rho, sunDir) / (rhoMag * sunMag)))
  const angleRad = Math.acos(cosA)
  const angleDeg = (angleRad * 180) / Math.PI
  return {
    angleDeg,
    favorability: classifyAngle(angleDeg),
    rhoVecEci: rho,
    sunVecEci: sunDir,
  }
}
