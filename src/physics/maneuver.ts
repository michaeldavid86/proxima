// Impulsive-burn helpers: apply a delta-v (in any frame) to a state vector,
// and a Tsiolkovsky mass update for a given Isp.
import { G0 } from './constants'
import { ricBasisOf, ricToEci } from './frames'
import { add, type Vec3 } from './vec'

export interface ImpulsiveBurn {
  dvEci: Vec3 // delta-v in ECI frame (m/s)
}

// Apply an ECI-frame impulsive burn: velocity is instantaneously incremented.
export const applyImpulseEci = (
  v: Vec3,
  burn: ImpulsiveBurn,
): Vec3 => add(v, burn.dvEci)

// Build an impulsive burn from a RIC-frame delta-v expressed relative to the
// spacecraft's own orbit. dvRic = [radial, in-track, cross-track] in m/s.
export const burnFromRic = (
  r: Vec3,
  v: Vec3,
  dvRic: Vec3,
): ImpulsiveBurn => {
  const basis = ricBasisOf(r, v)
  return { dvEci: ricToEci(dvRic, basis) }
}

// Propellant consumption from rocket equation: dm = m * (1 - exp(-|dv| / (Isp*g0))).
export const propellantUsed = (
  wetMass: number,
  dvMag: number,
  isp: number,
): number => {
  if (dvMag === 0) return 0
  const ve = isp * G0
  return wetMass * (1 - Math.exp(-dvMag / ve))
}
